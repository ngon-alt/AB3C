// ユーザーのプラン種別判定（メール文面分岐などに使う）
//   - 'support'  : 戦略指南サブスク / PRO（履歴保存される）
//   - 'diagnosis': 戦略診断チケット / 無料トライアル（履歴保存なし＝持ち帰り必須）
//
// 設計上の注意:
//   - Promise.all で 2 つの SELECT を並列実行している。Neon serverless の
//     HTTPS ゲートウェイが一時失敗するとどちらか/両方が throw する。
//   - 失敗時は短いバックオフでリトライする（PRO 付与ユーザーが support 判定で
//     落ちる→ diagnosis 版メールが届くバグへの対策。2026-06-04 案 X 導入）。
//   - 最終的に失敗したら 'diagnosis' を返す（持ち帰りを促す側に倒す）。
//
// 共通モジュール化（2026-06-04 案 Y 統一化）。
//   - /api/analyze と /api/analyze/send-completion-email 両方から使う。
//   - 重複実装が判定の二重化リスクになっていたので統合。

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 500, 1500]; // attempt index → wait before retry

export async function resolveUserPlanKind(sql, email) {
  if (!email) return 'diagnosis';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt] > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    }
    try {
      const [proRows, planRows] = await Promise.all([
        sql`SELECT email FROM pro_users WHERE email = ${email} LIMIT 1`,
        sql`SELECT plan_type FROM user_plans WHERE user_email = ${email} AND status = 'active' AND (is_trial IS NOT TRUE OR expires_at > NOW()) ORDER BY purchased_at DESC LIMIT 1`,
      ]);
      // user_plans に support active がある → support
      if (planRows.length > 0 && planRows[0].plan_type === 'support') return 'support';
      // PRO 付与（pro_users 登録）→ support
      if (proRows.length > 0) return 'support';
      // それ以外 → diagnosis
      return 'diagnosis';
    } catch (e) {
      if (attempt === MAX_ATTEMPTS - 1) {
        console.error(`プラン判定エラー（${MAX_ATTEMPTS}回試行失敗）:`, e?.message);
        return 'diagnosis'; // 最終 fallback
      }
      console.warn(`プラン判定リトライ ${attempt + 1}/${MAX_ATTEMPTS}:`, e?.message);
    }
  }
  return 'diagnosis'; // unreachable, defensive
}
