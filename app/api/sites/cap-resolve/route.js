// ユーザーが「残すサイト」を選択して送信
// keepIds に含まれていない自分のサイトを削除する

import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { sendPlanDowngradeEmail } from '@/app/lib/email';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 });
    }
    const email = session.user.email;
    const body = await req.json();
    const keepIds = Array.isArray(body?.keepIds) ? body.keepIds : [];

    const sql = neon(process.env.DATABASE_URL);

    // PRO は削除しない（誤操作防止）
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
    if (proRows.length > 0) {
      return NextResponse.json({ error: 'PRO会員はサイト削減の対象外です。' }, { status: 400 });
    }

    // 上限を計算
    const supportRows = await sql`
      SELECT COALESCE(SUM(site_limit), 0) as total
      FROM user_plans
      WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
    `;
    const cap = parseInt(supportRows[0]?.total || 0);

    // keepIds が cap を超えていたら拒否
    if (keepIds.length > cap) {
      return NextResponse.json({ error: `残せるサイト数は最大 ${cap} 件です。` }, { status: 400 });
    }

    // 現サイト一覧（自分のもののみ）
    const sites = await sql`
      SELECT id, site_name, site_url FROM sites WHERE user_email = ${email}
    `;
    if (sites.length <= cap) {
      // すでに上限内 → 削除なし
      return NextResponse.json({ deleted: 0, message: 'すでに上限内です。' });
    }

    // keepIds の妥当性チェック（自分のサイトであること）
    const ownIds = new Set(sites.map(s => s.id));
    const validKeepIds = keepIds.filter(id => ownIds.has(id));

    // 削除対象 = keepIds に含まれていないもの
    const sitesToDelete = sites.filter(s => !validKeepIds.includes(s.id));

    if (sitesToDelete.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const idsToDelete = sitesToDelete.map(s => s.id);
    await sql`DELETE FROM sites WHERE id = ANY(${idsToDelete}) AND user_email = ${email}`;

    // 通知メール
    try {
      let userName = null;
      try {
        const nameRows = await sql`SELECT name FROM users WHERE email = ${email} LIMIT 1`;
        if (nameRows.length > 0) userName = nameRows[0].name;
      } catch (e) {}
      await sendPlanDowngradeEmail({
        email,
        name: userName,
        deletedSites: sitesToDelete,
        oldLimit: sites.length,
        newLimit: cap,
      });
    } catch (e) {
      console.error('cap-resolve 通知メール送信エラー:', e);
    }

    console.log(`cap-resolve: ${email} / ${sites.length} → ${cap} / ${sitesToDelete.length}サイト削除`);
    return NextResponse.json({ deleted: sitesToDelete.length, cap });
  } catch (e) {
    console.error('POST /api/sites/cap-resolve error:', e);
    return NextResponse.json({ error: 'サーバーエラー: ' + e.message }, { status: 500 });
  }
}
