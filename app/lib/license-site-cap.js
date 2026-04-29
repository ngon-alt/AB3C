// ライセンス上限を超えたサイトを古い順に削除するヘルパー
//
// 基本ルール:
//  - PRO（pro_users 在籍）は実質無制限プランとして扱う → 削除しない
//  - 戦略指南プラン（user_plans の type='support', status='active'）あり
//      → 合計 site_limit までに削減（古い順削除）
//  - 戦略指南プランなし（戦略診断チケットのみ／無料／無契約）
//      → 戦略指南プランは「サイト履歴を残せる唯一のプラン」のため、全サイト削除
//
// 呼び出しタイミング:
//  - Stripe checkout 完了後（webhook）
//  - 管理画面でのプラン切替（admin POST）
//  - 管理画面での PRO 解除（admin DELETE）
//
// 戻り値:
//  { skipped: true, reason: "pro" }                       → PRO のため処理スキップ
//  { skipped: false, deleted: N, deletedSites: [...], cap: M }  → cap=M まで削減、N 件削除
//  { skipped: false, deleted: 0, cap: M }                 → 削除不要だった

export async function enforceLicenseSiteCap(sql, email) {
  // PRO は無制限扱い
  const proCheck = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
  if (proCheck.length > 0) {
    return { skipped: true, reason: "pro" };
  }

  // active な戦略指南プランの合計サイト数（cap）
  const supportRows = await sql`
    SELECT COALESCE(SUM(site_limit), 0) as total
    FROM user_plans
    WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
  `;
  const cap = parseInt(supportRows[0]?.total || 0);

  // 現サイト数
  const cntRows = await sql`SELECT COUNT(*) as c FROM sites WHERE user_email = ${email}`;
  const currentCount = parseInt(cntRows[0]?.c || 0);

  if (currentCount <= cap) {
    return { skipped: false, deleted: 0, cap };
  }

  // cap 超過分を「古い順」に削除（新しい N 件を残す）
  // ORDER BY created_at DESC で新しい順 → OFFSET cap で新しい cap 件をスキップ
  // → 残ったのが削除対象（古い方）
  const toDelete = await sql`
    SELECT id, site_name, site_url
    FROM sites
    WHERE user_email = ${email}
    ORDER BY created_at DESC
    OFFSET ${cap}
  `;
  if (toDelete.length === 0) {
    return { skipped: false, deleted: 0, cap };
  }

  const ids = toDelete.map((s) => s.id);
  await sql`DELETE FROM sites WHERE id = ANY(${ids})`;
  return {
    skipped: false,
    deleted: toDelete.length,
    deletedSites: toDelete,
    cap,
    previousCount: currentCount,
  };
}
