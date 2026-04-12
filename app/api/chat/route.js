import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL);

  // プロ会員チェック
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;

  // 有料チケットチェック
  const ticketRows = await sql`
    SELECT id, remaining_chats FROM tickets
    WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
    ORDER BY purchased_at ASC
    LIMIT 1
  `;
  const hasTicket = ticketRows.length > 0;

  // トライアルチケットチェック
  const trialRows = await sql`
    SELECT id, remaining_chats FROM tickets
    WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = TRUE
    ORDER BY purchased_at ASC
    LIMIT 1
  `;
  const hasTrial = trialRows.length > 0;

  if (!isPro && !hasTicket && !hasTrial) {
    return NextResponse.json({ error: "チャット機能を利用するにはチケットが必要です" }, { status: 403 });
  }

  // チケット消費（プロ会員は消費しない）
  if (!isPro) {
    if (hasTicket) {
      await sql`UPDATE tickets SET remaining_chats = remaining_chats - 1 WHERE id = ${ticketRows[0].id}`;
    } else if (hasTrial) {
      await sql`UPDATE tickets SET remaining_chats = remaining_chats - 1 WHERE id = ${trialRows[0].id}`;
    }
  }

  const { messages, analysisResult, reanalyze, recruitMode } = await req.json();

  if (reanalyze) {
    const conversationSummary = messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content.slice(0, 200))
      .join('\n');

    const systemPrompt = `あなたはAB3C分析の専門家です。以下の元の分析結果とユーザーとの会話内容をもとに、改善されたAB3C分析結果をJSON形式で返してください。
## 元の分析結果
${JSON.stringify(analysisResult)}
## ユーザーからの追加情報（最新3件）
${conversationSummary}
上記を反映した新しい分析結果を返してください。
絶対に守ること：
- JSONのみ返す。説明文・前置き・コードブロック記号（\`\`\`）は一切不要
- checkpointsは元の値をそのままコピーして変更しない
- 必ず有効なJSONのみを返す`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: systemPrompt }],
    });

    try {
      const text = response.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const newResult = JSON.parse(clean);

      const summaryResponse = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `以下の会話内容を15文字以内で一言に要約してください。要約のみ返してください。\n\n${conversationSummary}`
        }],
      });
      const chatSummary = summaryResponse.content[0].text.trim();
      return NextResponse.json({ reanalyzed: true, result: newResult, chatSummary });
    } catch (e) {
      console.error("再分析JSONパースエラー:", e);
      return NextResponse.json({ error: "再分析に失敗しました" }, { status: 500 });
    }
  }

  const recruitPrompt = recruitMode ? `

また、あなたは採用コンテンツの専門家でもあります。AB3C分析結果から導かれる採用戦略を提案しながら、以下の情報を自然な会話の中でヒアリングしてください:
- 会社のビジョン（戦略メッセージをベースに提案し確認）
- 会社の特徴・強み（働く人の観点で）
- この会社で働くと身につくスキル
- キャリアパス・転職先の可能性（同業界の一般的なパスも提示）
- 待遇・環境面での差別化ポイント
一問一答ではなく、戦略分析から推論した提案をしながら確認・修正を受ける形で進めてください。
例えば「Advantageから考えると御社のビジョンはこうでしょうか」「同業界ではこのようなキャリアパスが考えられますが」のように、具体的な提案をベースにヒアリングしてください。` : "";

  const systemPrompt = `あなたはAB3C分析の専門家です。以下の分析結果をもとに、ユーザーの相談に答えてください。
## 現在の分析結果
${JSON.stringify(analysisResult, null, 2)}
回答は日本語で、具体的かつ簡潔に。AB3Cフレームワークの観点から助言してください。
マークダウン記法（**太字**、###見出し、---区切りなど）は使わず、プレーンテキストで回答してください。
具体的なアクション（やるべきこと）を提案する場合は、回答の最後に [ACTION: アクションのタイトル] の形式で1つだけ明記してください。例：[ACTION: トップページのキャッチコピーを変更する]
アクション提案が不要な一般的な質疑応答の場合は[ACTION:]を付けないでください。${recruitPrompt}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages,
  });

  return NextResponse.json({ message: response.content[0].text });
}
