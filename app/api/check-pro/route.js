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

    // トライアルチャット残数（24時間フリーパス: expires_at > NOW() のみ有効）
    const trialResult = await sql`
      SELECT COALESCE(SUM(remaining_chats), 0) as total
      FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const trialChats = parseInt(trialResult[0].total);

    // 契約プラン情報（複数 active な場合に備えて全件取得し、表示向けに整形）
    // 【診断チケット】複数購入分を合算して「診断 残り合計/総合計」として 1 つのエントリに集約
    // 【戦略指南サブスク】それぞれ独立したエントリ（Step 2 で一本化予定）
    let planLabel = null;
    let planType = null;
    let nextRenewalAt = null;
    let activePlans = []; // [{ id, planType, planLabel, expiresAt, ... }]
    try {
      const planResult = await sql`
        SELECT id, plan_type, site_limit, analyses_used, expires_at, interval, purchased_at,
               COALESCE(is_trial, FALSE) as is_trial
        FROM user_plans
        WHERE user_email = ${session.user.email} AND status = 'active'
          AND (COALESCE(is_trial, FALSE) = FALSE OR expires_at > NOW())
        ORDER BY CASE WHEN plan_type = 'support' THEN 0 ELSE 1 END, site_limit DESC
      `;
      // 支援プランはそのまま、診断プランは集約
      const supportRows = planResult.filter(p => p.plan_type === 'support');
      const analysisRows = planResult.filter(p => p.plan_type === 'analysis');

      // 指南プラン（支援）— 個別エントリ
      // is_trial=TRUE の場合は「無料体験」ラベル + isTrial フラグを返す。
      // 残り時間表示はクライアント側で expiresAt から計算（毎分更新）。
      const supportEntries = supportRows.map(p => ({
        id: p.id,
        planType: p.plan_type,
        planLabel: p.is_trial ? '無料体験' : `指南${p.site_limit}`,
        siteLimit: p.site_limit,
        expiresAt: p.expires_at,
        interval: p.interval,
        isTrial: !!p.is_trial,
      }));

      // 診断プラン — 全行を合算して1エントリ化
      let analysisEntry = null;
      if (analysisRows.length > 0) {
        const totalLimit = analysisRows.reduce((s, r) => s + parseInt(r.site_limit || 0), 0);
        const totalUsed = analysisRows.reduce((s, r) => s + parseInt(r.analyses_used || 0), 0);
        const remaining = Math.max(0, totalLimit - totalUsed);
        // 有効期限は最も早く切れる行（古い購入から失効）
        const earliestExpiry = analysisRows
          .map(r => r.expires_at)
          .filter(Boolean)
          .sort()[0] || null;
        analysisEntry = {
          id: 'analysis_combined',
          planType: 'analysis',
          planLabel: totalLimit > 1 ? `診断 ${remaining}/${totalLimit}` : (remaining > 0 ? '診断' : '診断 0/1'),
          siteLimit: totalLimit,
          expiresAt: earliestExpiry,
          interval: 'year',
          rowCount: analysisRows.length, // デバッグ用: 集約した購入レコード数
        };
      }

      // 並び順: 支援 先頭 → 診断
      activePlans = [...supportEntries, ...(analysisEntry ? [analysisEntry] : [])];

      // 既存仕様の「単一プラン」表示: 先頭（support 優先、次点 診断合算）
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
