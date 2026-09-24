// ウェブサイトのイメージを描く（新規事業版）
//
// 正典: docs/新規事業版-画面遷移設計-20260924.md ⑥「ウェブサイトのイメージ」
// ・分析と同時に作り、レポートの下に出す。「分析しました」だけでは成果物に見えないため（2026-09-25 権さん）
// ・今あるサイトの批評ではない。「この戦略をそのまま形にすると、こうなる」を見せるもの。
//   よって改善コメントは付けず、そう作った意図だけを添える。
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { logUsage } from "../../../lib/usage-log";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 180;
const MODEL = "claude-sonnet-4-6";

const SYSTEM = `あなたは、事業の戦略を受け取って、その事業のウェブサイトのトップページを形にするデザイナー兼コピーライターです。

## つくるもの
トップページの上半分（ファーストビューから、3つの柱、最後の一押しまで）を、そのまま表示できる HTML の断片として書きます。今あるサイトの改善案ではありません。**これから作るサイトの姿**です。

## 中身の決め方
- **最初の一文が最も大事です。**お客様がいちばん感じている気後れや不安を、正面から外す一文にしてください。戦略のベネフィットをそのまま書き写さないでください。
- 押しボタンの文言は、アドバンテージに合わせてください。相手にとっていちばん心理的に軽い一歩を書きます。
- 3つの柱は、ニーズ・ウォンツから拾って、お客様の言葉で書きます。
- 最後に、経営者自身の物語が一行入ると強くなります。
- 架空の実績数字・受賞歴・お客様の声を作らないでください。無いものは書かない。

## 見た目の決まり（守ること）
- 外部の画像・フォント・スクリプトを読み込まないでください。写真が要る場所は、灰色の枠に文字を置いたつなぎで表します。
- **避けること**: ベージュの全面使用、紫系などのグラデーション装飾、すりガラス風の表現。AIが作ったように見えます。
- 配色は事業の中身から引いてください（例：鉄と機械なら濃紺と鈍い金、食なら深緑と生成り）。落ち着いた濃い色1つと、目を引く色1つに絞ります。
- 赤 #FF0000 と 青 #1a6fd4 は、この画面では**使わないでください**（当サービスの中でベネフィットとアドバンテージを指す色なので、事業のサイトの装飾に使うと意味が混ざります）。
- **文字の大きさ：すべて16px以上にしてください。11px〜15px は1か所も使わないでください。**本文は18px、補足や小さなラベルでも16pxが下限です。見出しはもっと大きく。小さくして差をつけたくなったら、大きさではなく**色・太さ・余白・字間**で差をつけてください。年配の経営者が読む前提です。
- フォントは system-ui, sans-serif。日本語のみ。
- 高さは固定せず、内容に応じて伸びるようにしてください。
- 全体で80行以内。

## 印刷対応（必須）
<style> の冒頭に必ず次を入れてください。
*, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

## 出力
site_mock という道具を使って返してください。`;

const TOOL = {
  name: "site_mock",
  description: "ウェブサイトのイメージ（HTML断片）と、その意図",
  input_schema: {
    type: "object",
    properties: {
      html: { type: "string", description: "<style>…</style> と要素からなる HTML 断片。外部リソースを読み込まないこと。" },
      caption: { type: "string", description: "なぜこの見せ方にしたのかを2〜3文で。最初の一文と押しボタンの文言の意図に必ず触れる。" },
    },
    required: ["html", "caption"],
  },
};

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const { analysis, businessId, siteName } = await req.json();
  if (!analysis) return NextResponse.json({ error: "分析結果がありません" }, { status: 400 });

  const sm = analysis.strategy_message || {};
  const ben = analysis.benefit || {};
  const adv = analysis.advantage || {};
  const c = analysis.three_c || {};

  const brief = `事業の呼び名: ${siteName || "（未定）"}
戦略メッセージ: ${sm.message || ""}
お客様が求める価値の核心: ${ben.core || ""}
ニーズ: ${(ben.needs || []).join(" / ")}
ウォンツ: ${(ben.wants || []).join(" / ")}
好ましい違い: ${adv.what || ""}
　なぜ好ましいか: ${adv.why_good || ""}
　なぜ真似されにくいか: ${adv.why_hard_to_copy || ""}
お客様: ${c.customer?.target || ""}${(c.customer?.profile || []).length ? "（" + (c.customer.profile || []).join("、") + "）" : ""}
競合: ${[...(c.competitor?.direct || []), ...(c.competitor?.indirect || [])].join(" / ")}
自社の強み: ${(analysis.company_core?.all_strengths || c.company?.strength || []).join(" / ")}
経営者の価値観: ${analysis.company_core?.passion || c.company?.passion || ""}`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: brief }],
    });

    logUsage(msg, { email: session.user.email, feature: "newbiz_sitemock", siteId: businessId || null }).catch(() => {});

    const block = msg.content.find(b => b.type === "tool_use" && b.name === TOOL.name);
    if (!block?.input?.html) return NextResponse.json({ error: "イメージを作れませんでした" }, { status: 500 });
    return NextResponse.json({ html: block.input.html, caption: block.input.caption || "" });
  } catch (e) {
    console.error("[newbiz/sitemock] 失敗:", e?.message || e);
    return NextResponse.json({ error: "イメージを作れませんでした" }, { status: 500 });
  }
}
