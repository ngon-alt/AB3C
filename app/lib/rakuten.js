// 楽天市場・商品分析機能（楽天版）のデータ取得ライブラリ
// 仕様: docs/楽天版-仕様書-v1.md 第7章
//
// 取得経路（2026-06-12 スパイク検証済み・ローカル回線）:
//   - 商品LP: item.rakuten.co.jp/{shop}/{slug}/ … ブラウザ相当UAでHTTP 200。
//     ページ内に review.rakuten.co.jp/item/1/{shopId}_{itemId} の数値IDが含まれる
//   - レビュー: review.rakuten.co.jp/item/1/{shopId}_{itemId}/{page}.1/ … HTTP 200。
//     window.__INITIAL_STATE__ のJSONに本文(body)・評価(rating)が構造化されて入っている
//   - 標準的なfetch（プログラム的UA）は403で弾かれるため、ブラウザ相当ヘッダーが必須
//   - Vercel経路（データセンターIP）での可否は preview で要確認（403なら中継を検討）

// ブラウザ相当のヘッダー。これがないと楽天は403を返す。
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ja,en;q=0.9",
};

export async function fetchRakutenHtml(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!res.ok) {
    const err = new Error(`楽天ページの取得に失敗しました（HTTP ${res.status}）`);
    err.httpStatus = res.status;
    throw err;
  }
  // 楽天の商品ページは EUC-JP のことがある（古いページ構成）。
  // Content-Type ヘッダー → meta charset の順で文字コードを検出してデコードする。
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  let charset = (ct.match(/charset=([\w-]+)/i) || [])[1];
  if (!charset) {
    const head = buf.slice(0, 4096).toString("latin1");
    charset = (head.match(/charset=["']?([\w-]+)/i) || [])[1];
  }
  charset = (charset || "utf-8").toLowerCase();
  try {
    return new TextDecoder(charset).decode(buf);
  } catch {
    return buf.toString("utf-8");
  }
}

export function isRakutenItemUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === "item.rakuten.co.jp" && u.pathname.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

// 商品LPページから、タイトル・本文テキスト・レビューページの数値IDを抽出する
export function parseItemPage(html) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/【楽天市場】/g, "").replace(/\s+/g, " ").trim().slice(0, 120)
    : "";

  // レビューページへの橋渡しID（shopId_itemId）。ページ内のレビューリンクから拾う
  const idMatch = html.match(/review\.rakuten\.co\.jp\/item\/1\/(\d+_\d+)/);
  const reviewKey = idMatch ? idMatch[1] : null;

  // LP本文テキスト（訴求の抽出に使う）。スクリプト・スタイルを除去してタグを剥がす
  const lpText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/data:image\/[^;]+;base64,[^"']*/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);

  return { title, reviewKey, lpText };
}

// レビューページの __INITIAL_STATE__ からレビュー配列を取り出す
export function parseReviewPage(html) {
  const marker = html.indexOf("__INITIAL_STATE__");
  if (marker < 0) return { reviews: [], totalCount: 0 };
  const braceStart = html.indexOf("{", marker);
  if (braceStart < 0) return { reviews: [], totalCount: 0 };

  // バランスの取れた波かっこ範囲を切り出してJSONパースする
  let depth = 0;
  let end = -1;
  let inString = false;
  let escaped = false;
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) return { reviews: [], totalCount: 0 };

  let state;
  try {
    state = JSON.parse(html.slice(braceStart, end));
  } catch {
    return { reviews: [], totalCount: 0 };
  }

  // reviews.data には店舗レビューも混在する。itemReviews.keys が商品レビューのID一覧
  const data = state?.reviews?.data || {};
  const itemKeys = state?.reviews?.itemReviews?.keys;
  const pool = Array.isArray(itemKeys)
    ? itemKeys.map((k) => data[k]).filter(Boolean)
    : Object.values(data);
  const reviews = pool
    .filter((r) => r && typeof r.body === "string" && r.body.trim().length > 0)
    .map((r) => ({
      key: r.key || r.revSubkey || null,
      rating: typeof r.rating === "number" ? r.rating : null,
      body: r.body.replace(/\s+/g, " ").trim().slice(0, 600),
      postDate: r.postDate || r.orderDate || null,
    }));
  const totalCount = state?.itemInfo?.reviewRatings?.totalCount || reviews.length;
  const ratingAverage = state?.itemInfo?.reviewRatings?.average ?? null;
  return { reviews, totalCount, ratingAverage };
}

// 商品URL → LP本文＋レビュー一式を取得する（レビューは複数ページ巡回・重複排除）
export async function fetchProductData(itemUrl, { maxReviewPages = 3 } = {}) {
  const itemHtml = await fetchRakutenHtml(itemUrl);
  const { title, reviewKey, lpText } = parseItemPage(itemHtml);

  const all = new Map();
  let totalCount = 0;
  let ratingAverage = null;
  if (reviewKey) {
    for (let page = 1; page <= maxReviewPages; page++) {
      let parsed;
      try {
        const reviewHtml = await fetchRakutenHtml(
          `https://review.rakuten.co.jp/item/1/${reviewKey}/${page}.1/`
        );
        parsed = parseReviewPage(reviewHtml);
      } catch {
        break; // レビューページの途中失敗は致命傷にしない（取れた分で分析する）
      }
      totalCount = parsed.totalCount || totalCount;
      if (parsed.ratingAverage != null) ratingAverage = parsed.ratingAverage;
      const before = all.size;
      for (const r of parsed.reviews) {
        const k = r.key || `${r.postDate}-${r.body.slice(0, 30)}`;
        if (!all.has(k)) all.set(k, r);
      }
      // 新規が増えなければ最終ページに到達している
      if (all.size === before || all.size >= totalCount) break;
    }
  }

  return {
    itemUrl,
    title,
    reviewKey,
    lpText,
    reviewTotal: totalCount,
    ratingAverage,
    reviews: Array.from(all.values()),
  };
}

// レビューの層化抽出: 高評価（★4〜5）と低評価（★1〜2）を優先的に残す
// 「選ばれる理由」と「離れる理由」のコントラストを少ない件数で出す（仕様書4-1）
export function stratifyReviews(reviews, { high = 25, low = 15, mid = 5 } = {}) {
  const highs = reviews.filter((r) => r.rating >= 4);
  const lows = reviews.filter((r) => r.rating != null && r.rating <= 2);
  const mids = reviews.filter((r) => r.rating === 3);
  const pick = (arr, n) => arr.slice(0, n);
  return [...pick(highs, high), ...pick(lows, low), ...pick(mids, mid)];
}
