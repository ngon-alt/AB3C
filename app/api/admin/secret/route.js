// ADMIN_SECRET を /admin 画面のセッション認証済みユーザーに返すエンドポイント。
//
// 2026-06-04 修正: 認可を ADMIN_EMAIL 固定値から pro_users 登録ベースに変更。
// 旧実装では権さん（ngon@gonweb.co.jp）でログインしていると 401 になり、
// /admin 画面の secret 自動取得が動かなかった。
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: '認証エラー（未ログイン）' }, { status: 401 });
  }

  // pro_users に登録されているユーザーのみ ADMIN_SECRET を取得可能
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email} LIMIT 1`;
    if (rows.length === 0) {
      return Response.json({ error: '認証エラー（pro_users 未登録）' }, { status: 401 });
    }
  } catch (e) {
    console.error('GET /api/admin/secret check error:', e);
    return Response.json({ error: 'サーバーエラー' }, { status: 500 });
  }

  return Response.json({ secret: process.env.ADMIN_SECRET });
}
