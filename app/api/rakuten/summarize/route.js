// 楽天版: 商品単位のレビュー要約エンドポイント（パイプライン第一段）
// POST { label, isOwn, lpText, reviews[] } → 価値サークル6軸＋共通項目への仕分け結果（JSON）
// 商品ごとに一度要約してから束ねる二段構え（仕様書4-1）
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text) {
  let clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  if (start > 0) clean = clean.substring(start);
  const end = clean.lastIndexOf("}");
  if (end > 0) clean = clean.substring(0, end + 1);
  return JSON.parse(clean);
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

  const { label, isOwn, lpText, reviews } = body || {};
  if (!Array.isArray(reviews)) {
    return NextResponse.json({ error: "レビューがありません" }, { status: 400 });
  }

  const reviewBlock = reviews
    .map((r, i) => `${i + 1}. [★${r.rating ?? "?"}] ${r.body}`)
    .join("\n");

  const prompt = `あなたはEC戦略コンサルタントです。楽天市場の商品「${label || "対象商品"}」について、レビューを価値の軸に仕分けて要約してください。

# 価値サークル（6軸）の定義
- 機能: 商品本体の働き・品質・味・効果など
- デザイン: 商品本体の見た目・色・形
- パッケージング: 商品そのもののベースパッケージ（商品の一部。例: ギフト用化粧箱）
- 購入前サービス: 質問対応・情報提供・選びやすさなど購入前の体験
- 購入中サービス: 注文・決済・配送連絡・梱包の丁寧さ・配送箱・同梱物・開封しやすさなど
- 購入後サービス: アフターフォロー・返品対応・使い方サポートなど

**仕分けの重要ルール**: 「梱包が丁寧」「箱がつぶれていた」「おまけが入っていた」「開けやすい」など配送・外装への言及は、パッケージング軸ではなく**購入中サービス**に仕分けてください。パッケージング軸は商品そのもののベースパッケージ専用です。

さらに全通販共通の2項目（価格、納期・配送スピード）も独立して拾ってください。

# レビュー（★は評価点）
${reviewBlock || "（レビューなし）"}

${isOwn && lpText ? `# この商品のLP（商品ページ）本文テキスト（抜粋）\n${String(lpText).slice(0, 9000)}` : ""}

# 出力（JSONのみ）
{
  "axes": {
    "機能": ["レビューから読み取れた強み・弱みの要点（弱みは文頭に【弱み】と付ける）", ...],
    "デザイン": [...],
    "パッケージング": [...],
    "購入前サービス": [...],
    "購入中サービス": [...],
    "購入後サービス": [...],
    "価格": [...],
    "納期・配送": [...]
  },
  "selectedReasons": ["この商品が選ばれている理由（重要順に最大5つ。レビューの言葉を活かす）"],
  "complaints": ["離れる理由・不満（最大4つ）"],
  "featureWords": ["レビューで繰り返される特徴語（差別的特徴を表す言葉。最大6語）"],
  "emotionalScenes": ["レビューに表れた利用シーン・情緒的な場面（最大3つ）"]${isOwn ? `,
  "lpClaims": ["LP本文が訴求している主張（重要順に最大6つ。LPの言葉を活かす）"],
  "lpSevenElements": [
    { "name": "ターゲットの悩み", "status": "整っている | まだ弱い | 見当たらない", "comment": "30〜60字の平易な日本語" },
    { "name": "ベネフィット", "status": "...", "comment": "..." },
    { "name": "他社との違い", "status": "...", "comment": "..." },
    { "name": "証拠（信頼コンテンツ）", "status": "...", "comment": "レビュー活用・売り手の専門家としての説明・第三者の証明・開発ストーリーの有無を見る" },
    { "name": "使用シーン", "status": "...", "comment": "..." },
    { "name": "不安解消", "status": "...", "comment": "FAQ・保証・スペック・配送納期・送料がページ内で分かるか" },
    { "name": "今買う理由", "status": "...", "comment": "..." }
  ]` : ""}
}

# 厳守事項
- 該当レビューのない軸は空配列にする（無理にひねり出さない）
- ユーザーに見せる文章なので、英語の状態ラベル（ok/warn/ng等）や馴染みの薄い英略語は使わない
- 文字列の値の中でASCIIのダブルクオートを使わない（引用は「」を使う）
- JSONのみ返す`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      temperature: 0.3, // 仕分けは安定性重視
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const result = extractJson(text);
    return NextResponse.json({ summary: result });
  } catch (e) {
    console.error(`[rakuten/summarize] label=${label} error=${e?.message}`);
    return NextResponse.json({ error: "レビューの分析に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
