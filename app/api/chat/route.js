import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  // プロ会員チェック
  const sql = neon(process.env.DATABASE_URL);
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  if (proRows.length === 0) {
    return NextResponse.json({ error: "この機能はプロ会員限定です" }, { status: 403 });
  }

  const { messages, analysisResult } = await req.json();

  const systemPrompt = `あなたはAB3C分析の専門家です。以下の分析結果をもとに、ユーザーの相談に答えてください。

## 現在の分析結果
${JSON.stringify(analysisResult, null, 2)}

回答は日本語で、具体的かつ簡潔に。AB3Cフレームワークの観点から助言してください。`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages,
  });

  return NextResponse.json({ 
    message: response.content[0].text 
  });
}
