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

    // 契約プラン情報（複数 active な場合に備えて全件取得し、表示向けに整形）
    let planLabel = null;
    let planType = null;
    let nextRenewalAt = null;
    let activePlans = []; // [{ id, planType, planLabel, expiresAt, ... }]
    try {
      const planResult = await sql`
        SELECT id, plan_type, site_limit, analyses_used, expires_at, interval FROM user_plans
        WHERE user_email = ${session.user.email} AND status = 'active'
        ORDER BY CASE WHEN plan_type = 'support' THEN 0 ELSE 1 END, site_limit DESC
      `;
      // それぞれを planLabel 付きで整形
      activePlans = planResult.map(p => {
        let label;
        if (p.plan_type === 'support') {
          label = `指南${p.site_limit}`;
        } else {
          const used = parseInt(p.analyses_used || 0);
          const remaining = Math.max(0, p.site_limit - used);
          label = p.site_limit > 1 ? `診断 ${remaining}/${p.site_limit}` : (remaining > 0 ? '診断' : '診断 0/1');
        }
        return {
          id: p.id,
          planType: p.plan_type,
          planLabel: label,
          siteLimit: p.site_limit,
          expiresAt: p.expires_at,
          interval: p.interval,
        };
      });
      // 既存仕様の「単一プラン」表示: 先頭（support 優先、次点 site_limit 降順）
      if (activePlans.length > 0) {
        const first = activePlans[0];
        planType = first.planType;
        planLabel = first.planLabel;
        nextRenewalAt = first.expiresAt;
      }
    } catch (e) {}

    return Response.json({ isPro, chatTickets, trialChats, planLabel, planType, nextRenewalAt, activePlans });
  } catch (e) {
    console.error(e);
    return Response.json({ isPro: false, chatTickets: 0, trialChats: 0, planLabel: null });
  }
}
