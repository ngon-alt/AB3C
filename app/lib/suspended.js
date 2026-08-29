// 停止中アカウントの判定（運用対応）
//
// 支払遅延等の理由で、特定ユーザーのアクセスを一時的に止めるための仕組み。
// 環境変数 SUSPENDED_EMAILS にカンマ区切りでメールアドレスを設定する。
//   例) SUSPENDED_EMAILS=foo@example.com,bar@example.com
//
// 設計方針:
//  - sites / pro_users / user_plans には一切触れない。データは完全に温存する。
//  - ログイン自体を止めるため、サイト上限モーダル（SiteCapGuard → cap-resolve）が
//    起動せず、ユーザー操作でデータが削除される事故が起きない。
//  - 解除は環境変数から該当アドレスを外すだけ。元の状態にそのまま戻る。
//
// ※ 反映には Vercel の再デプロイが必要（環境変数の変更のため）。

export function isSuspendedEmail(email) {
  if (!email) return false;
  const list = (process.env.SUSPENDED_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(String(email).trim().toLowerCase());
}
