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
    let planType = null;
    let nextRenewalAt = null;
    try {
      const planResult = await sql`
        SELECT plan_type, site_limit, analyses_used, expires_at, interval FROM user_plans
        WHERE user_email = ${session.user.email} AND status = 'active'
        ORDER BY CASE WHEN plan_type = 'support' THEN 0 ELSE 1 END, site_limit DESC LIMIT 1
      `;
      if (planResult.length > 0) {
        const p = planResult[0];
        planType = p.plan_type;
        nextRenewalAt = p.expires_at; // フルプラン: 次回課金日 / 戦略診断プラン: 有効期限
        // バッジ表示:
        // - フルプラン: `フル${契約サイト数}` (例: フル5, フル15)
        // - 戦略診断プラン: 1サイトは"診断 X/1"、10/100サイトは"診断 ${残り}/${契約数}"
        //   消費カウントは analyses_used (再分析もカウント) に基づく
        if (p.plan_type === "support") {
          planLabel = `フル${p.site_limit}`;
        } else {
          const used = parseInt(p.analyses_used || 0);
          const remaining = Math.max(0, p.site_limit - used);
          planLabel = p.site_limit > 1 ? `診断 ${remaining}/${p.site_limit}` : (remaining > 0 ? "診断" : "診断 0/1");
        }
      }
    } catch (e) {}

    return Response.json({ isPro, chatTickets, trialChats, planLabel, planType, nextRenewalAt });
  } catch (e) {
    console.error(e);
    return Response.json({ isPro: false, chatTickets: 0, trialChats: 0, planLabel: null });
  }
}
