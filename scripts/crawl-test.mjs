// クロール結果の確認用（読み取り専用・DB不要）
// 使い方: node scripts/crawl-test.mjs https://example.com/
// 取得ページ数・一覧ページ数・文字数・所要時間・カテゴリーの広がりを表示する。
// CRAWL_LIMITS（app/lib/site-crawl.js）を調整した時の効果確認に使う。
import { crawlSite, buildAnalysisContext } from "../app/lib/site-crawl.js";
const url = process.argv[2];
const t = Date.now();
const snap = await crawlSite(url);
const ctx = buildAnalysisContext(snap, url);
console.log(JSON.stringify({
  url,
  elapsedMs: Date.now() - t,
  pages: snap.stats.pageCount,
  index: snap.stats.indexCount,
  indexFetched: snap.index.filter(e => e.fetched).length,
  totalChars: snap.stats.totalChars,
  contextChars: ctx.length,
  notes: snap.notes,
  sections: [...new Set(snap.pages.map(p => { try { return new URL(p.url).pathname.split("/").filter(Boolean)[0] || "_root"; } catch { return "?"; } }))],
}, null, 2));
console.log("--- first 12 pages ---");
snap.pages.slice(0, 12).forEach((p, i) => console.log(i + 1, p.title.slice(0, 40), "|", p.url, "|", p.text.length));
console.log("--- first 8 index ---");
snap.index.slice(0, 8).forEach((e) => console.log("-", (e.title || e.anchorText || "").slice(0, 40), "|", e.url, "|", e.fetched));
