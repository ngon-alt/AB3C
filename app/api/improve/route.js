import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { getScreenshotUrl, fetchScreenshotBase64 } from "@/app/lib/urlbox";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 60;

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

  // スクショ取得（URL分析の場合のみ）
  let screenshotUrl = null;
  let imageBlock = null;
  if (isHttpUrl) {
    try {
      screenshotUrl = getScreenshotUrl(url);
      const shot = await fetchScreenshotBase64(url);
      imageBlock = {
        type: "image",
        source: {
          type: "base64",
          media_type: shot.mediaType,
          data: shot.base64,
        },
      };
    } catch (e) {
      console.error("Screenshot capture failed:", e?.message || e);
      screenshotUrl = null;
      imageBlock = null;
    }
  }

  const visionNote = imageBlock
    ? "添付したウェブサイトのスクリーンショットをよく観察し、実際のデザイン・レイアウト・コンテンツに即した具体的な改善提案を行ってください。"
    : "";

  const prompt = `あなたはウェブサイト改善の専門家です。${visionNote}以下のAB3C分析結果${isHttpUrl ? "とウェブサイトURL" : ""}をもとに、具体的な改善提案を行ってください。

## 分析対象URL
${url}

## AB3C分析結果
${JSON.stringify(analysisResult, null, 2)}

以下のJSON形式のみで返してください。
各セクション5項目、改善効果の高い上位2項目にのみ improved_html を付けます（3・4・5項目目は improved_html は空文字列 "" にしてください）。

{
  "contents": [
    {"title": "...", "reason": "...", "example": "...", "improved_html": "<style>...</style><div>...</div>"},
    {"title": "...", "reason": "...", "example": "...", "improved_html": "..."},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""}
  ],
  "design": [
    {"title": "...", "reason": "...", "example": "...", "improved_html": "..."},
    {"title": "...", "reason": "...", "example": "...", "improved_html": "..."},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""}
  ],
  "structure": [
    {"title": "...", "reason": "...", "example": "...", "improved_html": "..."},
    {"title": "...", "reason": "...", "example": "...", "improved_html": "..."},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""},
    {"title": "...", "reason": "...", "example": "...", "improved_html": ""}
  ]
}

## improved_html の生成ルール（重要）
- 改善案を視覚的に伝えるHTMLモック（iframeで表示）
- 完結したHTML/CSS断片（**20〜40行以内**、コンパクトに）
- 外部リソース（画像URL、Webフォント、外部CSS/JS）は使わない
- CSSは<style>タグでインライン化
- ダミーテキスト・プレースホルダーでOK（例: 「ここに事例」「お客様の声」など）
- 色は戦略大臣のカラールール：Benefit=赤(#FF0000)、Advantage=青(#1a6fd4)、本文=黒(#1a1a14)、背景=白 or #f8f8f6
- フォントは system-ui, sans-serif（本文16px以上）
- 日本語OK、絵文字は最小限
- 画像は <div style="background:#e0e0e0;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#666;font-size:14px">画像: 〇〇</div> で表現
- JSON文字列として埋め込むため、**改行は \\n、二重引用符は \\" でエスケープ**すること

JSONのみ返してください。コードブロック記号(\`\`\`)も不要です。`;

  let rawText = "";
  let stopReason = "";
  try {
    const userContent = imageBlock
      ? [imageBlock, { type: "text", text: prompt }]
      : prompt;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      messages: [{ role: "user", content: userContent }],
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
        had_screenshot: !!imageBlock,
      },
    }, { status: 500 });
  }
}
