// 年間契約のポイント月次付与（毎日実行。付与日を迎えた契約だけ付与する）
// 月払いは Stripe の請求（invoice.paid）ごとに webhook で付与するので対象外。
import { runYearlyMonthlyGrants } from "../../../lib/points";

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  // Vercel Cron が自動付与する Authorization ヘッダ／手動実行時の x-cron-secret
  return req.headers.get("authorization") === `Bearer ${expected}` || req.headers.get("x-cron-secret") === expected;
}

async function handle(req) {
  if (!isAuthorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const results = await runYearlyMonthlyGrants();
    console.log(`[cron/points-monthly] ${results.length}件`, results);
    return Response.json({ ok: true, results });
  } catch (e) {
    console.error("[cron/points-monthly] 失敗:", e?.message || e);
    return Response.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
