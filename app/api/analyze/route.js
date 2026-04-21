import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { neon } from "@neondatabase/serverless";
import { authOptions } from "../auth/[...nextauth]/route";
import { sendAnalysisCompleteEmail } from "@/app/lib/email";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ユーザーの契約プラン種別を判定（メール分岐用）
//  - 'support'  : 戦略指南プラン or PRO（分析結果が履歴保存される）
//  - 'diagnosis': 戦略診断チケット or 無料トライアル（履歴保存されないため持ち帰り必須）
async function resolveUserPlanKind(email) {
  if (!email) return 'diagnosis';
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [proRows, planRows] = await Promise.all([
      sql`SELECT email FROM pro_users WHERE email = ${email} LIMIT 1`,
      sql`SELECT plan_type FROM user_plans WHERE user_email = ${email} AND status = 'active' ORDER BY purchased_at DESC LIMIT 1`,
    ]);
    if (planRows.length > 0 && planRows[0].plan_type === 'support') return 'support';
    if (proRows.length > 0) return 'support'; // PRO直接登録ユーザーもsupport扱い
    return 'diagnosis';
  } catch (e) {
    console.error('プラン判定エラー:', e);
    return 'diagnosis'; // 判定失敗時は持ち帰りを促す側に倒す
  }
}

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

  const body = await req.json();
  const { input, url, refineFrom, refineSelection } = body;

  let analysisTarget = "";
  let useWebSearch = false;
  const isRefining = !!(refineFrom && refineSelection);

  if (url && url.trim()) {
    try {
      const siteText = await fetchWebsite(url.trim());
      analysisTarget = `以下はウェブサイト（${url}）から取得したテキストです：\n\n${siteText}`;
      useWebSearch = !isRefining; // 絞り込み時はすでに市場情報が揃っているのでweb検索不要
    } catch (e) {
      return NextResponse.json({ error: `URLの読み込みに失敗しました。\n\n以下のようなサイトは読み取りができない場合があります：\n・楽天市場・Yahoo!ショッピング・Amazonなどのモール型ECサイト\n・Instagram・FacebookなどのSNS\n・食べログ・ホットペッパーなどの予約サイト\n・SUUMO・HOME'Sなどの不動産ポータルサイト\n・Indeed・リクナビなどの求人サイト\n・金融・銀行系サイト\n\nこれらのサイトは「テキストで入力」タブから事業概要を直接入力してお試しください。` }, { status: 400 });
    }
  } else if (input && input.trim()) {
    analysisTarget = input.trim();
  } else {
    return NextResponse.json({ error: "事業概要またはURLを入力してください。" }, { status: 400 });
  }

  // 絞り込み再分析用のコンテキスト
  const refinementContext = isRefining ? `

## 絞り込み再分析モード

以下は前回の分析結果です。ユーザーが「より重要な項目」に絞り込みました。
絞り込まれた項目だけに焦点を当て、**よりシャープで具体的な戦略メッセージ**を生成してください。
重要：戦略メッセージは**短く・鋭く**（最大でも40文字程度、理想は20〜30文字）してください。ターゲットを絞ったぶん、言葉を磨いて一撃で伝わるコピーにすること。

### 前回の分析結果（抜粋）
- 戦略メッセージ: ${refineFrom?.strategy_message?.message || ""}
- 元のBenefit核心: ${refineFrom?.benefit?.core || ""}

### ユーザーが選んだ（残した）項目
- 残したニーズ: ${JSON.stringify(refineSelection?.needs || [])}
- 残したウォンツ: ${JSON.stringify(refineSelection?.wants || [])}
- 残したターゲットプロフィール: ${JSON.stringify(refineSelection?.profile || [])}
${refineSelection?.target ? `- ターゲット（主役）: ${refineSelection.target}` : ""}

### 絞り込みの意図
「選ばれた項目」に該当するお客様に対して、最も鋭い「選ばれる理由」を打ち出すよう分析を磨き直してください。
- benefit.needs / benefit.wants は選ばれた項目のみに絞る（増やさない）
- three_c.customer.target / profile も選ばれた項目に寄せる
- cutoff（切り捨てたお客様）には、今回外された項目を含める
- strategy_message.message は**短く研ぎ澄ます**
- market規模は前回の値を維持しつつ、絞り込みに応じて微調整OK
- competitor / company は前回の値をベースに調整（大きな変更不要）
` : "";

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
${refinementContext}

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
    {"label": "価値の本質（ニーズまで掘り下げた戦略・コンテンツになっているか）", "status": "warn", "comment": "コメント"},
    {"label": "同業種競合、異業種競合との違いを表現できているか", "status": "ok", "comment": "コメント"},
    {"label": "アドバンテージは模倣されにくいか", "status": "ok", "comment": "コメント"},
    {"label": "戦略メッセージに含まれるキーワード要素に明確な優先順位をつけられているか", "status": "ok", "comment": "コメント"}
  ]
}

## チェックポイントの判定基準（厳守）

各項目 status は以下の具体的な YES/NO 基準に従って判定してください。甘く ok に倒すのは避け、基準を満たさないものは warn または ng を選ぶこと。

**1. 切り捨てができているか**
- 基準: 見込み客全員に売ることを期待するのではなく、「何割かを切り捨ててでも、残りに訴求する」設計になっているか？
- 具体例:
  - ✕ ng: 「誰にでも効く基礎化粧品」「経営者向け」「すべてにおいて高機能」のような万人向け
  - ▲ warn: ターゲットは絞っているが切り捨て対象が曖昧、またはメッセージが万人向けに流れている
  - ◎ ok: 「肌が弱い人のための基礎化粧品」「中小企業経営者向け」「◯◯シーンで高機能」のように、切り捨て対象が明示され、残りに尖ったメッセージが届いている

**2. 価値の本質（ニーズまで掘り下げた戦略・コンテンツになっているか）**
- 基準: ウォンツ（手段：ウェブサイトが欲しい等）ではなく、ニーズ（目的：売上・利益を伸ばしたい、選ばれる理由を作りたい等）にこたえる設計か？
- 判定:
  - ✕ ng: ウォンツ側の便利さ・機能訴求のみ（例: 「使いやすいウェブサイト」）
  - ▲ warn: ウォンツとニーズが混在、または本質的ニーズが曖昧
  - ◎ ok: 明確にニーズ（売上・利益・選ばれる理由等）にこたえる表現・コンテンツ設計になっている

**3. 同業種競合、異業種競合との違いを表現できているか**
- 基準: 同業種競合「だけ」でなく、異業種競合（代替手段・異業態）との違いも語れているか？
- 判定:
  - ✕ ng: 競合分析が弱い／同業種すら具体性がない
  - ▲ warn: **片方だけ**（同業種のみ、または異業種のみ）表現できている
  - ◎ ok: **両方**の違いが具体的に表現できている

**4. アドバンテージは模倣されにくいか（VRIO軸で判定）**
- 基準: VRIO分析の4段階「価値がある→珍しい→真似しづらい→組織が卓越している」のうち、どこまで到達しているか？
- 判定:
  - ✕ ng: 価値がある止まり、または価値も弱い
  - ▲ warn: 「価値がある」＋「珍しい」まで到達（2段階目）
  - ◎ ok: 「真似しづらい」以上に到達（3段階目以上）— 構造・歴史・関係資本・組織能力などで模倣されにくい

**5. 戦略メッセージに含まれるキーワード要素に明確な優先順位をつけられているか**
- 基準: ターゲット・ベネフィット・アドバンテージなど戦略メッセージの構成要素に「これが最優先」という絞り込み・優先順位付けができているか？
- 判定:
  - ✕ ng: 要素が並列で語られ優先順位が不明
  - ▲ warn: ある程度絞れているが、最優先要素が曖昧、または複数候補がある
  - ◎ ok: ターゲットとベネフィットの最優先要素が明確で、キーワードの順序に迷いがない

status は必ず "ok", "warn", "ng" のいずれかにしてください。JSONのみ返してください。

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
  // 分析完了メール送信（プラン種別で文面を分岐・エラーでも止めない）
  try {
    if (session?.user?.email) {
      // フロントから siteId が渡されていれば、メール内のリンクを直接その分析結果ページに飛ばす
      const siteId = body?.siteId || null;
      resolveUserPlanKind(session.user.email).then(planKind =>
        sendAnalysisCompleteEmail({ email: session.user.email, name: session.user.name, planKind, siteId })
      ).catch(() => {});
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
