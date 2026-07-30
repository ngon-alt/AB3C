// 管理者判定（管理画面 /admin へのアクセス権）
//
// 2026-07-30 再設計: 管理者アクセスを pro_users から分離した。
// pro_users は「指南 無制限プラン（非公開・無償）」の付与リストであり、
// 外部のお試しユーザー（協会理事の方々等）も登録されるため、
// 管理画面のアクセス権を相乗りさせない。
//
// 管理者は環境変数 ADMIN_EMAILS（カンマ区切り）で指定。
// 未設定時は既定の権さんアカウント2つにフォールバックする。
const DEFAULT_ADMIN_EMAILS = [
  'ngon@gonweb.co.jp',
  'webconsultant2022@gmail.com',
];

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return DEFAULT_ADMIN_EMAILS;
  const list = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(String(email).trim().toLowerCase());
}
