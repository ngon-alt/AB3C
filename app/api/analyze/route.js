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

## 組み合わせパターン（重要・追加要件）

AB3C は本来、ターゲットとベネフィットがセットで、それに応じて競合・自社の強み・戦略メッセージが絞り込まれます。
そのため、要素を箇条書きで並列に並べるだけでなく、「この層に・この価値を・この強みで提供する」という**組み合わせ**として表現するのが本来の姿です。

上記の全体分析に加えて、**ターゲット×ベネフィットの切り口を3つ**提示してください（後述の combinations 配列）。

### 切り口を考える際のヒント
事業内容によって自然な切り口は変わります。よくあるパターンの例:
- 価格優先層 vs 品質優先層
- BtoC（個人向け）vs BtoB（法人向け）
- 自分用 vs ギフト用 vs 法人ノベルティ
- 入門者層 vs 上級者層
- 利用シーン（日常使い vs 特別な場面）
- 動機（悩み解消 vs ステップアップ vs 記念）
- 緊急度（今すぐ困っている層 vs 将来に備える層）

これらに縛られず、**事業に最もフィットする3つの切り口**を選んでください。
3パターンは互いに重ならないように、それぞれ別のターゲット・別のベネフィット・別の主競合・別の主強みに焦点を当てたものにします。
事業内容上「組み合わせはこの2つしかない」と判断した場合は2つでも構いませんが、原則3つ出すこと。

### 各組み合わせの戦略メッセージは短く
要素を絞り込んでいるからこそ、各組み合わせの strategy_message は**最大40文字、理想20〜30文字**で表現してください。
言葉を磨いて一撃で伝わるコピーにすること。全体の strategy_message が長くても、各組み合わせは短く。

### おすすめパターンの選定
recommended_combination_id には、AIが最も推奨する1つのidを入れてください。
判断基準: ①Advantageが明確で真似されにくい、②市場が中小企業に十分な規模、③自社の強みと噛み合っている。

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
  "combinations": [
    {
      "id": 1,
      "label": "短いキャッチー名（10〜15字、例：足の悩み解消ルート）",
      "target": "ターゲット顧客像（30字以内）",
      "benefit": "得られる価値を一言で（30字以内）",
      "competitor_focus": "この組み合わせで主に意識する競合（具体名）",
      "company_strength_focus": "この組み合わせで活きる自社の主な強み",
      "advantage": "競合との差別的優位点（30字以内）",
      "strategy_message": "短く鋭い戦略メッセージ（40字以内、理想20〜30字）"
    },
    {
      "id": 2,
      "label": "別の切り口の名前",
      "target": "別のターゲット層",
      "benefit": "別のベネフィット",
      "competitor_focus": "別の主競合",
      "company_strength_focus": "別の主な強み",
      "advantage": "別の優位点",
      "strategy_message": "別の戦略メッセージ"
    },
    {
      "id": 3,
      "label": "さらに別の切り口の名前",
      "target": "さらに別のターゲット層",
      "benefit": "さらに別のベネフィット",
      "competitor_focus": "さらに別の主競合",
      "company_strength_focus": "さらに別の主な強み",
      "advantage": "さらに別の優位点",
      "strategy_message": "さらに別の戦略メッセージ"
    }
  ],
  "recommended_combination_id": 1,
  "checkpoints": [
    {"label": "切り捨てができているか", "status": "ok", "comment": "コメント"},
    {"label": "価値の本質（ニーズまで掘り下げた戦略・コンテンツになっているか）", "status": "warn", "comment": "コメント"},
    {"label": "同業種競合、異業種競合との違いを表現できているか", "status": "ok", "comment": "コメント"},
    {"label": "アドバンテージは模倣されにくいか", "status": "ok", "comment": "コメント"},
    {"label": "戦略メッセージのわかりやすさ（戦略要素が絞られているか、優先順位をつけられているか）", "status": "ok", "comment": "コメント"}
  ]
}

## チェックポイントの判定基準（厳守）

各項目の status は以下の基準で判定してください（◎ = ok、▲ = warn、✕ = ng の 3 段階）。
甘く ◎ に寄せず、基準を満たさないものは ▲ や ✕ を選んでください。
**comment（コメント欄）は一般の方にも伝わる平易な日本語で書くこと**。
VRIO など専門用語は使わず、身近な言葉で「なぜこの評価なのか」を端的に説明してください。

**1. 切り捨てができているか**
- 基準: すべての見込み客に売ろうとせず、「誰に売らないか」を決めて、残った顧客に強く訴求できているか？
- 判定:
  - ✕ ng: 万人向け。例「誰にでも効く基礎化粧品」「経営者向け」「すべてにおいて高機能」
  - ▲ warn: 少しはターゲットが絞れているが、まだ幅が広い／メッセージが万人向けに流れている
  - ◎ ok: 切り捨てる顧客が明確で、残った顧客に尖ったメッセージが届いている。例「肌が弱い人向け」「中小企業経営者向け」「◯◯シーンで高機能」

**2. 価値の本質（ニーズまで掘り下げた戦略・コンテンツになっているか）**
- 基準: お客様が「欲しいもの（ウォンツ：例・ウェブサイトが欲しい）」ではなく、その奥にある「本当の目的（ニーズ：例・売上や利益を伸ばしたい／選ばれる理由を作りたい）」にこたえる設計になっているか？
- 判定:
  - ✕ ng: 機能や便利さの訴求に留まっている（例: 「使いやすいウェブサイト」）
  - ▲ warn: 目的と手段が混ざっている／本当の目的がぼんやりしている
  - ◎ ok: 目的（売上を伸ばす等）に正面からこたえる表現・コンテンツ設計になっている

**3. 同業種・異業種、両方の競合との違いを表現できているか**
- 基準: 同じ業種のライバルだけでなく、異業種の代替手段とも比較して、違いをはっきり示せているか？
- 判定:
  - ✕ ng: 競合との違いが具体的に語られていない
  - ▲ warn: 同業種だけ、または異業種だけ、片方との違いは言えている
  - ◎ ok: 同業種・異業種の両方との違いが具体的に表現できている

**4. アドバンテージは真似されにくいか**
- 基準: そのアドバンテージが「他社も簡単に真似できるもの」か、それとも「構造・歴史・人・ノウハウなどの理由で真似しづらいもの」か？
- 判定:
  - ✕ ng: アドバンテージが弱い／価値が伝わらない
  - ▲ warn: 他社も提供できる価値だが、今のところ珍しい（まだ広まっていない）
  - ◎ ok: 仕組み・歴史・人材・独自ノウハウなどで、他社がすぐには追いつけない

**5. 戦略メッセージのわかりやすさ（戦略要素が絞られているか、優先順位をつけられているか）**
- 基準: 戦略メッセージが一読で理解でき、盛り込む要素（ターゲット・ベネフィット・アドバンテージ等）が絞り込まれ、最も伝えたいことが前面に出ているか？
- 判定:
  - ✕ ng: 情報が多すぎて要点が掴めない／要素が並列に並んでいて強弱がない
  - ▲ warn: ある程度絞れているが、複数の要素が同列で最優先がぼやけている／一部冗長
  - ◎ ok: 要素がしっかり絞り込まれ、最も伝えたい要素が一目で伝わる簡潔で強いメッセージ

status は必ず "ok", "warn", "ng" のいずれかにしてください。これはシステム内部で使う技術的な値であり、日本語表記（「注意」「警告」など）に変換してユーザーに表示する前提です。
**comment 欄の書き方（厳守）**:
- 「なぜこの評価になったか」を**一般の経営者の方にも伝わる平易な日本語で**30〜80字程度で書いてください。
- **comment 欄には「warn」「ok」「ng」「[warn]」「[ok]」「[ng]」などの英語の状態ラベルを絶対に書かないでください**。これらはシステム内部の値で、ユーザーには意味が伝わりません。評価の度合いを本文で示したい場合は「問題なし」「要注意」「改善が必要」「整っています」「まだ弱い」などの自然な日本語表現を使ってください。
- 一般に馴染みの薄い英単語（VRIO・CPM・CVR などの略語や、ターゲティング等の英語混じり表現）は使わないでください。既に広く使われているカタカナ語（ウェブサイト、ターゲット、コンテンツ、ベネフィット、ブランド、メッセージ等）は使って構いません。
- 専門用語を使う必要がある場合は、日本語で噛み砕いた言い換え（例：「VRIO分析」→「真似しづらさの分析」）を添えてください。

JSONのみ返してください。

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
