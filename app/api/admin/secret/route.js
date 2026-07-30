// ADMIN_SECRET を /admin 画面のセッション認証済みユーザーに返すエンドポイント。
//
// 2026-07-30 修正: 認可を pro_users 登録ベースから管理者メール指定（ADMIN_EMAILS）に変更。
// pro_users は「指南 無制限プラン」の付与リストとして外部のお試しユーザーにも
// 使われるため、全員に ADMIN_SECRET が渡ってしまう穴になっていた。
// （2026-06-04 の pro_users ベース化は ngon@gonweb.co.jp が旧 ADMIN_EMAIL 固定値で
//   弾かれた問題への対処だったが、既定管理者リストに両アカウントを含めて解決）
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isAdminEmail } from '@/app/lib/admin';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: '認証エラー（未ログイン）' }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    return Response.json({ error: '認証エラー（管理者ではありません）' }, { status: 401 });
  }

  return Response.json({ secret: process.env.ADMIN_SECRET });
}
