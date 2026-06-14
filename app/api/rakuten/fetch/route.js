// 楽天版: 商品データ取得エンドポイント
// POST { url } → { title, lpText, reviewKey, reviewTotal, ratingAverage, reviews[] }
// 仕様: docs/楽天版-仕様書-v1.md 4-1 / 7-1
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { fetchProductData, isRakutenItemUrl, stratifyReviews } from "../../../lib/rakuten";

export const maxDuration = 60;

// 接続診断（Vercel経路から楽天にアクセスできるかの確認用。データは返さない）
// 仕様書7-1のリスク「VercelのデータセンターIPからは403の可能性」を preview で検証する
export async function GET() {
  const targets = {
    itemPage: "https://item.rakuten.co.jp/horizonfarms/cd601/",
    reviewPage: "https://review.rakuten.co.jp/item/1/367826_10000702/1.1/",
    searchPage: "https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%82%A4%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%A0/",
    rankingPage: "https://ranking.rakuten.co.jp/daily/100283/",
  };
  const result = {};
  for (const [name, url] of Object.entries(targets)) {
    try {
      const { fetchRakutenHtml: f } = await import("../../../lib/rakuten");
      const html = await f(url);
      // 取得サイズが極端に小さい場合の切り分け用に冒頭だけ返す（公開ページの断片なので問題ない）
      result[name] = { ok: true, bytes: html.length, head: html.slice(0, 200) };
    } catch (e) {
      result[name] = { ok: false, httpStatus: e?.httpStatus || null, message: e?.message };
    }
  }
  return NextResponse.json({ diag: result, at: new Date().toISOString() });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const url = (body?.url || "").trim();
  if (!isRakutenItemUrl(url)) {
    return NextResponse.json(
      { error: "楽天市場の商品ページURL（item.rakuten.co.jp）を入力してください" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchProductData(url);
    // 分析に使う分だけ層化して返す（高評価25・低評価15・中間5）
    const sampled = stratifyReviews(data.reviews);
    return NextResponse.json({ ...data, reviews: sampled, fetchedReviewCount: data.reviews.length });
  } catch (e) {
    // Vercel経路で403が出る場合はデータセンターIP遮断の可能性（仕様書7-1のリスク）
    console.error(`[rakuten/fetch] url=${url} status=${e?.httpStatus} message=${e?.message}`);
    const msg =
      e?.httpStatus === 403
        ? "楽天側にアクセスを拒否されました（403）。サーバー経路の制限の可能性があります。"
        : "商品ページの取得に失敗しました。URLを確認してください。";
    return NextResponse.json({ error: msg, httpStatus: e?.httpStatus || null }, { status: 502 });
  }
}
