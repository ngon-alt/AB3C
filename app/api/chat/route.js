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
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  if (proRows.length === 0) {
    return NextResponse.json({ error: "この機能はプロ会員限定です" }, { status: 403 });
  }

  const { messages, analysisResult, reanalyze } = await req.json();

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
// 会話の概要を生成
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
      console.error("受信テキスト:", response.content[0].text);
      return NextResponse.json({ error: "再分析に失敗しました" }, { status: 500 });
    }
  }

  const systemPrompt = `あなたはAB3C分析の専門家です。以下の分析結果をもとに、ユーザーの相談に答えてください。

## 現在の分析結果
${JSON.stringify(analysisResult, null, 2)}

回答は日本語で、具体的かつ簡潔に。AB3Cフレームワークの観点から助言してください。
マークダウン記法（**太字**、###見出し、---区切りなど）は使わず、プレーンテキストで回答してください。`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages,
  });

return NextResponse.json({ message: response.content[0].text, content: response.content[0].text });
}
