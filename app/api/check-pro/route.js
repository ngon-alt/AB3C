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
        // バッジ表示:
        // - フルプラン: `フル${契約サイト数}` (例: フル5, フル15)
        // - 戦略診断プラン: 1サイトは"診断"、10/100サイトは"診断 ${残り}/${契約数}" (例: 診断 99/100)
        if (p.plan_type === "support") {
          planLabel = `フル${p.site_limit}`;
        } else if (p.site_limit > 1) {
          // 使用済み件数 = 登録済みサイト数
          const usedResult = await sql`
            SELECT COUNT(*) as count FROM sites
            WHERE user_email = ${session.user.email}
          `;
          const used = parseInt(usedResult[0].count);
          const remaining = Math.max(0, p.site_limit - used);
          planLabel = `診断 ${remaining}/${p.site_limit}`;
        } else {
          planLabel = "診断";
        }
      }
    } catch (e) {}

    return Response.json({ isPro, chatTickets, trialChats, planLabel });
  } catch (e) {
    console.error(e);
    return Response.json({ isPro: false, chatTickets: 0, trialChats: 0, planLabel: null });
  }
}
