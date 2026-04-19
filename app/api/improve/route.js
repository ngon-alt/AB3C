import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { getScreenshotUrl } from "@/app/lib/urlbox";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 300;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL);

  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;

  const ticketRows = await sql`
    SELECT id, remaining_chats FROM tickets
    WHERE email = ${session.user.email} AND remaining_chats > 0
    ORDER BY purchased_at ASC
    LIMIT 1
  `;
  const hasTicket = ticketRows.length > 0;

  if (!isPro && !hasTicket) {
    return NextResponse.json({ error: "改善レポートの利用にはプランの購入が必要です" }, { status: 403 });
  }

  const { analysisResult, url } = await req.json();
  const isHttpUrl = typeof url === "string" && url.startsWith("http");

  // スクショURL生成（表示用）
  let screenshotUrl = null;
  if (isHttpUrl) {
    try {
      screenshotUrl = getScreenshotUrl(url);
    } catch (e) {
      console.error("Screenshot URL generation failed:", e?.message || e);
    }
  }

  const prompt = `あなたはウェブサイト改善の専門家です。以下のAB3C分析結果とウェブサイトURLをもとに、具体的な改善提案を行ってください。

## 分析対象URL
${url}

## AB3C分析結果
${JSON.stringify(analysisResult, null, 2)}

以下のJSON形式のみで返してください（各セクション3項目、改善効果の高いもの順）：
{
  "contents": [
    {"title": "追加すべきコンテンツのタイトル", "reason": "なぜ必要か", "example": "具体的な実装例"},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."}
  ],
  "design": [
    {"title": "改善すべきデザイン・ビジュアルのタイトル", "reason": "なぜ必要か", "example": "具体的な実装例"},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."}
  ],
  "structure": [
    {"title": "サイト構造の改善タイトル", "reason": "なぜ必要か", "example": "具体的な実装例"},
    {"title": "...", "reason": "...", "example": "..."},
    {"title": "...", "reason": "...", "example": "..."}
  ]
}

JSONのみ返してください。`;

  let rawText = "";
  let stopReason = "";
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 5000,
      messages: [{ role: "user", content: prompt }],
    });

    stopReason = message.stop_reason || "";
    rawText = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = rawText.replace(/```json|```/g, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    const jsonStr = firstBrace >= 0 && lastBrace > firstBrace ? clean.slice(firstBrace, lastBrace + 1) : clean;
    const result = JSON.parse(jsonStr);
    if (screenshotUrl) result.screenshot_url = screenshotUrl;
    return NextResponse.json(result);
  } catch (e) {
    console.error("[improve] error:", e?.message, "stop_reason:", stopReason, "text head:", rawText.slice(0, 500));
    return NextResponse.json({
      error: "改善レポートの生成に失敗しました。",
      debug: {
        message: String(e?.message || e),
        stop_reason: stopReason,
        text_length: rawText.length,
        text_head: rawText.slice(0, 300),
        text_tail: rawText.slice(-300),
      },
    }, { status: 500 });
  }
}
