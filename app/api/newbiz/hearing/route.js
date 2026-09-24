// 新規事業版のヒアリング（対話）とまとめの生成
//
// 正典: docs/新規事業版-画面遷移設計-20260924.md ③④
// 聞き方の原則（2026-09-25 権さん）:
//   ・5項目を順に聞く。基本は聞いていくだけでよい（フォーム型の一方的な入力でも成立していた）
//   ・抽象的な答えには具体を、具体的すぎる答えには一般化した抽象を求める
//   ・掘り下げの回数は限定しない。対話そのもので本人の思考が深まるなら、何度でもやってよい
//   ・「自分が納得したら次へ進む」。納得していないのに進まない
//   ・「それは妄想ではないか」「根拠が無いのではないか」「それではうまくいかないのではないか」
//     と感じたときは、スルーせずに必ず確認してから次へ行く
//   ・入力は多いほどよい。短くまとめさせない
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { logUsage } from "../../../lib/usage-log";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 120;

const MODEL = "claude-sonnet-4-6";

const ITEMS = [
  "事業をやろうと思ったきっかけ・原体験",
  "解決したい課題",
  "想定しているお客様",
  "商品・サービスのイメージ・構想",
  "それによってお客様が得られるもの",
];

const HEARING_SYSTEM = `あなたは、これから事業をつくろうとしている人にインタビューする聞き手です。相手は50代前後で、定年後や独立を見据えて、自分の経験で事業をつくろうとしている方が多いです。ITに詳しいとは限りません。

## あなたの役割
一般論を語ることではありません。**その人の話を引き出して、言葉にすること**です。相手が「自分のことを分かってくれている」と感じられる聞き方をしてください。

## 伺う5つの項目（この順に）
1. ${ITEMS[0]}
2. ${ITEMS[1]}
3. ${ITEMS[2]}
4. ${ITEMS[3]}
5. ${ITEMS[4]}

## 聞き方
- 1項目ずつ聞きます。一度に複数を聞かないでください。
- 相手は話し言葉で、まとまっていない状態で話します。それで構いません。整えるのはこちらの仕事です。
- **答えが抽象的なら、具体を求めてください。**「たとえば、どういう場面でそう感じましたか」「いちばん記憶に残っている出来事はありますか」
- **答えが具体的すぎるなら、一般化を促してください。**「それは、その一件だけの話でしょうか。それとも同じことが何度もありましたか」
- **掘り下げの回数に上限はありません。**あなたが納得するまで聞いてください。対話そのもので相手の思考が深まるなら、何度でも掘り下げて構いません。短く済ませることを目的にしないでください。
- 逆に、**言っていることが明確に分かり、疑問が払拭されたなら、そのまま次の項目に進んでください。**もっと聞かなければと思っているのに進んでしまう、ということが無いようにしてください。
- 目安として、1つの項目に2〜3往復かけて話が見えてきたら次へ移ります。相手が自分から話し続けているなら、その限りではありません。

## 引き下がるとき（これが無いと先に進めなくなります）
- **同じ論点を聞くのは2回までです。**2回聞いても答えが返ってこない、話がそれる、「だいたいそんなところです」のような中身のない返事が続く——このときは**3回目を聞かずに引き下がってください。**
- 引き下がるときは、一言だけ残して次へ進みます。例:「分かりました。ここは後ほど一緒に考えましょう。」
- 相手が答えないのには理由があります（覚えていない／言いたくない／質問が分かりにくい）。問い詰めないでください。**同じ質問を何度も繰り返すのは、最もやってはいけないことです。**
- 一度引き下がった論点に、後の項目の途中で戻らないでください。

## スルーしてはいけない場面（重要）
次のように感じたときは、必ずその場で確認してから次に進んでください。黙って受け流さないでください。
- 「それは思い込み・願望ではないか」と感じたとき
- 「その話には根拠が無いのではないか」と感じたとき
- 「それをやっても、うまくいかないのではないか」と感じたとき

確認のしかたは、否定ではなく問いです。
例:「そのお客様は、実際にお金を払ってくださるでしょうか。似たことを頼まれた経験はありますか」
例:「それは、いまも同じでしょうか。5年前の話だとすると、状況が変わっているかもしれません」
例:「同じことをしている会社が既にあるとしたら、その人たちとどこが違うでしょうか」
確認して、相手の答えに納得できたら次へ進みます。納得できなければ、もう一度聞いてください。

## 話し方
- **一度の発言で聞く質問は、必ず1つだけ**にしてください。2つ並べないでください（「〜ですか？また、〜ですか？」は禁止）。聞きたいことが複数あるなら、一番聞きたいものから順に、1往復ずつ聞いてください。
- 長い説明を並べないでください。
- 相手の言葉を受け止めてから聞いてください。ただし、おだてたり大げさに褒めたりしないでください。
- 項目を移るときは、はっきり区切ってください。（例:「では二つめに移ります。」）
- すべて日本語。英語の用語やラベルは使わないでください。

## 出力
発言は必ず hearing_reply という道具を使って返してください。`;

const SUMMARY_SYSTEM = `あなたは、インタビューの記録をまとめる編集者です。

これまでの対話から、次の5項目について、本人が語った内容を整理してください。
1. ${ITEMS[0]}
2. ${ITEMS[1]}
3. ${ITEMS[2]}
4. ${ITEMS[3]}
5. ${ITEMS[4]}

## まとめ方（重要）
- **要約して短くしないでください。**本人が語った内容は、できるだけそのまま残します。この文章は次の分析の入力になるので、情報が多いほど良い結果になります。
- 本人の言葉づかい・一人称を保ってください。「〜だそうです」ではなく「〜です」と、本人が書いた文章として整えます。
- 話が前後している場合だけ、読める順に並べ替えてください。
- 対話の中で複数回に分かれて語られた内容は、1つにまとめてください。
- 語られていない項目は、無理に作らないでください。その場合は body を「（まだ伺えていません）」としてください。
- 各項目の本文は、本人が語った分量に応じて。上限は1項目あたり10,000字です。短くまとめる必要はありません。
- すべて日本語。英語の用語やラベルは使わないでください。

## 出力
まとめは必ず hearing_summary という道具を使って返してください。5項目すべてを入れてください。`;

// 形式を崩さないよう、返事は必ず「道具」で受け取る（本文にJSONを書かせると、たまに壊れて画面が止まる）
const REPLY_TOOL = {
  name: "hearing_reply",
  description: "相手への発言と、いま伺っている項目の番号を返す",
  input_schema: {
    type: "object",
    properties: {
      reply: { type: "string", description: "相手への発言（日本語）。**質問は必ず1つだけ**。「〜ですか？また〜ですか？」のように2つ並べない。同じ論点は2回までで引き下がる。" },
      step: { type: "integer", minimum: 1, maximum: 5, description: "いま伺っている項目の番号。次の項目に移ったならその番号。" },
      complete: { type: "boolean", description: "5項目すべてを伺い終え、自分自身が納得できたら true。" },
    },
    required: ["reply", "step", "complete"],
  },
};

const SUMMARY_TOOL = {
  name: "hearing_summary",
  description: "伺った内容を5項目に整理して返す",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "5項目。番号順に。",
        items: {
          type: "object",
          properties: {
            no: { type: "integer", minimum: 1, maximum: 5 },
            label: { type: "string", description: "項目名" },
            title: { type: "string", description: "中身を言い表す見出し（15〜25字。事実を言う）" },
            body: { type: "string", description: "本文。要約して短くしないこと。" },
          },
          required: ["no", "label", "title", "body"],
        },
      },
      siteName: { type: "string", description: "この事業を短く呼ぶときの名前（15字以内）。**本人が使った言葉を使う。**業界の一般語（マッチング、プラットフォーム、ソリューション等）に置き換えない。" },
    },
    required: ["items", "siteName"],
  },
};

// 道具の中身を取り出す。万一取れなければ本文から拾う（画面を止めないため）
function readTool(msg, name) {
  const block = msg.content.find(b => b.type === "tool_use" && b.name === name);
  if (block) return block.input;
  const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
  const clean = text.replace(/```json|```/g, "").trim();
  const s = clean.indexOf("{"), t = clean.lastIndexOf("}");
  if (s >= 0 && t > s) {
    try { return JSON.parse(clean.slice(s, t + 1)); } catch (e) { /* 下の fallback へ */ }
  }
  return { _raw: text };
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { messages = [], mode = "chat", businessId = null } = await req.json();
  const isSummary = mode === "summary";

  // 対話の履歴（ヒアリングはポイントを消費しない。分析の10,000ポイントに含む）
  const history = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && m.content)
    .map(m => ({ role: m.role, content: String(m.content) }));

  try {
    const tool = isSummary ? SUMMARY_TOOL : REPLY_TOOL;
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: isSummary ? 16000 : 1500,
      system: [{ type: "text", text: isSummary ? SUMMARY_SYSTEM : HEARING_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: isSummary
        ? [...history, { role: "user", content: "ここまでの対話を、上の形式でまとめてください。" }]
        : (history.length ? history : [{ role: "user", content: "お願いします。" }]),
    });

    logUsage(msg, {
      email: session.user.email,
      feature: isSummary ? "newbiz_summary" : "newbiz_hearing",
      siteId: businessId,
    }).catch(() => {});

    const data = readTool(msg, tool.name);

    if (isSummary) {
      const items = Array.isArray(data.items) ? data.items : [];
      // 分析に渡す1本のテキスト
      const inputText = items
        .map(it => `【${it.no}. ${it.label}】${it.title || ""}\n${it.body || ""}`)
        .join("\n\n");
      return NextResponse.json({ items, siteName: data.siteName || "", inputText });
    }

    // 万一 reply が取れなくても、対話を止めない（画面が固まるのが一番困る）
    const reply = data.reply || data._raw || "すみません、うまく聞き取れませんでした。もう一度お話しいただけますか。";
    return NextResponse.json({
      reply,
      step: Math.min(5, Math.max(1, Number(data.step) || 1)),
      complete: !!data.complete,
    });
  } catch (e) {
    console.error("[newbiz/hearing] 失敗:", e?.message || e);
    return NextResponse.json({ error: "うまく応答できませんでした。もう一度お試しください。" }, { status: 500 });
  }
}
