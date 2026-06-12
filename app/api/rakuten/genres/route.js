// 楽天版: カテゴリー（ジャンル）ツリー取得エンドポイント
// 楽天ウェブサービスの「ジャンル検索API」で現行の楽天市場カテゴリー分類を返す。
// GET ?genreId=0 → 直下の子ジャンル一覧（大カテゴリー）。子のIDを渡すと中・小と降りられる。
// RAKUTEN_APP_ID（楽天ウェブサービスのアプリID）が未設定の間は 503 を返し、
// フロントはテキスト入力にフォールバックする。
import { NextResponse } from "next/server";

export const maxDuration = 30;

// ジャンルツリーはめったに変わらないので1日キャッシュする
const cache = new Map();
const CACHE_MS = 24 * 60 * 60 * 1000;

export async function GET(req) {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "no-key" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const genreId = String(searchParams.get("genreId") || "0").replace(/[^\d]/g, "") || "0";

  const hit = cache.get(genreId);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const res = await fetch(
      `https://app.rakuten.co.jp/services/api/IchibaGenre/Search/20140222?applicationId=${appId}&genreId=${genreId}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const children = (json.children || []).map((c) => ({
      id: c.child?.genreId,
      name: c.child?.genreName,
    })).filter((c) => c.id && c.name);
    const data = { genreId, children };
    cache.set(genreId, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    console.error(`[rakuten/genres] genreId=${genreId} error=${e?.message}`);
    return NextResponse.json({ error: "カテゴリーの取得に失敗しました" }, { status: 502 });
  }
}
