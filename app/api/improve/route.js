import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Vercel Functions のタイムアウト延長（改善レポート生成は時間がかかる）
export const maxDuration = 300;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL);

  // プロ会員チェック
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;

  // チャットチケットチェック（指南プラン契約者等）
  const ticketRows = await sql`
    SELECT id, remaining_chats FROM tickets
    WHERE email = ${session.user.email} AND remaining_chats > 0
    ORDER BY purchased_at ASC
    LIMIT 1
  `;
  const hasTicket = ticketRows.length > 0;

  // 戦略診断チケット保有チェック（analysis プラン）
  const analysisPlanRows = await sql`
    SELECT id FROM user_plans
    WHERE user_email = ${session.user.email} AND plan_type = 'analysis' AND status = 'active'
    LIMIT 1
  `;
  const hasAnalysisPlan = analysisPlanRows.length > 0;

  // 無料トライアル中（初回の1回）のユーザーも改善レポート生成を許可
  const userRows = await sql`SELECT usage_count FROM users WHERE email = ${session.user.email}`;
  const isTrialActive = userRows.length > 0 && parseInt(userRows[0].usage_count || 0) >= 1;

  if (!isPro && !hasTicket && !hasAnalysisPlan && !isTrialActive) {
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

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000, // 15項目×詳細テキストで大きめ
      messages: [{ role: "user", content: prompt }],
    });
  } catch (e) {
    console.error("/api/improve Claude API error:", e?.message);
    return NextResponse.json({ error: "AI への接続に失敗しました。少し時間をおいてもう一度お試しください。" }, { status: 502 });
  }

  try {
    const stopReason = message.stop_reason;
    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    let clean = text.replace(/```json|```/g, "").trim();

    // JSON 開始位置から波括弧バランスで真の終端を探す（lastIndexOf 誤検出対策）
    const jsonStart = clean.indexOf("{");
    if (jsonStart < 0) throw new Error("no JSON object found");
    let depth = 0, inString = false, escapeNext = false, jsonEnd = -1;
    for (let i = jsonStart; i < clean.length; i++) {
      const ch = clean[i];
      if (escapeNext) { escapeNext = false; continue; }
      if (ch === "\\" && inString) { escapeNext = true; continue; }
      if (ch === "\"") { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { jsonEnd = i; break; }
      }
    }
    if (jsonEnd < 0) throw new Error("JSON not properly closed (likely truncated)");
    clean = clean.substring(jsonStart, jsonEnd + 1);

    if (stopReason === "max_tokens") throw new Error("max_tokens reached: response truncated");

    let result;
    try {
      result = JSON.parse(clean);
    } catch (e1) {
      const cleaned2 = clean.replace(/[\x00-\x1F\x7F]/g, " ");
      try {
        result = JSON.parse(cleaned2);
      } catch (e2) {
        const cleaned3 = cleaned2.replace(/,\s*([}\]])/g, "$1");
        result = JSON.parse(cleaned3);
      }
    }

    // 必須フィールド検証（空でもいいが配列であることが必要）
    if (!result || !Array.isArray(result.contents) || !Array.isArray(result.design) || !Array.isArray(result.structure)) {
      console.error("/api/improve 不完全なJSON:", JSON.stringify(result).slice(0, 300));
      return NextResponse.json({ error: "改善レポートの内容が不完全でした。もう一度お試しください。", debug: "incomplete sections" }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const rawText = message?.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    console.error("/api/improve JSONパースエラー:", e?.message);
    console.error("stop_reason:", message?.stop_reason, "/ usage:", message?.usage);
    console.error("Raw response length:", rawText.length);
    console.error("Raw response (first 500):", rawText.slice(0, 500));
    console.error("Raw response (last 300):", rawText.slice(-300));
    let reason;
    if (message?.stop_reason === "max_tokens" || /max_tokens/.test(e?.message || "")) {
      reason = "AIの応答が長すぎて途中で切れました。";
    } else if (rawText.length < 50) {
      reason = "AIから空の応答が返りました。";
    } else {
      reason = "AIの応答を解釈できませんでした（JSON形式エラー）。";
    }
    return NextResponse.json({ error: `改善レポートの生成に失敗しました: ${reason}少し時間をおいてもう一度お試しください。`, debug: e?.message }, { status: 500 });
  }
}
