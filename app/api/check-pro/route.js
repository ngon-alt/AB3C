import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ isPro: false, chatTickets: 0, hasTrialChat: false });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // プロ会員チェック
    const proResult = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
    const isPro = proResult.length > 0;

    // 有料チケット残数
    const ticketResult = await sql`
      SELECT COALESCE(SUM(remaining_chats), 0) as total
      FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
    `;
    const chatTickets = parseInt(ticketResult[0].total);

    // トライアルチャット残数
    const trialResult = await sql`
      SELECT COALESCE(SUM(remaining_chats), 0) as total
      FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = TRUE
    `;
    const trialChats = parseInt(trialResult[0].total);

    // 契約プラン情報
    let planLabel = null;
    try {
      const planResult = await sql`
        SELECT plan_type, site_limit FROM user_plans
        WHERE user_email = ${session.user.email} AND status = 'active'
        ORDER BY site_limit DESC LIMIT 1
      `;
      if (planResult.length > 0) {
        const p = planResult[0];
        const typeLabel = p.plan_type === "support" ? "伴走" : "分析";
        planLabel = `${typeLabel}${p.site_limit}`;
      }
    } catch {}

    return Response.json({ isPro, chatTickets, trialChats, planLabel });
  } catch (e) {
    console.error(e);
    return Response.json({ isPro: false, chatTickets: 0, trialChats: 0, planLabel: null });
  }
}
