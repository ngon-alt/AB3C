import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const { input } = await req.json();

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ error: "事業概要を入力してください。" }, { status: 400 });
  }

  const prompt = `あなたはAB3C分析の専門家です。

AB3C分析の正確な定義：
- A（Advantage）：差別的優位点・好ましい違い。競合と比較したときに「こちらのほうがいい」と思ってもらえる違い。単なる違いではなく、お客様にとって「好ましい」違いであること。真似されにくい自社の強みに根差していること。
- B（Benefit）：お客様がその商品・サービスを通じて得られる価値。ニーズ（欠乏感・まだ曖昧な欲求）とウォンツ（具体的に欲しいものが決まっている欲求）の両面から捉える。
- 3C：
  - Customer（お客様）：ターゲット顧客の絞り込み。誰にとってのオンリーワンか。ニーズ段階かウォンツ段階か。切り捨てたお客様は誰か。
  - Competitor（競合）：直接競合だけでなく、ニーズに基づく異業種競合も含む。
  - Company（自社）：①保有する技術・ノウハウ・設備などの具体的強み、②その強みを生む構造的特徴、③経営者のパッション・価値観。

戦略メッセージ = Benefit（何が得られるか）＋ Advantage（なぜ競合よりいいか）

事業概要：
${input}

以下のJSON形式のみで返してください：
{
  "benefit": {
    "needs": ["ニーズ1", "ニーズ2"],
    "wants": ["ウォンツ1", "ウォンツ2"],
    "core": "ベネフィットの核心を一言で"
  },
  "advantage": {
    "what": "アドバンテージの内容を一言で",
    "why_good": "なぜお客様にとって好ましいのか",
    "why_hard_to_copy": "なぜ競合に真似されにくいか"
  },
  "three_c": {
    "customer": {
      "target": "ターゲット顧客を一言で",
      "profile": ["特徴1", "特徴2", "特徴3"],
      "stage": "ニーズ段階 or ウォンツ段階",
      "cutoff": "切り捨てたお客様"
    },
    "competitor": {
      "direct": ["直接競合1", "直接競合2"],
      "indirect": ["異業種競合1", "異業種競合2"]
    },
    "company": {
      "strength": ["具体的強み1", "具体的強み2"],
      "structure": "強みを生む構造的特徴",
      "passion": "経営者の価値観・パッション"
    }
  },
  "strategy_message": {
    "message": "戦略メッセージ（一言で選ばれる理由）",
    "benefit_part": "ベネフィット部分",
    "advantage_part": "アドバンテージ部分"
  },
  "checkpoints": [
    {"label": "切り捨てができているか", "status": "ok", "comment": "コメント"},
    {"label": "価値の本質（ニーズまで掘り下げているか）", "status": "warn", "comment": "コメント"},
    {"label": "異業種競合を考慮しているか", "status": "ok", "comment": "コメント"},
    {"label": "アドバンテージが好ましい違いになっているか", "status": "ok", "comment": "コメント"},
    {"label": "戦略メッセージが一言で言えるか", "status": "ok", "comment": "コメント"}
  ]
}

statusは必ず "ok", "warn", "ng" のいずれかにしてください。`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1600,
      messages: [{ role: "user", content: prompt }],
    });

const text = message.content.map((b) => ("text" in b ? b.text : "")).join("");
const clean = text.replace(/```json|```/g, "").trim();
try {
  const result = JSON.parse(clean);
  return NextResponse.json(result);
} catch (parseError) {
  console.error("JSON parse error:", parseError, "Raw text:", text);
  return NextResponse.json({ error: "レスポンスの解析に失敗しました。: " + text.substring(0, 200) }, { status: 500 });
}
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "分析中にエラーが発生しました。" }, { status: 500 });
  }
}
