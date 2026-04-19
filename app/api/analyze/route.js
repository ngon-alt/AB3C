import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { sendAnalysisCompleteEmail } from "@/app/lib/email";

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
      .replace(/data:image\/[^;]+;base64,[^"']*/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return text;
  } catch (e) {
    throw new Error("URLの読み込みに失敗しました。URLを確認してください。");
  }
}
export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "分析にはGoogleログインが必要です。右上の「Googleでログイン」からログインしてください。" }, { status: 401 });
  }

  // リクエストのホストから URL を組み立てる（preview.senryaku.ai 等のカスタムドメイン対応）
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXTAUTH_URL;
  const usageRes = await fetch(`${baseUrl}/api/usage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": req.headers.get("cookie") || "",
    },
  });
  const usageData = await usageRes.json();
  if (usageRes.status === 429) {
    return NextResponse.json({ error: usageData.error }, { status: 429 });
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
      return NextResponse.json({ error: `URLの読み込みに失敗しました。\n\n以下のようなサイトは読み取りができない場合があります：\n・楽天市場・Yahoo!ショッピング・Amazonなどのモール型ECサイト\n・Instagram・FacebookなどのSNS\n・食べログ・ホットペッパーなどの予約サイト\n・SUUMO・HOME'Sなどの不動産ポータルサイト\n・Indeed・リクナビなどの求人サイト\n・金融・銀行系サイト\n\nこれらのサイトは「テキストで入力」タブから事業概要を直接入力してお試しください。` }, { status: 400 });
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
また市場規模（SAM・SOM・成長率）も調査してください。市場規模の算出根拠を必ず明記してください。公的統計や業界レポートを参照した場合は出典名と年度を記載し、フェルミ推定の場合はベースとなる数字と計算過程を簡潔に説明してください。
競合リストにはウェブサイトURLがわかる場合は「競合名（特徴）｜https://url」の形式で含めてください。
市場規模の算出根拠にも参照した情報源のURLがあれば含めてください。` : ""}

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
        "growth": "市場成長率・トレンド（例：年率10%成長、DX需要で拡大中）",
        "basis": "算出根拠（公的統計・業界レポートからの引用の場合は出典名・年度・URLを明記。フェルミ推定の場合はベースとなる数字と計算過程を簡潔に説明。例：『経済産業省DXレポート2024（https://www.meti.go.jp/...）によると国内DX市場は約3.4兆円。うちコンサルティング領域は約15%の5,100億円。中小企業向けは約30%と推定し、SAM≒1,500億円』）"
      }
    },
    "competitor": {
      "direct": ["直接競合1（特徴も含めて）｜https://example.com", "直接競合2（特徴も含めて）｜https://example.com"],
      "indirect": ["異業種競合1｜https://example.com", "異業種競合2"]
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

statusは必ず "ok", "warn", "ng" のいずれかにしてください。JSONのみ返してください。

**重要（JSONの構文ルール）**：
- 文字列の値の中で、ASCIIのダブルクオート(\") を使わないでください。引用・強調が必要な場合は **日本語の「」や『』** を使ってください。例: ✗「カビュウは"振り返り専用"として設計」→ ✓「カビュウは『振り返り専用』として設計」
- 改行が必要な場合は \\n でエスケープしてください（生の改行を文字列中に入れない）
- JSONパースエラーの原因になるので厳守してください`;

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

   let clean = text.replace(/```json|```/g, "").trim();

// JSON前の説明文を削除（{ で始まるまでの部分を除去）
const jsonStart = clean.indexOf('{');
if (jsonStart > 0) {
  clean = clean.substring(jsonStart);
}
// JSON後のゴミを削除（最後の } 以降を除去）
const jsonEnd = clean.lastIndexOf('}');
if (jsonEnd > 0) {
  clean = clean.substring(0, jsonEnd + 1);
}

try {
  const result = JSON.parse(clean);
  // 分析完了メール送信（初回のみ・エラーでも止めない）
  try {
    if (session?.user?.email) {
      sendAnalysisCompleteEmail({ email: session.user.email, name: session.user.name }).catch(() => {});
    }
  } catch (e) {}
  return NextResponse.json(result);
} catch (parseError) {
  console.error("JSON Parse Error:", parseError.message);
  console.error("Raw AI response (first 500 chars):", clean.slice(0, 500));
  // リトライ: 不正な制御文字を除去して再パース
  try {
    const cleaned2 = clean.replace(/[\x00-\x1F\x7F]/g, " ");
    const result2 = JSON.parse(cleaned2);
    return NextResponse.json(result2);
  } catch (e2) {
    return NextResponse.json({ error: "AI応答の解析に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "分析中にエラーが発生しました。" }, { status: 500 });
  }
}
