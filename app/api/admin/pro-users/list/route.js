import { neon } from '@neondatabase/serverless';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  const users = await sql`SELECT * FROM pro_users ORDER BY added_at DESC`;
  // このテーブルに載っている時点で全員 PRO付与（無制限）ユーザー。
  // ヘッダーの表示（check-pro の activePlans）と同じ考え方で、
  // 「無制限」は消さずに常に表示しつつ、追加で保有中のプラン（購入済みチケット等）も
  // 一覧できるようにする（無制限のはずが別表示に化ける問題への対応）。
  const usersWithPlan = await Promise.all(users.map(async (user) => {
    user.plan_label = '無制限';
    user.active_plans = [];
    try {
      // デバッグのため is_trial / expires_at 等の生データも一旦フィルタなしで全件取得し、
      // フィルタ後件数と食い違いがないか JS 側でも判別できるようにする。
      const allActiveRows = await sql`
        SELECT plan_type, site_limit, status, COALESCE(is_trial, FALSE) as is_trial,
               expires_at, purchased_at, interval, stripe_price_id
        FROM user_plans
        WHERE user_email = ${user.email} AND status = 'active'
        ORDER BY plan_type, site_limit DESC
      `;
      user.active_plans = allActiveRows.map(p => {
        const notExpiredTrial = !p.is_trial || (p.expires_at && new Date(p.expires_at).getTime() > Date.now());
        return {
          planType: p.plan_type,
          siteLimit: p.site_limit,
          label: `${p.plan_type === 'support' ? '伴走' : '分析'}${p.site_limit}`,
          isTrial: p.is_trial,
          expiresAt: p.expires_at,
          purchasedAt: p.purchased_at,
          interval: p.interval,
          stripePriceId: p.stripe_price_id,
          currentlyValid: notExpiredTrial, // false ならトライアル期限切れ（デバッグ表示のみに使う）
        };
      });
    } catch (e) {}
    return user;
  }));
  return Response.json({ users: usersWithPlan });
}
