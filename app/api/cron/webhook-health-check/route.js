// 月次の webhook 健全性チェック cron（2026-06-05 / 案 Z）
//
// 目的:
//   2026-05-30 の FutureShop さん事故（invoice.paid webhook で DELETE 後に
//   INSERT が失敗し tickets が空になる）と同型の事象を定期検知する。
//
// 検査内容:
//   支援プラン（plan_type='support'）が active かつ非トライアル
//   （is_trial=FALSE）にもかかわらず、tickets テーブルに非トライアル行が
//   一つも無いか合計残数が 0 のユーザーを列挙する。
//
// ヒット時:
//   運営宛（OPERATIONS_NOTIFY_EMAIL / CONTACT_NOTIFY_EMAIL / 既定で
//   ngon@gonweb.co.jp）にアラートメールを送信する。
//   自動修復はしない（誤動作のリスクを避け、人手で SQL を流す方針）。
//
// 認証:
//   Vercel Cron が自動付与する Authorization: Bearer ${CRON_SECRET} か、
//   手動トリガー用の x-cron-secret ヘッダ。
//
// スケジュール:
//   vercel.json で毎月 1日 0:30 UTC（JST 9:30）に実行。
//   月次更新の翌日朝に走るので、月末契約者の更新失敗を検知しやすい。
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendWebhookHealthAlertEmail } from "@/app/lib/email";

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${expected}`) return true;
  const xSecret = req.headers.get("x-cron-secret");
  if (xSecret === expected) return true;
  return false;
}

async function runCheck() {
  const sql = neon(process.env.DATABASE_URL);

  // support active 非トライアル の中で、非トライアル tickets が無い／残数 0 のユーザー
  const rows = await sql`
    SELECT up.user_email,
           up.site_limit,
           up.expires_at,
           COALESCE((
             SELECT SUM(t.remaining_chats) FROM tickets t
             WHERE t.email = up.user_email AND t.is_trial = FALSE
           ), 0) AS total_chats
    FROM user_plans up
    WHERE up.plan_type = 'support'
      AND up.status = 'active'
      AND COALESCE(up.is_trial, FALSE) = FALSE
      AND up.stripe_price_id != 'admin_manual'
      AND COALESCE((
        SELECT SUM(t.remaining_chats) FROM tickets t
        WHERE t.email = up.user_email AND t.is_trial = FALSE
      ), 0) = 0
  `;

  return rows.map(r => ({
    user_email: r.user_email,
    site_limit: r.site_limit,
    expires_at: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    total_chats: parseInt(r.total_chats || 0),
  }));
}

async function handle(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const affectedUsers = await runCheck();
    if (affectedUsers.length === 0) {
      console.log("📊 webhook 健全性チェック: 異常なし");
      return NextResponse.json({ ok: true, affectedCount: 0 });
    }

    console.warn("⚠️  webhook 健全性チェック: 異常検知", { count: affectedUsers.length, users: affectedUsers.map(u => u.user_email) });
    const mailResult = await sendWebhookHealthAlertEmail({ affectedUsers });

    return NextResponse.json({
      ok: true,
      affectedCount: affectedUsers.length,
      affectedUsers,
      mail: { success: mailResult?.success !== false, skipped: !!mailResult?.skipped, error: mailResult?.error || null },
    });
  } catch (e) {
    console.error("webhook 健全性チェックでエラー:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Vercel Cron は GET でも POST でも叩けるよう両対応
export async function GET(req) { return handle(req); }
export async function POST(req) { return handle(req); }
