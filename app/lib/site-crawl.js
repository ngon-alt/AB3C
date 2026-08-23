import https from "node:https";
import http from "node:http";
import { neon } from "@neondatabase/serverless";

// ============================================================================
// サイトクロール（分析入力の拡充・2026-08-20）
//
// これまで AB3C 分析の入力は「指定URL 1ページ・タグを全部剥いだ素のテキスト 5000字」
// だけだった。下層ページの内容はウェブ検索が偶然拾って補っていたに過ぎず、
// 制御できず毎回変わっていた（＝分析のぶれの温床）。
// このモジュールは「同一ドメインの主要ページを上限つきで直接取得し、
// 本文・見出し階層・ナビ・パンくず・配色まで構造を保ったまま渡す」ための共通土台。
//
// 設計方針:
//   - 品質最優先。「読める範囲は全部読む」が基本で、上限は暴走防止のためだけに置く
//     （2026-08-23 権さん判断。当初の8ページ上限は「トークン節約」寄りの設計で、
//       会社概要の配下だけで使い切る数だった。戦略指南の原則に照らして撤回）
//   - 二層構造: 本文まで取る「主要ページ」と、タイトル・概要・主見出しだけ拾う「一覧ページ」。
//     一覧があれば、本文を取っていないページも「サイトに何があるか」として AI に見える
//   - 取得順はカテゴリー横断（会社概要・サービス・事例・採用…を横に広く）。
//     同じ階層の兄弟ページを取り尽くす前に、別カテゴリーの代表ページを先に取る
//   - robots.txt の Disallow を尊重する（ユーザーが指定した開始URLだけは例外＝本人の意思）
//   - 取得結果はスナップショットとして DB にキャッシュし、分析と改善レポートで共用する
//     （同じサイトを2度3度取りに行かない）
//   - クロールの失敗・キャッシュの失敗は本処理を壊さない
// ============================================================================

export const CRAWL_LIMITS = {
  maxPages: 100,        // 本文まで取得するページ数の上限（トップを含む）
  indexMaxPages: 300,   // 本文は取らず、タイトル・概要・主見出しだけ拾う「一覧」ページ数の上限
  maxDepth: 3,          // トップ = 深さ0。辿るのは深さ3まで
  topPageChars: 6000,   // トップページの本文上限
  perPageChars: 4000,   // 下層1ページあたりの本文上限
  totalChars: 400000,   // 全ページ合計の本文上限（100ページ×4000字。約22万トークン・文脈100万の範囲内）
  concurrency: 6,       // 同時取得数（訪問者6人が同時に閲覧する程度。相手サーバーへの配慮）
  pageTimeoutMs: 9000,  // 1ページの取得タイムアウト
  totalBudgetMs: 60000, // クロール全体の時間予算（関数の上限は300秒。実測は8ページ0.4秒なので100ページでも十数秒）
  maxCssFiles: 3,       // 配色抽出のために取りにいく外部CSSの数
  maxColors: 14,        // 拾う色コードの数
  maxHeadingsPerPage: 40,
  snapshotTtlHours: 6,  // スナップショットの有効時間
};

const UA = "Mozilla/5.0 (compatible; AB3CAnalyzer/1.0)";

// クロール方式のバージョン。上限や構造を変えたら上げる。
// スナップショットのキャッシュ（TTL 6時間）に古い方式の結果が残っていても、
// バージョンが違えば取り直す（8ページ版の結果が100ページ版として使われるのを防ぐ）。
export const CRAWL_VERSION = 2;

// 証明書チェーン系のエラーコード。このエラーで失敗したサイトに限り、
// TLS 検証を緩めた fallback 取得を1回だけ許可する。
// 原因の多くは「サーバーが中間証明書の送出を忘れている（fullchain でない）」不備で、
// ブラウザでは見えるが Node の厳格な fetch では検証できず弾かれる。
const CERT_CHAIN_ERROR_CODES = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "CERT_UNTRUSTED",
]);

// 証明書チェーン不備サイト専用の低レベル GET。
// Node 組み込みの node:https/http を使う（undici は import 解決が不安定なため避ける）。
// rejectUnauthorized:false は「読み取り専用の公開ページ取得」かつ
// 「厳格 fetch が証明書エラーで失敗した後の救済」に限定して使用する。最大3リダイレクト追従。
function insecureGet(targetUrl, redirectsLeft = 3, timeoutMs = CRAWL_LIMITS.pageTimeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(targetUrl); } catch (e) { return reject(e); }
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.request(
      u,
      { method: "GET", rejectUnauthorized: false, headers: { "User-Agent": UA }, timeout: timeoutMs },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume(); // ボディを破棄してソケットを解放
          const next = new URL(res.headers.location, u).toString();
          return resolve(insecureGet(next, redirectsLeft - 1, timeoutMs));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf-8"), finalUrl: u.toString(), status }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.end();
  });
}

// 1ファイル取得。証明書チェーン不備のサイトだけ TLS を緩めて1回だけ再試行する。
async function fetchDoc(url, { timeoutMs = CRAWL_LIMITS.pageTimeoutMs } = {}) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await res.text();
    return { body, finalUrl: res.url || url, status: res.status, contentType: res.headers.get("content-type") || "" };
  } catch (e) {
    const code = e?.code || e?.cause?.code;
    if (CERT_CHAIN_ERROR_CODES.has(code)) {
      console.warn(`[site-crawl] cert chain incomplete, retrying with relaxed TLS url=${url} code=${code}`);
      const r = await insecureGet(url, 3, timeoutMs);
      return { body: r.body, finalUrl: r.finalUrl, status: r.status || 200, contentType: "text/html" };
    }
    // 失敗理由を握り潰さずログに出す（IP遮断 vs タイムアウト等の切り分け用）。
    console.error(
      `[site-crawl] fetch failed url=${url} name=${e?.name} message=${e?.message} code=${code} causeMessage=${e?.cause?.message}`
    );
    throw e;
  }
}

// ---------------------------------------------------------------------------
// URL の正規化・選別
// ---------------------------------------------------------------------------

// 末尾スラッシュ・ハッシュ・計測用パラメータを落として同一ページの重複取得を防ぐ。
const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|yclid$|_ga$|mc_cid$|mc_eid$)/i;

export function normalizeUrl(href, base) {
  let u;
  try { u = base ? new URL(href, base) : new URL(href); } catch (e) { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  u.hash = "";
  const keep = [];
  u.searchParams.forEach((v, k) => { if (!TRACKING_PARAMS.test(k)) keep.push([k, v]); });
  u.search = "";
  keep.forEach(([k, v]) => u.searchParams.append(k, v));
  let s = u.toString();
  // 「/」だけのパス以外は末尾スラッシュを落として /about と /about/ を同一視する
  if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
  return s;
}

function hostKey(host) {
  return String(host || "").toLowerCase().replace(/^www\./, "");
}

export function isSameSite(a, b) {
  try { return hostKey(new URL(a).hostname) === hostKey(new URL(b).hostname); } catch (e) { return false; }
}

// 取得しても分析の役に立たない、あるいは取得すべきでないリンクを弾く
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|ico|bmp|zip|rar|7z|gz|dmg|exe|mp[34]|m4a|mov|avi|wmv|css|js|json|xml|rss|doc|docx|xls|xlsx|ppt|pptx)(\?|$)/i;
const SKIP_PATH = /(\/wp-admin|\/wp-login|\/wp-json|\/cart|\/checkout|\/mypage|\/my-?account|\/login|\/logout|\/signin|\/signup|\/register|\/password|\/feed|\/trackback|\/print|\/search|\/tag\/|\/tags\/|\/author\/|\/page\/\d+|\/\d{4}\/\d{2}\/)/i;

// 分析に効くページを優先的に選ぶための重み。
// 会社の根っこ（理念・強み・沿革）と提供物（事業・商品・料金・事例）を上位に置く。
const PAGE_PRIORITY = [
  { re: /(会社概要|企業情報|会社案内|about|company|corporate|profile)/i, score: 10 },
  { re: /(理念|想い|思い|philosophy|vision|mission|message|代表|挨拶|ごあいさつ|greeting)/i, score: 10 },
  { re: /(強み|特長|特徴|こだわり|選ばれる|理由|feature|strength|why)/i, score: 9 },
  { re: /(事業|サービス|service|business|product|商品|製品|menu|メニュー|solution)/i, score: 9 },
  { re: /(料金|価格|費用|price|pricing|plan|プラン|コース)/i, score: 7 },
  { re: /(実績|事例|導入|case|works|portfolio|customer|お客様の声|voice|review|口コミ)/i, score: 7 },
  { re: /(採用|求人|recruit|career|join)/i, score: 5 },
  { re: /(よくある質問|faq|q&a|qa)/i, score: 4 },
  { re: /(流れ|ご利用|how|guide|使い方)/i, score: 4 },
  { re: /(news|blog|column|コラム|お知らせ|ブログ|新着)/i, score: 1 },
  { re: /(privacy|policy|terms|law|tokushoho|特定商取引|プライバシー|利用規約|sitemap|contact|お問い合わせ)/i, score: -5 },
];

function scoreCandidate(url, anchorText, depth) {
  let path = "";
  try { path = decodeURIComponent(new URL(url).pathname); } catch (e) { path = url; }
  const hay = `${path} ${anchorText || ""}`;
  let score = 0;
  for (const { re, score: s } of PAGE_PRIORITY) if (re.test(hay)) score += s;
  // 階層が浅いページほど「サイトの骨格」に近い
  const segs = path.split("/").filter(Boolean).length;
  score += Math.max(0, 3 - segs);
  score -= depth; // 深さのぶん減点
  return score;
}

// URL の最初のパス区切りを「カテゴリー」とみなす（/company/..., /service/..., /blog/...）。
function sectionKey(url) {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    return segs.length ? decodeURIComponent(segs[0]).toLowerCase() : "_root";
  } catch (e) { return "_root"; }
}

// カテゴリー横断で n 件選ぶ。
// 単純なスコア順だと「商品ページ60枚」のような同スコアの塊が、事例・採用といった
// 別カテゴリーの代表ページを押し出してしまう。カテゴリーごとに最良のものから
// 順番に1枚ずつ取る（総当たり）ことで、まず横に広く、余った枠で縦に深く取る。
function pickBreadthFirst(cands, n) {
  if (n <= 0) return [];
  const buckets = new Map();
  for (const c of [...cands].sort((a, b) => b.score - a.score)) {
    const k = sectionKey(c.url);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(c);
  }
  const order = [...buckets.values()]; // 挿入順 = 各カテゴリーの最高スコア順
  const out = [];
  while (out.length < n) {
    let progressed = false;
    for (const b of order) {
      if (!b.length) continue;
      out.push(b.shift());
      progressed = true;
      if (out.length >= n) break;
    }
    if (!progressed) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// HTML の解析
// ---------------------------------------------------------------------------

function stripNoise(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    // base64 画像はテキスト扱いすると一瞬で上限を食い潰す（2026-03-30 の対策を踏襲）
    .replace(/data:[a-z/+.-]+;base64,[^"')\s]*/gi, " ");
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decodeEntities(s) {
  return String(s || "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e) => {
    if (ENTITIES[e] !== undefined) return ENTITIES[e];
    if (/^#x/i.test(e)) { const c = parseInt(e.slice(2), 16); return Number.isFinite(c) ? String.fromCodePoint(c) : m; }
    if (/^#/.test(e)) { const c = parseInt(e.slice(1), 10); return Number.isFinite(c) ? String.fromCodePoint(c) : m; }
    return m;
  });
}

function tagText(html) {
  return decodeEntities(stripNoise(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

// ブロック要素を改行に変換してから素のテキストにする。
// これまでのように全部を1行に潰すと「どこからどこまでが一つの塊か」が失われ、
// 見出しと本文の関係も、箇条書きの区切りも AI から見えなくなる。
function blockText(html) {
  const withBreaks = stripNoise(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|tr|h[1-6]|dd|dt|td|th|blockquote|figcaption|address)>/gi, "\n")
    .replace(/<(p|div|section|article|li|tr|h[1-6]|dd|dt|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const lines = decodeEntities(withBreaks)
    .split("\n")
    .map(l => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean);
  // 連続する同一行（ナビの重複等）を畳む
  const out = [];
  for (const l of lines) if (out[out.length - 1] !== l) out.push(l);
  return out;
}

function pickSection(html, tagRe) {
  const m = html.match(tagRe);
  return m ? m[0] : "";
}

function extractHeadings(html) {
  const out = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < CRAWL_LIMITS.maxHeadingsPerPage) {
    const text = tagText(m[2]).slice(0, 120);
    if (text) out.push({ level: Number(m[1]), text });
  }
  return out;
}

function extractLinks(html, baseUrl) {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 400) {
    const url = normalizeUrl(m[1], baseUrl);
    if (!url) continue;
    out.push({ url, text: tagText(m[2]).slice(0, 60) });
  }
  return out;
}

// ナビゲーション（グローバルメニュー）。サイトが自分で示す「情報の柱」なので構造として渡す。
function extractNav(html, baseUrl) {
  const navHtml = [...html.matchAll(/<nav\b[\s\S]*?<\/nav>/gi)].map(m => m[0]).join("\n")
    || pickSection(html, /<header\b[\s\S]*?<\/header>/i)
    || "";
  if (!navHtml) return [];
  const seen = new Set();
  const items = [];
  for (const l of extractLinks(navHtml, baseUrl)) {
    if (!l.text || seen.has(l.url)) continue;
    seen.add(l.url);
    items.push(l);
    if (items.length >= 25) break;
  }
  return items;
}

// パンくず。JSON-LD の BreadcrumbList か、class名に breadcrumb を含む要素から拾う。
function extractBreadcrumb(html) {
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ld) {
    try {
      const data = JSON.parse(m[1].trim());
      const list = [].concat(data).flatMap(d => (d?.["@type"] === "BreadcrumbList" ? [d] : d?.["@graph"] || []));
      const bc = list.find(d => d?.["@type"] === "BreadcrumbList");
      if (bc?.itemListElement) {
        const names = bc.itemListElement.map(i => i?.name || i?.item?.name).filter(Boolean);
        if (names.length) return names.slice(0, 8);
      }
    } catch (e) { /* JSON-LD が壊れているサイトは無視 */ }
  }
  const m = html.match(/<[^>]+(?:class|id)\s*=\s*["'][^"']*(breadcrumb|topicpath|pankuzu)[^"']*["'][^>]*>([\s\S]{0,1500}?)<\/(?:nav|div|ul|ol|p)>/i);
  if (m) {
    const parts = tagText(m[2]).split(/[>›»／\/|｜]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts.slice(0, 8);
  }
  return [];
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]*(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, "i");
  const m = html.match(re);
  if (m) return decodeEntities(m[1]).trim();
  const re2 = new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${name}["']`, "i");
  const m2 = html.match(re2);
  return m2 ? decodeEntities(m2[1]).trim() : "";
}

// ロゴ画像の URL。画素は読まないが、「どのファイルがロゴか」は配色検討の手がかりになる。
function extractLogoUrl(html, baseUrl) {
  const m = html.match(/<img\b[^>]*(?:src|data-src)\s*=\s*["']([^"']*(?:logo|ロゴ)[^"']*)["'][^>]*>/i)
    || html.match(/<img\b[^>]*(?:alt|class|id)\s*=\s*["'][^"']*(?:logo|ロゴ)[^"']*["'][^>]*(?:src|data-src)\s*=\s*["']([^"']+)["']/i);
  return m ? normalizeUrl(m[1], baseUrl) : null;
}

// ログイン壁の検知。
// これまではログインページの HTML をそのまま「サイトの中身」として分析していた
// （エラーにならないぶん、誤分析に気づけないという意味でむしろ危険だった）。
function detectLoginWall({ html, title, textLength }) {
  const hasPassword = /<input[^>]*type\s*=\s*["']password["']/i.test(html);
  const loginish = /(ログイン|サインイン|ログオン|log\s?in|sign\s?in)/i.test(title || "");
  if (hasPassword && textLength < 1200) {
    return { detected: true, reason: "パスワード入力欄があり、本文がほとんど取得できませんでした" };
  }
  if (loginish && textLength < 800) {
    return { detected: true, reason: "ページタイトルがログイン画面のもので、本文がほとんど取得できませんでした" };
  }
  return { detected: false, reason: "" };
}

// ---------------------------------------------------------------------------
// 配色（CSS から色コードをテキストとして拾う）
// ---------------------------------------------------------------------------

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;

function normalizeColor(raw) {
  let s = String(raw).trim().toLowerCase();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) return "#" + hex.split("").map(c => c + c).join("");
    if (hex.length === 6) return "#" + hex;
    if (hex.length === 8) return "#" + hex.slice(0, 6); // 透明度は落とす
    return null;
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  const to = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0");
  return "#" + to(m[1]) + to(m[2]) + to(m[3]);
}

function collectColors(cssText, counter) {
  const found = String(cssText).match(COLOR_RE) || [];
  for (const raw of found) {
    const c = normalizeColor(raw);
    if (!c) continue;
    counter.set(c, (counter.get(c) || 0) + 1);
  }
}

// 白・黒・無彩色は「配色の意図」を表さないので後ろに回す（捨てはしない）
function colorRank([hex, count]) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return count * (chroma > 24 ? 3 : 1);
}

async function collectSiteColors(topHtml, baseUrl) {
  const counter = new Map();
  for (const m of topHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) collectColors(m[1], counter);
  for (const m of topHtml.matchAll(/\bstyle\s*=\s*["']([^"']+)["']/gi)) collectColors(m[1], counter);
  const themeColor = extractMeta(topHtml, "theme-color");
  if (themeColor) collectColors(themeColor, counter);

  // 外部CSS（同一ドメインのみ・数を絞って取得）
  const hrefs = [];
  for (const m of topHtml.matchAll(/<link\b[^>]*>/gi)) {
    if (!/rel\s*=\s*["']?stylesheet/i.test(m[0])) continue;
    const h = m[0].match(/href\s*=\s*["']([^"']+)["']/i);
    if (!h) continue;
    const u = normalizeUrl(h[1], baseUrl);
    if (u && isSameSite(u, baseUrl)) hrefs.push(u);
  }
  // style/theme/main を名前に含むものを優先（テーマ色が入っている可能性が高い）
  const weight = (u) => (/(style|theme|main|common)/i.test(u) ? 1 : 0);
  hrefs.sort((a, b) => weight(b) - weight(a));
  const targets = [...new Set(hrefs)].slice(0, CRAWL_LIMITS.maxCssFiles);
  await Promise.all(targets.map(async (u) => {
    try {
      const { body } = await fetchDoc(u, { timeoutMs: 5000 });
      collectColors(String(body).slice(0, 300000), counter);
    } catch (e) { /* CSS が取れなくても分析は続ける */ }
  }));

  return [...counter.entries()]
    .sort((a, b) => colorRank(b) - colorRank(a))
    .slice(0, CRAWL_LIMITS.maxColors)
    .map(([hex, count]) => ({ hex, count }));
}

// ---------------------------------------------------------------------------
// robots.txt（同一ドメインを巡回する以上、最低限の礼儀として尊重する）
// ---------------------------------------------------------------------------

async function fetchRobots(origin) {
  try {
    const { body } = await fetchDoc(`${origin}/robots.txt`, { timeoutMs: 4000 });
    if (!body || /<html/i.test(String(body).slice(0, 200))) return [];
    const disallow = [];
    let applies = false;
    for (const raw of String(body).split(/\r?\n/)) {
      const line = raw.replace(/#.*$/, "").trim();
      if (!line) continue;
      const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
      if (!m) continue;
      const key = m[1].toLowerCase(), val = m[2].trim();
      if (key === "user-agent") applies = (val === "*");
      else if (applies && key === "disallow" && val) disallow.push(val);
    }
    return disallow;
  } catch (e) {
    return [];
  }
}

function robotsAllows(disallow, url) {
  if (!disallow.length) return true;
  let path;
  try { const u = new URL(url); path = u.pathname + u.search; } catch (e) { return true; }
  return !disallow.some(rule => {
    const clean = rule.replace(/\*+$/, "");
    return clean && path.startsWith(clean);
  });
}

// ---------------------------------------------------------------------------
// クロール本体
// ---------------------------------------------------------------------------

function parsePage(html, url, { isTop }) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, " ").trim().slice(0, 200) : "";
  const description = extractMeta(html, "description").slice(0, 300);
  const headings = extractHeadings(html);
  const breadcrumb = extractBreadcrumb(html);
  // 本文は main / article があればそこを優先（ナビ・フッターの重複を減らす）
  const mainHtml = pickSection(html, /<main\b[\s\S]*?<\/main>/i)
    || pickSection(html, /<article\b[\s\S]*?<\/article>/i)
    || html;
  const lines = blockText(mainHtml);
  const links = extractLinks(html, url);
  return {
    url,
    title,
    description,
    headings,
    breadcrumb,
    lines,
    links,
    isTop: !!isTop,
    textLength: lines.join("").length,
  };
}

// 一覧（二層目）用の軽量パース。本文は持たず、タイトル・概要・主見出しだけ。
// 「このページが存在し、何についてのページか」を AI に見せるための最小情報。
function parsePageLight(html, url) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, " ").trim().slice(0, 120) : "";
  const description = extractMeta(html, "description").slice(0, 160);
  const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const heading = h1m ? tagText(h1m[1]).slice(0, 100) : "";
  return { url, title, description, heading };
}

// 全ページに共通して現れる短い行（グローバルナビ・フッター）は本文から落とす。
// ナビはナビとして別に渡しているので、本文側では繰り返しぶんのトークンが無駄になる。
function dropBoilerplate(pages) {
  if (pages.length < 3) return pages;
  const count = new Map();
  for (const p of pages) {
    for (const l of new Set(p.lines)) count.set(l, (count.get(l) || 0) + 1);
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.6));
  const boiler = new Set([...count.entries()].filter(([l, c]) => c >= threshold && l.length <= 40).map(([l]) => l));
  return pages.map(p => ({ ...p, lines: p.lines.filter(l => !boiler.has(l)) }));
}

function clampText(lines, limit) {
  let out = "", truncated = false;
  for (const l of lines) {
    if (out.length + l.length + 1 > limit) { truncated = true; break; }
    out += (out ? "\n" : "") + l;
  }
  return { text: out, truncated };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

// sitemap.xml から候補URLを拾う。
// 当初は「トップページのリンクが JavaScript 生成で取れない場合の保険」だったが、
// 取得上限を広げた（2026-08-23）ことで「サイト全体の候補を揃える常用の手段」になった。
// サイトマップインデックス（子サイトマップの一覧）なら子を最大5本まで読む。
async function fetchSitemapUrls(origin, baseUrl, limit = 1000) {
  const readLocs = async (url) => {
    const { body } = await fetchDoc(url, { timeoutMs: 5000 });
    return [...String(body).matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim());
  };
  try {
    let locs = await readLocs(`${origin}/sitemap.xml`);
    const children = locs.filter(l => /sitemap[^/]*\.xml(\?|$)/i.test(l)).slice(0, 5);
    if (children.length) {
      const nested = await Promise.all(children.map(c => readLocs(c).catch(() => [])));
      locs = locs.filter(l => !children.includes(l)).concat(nested.flat());
    }
    const urls = [];
    for (const loc of locs.slice(0, limit)) {
      const u = normalizeUrl(loc, baseUrl);
      if (u && isSameSite(u, baseUrl) && !SKIP_EXT.test(u) && !SKIP_PATH.test(u)) urls.push(u);
    }
    return [...new Set(urls)];
  } catch (e) {
    return [];
  }
}

/**
 * 指定URLを起点に、同一ドメインの主要ページを上限つきで取得する。
 * 開始ページの取得に失敗した場合のみ throw する（下層ページの失敗は握って続行）。
 */
export async function crawlSite(startUrl, opts = {}) {
  const limits = { ...CRAWL_LIMITS, ...opts };
  const startedAt = Date.now();
  const timeLeft = () => limits.totalBudgetMs - (Date.now() - startedAt);
  const notes = [];

  // --- 開始ページ（ユーザーが指定したURL。robots.txt の判定対象外＝本人の意思による取得） ---
  let first = await fetchDoc(startUrl, { timeoutMs: limits.pageTimeoutMs });
  let topUrl = normalizeUrl(first.finalUrl || startUrl) || startUrl;
  let topHtml = String(first.body || "");
  let topPage = parsePage(topHtml, topUrl, { isTop: true });

  // 裸ドメインと www の片方だけが生きているサイトがある（2026-08-23 komagomeku.tokyo で確認:
  // 裸ドメインが 404、www は正常）。開始ページが 4xx/5xx か中身が空なら相方を1回だけ試す。
  if ((first.status >= 400 || topPage.textLength === 0)) {
    try {
      const u = new URL(startUrl);
      u.hostname = /^www\./i.test(u.hostname) ? u.hostname.replace(/^www\./i, "") : `www.${u.hostname}`;
      const alt = await fetchDoc(u.toString(), { timeoutMs: limits.pageTimeoutMs });
      const altUrl = normalizeUrl(alt.finalUrl || u.toString()) || u.toString();
      const altPage = parsePage(String(alt.body || ""), altUrl, { isTop: true });
      if (alt.status < 400 && altPage.textLength > topPage.textLength) {
        notes.push(`指定URLが${first.status >= 400 ? `ステータス${first.status}` : "空のページ"}だったため ${u.hostname} で取得しました`);
        first = alt; topUrl = altUrl; topHtml = String(alt.body || ""); topPage = altPage;
      }
    } catch (e) { /* 相方も駄目なら元の結果で続行 */ }
  }

  const loginWall = detectLoginWall({ html: topHtml, title: topPage.title, textLength: topPage.textLength });

  let origin = "";
  try { origin = new URL(topUrl).origin; } catch (e) { origin = ""; }

  // --- 巡回対象の選定 ---
  const visited = new Set([topUrl]);
  const collected = [topPage];
  const indexPages = []; // 二層目（本文なしの一覧）
  const colorsPromise = collectSiteColors(topHtml, topUrl).catch(() => []);

  if (!loginWall.detected && origin) {
    const disallow = await fetchRobots(origin);

    const candidates = new Map(); // url -> { url, text, depth, score }
    const addCandidates = (links, depth) => {
      for (const l of links) {
        if (!l.url || visited.has(l.url) || candidates.has(l.url)) continue;
        if (!isSameSite(l.url, topUrl)) continue;
        if (SKIP_EXT.test(l.url) || SKIP_PATH.test(l.url)) continue;
        if (!robotsAllows(disallow, l.url)) continue;
        const d = Number.isFinite(l.depth) ? l.depth : depth;
        candidates.set(l.url, { url: l.url, text: l.text, depth: d, score: scoreCandidate(l.url, l.text, d) });
      }
    };
    addCandidates(topPage.links, 1);

    // sitemap.xml で候補を広げる。トップのリンクだけでは深い階層のページが見えない
    // （JavaScript でメニューを組むサイトでは、そもそもリンクが取れない）。
    if (candidates.size < limits.maxPages) {
      const sitemapUrls = await fetchSitemapUrls(origin, topUrl);
      if (sitemapUrls.length) {
        if (candidates.size < 2) notes.push("トップページのリンクが少なかったため sitemap.xml から主要ページを補いました");
        // サイトマップ由来のURLは階層が分からないので、パスの深さを深さとみなす
        addCandidates(
          sitemapUrls.map(u => {
            let d = 1;
            try { d = Math.min(limits.maxDepth, Math.max(1, new URL(u).pathname.split("/").filter(Boolean).length)); } catch (e) { d = 1; }
            return { url: u, text: "", depth: d };
          }),
          1
        );
      }
    }

    // --- 一層目: 本文まで取る主要ページ。深さ1 → 2 → 3 の順、各深さ内はカテゴリー横断 ---
    for (let depth = 1; depth <= limits.maxDepth; depth++) {
      if (collected.length >= limits.maxPages) break;
      if (timeLeft() <= 3000) { notes.push("時間の上限に達したため取得を打ち切りました"); break; }
      const pool = [...candidates.values()].filter(c => c.depth === depth && !visited.has(c.url) && c.score > -3);
      const batch = pickBreadthFirst(pool, limits.maxPages - collected.length);
      if (!batch.length) continue;
      batch.forEach(c => visited.add(c.url));

      const fetched = await runPool(batch, async (c) => {
        if (timeLeft() <= 1500) return null;
        try {
          const r = await fetchDoc(c.url, { timeoutMs: Math.min(limits.pageTimeoutMs, Math.max(3000, timeLeft())) });
          if (r.contentType && !/text\/html|application\/xhtml/i.test(r.contentType)) return null;
          return parsePage(String(r.body || ""), c.url, { isTop: false });
        } catch (e) {
          return null;
        }
      }, limits.concurrency);

      for (const p of fetched) {
        if (!p) continue;
        if (collected.length >= limits.maxPages || p.textLength < 120) {
          // 枠に入らない・中身が薄いページも「存在」は一覧に残す
          indexPages.push({ url: p.url, title: p.title, description: p.description, heading: p.headings?.[0]?.text || "", fetched: true });
          continue;
        }
        collected.push(p);
      }
      // 次の深さの候補を、いま取れたページのリンクから足す
      if (depth < limits.maxDepth) {
        for (const p of fetched) if (p) addCandidates(p.links, depth + 1);
      }
    }

    // --- 二層目: 本文は取らず、タイトル・概要・主見出しだけ拾う「一覧」 ---
    // 本文を渡していないページでも「サイトに何があるか」を AI が把握できるようにする。
    const leftovers = [...candidates.values()]
      .filter(c => !visited.has(c.url) && c.score > -3)
      .sort((a, b) => b.score - a.score);
    const toFetch = leftovers.slice(0, Math.max(0, limits.indexMaxPages - indexPages.length));
    if (toFetch.length && timeLeft() > 5000) {
      toFetch.forEach(c => visited.add(c.url));
      const light = await runPool(toFetch, async (c) => {
        if (timeLeft() <= 1500) return { url: c.url, title: "", description: "", heading: "", anchorText: c.text, fetched: false };
        try {
          const r = await fetchDoc(c.url, { timeoutMs: Math.min(6000, Math.max(2000, timeLeft())) });
          if (r.contentType && !/text\/html|application\/xhtml/i.test(r.contentType)) return null;
          return { ...parsePageLight(String(r.body || ""), c.url), anchorText: c.text, fetched: true };
        } catch (e) {
          return { url: c.url, title: "", description: "", heading: "", anchorText: c.text, fetched: false };
        }
      }, limits.concurrency);
      for (const e of light) if (e) indexPages.push(e);
    }
    // 時間や枠の都合で取りに行けなかった残りは、URLとリンク文言だけで一覧に載せる
    for (const c of leftovers.slice(toFetch.length, toFetch.length + 300)) {
      indexPages.push({ url: c.url, title: "", description: "", heading: "", anchorText: c.text, fetched: false });
    }
    if (leftovers.length > toFetch.length + 300) {
      notes.push(`一覧に載せきれなかったページが${leftovers.length - toFetch.length - 300}件あります`);
    }
  }

  // --- 本文の整形と文字数上限の配分 ---
  const cleaned = dropBoilerplate(collected);
  let budget = limits.totalChars;
  const pages = cleaned.map((p) => {
    const perPage = Math.min(p.isTop ? limits.topPageChars : limits.perPageChars, Math.max(0, budget));
    const { text, truncated } = clampText(p.lines, perPage);
    budget -= text.length;
    return {
      url: p.url,
      title: p.title,
      description: p.description,
      breadcrumb: p.breadcrumb,
      headings: p.headings,
      text,
      truncated,
      isTop: p.isTop,
    };
  });
  // 文字数上限で本文が入らなかったページは、一覧側に回して「存在」だけは残す
  for (const p of pages) {
    if (!p.isTop && p.text.length === 0) {
      indexPages.push({ url: p.url, title: p.title, description: p.description, heading: p.headings?.[0]?.text || "", fetched: true });
    }
  }
  const keptPages = pages.filter(p => p.isTop || p.text.length > 0);

  const colors = await colorsPromise;
  const nav = extractNav(topHtml, topUrl);
  const logoUrl = extractLogoUrl(topHtml, topUrl);

  return {
    crawlVersion: CRAWL_VERSION,
    startUrl,
    topUrl,
    host: origin ? new URL(topUrl).hostname : "",
    fetchedAt: new Date().toISOString(),
    loginWall,
    nav,
    logoUrl,
    colors,
    pages: keptPages,
    index: indexPages,
    notes,
    stats: {
      pageCount: keptPages.length,
      indexCount: indexPages.length,
      totalChars: keptPages.reduce((n, p) => n + p.text.length, 0),
      elapsedMs: Date.now() - startedAt,
    },
  };
}

// ---------------------------------------------------------------------------
// スナップショットのキャッシュ（分析と改善レポートで同じ取得結果を使い回す）
// ---------------------------------------------------------------------------

let _sql = null;
function getSql() {
  // 接続はモジュール読み込み時ではなく初回利用時に作る（DATABASE_URL の無いビルド環境対策）
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS site_snapshots (
      url_key TEXT PRIMARY KEY,
      start_url TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_site_snapshots_created ON site_snapshots(created_at)`;
  tableReady = true;
}

async function readSnapshot(key, ttlHours) {
  try {
    await ensureTable();
    const sql = getSql();
    const rows = await sql`
      SELECT data FROM site_snapshots
      WHERE url_key = ${key} AND created_at > NOW() - make_interval(hours => ${Number(ttlHours)})
      LIMIT 1
    `;
    return rows[0]?.data || null;
  } catch (e) {
    console.error("[site-crawl] スナップショットの読み出しに失敗:", e?.message || e);
    return null;
  }
}

async function writeSnapshot(key, startUrl, data) {
  try {
    await ensureTable();
    const sql = getSql();
    await sql`
      INSERT INTO site_snapshots (url_key, start_url, data, created_at)
      VALUES (${key}, ${startUrl}, ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (url_key) DO UPDATE
        SET data = EXCLUDED.data, start_url = EXCLUDED.start_url, created_at = NOW()
    `;
  } catch (e) {
    console.error("[site-crawl] スナップショットの保存に失敗:", e?.message || e);
  }
}

/**
 * キャッシュ優先でサイトのスナップショットを得る。
 * 分析（/api/analyze）と改善レポート（/api/improve・パターン切替で複数回呼ばれる）で
 * 同じ取得結果を共用し、相手サーバーへ何度も取りに行かないためのもの。
 * キャッシュが使えない場合は素直にクロールする（キャッシュの失敗で分析を止めない）。
 */
export async function getSiteSnapshot(url, opts = {}) {
  const key = normalizeUrl(url) || String(url);
  const ttl = opts.ttlHours ?? CRAWL_LIMITS.snapshotTtlHours;
  if (opts.forceRefresh !== true) {
    const cached = await readSnapshot(key, ttl);
    if (cached && cached.crawlVersion === CRAWL_VERSION) return { ...cached, fromCache: true };
  }
  const snapshot = await crawlSite(url, opts);
  await writeSnapshot(key, url, snapshot);
  return { ...snapshot, fromCache: false };
}

// ---------------------------------------------------------------------------
// プロンプト用のテキスト化
// ---------------------------------------------------------------------------

function headingOutline(headings) {
  return headings
    .map(h => `${"  ".repeat(Math.max(0, h.level - 1))}${"#".repeat(h.level)} ${h.text}`)
    .join("\n");
}

// 二層目（本文なしの一覧）を1行1ページで整形する。
function indexLines(index) {
  return (index || []).map(e => {
    const label = e.title || e.heading || e.anchorText || "(タイトル未取得)";
    const extra = [e.heading && e.heading !== e.title ? e.heading : "", e.description].filter(Boolean).join(" — ");
    return `- ${label}｜${e.url}${extra ? `（${extra}）` : ""}`;
  }).join("\n");
}

/** AB3C 分析用。サイトの骨格（ナビ・ページ構成）＋各ページの見出しと本文。 */
export function buildAnalysisContext(snapshot, sourceUrl) {
  const parts = [];
  parts.push(`以下はウェブサイト（${sourceUrl || snapshot.topUrl}）から実際に取得した内容です。`);
  const idxCount = snapshot.index?.length || 0;
  parts.push(`本文を取得したページ: ${snapshot.pages.length}ページ${idxCount ? `／題名のみ把握したページ: ${idxCount}ページ` : ""}／取得日時: ${snapshot.fetchedAt}`);
  if (snapshot.nav?.length) {
    parts.push(`\n## グローバルナビゲーション（サイトが自ら示す情報の柱）\n${snapshot.nav.map(n => `- ${n.text || "(無題)"}｜${n.url}`).join("\n")}`);
  }
  parts.push(`\n## 取得したページ一覧\n${snapshot.pages.map((p, i) => `${i + 1}. ${p.title || "(無題)"}｜${p.url}`).join("\n")}`);
  snapshot.pages.forEach((p, i) => {
    parts.push(`\n---\n### ページ${i + 1}${p.isTop ? "（トップページ）" : ""}: ${p.title || "(無題)"}\nURL: ${p.url}`);
    if (p.description) parts.push(`ページ概要: ${p.description}`);
    if (p.breadcrumb?.length) parts.push(`パンくず: ${p.breadcrumb.join(" > ")}`);
    if (p.headings?.length) parts.push(`見出し階層:\n${headingOutline(p.headings)}`);
    parts.push(`本文:\n${p.text}${p.truncated ? "\n（本文はここまで。以降は文字数上限のため省略）" : ""}`);
  });
  if (idxCount) {
    parts.push(`\n---\n## その他のページ一覧（本文は未取得・存在と題名のみ。${idxCount}ページ）\nサイト全体にどんなページがあるかの把握に使ってください。\n${indexLines(snapshot.index)}`);
  }
  if (snapshot.notes?.length) parts.push(`\n（取得メモ: ${snapshot.notes.join(" / ")}）`);
  return parts.join("\n");
}

/** ウェブサイト改善レポート用。構造・ナビ・見出し・配色を主に、本文は要点だけ。 */
export function buildStructureContext(snapshot) {
  const parts = [];
  const idxCount = snapshot.index?.length || 0;
  parts.push(`## 現状サイトの実データ（本文取得 ${snapshot.pages.length}ページ${idxCount ? `＋題名のみ把握 ${idxCount}ページ` : ""}／取得日時 ${snapshot.fetchedAt}）`);
  if (snapshot.nav?.length) {
    parts.push(`\n### グローバルナビゲーション\n${snapshot.nav.map(n => `- ${n.text || "(無題)"}｜${n.url}`).join("\n")}`);
  }
  parts.push(`\n### ページ構成（取得できた主要ページ）\n${snapshot.pages.map((p, i) => {
    const bc = p.breadcrumb?.length ? `／パンくず: ${p.breadcrumb.join(" > ")}` : "";
    return `${i + 1}. ${p.title || "(無題)"}｜${p.url}${bc}`;
  }).join("\n")}`);
  if (snapshot.colors?.length) {
    parts.push(`\n### 現状の配色（CSSから抽出した使用色・出現数順）\n${snapshot.colors.map(c => `${c.hex}（${c.count}箇所）`).join(" / ")}`);
    if (snapshot.logoUrl) parts.push(`ロゴ画像: ${snapshot.logoUrl}`);
  }
  snapshot.pages.forEach((p, i) => {
    parts.push(`\n---\n### ページ${i + 1}${p.isTop ? "（トップページ）" : ""}: ${p.title || "(無題)"}\nURL: ${p.url}`);
    if (p.headings?.length) parts.push(`見出し階層:\n${headingOutline(p.headings)}`);
    const body = p.isTop ? p.text.slice(0, 2500) : p.text.slice(0, 1200);
    if (body) parts.push(`本文（抜粋）:\n${body}`);
  });
  if (idxCount) {
    parts.push(`\n---\n### その他のページ一覧（本文は未取得・存在と題名のみ。${idxCount}ページ）\n構造の提案では、これらのページの置き場所・統廃合も対象に含めてください。\n${indexLines(snapshot.index)}`);
  }
  return parts.join("\n");
}
