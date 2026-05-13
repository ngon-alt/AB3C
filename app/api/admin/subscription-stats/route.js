import { neon } from '@neondatabase/serverless';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

// 戦略指南サブスク / 戦略診断チケットの契約者統計を返す。
// 管理画面（/admin）に表示するためのエンドポイント。
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  try {
    // 戦略指南サブスク（active）
    const supportRows = await sql`
      SELECT
        user_email, name, site_limit, interval, purchased_at, expires_at,
        stripe_subscription_id, COALESCE(is_trial, FALSE) as is_trial
      FROM user_plans up
      LEFT JOIN users u ON u.email = up.user_email
      WHERE plan_type = 'support' AND status = 'active'
        AND (COALESCE(is_trial, FALSE) = FALSE OR expires_at > NOW())
      ORDER BY purchased_at DESC
    `;
    const supportCount = supportRows.length;
    const supportTotalSites = supportRows.reduce((s, r) => s + parseInt(r.site_limit || 0), 0);
    // 月額/年額の内訳
    const supportMonthly = supportRows.filter(r => r.interval === 'month').length;
    const supportYearly = supportRows.filter(r => r.interval === 'year').length;
    // トライアル/有料の内訳
    const supportTrial = supportRows.filter(r => r.is_trial).length;
    const supportPaid = supportCount - supportTrial;

    // 戦略診断チケット（active）
    const analysisRows = await sql`
      SELECT user_email, site_limit, analyses_used, purchased_at, expires_at
      FROM user_plans
      WHERE plan_type = 'analysis' AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY purchased_at DESC
    `;
    const analysisCount = analysisRows.length;
    const analysisTotalTickets = analysisRows.reduce((s, r) => s + parseInt(r.site_limit || 0), 0);
    const analysisUsedTickets = analysisRows.reduce((s, r) => s + parseInt(r.analyses_used || 0), 0);
    const analysisRemainingTickets = Math.max(0, analysisTotalTickets - analysisUsedTickets);

    // 過去解約者数（参考）
    const canceledRows = await sql`
      SELECT COUNT(*) as count FROM user_plans
      WHERE plan_type = 'support' AND status = 'canceled'
    `;
    const supportCanceled = parseInt(canceledRows[0]?.count || 0);

    return Response.json({
      support: {
        count: supportCount,
        paidCount: supportPaid,
        trialCount: supportTrial,
        totalSites: supportTotalSites,
        monthlyCount: supportMonthly,
        yearlyCount: supportYearly,
        canceledTotal: supportCanceled,
        plans: supportRows.map(r => ({
          email: r.user_email,
          name: r.name || '',
          site_limit: parseInt(r.site_limit || 0),
          interval: r.interval,
          purchased_at: r.purchased_at,
          expires_at: r.expires_at,
          is_trial: r.is_trial,
        })),
      },
      analysis: {
        count: analysisCount,
        totalTickets: analysisTotalTickets,
        usedTickets: analysisUsedTickets,
        remainingTickets: analysisRemainingTickets,
      },
    });
  } catch (e) {
    console.error('subscription-stats error:', e);
    return Response.json({ error: 'サーバーエラー: ' + e.message }, { status: 500 });
  }
}
