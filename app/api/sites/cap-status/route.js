// ライセンス上限とサイト数の状態を返す
// - PRO 在籍時: overCap: false（無制限）
// - 戦略指南プランあり: cap = 合計 site_limit、overCap = (現サイト数 > cap)
// - 戦略指南プランなし: cap = 0、overCap = (現サイト数 > 0)

import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 });
    }
    const email = session.user.email;
    const sql = neon(process.env.DATABASE_URL);

    // PRO チェック
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
    const isPro = proRows.length > 0;

    // 戦略指南プランの合計 site_limit
    const supportRows = await sql`
      SELECT COALESCE(SUM(site_limit), 0) as total
      FROM user_plans
      WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
    `;
    const supportCap = parseInt(supportRows[0]?.total || 0);

    // 現サイト数
    const sitesAll = await sql`
      SELECT id, site_name, site_url, strategy_confirmed, analyzed_at, updated_at, created_at
      FROM sites
      WHERE user_email = ${email}
      ORDER BY created_at DESC
    `;
    const currentCount = sitesAll.length;

    // PRO は実質無制限なので overCap=false
    if (isPro) {
      return NextResponse.json({
        overCap: false,
        isPro: true,
        cap: null,
        currentCount,
        reason: 'pro',
      });
    }

    const cap = supportCap;
    const overCap = currentCount > cap;
    let reason = 'support';
    if (cap === 0) {
      // 戦略指南プランなし。診断チケットだけ持っているか、無契約
      const analysisRows = await sql`
        SELECT COUNT(*) as c FROM user_plans
        WHERE user_email = ${email} AND plan_type = 'analysis' AND status = 'active'
      `;
      reason = parseInt(analysisRows[0]?.c || 0) > 0 ? 'analysis_only' : 'no_plan';
    }

    return NextResponse.json({
      overCap,
      isPro: false,
      cap,
      currentCount,
      excessCount: Math.max(0, currentCount - cap),
      reason,
      // overCap の時のみサイト一覧を返す（UI 選択用）
      sites: overCap ? sitesAll : [],
    });
  } catch (e) {
    console.error('GET /api/sites/cap-status error:', e);
    return NextResponse.json({ error: 'サーバーエラー: ' + e.message }, { status: 500 });
  }
}
