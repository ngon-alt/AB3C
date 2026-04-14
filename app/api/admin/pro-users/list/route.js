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
  // プラン情報を付加
  const usersWithPlan = await Promise.all(users.map(async (user) => {
    try {
      const plans = await sql`SELECT plan_type, site_limit FROM user_plans WHERE user_email = ${user.email} AND status = 'active' ORDER BY site_limit DESC LIMIT 1`;
      if (plans.length > 0) {
        const p = plans[0];
        user.plan_label = `${p.plan_type === 'support' ? '伴走' : '分析'}${p.site_limit}`;
      } else {
        user.plan_label = '無制限';
      }
    } catch { user.plan_label = '無制限'; }
    return user;
  }));
  return Response.json({ users: usersWithPlan });
}
