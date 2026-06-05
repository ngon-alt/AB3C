// 分析完了メールのテスト送信用エンドポイント（管理者専用・2026-06-04 案 C）。
//
// 用途:
//   /api/analyze/send-completion-email の本番ロジックは plan_kind 判定で
//   support/diagnosis を自動分岐するため、PRO 付与ユーザーは diagnosis 版
//   メールを実フローで再現できない。このエンドポイントは admin secret で
//   保護した上で、強制的に指定バージョンのメールを送信者自身に送る。
//
// 想定リクエスト:
//   POST /api/dev/send-test-completion-email
//   Body: {
//     secret: '<ADMIN_SECRET>',
//     as: 'diagnosis' | 'support',
//     siteId?: string,           // support: メール内ボタンを /?site_id=X に
//     generateRealShare?: bool,  // diagnosis: 実シェアURL を発行（true 推奨）
//   }
//
// セキュリティ:
//   - セッション必須（自分宛にしか送れない）
//   - ADMIN_SECRET 必須（pro_users 全員に開放するわけではない）
//   - 本番 URL は秘密ではないので、漏洩対策として secret は body/header どちらでも可
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendAnalysisCompleteEmail } from "@/app/lib/email";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function generateShareId() {
  const ts = Date.now().toString(36);
  return "test" + ts + Math.random().toString(36).slice(2, 6);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const secret = body.secret || req.headers.get("x-admin-secret");
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "認証エラー（ADMIN_SECRET が必要）" }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const { as = "diagnosis", siteId = null, generateRealShare = true } = body;

    if (as !== "diagnosis" && as !== "support") {
      return NextResponse.json({ error: "as は 'diagnosis' または 'support'" }, { status: 400 });
    }

    if (as === "support") {
      try {
        await sendAnalysisCompleteEmail({
          email: session.user.email,
          name: session.user.name,
          planKind: "support",
          siteId: siteId || null,
        });
      } catch (mailErr) {
        console.error("テスト support メール送信エラー:", mailErr?.message);
        return NextResponse.json({ error: "メール送信に失敗: " + mailErr.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        sentAs: "support",
        sentTo: session.user.email,
        siteId: siteId || null,
      });
    }

    // diagnosis: shareUrl を発行
    const baseUrl = process.env.NEXTAUTH_URL || "https://senryaku.ai";
    let shareUrl = null;
    let shareId = null;

    if (generateRealShare) {
      shareId = generateShareId();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // 実際に動くシェアページにするため、最低限のプレースホルダ AB3C を入れる
      const placeholderResult = {
        benefit: {
          core: "【テストデータ】メール文面確認用のプレースホルダです。実分析の戦略メッセージはここに入ります。",
          needs: ["テスト用ニーズ1", "テスト用ニーズ2"],
          wants: ["テスト用ウォンツ1", "テスト用ウォンツ2"],
        },
        advantage: {
          what: "テスト用 Advantage",
          why_good: "テスト用：なぜ好ましいか",
          why_hard_to_copy: "テスト用：なぜ真似されにくいか",
        },
        three_c: {
          customer: {
            target: "テスト用ターゲット",
            profile: ["テストプロフィール"],
            stage: "テスト",
            cutoff: "テスト",
            market: { sam: "—", som: "—", growth: "—", basis: "—" },
          },
          competitor: { direct: [], indirect: [] },
          company: { strength: ["テスト強み"], structure: "テスト", passion: "テスト" },
        },
        strategy_message: {
          message: "【テスト】これはテストメール送信用のプレースホルダ戦略メッセージです",
          benefit_part: "テスト Benefit",
          advantage_part: "テスト Advantage",
        },
        checkpoints: [],
      };

      try {
        // テーブル未作成のフォールバック付き INSERT
        try {
          await sql`
            INSERT INTO shared_results (id, input_text, result, expires_at, user_email)
            VALUES (${shareId}, ${"【テスト】メール文面確認用の placeholder"}, ${JSON.stringify(placeholderResult)}, ${expiresAt.toISOString()}, ${session.user.email})
          `;
        } catch (firstErr) {
          console.error("テスト share INSERT 失敗（CREATE TABLE して再試行）:", firstErr?.message);
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
            INSERT INTO shared_results (id, input_text, result, expires_at, user_email)
            VALUES (${shareId}, ${"【テスト】メール文面確認用の placeholder"}, ${JSON.stringify(placeholderResult)}, ${expiresAt.toISOString()}, ${session.user.email})
          `;
        }
        shareUrl = `${baseUrl}/share?id=${shareId}`;
      } catch (e) {
        console.error("テスト share 発行最終失敗:", e?.message);
        // shareUrl 無しでもメールは送る（リンクは TOP にフォールバック）
      }
    } else {
      // 完全フェイク URL（リンク先は 404 になる）
      shareUrl = `${baseUrl}/share?id=fake-${Date.now().toString(36)}`;
    }

    try {
      await sendAnalysisCompleteEmail({
        email: session.user.email,
        name: session.user.name,
        planKind: "diagnosis",
        siteId: null,
        shareUrl,
      });
    } catch (mailErr) {
      console.error("テスト diagnosis メール送信エラー:", mailErr?.message);
      return NextResponse.json({ error: "メール送信に失敗: " + mailErr.message, shareUrl, shareId }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      sentAs: "diagnosis",
      sentTo: session.user.email,
      shareUrl,
      shareId,
      generateRealShare,
    });
  } catch (e) {
    console.error("POST /api/dev/send-test-completion-email error:", e);
    return NextResponse.json({ error: "テストメール処理に失敗: " + e.message }, { status: 500 });
  }
}
