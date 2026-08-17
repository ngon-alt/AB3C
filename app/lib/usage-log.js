import { neon } from "@neondatabase/serverless";

// 接続はモジュール読み込み時ではなく初回利用時に作る。
// モジュールスコープで neon() を呼ぶと、DATABASE_URL の無いビルド環境でも
// ルートの読み込みだけで例外になり `next build` が落ちる（実際に落とした）。
let _sql = null;
function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// モデル別の単価（USD / 100万トークン）。Anthropic の価格改定時はここだけ直す。
// 未知のモデルが来たら DEFAULT_PRICING で概算する（記録自体は落とさない）。
const PRICING = {
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
};
const DEFAULT_PRICING = { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 };
// ウェブ検索は 1,000 回あたり $10
const WEB_SEARCH_USD_PER_CALL = 0.01;

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS api_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255),
      feature VARCHAR(50) NOT NULL,
      model VARCHAR(64),
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cache_creation_tokens INTEGER DEFAULT 0,
      cache_read_tokens INTEGER DEFAULT 0,
      web_search_count INTEGER DEFAULT 0,
      estimated_cost_usd NUMERIC(12, 6) DEFAULT 0,
      site_id UUID,
      meta JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_email_created ON api_usage(user_email, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_feature ON api_usage(feature)`;
  tableReady = true;
}

// Anthropic のレスポンスから usage を取り出して概算コストを出す。
export function summarizeUsage(response) {
  const u = response?.usage || {};
  const model = response?.model || null;
  const input = u.input_tokens || 0;
  const output = u.output_tokens || 0;
  const cacheWrite = u.cache_creation_input_tokens || 0;
  const cacheRead = u.cache_read_input_tokens || 0;
  const webSearch = u.server_tool_use?.web_search_requests || 0;

  const p = PRICING[model] || DEFAULT_PRICING;
  const cost =
    (input * p.input + output * p.output + cacheWrite * p.cacheWrite + cacheRead * p.cacheRead) / 1_000_000 +
    webSearch * WEB_SEARCH_USD_PER_CALL;

  return { model, input, output, cacheWrite, cacheRead, webSearch, cost };
}

/**
 * Anthropic 呼び出し1回分の使用量を記録する。
 *
 * 記録の失敗が本処理を壊してはいけないので、例外は握りつぶしてログに残すだけにする。
 * （分析が成功したのに使用量記録の DB エラーでユーザーがエラー画面を見る、という事態を防ぐ）
 *
 * @param {object} response  client.messages.create() の戻り値
 * @param {object} ctx       { email, feature, siteId, meta }
 */
export async function logUsage(response, ctx = {}) {
  try {
    const s = summarizeUsage(response);
    // usage が取れないレスポンス（ストリーム中断等）は記録しない
    if (!s.input && !s.output && !s.cacheWrite && !s.cacheRead) return;

    await ensureTable();
    const sql = getSql();
    await sql`
      INSERT INTO api_usage (
        user_email, feature, model,
        input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
        web_search_count, estimated_cost_usd, site_id, meta
      ) VALUES (
        ${ctx.email || null}, ${ctx.feature || "unknown"}, ${s.model},
        ${s.input}, ${s.output}, ${s.cacheWrite}, ${s.cacheRead},
        ${s.webSearch}, ${s.cost}, ${ctx.siteId || null},
        ${ctx.meta ? JSON.stringify(ctx.meta) : null}
      )
    `;
  } catch (e) {
    console.error("[usage-log] 記録に失敗:", e?.message || e);
  }
}

/**
 * 指定ユーザーの累計使用量を返す。従量課金・トライアル上限の判定用。
 * since を渡すとその日時以降だけを集計する（トライアル発行日以降など）。
 */
export async function getUsageTotals(email, since = null) {
  try {
    await ensureTable();
    const sql = getSql();
    const rows = since
      ? await sql`
          SELECT COALESCE(SUM(input_tokens), 0) AS input_tokens,
                 COALESCE(SUM(output_tokens), 0) AS output_tokens,
                 COALESCE(SUM(cache_creation_tokens), 0) AS cache_creation_tokens,
                 COALESCE(SUM(cache_read_tokens), 0) AS cache_read_tokens,
                 COALESCE(SUM(estimated_cost_usd), 0) AS estimated_cost_usd,
                 COUNT(*) AS calls
          FROM api_usage WHERE user_email = ${email} AND created_at >= ${since}
        `
      : await sql`
          SELECT COALESCE(SUM(input_tokens), 0) AS input_tokens,
                 COALESCE(SUM(output_tokens), 0) AS output_tokens,
                 COALESCE(SUM(cache_creation_tokens), 0) AS cache_creation_tokens,
                 COALESCE(SUM(cache_read_tokens), 0) AS cache_read_tokens,
                 COALESCE(SUM(estimated_cost_usd), 0) AS estimated_cost_usd,
                 COUNT(*) AS calls
          FROM api_usage WHERE user_email = ${email}
        `;
    const r = rows[0] || {};
    return {
      inputTokens: parseInt(r.input_tokens || 0),
      outputTokens: parseInt(r.output_tokens || 0),
      cacheCreationTokens: parseInt(r.cache_creation_tokens || 0),
      cacheReadTokens: parseInt(r.cache_read_tokens || 0),
      estimatedCostUsd: parseFloat(r.estimated_cost_usd || 0),
      calls: parseInt(r.calls || 0),
    };
  } catch (e) {
    console.error("[usage-log] 集計に失敗:", e?.message || e);
    return null;
  }
}
