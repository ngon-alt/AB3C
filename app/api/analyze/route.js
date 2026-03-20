import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchWebsite(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AB3CAnalyzer/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    return text;
  } catch (e) {
    throw new Error("URLの読み込みに失敗しました。URLを確認してください。");
  }
}

export async function POST(req) {
  // 使用回数チェック
  const session = await getServerSession();
  if (session) {
    const usageRes = await fetch(`${process.env.NEXTAUTH_URL}/api/usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const usageData = await usageRes.json();
    if (usageRes.status === 429) {
      return NextResponse.json({ error: usageData.error }, { status: 429 });
    }
  }

  const { input, url } = await req.json();

  let analysisTarget = "";
  let useWebSearch = false;

  if (url && url.trim()) {
    try {
      const siteText = await fetchWebsite(url.trim());
      analysisTarget = `以下はウェブサイト（${url}）から取得したテキストです：\n\n${siteText}`;
      useWebSearch = true;
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } else if (input && input.trim()) {
    analysisTarget = input.trim();
  } else {
    return NextResponse.json({ error: "事業概要またはURLを入力してください。" }, { status: 400 });
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

${useWebSearch ? `重要：ウェブ検索を使って競合他社を調査し、対象サービスと比較した上でAB3C分析を行ってください。
競合が多数存在する場合はAdvantageを厳しく評価し、本当に差別化できているかを判断してください。
また市場規模（SAM・SOM・成長率）も調査してください。` : ""}

分析対象：
${analysisTarget}

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
      "cutoff": "切り捨てたお客様",
      "market": {
        "sam": "獲得可能市場規模（例：約500億円）",
        "som": "実際に狙える市場規模（例：約50億円）",
        "growth": "市場成長率・トレンド（例：年率10%成長、DX需要で拡大中）"
      }
    },
    "competitor": {
      "direct": ["直接競合1（特徴も含めて）", "直接競合2（特徴も含めて）"],
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

statusは必ず "ok", "warn", "ng" のいずれかにしてください。JSONのみ返してください。`;

  try {
    const tools = useWebSearch ? [{ type: "web_search_20250305", name: "web_search" }] : [];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      tools: tools.length > 0 ? tools : undefined,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "分析中にエラーが発生しました。" }, { status: 500 });
  }
}
