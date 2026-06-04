// 分析完了メール送信（一本化版・2026-06-04 案 X + 案 Y）。
//
// フロントから analyze + improve + visual すべて揃った状態で呼ばれる、
// ユーザー全タイプの完了メール送信エンドポイント。
//
// 設計の経緯:
//   - 以前は /api/analyze 直後に sendAnalysisCompleteEmail を直接呼んでいた
//   - PRO 付与ユーザー（権さん等）は user_plans に active がなく、
//     pro_users クエリ 1本に判定が依存していたため、Neon の一時失敗で
//     catch ブランチに落ちて diagnosis 版メールが届くバグが発生
//   - 案 X: resolveUserPlanKind にリトライを追加（app/lib/plan.js に共通化）
//   - 案 Y: 送信経路を新エンドポイント1本に統一（判定の二重化を排除）
//
// 処理:
//   1) セッション確認
//   2) プラン判定（リトライ込み）
//   3) support なら siteId（あれば）で /?site_id=X、なければ /dashboard 向けのメール
//   4) diagnosis なら shared_results に INSERT してシェアURL を発行 → そのURL付きメール
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendAnalysisCompleteEmail } from "@/app/lib/email";
import { resolveUserPlanKind } from "@/app/lib/plan";

function generateShareId() {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).slice(2, 8);
  const random2 = Math.random().toString(36).slice(2, 6);
  return timestamp + random1 + random2;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // ローカル dev で DATABASE_URL 未設定時のモジュールロード失敗を避けるため関数内で生成
  const sql = neon(process.env.DATABASE_URL);

  try {
    const body = await req.json();
    const {
      input,
      result,
      improveResult,
      visualMock,
      improveResultsByCombination,
      visualMocksByCombination,
      siteId, // support ユーザーの場合、メール内ボタンを直接そのサイトへ飛ばす
    } = body;

    if (!result) {
      return NextResponse.json({ error: "分析結果が不正です" }, { status: 400 });
    }

    // 共通モジュールで判定（最大3回リトライ・指数バックオフ）
    const planKind = await resolveUserPlanKind(sql, session.user.email);

    if (planKind === 'support') {
      // 戦略指南サブスク / PRO: サイト管理画面に保存されているので、シェアURL は発行しない
      try {
        await sendAnalysisCompleteEmail({
          email: session.user.email,
          name: session.user.name,
          planKind: 'support',
          siteId: siteId || null,
        });
      } catch (mailErr) {
        console.error('support 完了メール送信エラー:', mailErr?.message);
        return NextResponse.json({ ok: true, planKind: 'support', warning: 'mail_failed' });
      }
      return NextResponse.json({ ok: true, planKind: 'support', siteId: siteId || null });
    }

    // diagnosis: シェアURL を自動発行
    const shareId = generateShareId();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    let shareCreated = false;
    try {
      await sql`
        INSERT INTO shared_results (
          id, input_text, result, improve_result, visual_mock,
          expires_at, user_email,
          improve_results_by_combination, visual_mocks_by_combination
        )
        VALUES (
          ${shareId},
          ${input || ""},
          ${JSON.stringify(result)},
          ${improveResult ? JSON.stringify(improveResult) : null},
          ${visualMock ? JSON.stringify(visualMock) : null},
          ${expiresAt.toISOString()},
          ${session.user.email},
          ${improveResultsByCombination ? JSON.stringify(improveResultsByCombination) : null},
          ${visualMocksByCombination ? JSON.stringify(visualMocksByCombination) : null}
        )
      `;
      shareCreated = true;
    } catch (insertErr) {
      // shared_results テーブル未作成のフォールバック
      console.error('shared_results INSERT エラー（フォールバック試行）:', insertErr?.message);
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS shared_results (
            id VARCHAR(12) PRIMARY KEY,
            input_text TEXT,
            result JSONB NOT NULL,
            improve_result JSONB,
            visual_mock JSONB,
            expires_at TIMESTAMP,
            user_email VARCHAR(255),
            improve_results_by_combination JSONB,
            visual_mocks_by_combination JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`
          INSERT INTO shared_results (
            id, input_text, result, improve_result, visual_mock,
            expires_at, user_email,
            improve_results_by_combination, visual_mocks_by_combination
          )
          VALUES (
            ${shareId},
            ${input || ""},
            ${JSON.stringify(result)},
            ${improveResult ? JSON.stringify(improveResult) : null},
            ${visualMock ? JSON.stringify(visualMock) : null},
            ${expiresAt.toISOString()},
            ${session.user.email},
            ${improveResultsByCombination ? JSON.stringify(improveResultsByCombination) : null},
            ${visualMocksByCombination ? JSON.stringify(visualMocksByCombination) : null}
          )
        `;
        shareCreated = true;
      } catch (retryErr) {
        console.error('shared_results INSERT 二度目失敗:', retryErr?.message);
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://senryaku.ai';
    const shareUrl = shareCreated ? `${baseUrl}/share?id=${shareId}` : null;

    try {
      await sendAnalysisCompleteEmail({
        email: session.user.email,
        name: session.user.name,
        planKind: 'diagnosis',
        siteId: null,
        shareUrl, // null の場合はメール内でフォールバック（TOP リンク）
      });
    } catch (mailErr) {
      console.error('診断ユーザー完了メール送信エラー:', mailErr?.message);
    }

    return NextResponse.json({
      ok: true,
      planKind: 'diagnosis',
      shareId: shareCreated ? shareId : null,
      shareUrl,
      expiresAt: shareCreated ? expiresAt.toISOString() : null,
    });
  } catch (e) {
    console.error('POST /api/analyze/send-completion-email error:', e);
    return NextResponse.json({ error: "完了メール処理に失敗しました" }, { status: 500 });
  }
}
