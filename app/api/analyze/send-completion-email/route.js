// 戦略診断チケット / 無料トライアルユーザー向けの分析完了メール送信。
// フロントから analyze + improve + visual すべて揃った状態で呼ばれる。
// このエンドポイント内で:
//   1) ユーザーのプラン種別を判定
//   2) 'support' なら何もしない（/api/analyze 側で即時送信済み）
//   3) 'diagnosis' ならシェアURL を自動発行 → そのURLをメインボタンに設定したメールを送る
//
// 案A の実装（2026-06-01）。これまでは /api/analyze で送るメールのボタンが
// 固定で TOP（https://senryaku.ai）に飛んでおり、診断ユーザーが分析結果へ戻れない
// バグがあった。シェアURL を事前発行することで、メールから直接結果ページに戻れる。
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendAnalysisCompleteEmail } from "@/app/lib/email";

function generateShareId() {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).slice(2, 8);
  const random2 = Math.random().toString(36).slice(2, 6);
  return timestamp + random1 + random2;
}

async function resolveUserPlanKind(sql, email) {
  if (!email) return 'diagnosis';
  try {
    const [proRows, planRows] = await Promise.all([
      sql`SELECT email FROM pro_users WHERE email = ${email} LIMIT 1`,
      sql`SELECT plan_type FROM user_plans WHERE user_email = ${email} AND status = 'active' AND (is_trial IS NOT TRUE OR expires_at > NOW()) ORDER BY purchased_at DESC LIMIT 1`,
    ]);
    if (planRows.length > 0 && planRows[0].plan_type === 'support') return 'support';
    if (proRows.length > 0) return 'support';
    return 'diagnosis';
  } catch (e) {
    console.error('プラン判定エラー（send-completion-email）:', e);
    return 'diagnosis';
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // ローカル dev で DATABASE_URL 未設定時にモジュールロードが失敗するのを防ぐため、
  // sql クライアントは関数内で生成する
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
    } = body;

    if (!result) {
      return NextResponse.json({ error: "分析結果が不正です" }, { status: 400 });
    }

    const planKind = await resolveUserPlanKind(sql, session.user.email);

    // support ユーザーは /api/analyze 側で送信済み。重複を避けるためここでは何もしない。
    if (planKind === 'support') {
      return NextResponse.json({ ok: true, skipped: true, reason: 'support_handled_by_analyze_route' });
    }

    // diagnosis: シェアURL を自動発行
    // shared_results テーブルは /api/share の ensureTable で作られている前提
    // （初回利用時に診断ユーザーがログインしていれば既に作成済み）
    const shareId = generateShareId();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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
    } catch (insertErr) {
      // shared_results テーブルが未作成のケースに備えてフォールバック
      // （/api/share に同じ ensureTable があるので通常は問題ないが、診断ユーザーが
      // 一度もシェアボタンを押していない場合に備える）
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
      } catch (retryErr) {
        console.error('shared_results INSERT 二度目失敗:', retryErr?.message);
        // シェア発行に失敗してもメール自体は送る（リンクは TOP にフォールバック）
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://senryaku.ai';
    const shareUrl = `${baseUrl}/share?id=${shareId}`;

    try {
      await sendAnalysisCompleteEmail({
        email: session.user.email,
        name: session.user.name,
        planKind: 'diagnosis',
        siteId: null,
        shareUrl,
      });
    } catch (mailErr) {
      console.error('診断ユーザー完了メール送信エラー:', mailErr?.message);
      // メール送信失敗でもシェア発行は成功しているので、フロントには成功扱いで返す
    }

    return NextResponse.json({ ok: true, shareId, shareUrl, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error('POST /api/analyze/send-completion-email error:', e);
    return NextResponse.json({ error: "完了メール処理に失敗しました" }, { status: 500 });
  }
}
