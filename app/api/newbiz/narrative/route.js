// 戦略ナラティブ（500〜1000字の一人語り）を書く
//
// 正典: docs/新規事業版-画面遷移設計-20260924.md ⑥
// ・分析と同時に書く。版が変われば、その版に合わせて書き直す
// ・このサービスの一番の成果物。「本人の声で書かれた手紙のように」読めること
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { logUsage } from "../../../lib/usage-log";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 120;
const MODEL = "claude-sonnet-4-6";

const SYSTEM = `あなたは、経営者の話を聞いて、その人の言葉で事業の物語を書く書き手です。

## 書くもの
戦略ナラティブ。500〜1000字の**一人語り**です。「なぜこの事業をやるのか、誰のために、何を約束するのか」を、本人が自分の言葉で語っている文章として書きます。

## 守ること
- **一人称（私）で書きます。**本人が書いた文章として読めること。
- **本人が実際に語った出来事・数字・言い回しを使ってください。**聞いていないことを足さないでください。作り話を混ぜると、本人が読んだ瞬間に嘘だと分かります。
- 抽象的な決意表明で終わらせないでください。具体的な情景から始めてください。
- 「〜と言われています」「一般的に」「近年」のような伝聞・一般論は使わないでください。
- 誇張・自慢はしないでください。弱気にもならないでください。淡々と事実から語ります。
- 説明の順は、**見てきたこと → そこで感じた問題 → 誰のために → 自分にできること → 何をやるのか**。ただし型に縛られすぎないでください。
- 最後の一行は短く言い切ってください。
- 段落は4〜6つ。1段落2〜4文。
- すべて日本語。英語の用語・カタカナの専門語（フレームワーク名など）は使わないでください。

## 出力
文章だけを返してください。見出し・前置き・箇条書き・引用符は付けないでください。段落の区切りは空行です。`;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { analysis, inputText, businessId } = await req.json();
  if (!analysis) return NextResponse.json({ error: "分析結果がありません" }, { status: 400 });

  const sm = analysis.strategy_message || {};
  const ben = analysis.benefit || {};
  const adv = analysis.advantage || {};
  const c = analysis.three_c || {};

  const brief = `## 本人が語った内容（これが素材です。ここにある言葉を使ってください）
${String(inputText || "").slice(0, 30000)}

## 組み立てた戦略（この筋で語ってください）
戦略メッセージ: ${sm.message || ""}
お客様が求める価値: ${ben.core || ""}
　ニーズ: ${(ben.needs || []).join(" / ")}
　ウォンツ: ${(ben.wants || []).join(" / ")}
好ましい違い: ${adv.what || ""}
　なぜ好ましいか: ${adv.why_good || ""}
　なぜ真似されにくいか: ${adv.why_hard_to_copy || ""}
お客様: ${c.customer?.target || ""}
競合: ${[...(c.competitor?.direct || []), ...(c.competitor?.indirect || [])].join(" / ")}
自社の強み: ${(c.company?.strength || []).join(" / ")}
価値観: ${c.company?.passion || ""}`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: brief }],
    });

    logUsage(msg, { email: session.user.email, feature: "newbiz_narrative", siteId: businessId || null }).catch(() => {});

    const narrative = msg.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
    return NextResponse.json({ narrative });
  } catch (e) {
    console.error("[newbiz/narrative] 失敗:", e?.message || e);
    return NextResponse.json({ error: "ナラティブを書けませんでした" }, { status: 500 });
  }
}
