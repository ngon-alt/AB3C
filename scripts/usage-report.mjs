// api_usage の実測レポート（読み取り専用）
// 2026-08-16 に導入した使用量記録から、操作1回あたりの実コストを機能別に集計する。
// 使い方:
//   node scripts/usage-report.mjs
// 前提: .env.local に DATABASE_URL があること（無ければ `vercel env pull .env.local`）
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const m = envFile.match(/^DATABASE_URL=["']?([^"'\r\n]+)/m);
if (!m) { console.error('DATABASE_URL not found in .env.local'); process.exit(1); }
const sql = neon(m[1]);

// 機能別: 回数・平均/最大コスト・平均入力トークン・平均ウェブ検索回数
const byFeature = await sql`
  SELECT feature,
         COUNT(*)::int                                              AS 回数,
         ROUND(AVG(estimated_cost_usd)::numeric, 4)                 AS 平均ドル,
         ROUND(MAX(estimated_cost_usd)::numeric, 4)                 AS 最大ドル,
         ROUND(AVG(input_tokens + cache_creation_tokens + cache_read_tokens))::bigint AS 平均入力トークン,
         ROUND(AVG(COALESCE(web_search_count, 0)), 1)            AS 平均検索回数
  FROM api_usage
  GROUP BY feature
  ORDER BY AVG(estimated_cost_usd) DESC NULLS LAST`;
console.log('=== 機能別（操作1回あたり） ===');
console.table(byFeature);

// analyze の内訳: 検索回数とコストの関係（web_search が主犯かどうかの検証）
const analyzeDetail = await sql`
  SELECT COALESCE(web_search_count, 0)                           AS 検索回数,
         COUNT(*)::int                                              AS 回数,
         ROUND(AVG(estimated_cost_usd)::numeric, 4)                 AS 平均ドル,
         ROUND(AVG(input_tokens + cache_creation_tokens + cache_read_tokens))::bigint AS 平均入力トークン,
         ROUND(AVG(output_tokens))::bigint                          AS 平均出力トークン
  FROM api_usage
  WHERE feature IN ('analyze', 'reanalyze', 'analyze_refine')
  GROUP BY 1
  ORDER BY 1`;
console.log('=== analyze系: 検索回数別のコスト（検索が主犯かの検証） ===');
console.table(analyzeDetail);

// 日別合計（傾向確認）
const daily = await sql`
  SELECT DATE(created_at AT TIME ZONE 'Asia/Tokyo')                 AS 日付,
         COUNT(*)::int                                              AS 呼び出し数,
         ROUND(SUM(estimated_cost_usd)::numeric, 2)                 AS 合計ドル
  FROM api_usage
  GROUP BY 1
  ORDER BY 1`;
console.log('=== 日別合計 ===');
console.table(daily);
