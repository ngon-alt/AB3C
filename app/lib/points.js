import { neon } from "@neondatabase/serverless";

// ポイントの帳簿（残高・付与・消費）。2026-09-22 実装。
// 価格・仕様の正典は docs/料金体系-ポイント制-20260919.md。
//
// 資金決済法の適用除外（発行から6か月以内に限り使えるもの）を保つため、次を守る:
//   - ポイントは付与ごとの束（point_lots）で持ち、束ごとに発行日と期限を持つ
//   - 期限切れの束は使えない（残高の計算・消費の対象から外すだけで、削除はしない）
//   - 期限を延長しない。返却（refund）も元の束に戻すので期限は変わらない
//   - 消費は期限の近い束から
//
// 当面ポイントで動くのは新規事業版の機能だけ（2026-09-19 権さん決定）。

// ---------------------------------------------------------------------------
// 設定（価格改定はここだけ直す。8/20 方針どおり、コードの他所に数値を埋め込まない）
// ---------------------------------------------------------------------------

/** 操作ごとの消費ポイント */
export const POINT_COSTS = {
  analyze_standard: 10000,   // 標準分析（分析＋改善レポート＋ビジュアル）
  analyze_competitor: 20000, // 競合徹底分析（標準分析を含む単体価格）
  reanalyze: 1000,           // 再分析
  action_first: 1000,        // アクションの初回アウトプット
  chat: 100,                 // チャット1往復（戦略策定・アクション共通）
  initial_advice: 0,         // テーマ初回アドバイス
  hearing: 0,                // 新規事業版のヒアリング（分析の10,000ptに含む）
};

/** 付与の種類と既定の有効期限（か月）。subscription は「その月限り」なので呼び出し側で期限を渡す */
export const POINT_SOURCES = {
  trial:        { label: "トライアル",       months: 6 },
  payg:         { label: "従量購入",         months: 6 },
  addon:        { label: "追加購入",         months: 6 },
  subscription: { label: "サブスク月次付与", months: null },
  camp:         { label: "キャンプ特典",     months: 3 },
  admin:        { label: "管理者付与",       months: 6 },
};

/** 期限の上限（資金決済法の適用除外のため6か月を超えさせない） */
const MAX_MONTHS = 6;

export const TRIAL_POINTS = 12700;

/**
 * 購入メニューと Stripe の価格ID（2026-09-22 本番に作成。lookup_key は ab3c_points_*）。
 * 金額は税込。商品名は Stripe 側で変更しても価格IDは変わらない。
 */
export const POINT_PURCHASES = {
  payg:  { priceId: "price_1UIRJDCYHZ66REnUvytPrQSs", pointsPerUnit: 500,  unitYen: 1100, label: "従量購入" },
  addon: { priceId: "price_1UIRJECYHZ66REnUJMkUNLOs", pointsPerUnit: 1000, unitYen: 1100, label: "追加購入" },
};
export const POINT_TIERS = {
  entry: { label: "月5,000円プラン", points: 5000,  monthYen: 5500,  priceMonth: "price_1UIRJECYHZ66REnUGXJGWkze", priceYear: "price_1UIRJFCYHZ66REnU7VUfYLtz" },
  mid:   { label: "月1万円プラン",   points: 12500, monthYen: 11000, priceMonth: "price_1UIRJGCYHZ66REnUvwXQhPzD", priceYear: "price_1UIRJHCYHZ66REnUkxmsMgCZ" },
  upper: { label: "月2万円プラン",   points: 30000, monthYen: 22000, priceMonth: "price_1UIRJHCYHZ66REnUXEYf4axG", priceYear: "price_1UIRJICYHZ66REnUdDHSbxWj" },
  top:   { label: "月5万円プラン",   points: 87500, monthYen: 55000, priceMonth: "price_1UIRJJCYHZ66REnUuAgw0kpu", priceYear: "price_1UIRJJCYHZ66REnUhaCUg133" },
};

// ---------------------------------------------------------------------------

let _sql = null;
function getSql() {
  // 接続は初回利用時に作る（DATABASE_URL の無いビルド環境で next build が落ちないように）
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

let tableReady = false;
async function ensureTables() {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS point_lots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) NOT NULL,
      source VARCHAR(20) NOT NULL,
      granted_points INTEGER NOT NULL CHECK (granted_points > 0),
      remaining INTEGER NOT NULL CHECK (remaining >= 0),
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      note TEXT,
      ref VARCHAR(255),
      created_by VARCHAR(255)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_point_lots_user ON point_lots(user_email, expires_at)`;
  // 同じ決済・同じ月次更新から二重に付与しないための一意制約（ref が無い付与は対象外）
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_point_lots_ref ON point_lots(source, ref) WHERE ref IS NOT NULL`;
  await sql`
    CREATE TABLE IF NOT EXISTS point_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) NOT NULL,
      lot_id UUID,
      delta INTEGER NOT NULL,
      kind VARCHAR(10) NOT NULL,
      feature VARCHAR(50),
      ref VARCHAR(255),
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_point_tx_user ON point_transactions(user_email, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_point_tx_ref ON point_transactions(ref)`;
  // ポイントのサブスク（月次付与の管理用。年間契約は毎月の付与を cron で行う）
  await sql`
    CREATE TABLE IF NOT EXISTS point_subscriptions (
      stripe_subscription_id VARCHAR(255) PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      stripe_customer_id VARCHAR(255),
      tier VARCHAR(20) NOT NULL,
      interval VARCHAR(10) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      current_period_end TIMESTAMPTZ,
      next_grant_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_point_subs_user ON point_subscriptions(user_email, status)`;
  // ポイント購入に使う Stripe の顧客（メールごとに1つ）。保存したカードを次の購入で呼び出すため。
  // 今の戦略指南の user_plans.stripe_customer_id とは別に持つ（新規事業版を今の環境から切り離す方針）
  await sql`
    CREATE TABLE IF NOT EXISTS point_customers (
      user_email VARCHAR(255) PRIMARY KEY,
      stripe_customer_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  tableReady = true;
}

function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * ポイントを付与する（束を1つ作る）。
 * expiresAt を省略すると付与の種類ごとの既定期限。どの場合も発行から6か月を超えない。
 * ref（決済IDなど）を渡すと、同じ ref での二重付与は無視される（{ duplicated: true }）。
 */
export async function grantPoints({ email, points, source, expiresAt = null, note = null, ref = null, createdBy = null }) {
  const e = normEmail(email);
  const n = Math.floor(Number(points));
  if (!e) throw new Error("メールアドレスが必要です");
  if (!Number.isFinite(n) || n <= 0) throw new Error("付与ポイントは1以上の整数にしてください");
  const src = POINT_SOURCES[source];
  if (!src) throw new Error(`不明な付与の種類です: ${source}`);

  const now = new Date();
  const cap = addMonths(now, MAX_MONTHS);
  let exp = expiresAt ? new Date(expiresAt) : (src.months ? addMonths(now, src.months) : null);
  if (!exp || Number.isNaN(exp.getTime())) throw new Error("有効期限を指定してください");
  if (exp <= now) throw new Error("有効期限が過去になっています");
  if (exp > cap) exp = cap; // 6か月を超える期限は6か月に丸める

  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO point_lots (user_email, source, granted_points, remaining, expires_at, note, ref, created_by)
    VALUES (${e}, ${source}, ${n}, ${n}, ${exp.toISOString()}, ${note}, ${ref}, ${createdBy})
    ON CONFLICT (source, ref) WHERE ref IS NOT NULL DO NOTHING
    RETURNING id, expires_at
  `;
  if (!rows.length) return { duplicated: true };
  await sql`
    INSERT INTO point_transactions (user_email, lot_id, delta, kind, feature, ref, meta)
    VALUES (${e}, ${rows[0].id}, ${n}, 'grant', ${source}, ${ref}, ${JSON.stringify({ note, createdBy })})
  `;
  return { lotId: rows[0].id, points: n, expiresAt: rows[0].expires_at };
}

/** 残高（期限内の束の合計）と束の一覧 */
export async function getBalance(email) {
  const e = normEmail(email);
  await ensureTables();
  const sql = getSql();
  const lots = await sql`
    SELECT id, source, granted_points, remaining, granted_at, expires_at, note
    FROM point_lots
    WHERE user_email = ${e} AND remaining > 0 AND expires_at > NOW()
    ORDER BY expires_at, granted_at
  `;
  const balance = lots.reduce((s, l) => s + l.remaining, 0);
  return {
    balance,
    nextExpiry: lots[0] ? { points: lots[0].remaining, expiresAt: lots[0].expires_at } : null,
    lots: lots.map(l => ({ ...l, sourceLabel: POINT_SOURCES[l.source]?.label || l.source })),
  };
}

/**
 * ポイントを消費する。期限の近い束から減らす。足りなければ何も減らさず { ok: false }。
 * 同じユーザーの同時消費は勧告ロックで直列化し、二重に減らさない。
 * ref には後で返却できるよう一意な値（リクエストID等）を渡す。
 */
export async function consumePoints({ email, points, feature, ref = null, meta = null }) {
  const e = normEmail(email);
  const n = Math.floor(Number(points));
  if (n === 0) return { ok: true, consumed: 0 };
  if (!Number.isFinite(n) || n < 0) throw new Error("消費ポイントが不正です");

  await ensureTables();
  const sql = getSql();
  const results = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${"points:" + e}))`,
    sql`
      WITH ordered AS (
        SELECT id, remaining,
               SUM(remaining) OVER (ORDER BY expires_at, granted_at, id) AS cum
        FROM point_lots
        WHERE user_email = ${e} AND remaining > 0 AND expires_at > NOW()
      ),
      total AS (SELECT COALESCE(MAX(cum), 0) AS t FROM ordered),
      take AS (
        SELECT o.id, LEAST(o.remaining, ${n} - (o.cum - o.remaining)) AS amt
        FROM ordered o, total
        WHERE total.t >= ${n} AND o.cum - o.remaining < ${n}
      ),
      upd AS (
        UPDATE point_lots p SET remaining = p.remaining - take.amt
        FROM take WHERE p.id = take.id
        RETURNING p.id, take.amt
      )
      INSERT INTO point_transactions (user_email, lot_id, delta, kind, feature, ref, meta)
      SELECT ${e}, upd.id, -upd.amt, 'consume', ${feature}, ${ref}, ${meta ? JSON.stringify(meta) : null}
      FROM upd
      RETURNING delta
    `,
  ]);
  const consumed = -results[1].reduce((s, r) => s + r.delta, 0);
  if (consumed < n) {
    const { balance } = await getBalance(e);
    return { ok: false, shortfall: n - balance, balance };
  }
  return { ok: true, consumed };
}

/**
 * 消費の取り消し（生成に失敗したときなど）。ref で消費した分を元の束に戻す。
 * 期限は変わらない（延長しない）。期限切れの束に戻った分はそのまま使えない。
 */
export async function refundPoints({ email, ref }) {
  const e = normEmail(email);
  if (!ref) throw new Error("返却には ref が必要です");
  await ensureTables();
  const sql = getSql();
  const results = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${"points:" + e}))`,
    sql`
      WITH c AS (
        SELECT lot_id, SUM(-delta) AS amt FROM point_transactions
        WHERE user_email = ${e} AND ref = ${ref} AND kind = 'consume'
          AND NOT EXISTS (
            SELECT 1 FROM point_transactions r
            WHERE r.user_email = ${e} AND r.ref = ${ref} AND r.kind = 'refund'
          )
        GROUP BY lot_id
      ),
      upd AS (
        UPDATE point_lots p SET remaining = p.remaining + c.amt
        FROM c WHERE p.id = c.lot_id
        RETURNING p.id, c.amt
      )
      INSERT INTO point_transactions (user_email, lot_id, delta, kind, ref)
      SELECT ${e}, upd.id, upd.amt, 'refund', ${ref} FROM upd
      RETURNING delta
    `,
  ]);
  return { refunded: results[1].reduce((s, r) => s + r.delta, 0) };
}

/** 履歴（管理画面・利用者の明細用） */
export async function getTransactions(email, limit = 50) {
  const e = normEmail(email);
  await ensureTables();
  const sql = getSql();
  return sql`
    SELECT t.created_at, t.delta, t.kind, t.feature, t.ref, l.source, l.expires_at
    FROM point_transactions t LEFT JOIN point_lots l ON l.id = t.lot_id
    WHERE t.user_email = ${e}
    ORDER BY t.created_at DESC
    LIMIT ${Math.min(Math.max(1, Number(limit) || 50), 500)}
  `;
}

// ---------------------------------------------------------------------------
// サブスク（毎月付与・その月限り）
// ---------------------------------------------------------------------------

/** 月を足す。月末日は翌月の末日に丸める（1/31 → 2/28）。Stripe の契約日基準の更新と揃える */
function addMonthsClamped(date, months) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/** 契約中のポイントサブスク（無ければ null） */
export async function getActivePointSubscription(email) {
  const e = normEmail(email);
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT stripe_subscription_id, tier, interval, status, current_period_end, next_grant_at
    FROM point_subscriptions
    WHERE user_email = ${e} AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `;
  if (!rows[0]) return null;
  return { ...rows[0], tierLabel: POINT_TIERS[rows[0].tier]?.label || rows[0].tier, monthlyPoints: POINT_TIERS[rows[0].tier]?.points || 0 };
}

/** Stripe のサブスク情報で記録を作る・更新する */
export async function upsertPointSubscription({ email, subscriptionId, customerId = null, tier, interval, status = "active", currentPeriodEnd = null }) {
  await ensureTables();
  const sql = getSql();
  await sql`
    INSERT INTO point_subscriptions (stripe_subscription_id, user_email, stripe_customer_id, tier, interval, status, current_period_end)
    VALUES (${subscriptionId}, ${normEmail(email)}, ${customerId}, ${tier}, ${interval}, ${status}, ${currentPeriodEnd})
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_end = COALESCE(EXCLUDED.current_period_end, point_subscriptions.current_period_end),
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, point_subscriptions.stripe_customer_id),
      updated_at = NOW()
  `;
}

export async function setPointSubscriptionStatus(subscriptionId, status) {
  await ensureTables();
  const sql = getSql();
  await sql`UPDATE point_subscriptions SET status = ${status}, updated_at = NOW() WHERE stripe_subscription_id = ${subscriptionId}`;
}

/**
 * 1か月ぶんを付与する。期限は「次の付与日」＝その月限り。
 * ref に契約IDと月の開始日を入れるので、webhook の再送や cron の重複実行でも二重に付与しない。
 */
export async function grantSubscriptionMonth({ email, subscriptionId, tier, monthStart }) {
  const t = POINT_TIERS[tier];
  if (!t) throw new Error(`不明なプランです: ${tier}`);
  const start = new Date(monthStart);
  const end = addMonthsClamped(start, 1);
  if (end <= new Date()) return { skipped: "期限切れの月" }; // 取りこぼした過去の月は付与しない
  return grantPoints({
    email, points: t.points, source: "subscription", expiresAt: end,
    ref: `${subscriptionId}:${start.toISOString().slice(0, 10)}`,
    note: `${t.label}（${start.toISOString().slice(0, 10)}〜）`,
  });
}

/**
 * 請求の支払い完了（invoice.paid）時の処理。
 * 月払いは毎月の請求ごとに付与。年間契約は初月を付与し、2か月目以降は cron（runYearlyMonthlyGrants）で付与する。
 */
export async function handlePointSubscriptionInvoice({ email, subscriptionId, customerId, tier, interval, periodStart, periodEnd }) {
  await upsertPointSubscription({ email, subscriptionId, customerId, tier, interval, status: "active", currentPeriodEnd: periodEnd });
  const r = await grantSubscriptionMonth({ email, subscriptionId, tier, monthStart: periodStart });
  if (interval === "year") {
    const sql = getSql();
    await sql`
      UPDATE point_subscriptions SET next_grant_at = ${addMonthsClamped(new Date(periodStart), 1).toISOString()}, updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `;
  }
  return r;
}

/** 年間契約の2か月目以降の付与（毎日 cron から呼ぶ。止まっていた分も順に追いつく） */
export async function runYearlyMonthlyGrants() {
  await ensureTables();
  const sql = getSql();
  const due = await sql`
    SELECT stripe_subscription_id, user_email, tier, next_grant_at, current_period_end
    FROM point_subscriptions
    WHERE status = 'active' AND interval = 'year' AND next_grant_at IS NOT NULL
      AND next_grant_at <= NOW() AND next_grant_at < current_period_end
  `;
  const results = [];
  for (const s of due) {
    let next = new Date(s.next_grant_at);
    const periodEnd = new Date(s.current_period_end);
    while (next <= new Date() && next < periodEnd) {
      try {
        const r = await grantSubscriptionMonth({ email: s.user_email, subscriptionId: s.stripe_subscription_id, tier: s.tier, monthStart: next });
        results.push({ subscriptionId: s.stripe_subscription_id, month: next.toISOString().slice(0, 10), ...r });
      } catch (e) {
        results.push({ subscriptionId: s.stripe_subscription_id, month: next.toISOString().slice(0, 10), error: e?.message });
        break; // 失敗した月で止め、次回の実行で再試行する
      }
      next = addMonthsClamped(next, 1);
    }
    await sql`UPDATE point_subscriptions SET next_grant_at = ${next.toISOString()}, updated_at = NOW() WHERE stripe_subscription_id = ${s.stripe_subscription_id}`;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Stripe の顧客（保存したカードを次の購入で呼び出す）
// ---------------------------------------------------------------------------

/**
 * メールに対応する Stripe の顧客IDを返す。無ければ作って記録する。
 * 契約中のサブスクがあれば、その顧客（カード登録済み）を優先して使う。
 */
export async function getOrCreatePointCustomer(stripe, email) {
  const e = normEmail(email);
  await ensureTables();
  const sql = getSql();
  const sub = await sql`
    SELECT stripe_customer_id FROM point_subscriptions
    WHERE user_email = ${e} AND status = 'active' AND stripe_customer_id IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  `;
  if (sub[0]?.stripe_customer_id) return sub[0].stripe_customer_id;
  const rows = await sql`SELECT stripe_customer_id FROM point_customers WHERE user_email = ${e}`;
  if (rows[0]) return rows[0].stripe_customer_id;
  const customer = await stripe.customers.create({ email: e, metadata: { kind: "points" } });
  // 同時に2つ作られた場合は先に記録された方を使う
  const saved = await sql`
    INSERT INTO point_customers (user_email, stripe_customer_id) VALUES (${e}, ${customer.id})
    ON CONFLICT (user_email) DO UPDATE SET user_email = EXCLUDED.user_email
    RETURNING stripe_customer_id
  `;
  return saved[0].stripe_customer_id;
}
