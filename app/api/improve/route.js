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

  // 改善レポートチケットチェック
  const ticketRows = await sql`
    SELECT id, remaining_chats FROM tickets
    WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
    ORDER BY purchased_at ASC
    LIMIT 1
  `;
  const hasTicket = ticketRows.length > 0;

  if (!isPro && !hasTicket) {
    return NextResponse.json({ error: "改善レポートの利用にはプランの購入が必要です" }, { status: 403 });
  }

  const { analysisResult, url } = await req.json();

  const prompt = `あなたはウェブサイト改善の専門家です。以下のAB3C分析結果とウェブサイトURLをもとに、具体的な改善提案を行ってください。

## 分析対象URL
${url}

## AB3C分析結果
${JSON.stringify(analysisResult, null, 2)}

以下のJSON形式のみで返してください：
{
  "contents": [
    {"title": "追加すべきコンテンツのタイトル", "reason": "なぜ必要か", "example": "具体的な実装例"},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."}
  ],
  "design": [
    {"title": "改善すべきデザイン・ビジュアルのタイトル", "reason": "なぜ必要か", "example": "具体的な実装例"},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."}
  ],
  "structure": [
    {"title": "サイト構造の改善タイトル", "reason": "なぜ必要か", "example": "具体的な実装例"},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."}
  ]
}

JSONのみ返してください。`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "改善レポートの生成に失敗しました。" }, { status: 500 });
  }
}
