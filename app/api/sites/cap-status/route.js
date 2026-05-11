// ライセンス上限とサイト数の状態を返す
// - PRO 在籍時: overCap: false（無制限）
// - 戦略指南サブスクあり: cap = 合計 site_limit、overCap = (現サイト数 > cap)
// - 戦略指南サブスクなし: cap = 0、overCap = (現サイト数 > 0)

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

    // 戦略指南サブスクの合計 site_limit
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

    // 判定の優先順位:
    //  1. 戦略指南サブスク active あり → そのプランの cap で制限（PRO であっても適用）
    //     ※ 戦略指南サブスク購入時に pro_users へも自動 INSERT されるため、isPro 単独では判定できない
    //  2. 上記なし & PRO → 実質無制限（overCap=false）
    //  3. 上記なし & 非PRO → cap=0、現サイトがあれば overCap=true
    if (supportCap > 0) {
      const cap = supportCap;
      const overCap = currentCount > cap;
      return NextResponse.json({
        overCap,
        isPro,
        cap,
        currentCount,
        excessCount: Math.max(0, currentCount - cap),
        reason: 'support',
        sites: overCap ? sitesAll : [],
      });
    }

    if (isPro) {
      return NextResponse.json({
        overCap: false,
        isPro: true,
        cap: null,
        currentCount,
        reason: 'pro',
      });
    }

    // 戦略指南サブスクなし＆非PRO: 戦略診断チケットだけ持っているか、無契約
    const analysisRows = await sql`
      SELECT COUNT(*) as c FROM user_plans
      WHERE user_email = ${email} AND plan_type = 'analysis' AND status = 'active'
    `;
    const reason = parseInt(analysisRows[0]?.c || 0) > 0 ? 'analysis_only' : 'no_plan';
    const cap = 0;
    const overCap = currentCount > 0;

    return NextResponse.json({
      overCap,
      isPro: false,
      cap,
      currentCount,
      excessCount: currentCount,
      reason,
      sites: overCap ? sitesAll : [],
    });
  } catch (e) {
    console.error('GET /api/sites/cap-status error:', e);
    return NextResponse.json({ error: 'サーバーエラー: ' + e.message }, { status: 500 });
  }
}
