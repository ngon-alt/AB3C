import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 300;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL);

  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;

  const ticketRows = await sql`
    SELECT id FROM tickets WHERE email = ${session.user.email} AND remaining_chats > 0 LIMIT 1
  `;
  const hasTicket = ticketRows.length > 0;

  if (!isPro && !hasTicket) {
    return NextResponse.json({ error: "ビジュアル生成にはプランの購入が必要です" }, { status: 403 });
  }

  const { analysisResult, improveResult, url } = await req.json();

  const strategyMessage = analysisResult?.strategy_message?.message || "";
  const benefitPart = analysisResult?.strategy_message?.benefit_part || analysisResult?.benefit?.core || "";
  const advantagePart = analysisResult?.strategy_message?.advantage_part || analysisResult?.advantage?.what || "";
  const target = analysisResult?.three_c?.customer?.target || "";

  // 改善レポートから上位2項目を抽出してビジュアルに反映（簡潔に）
  const extractTop = (arr) => (arr || []).slice(0, 2).map(x => `・${x.title}`).join("\n");
  const improveDigest = improveResult ? `
## 改善レポートの要点（反映してください）
追加すべきコンテンツ:
${extractTop(improveResult.contents)}
改善すべきデザイン:
${extractTop(improveResult.design)}
サイト構造:
${extractTop(improveResult.structure)}
` : "";

  const prompt = `あなたはウェブデザイナーです。以下のAB3C戦略分析と改善レポートを元に、**ウェブサイトのファーストビュー（トップページ最上部）の改善後の完成形**をHTML/CSSで制作してください。

## 対象URL
${url || "（URL未指定）"}

## AB3C戦略分析（要点）
- 戦略メッセージ: ${strategyMessage}
- Benefit（お客様が得る価値）: ${benefitPart}
- Advantage（差別化ポイント）: ${advantagePart}
- ターゲット顧客: ${target}
${improveDigest}

## AB3C分析結果（抜粋）
${JSON.stringify(analysisResult, null, 2).slice(0, 1500)}

## 要件
このサイトがもしこの戦略を最大限活かし、**上記の改善レポートの提案を反映したら**、ファーストビューはこうあるべき、という**理想の完成イメージ**を1枚のHTMLモックとして作ってください。

必須要素:
1. **ヒーローエリア**（画面上部）
   - 大きなキャッチコピー（戦略メッセージを反映、Benefit + Advantage が一目で伝わる）
   - サブコピー（具体的な価値の説明）
   - CTA ボタン（「無料相談」「詳しく見る」等、目立つ位置）
2. **ビジュアル要素**のプレースホルダー（ヒーロー画像、アイコン等は gray placeholder で表現）
3. **信頼要素**（改善レポートで言及された「お客様の声」「実績」「導入数」等を反映、事業内容に合わせて架空の数値でOK）
4. **下部に3〜4個の価値訴求カード**（Benefit の要素 + 改善レポートで挙がった追加コンテンツ案を視覚化）
5. **改善レポートの具体的な提案が見える**ように（例: 事例追加の提案があれば事例セクション、比較表の提案があれば比較要素、など）

## HTML/CSS 制約
- **完結した HTML 断片**（<html>タグ不要、bodyの中身だけ）
- **<style>タグでインラインCSS**（外部CSSやフォント禁止）
- **外部リソース禁止**（画像URLは使わない、プレースホルダー div で代用）
- ファイルサイズは 60行以内
- 表示は Shadow DOM でスコープ分離されるため、body や * セレクタを自由に使ってOK（外に漏れません）
- 高さは固定せずコンテンツに応じて自然に伸びるようにする（iframeではないため）
- フォント: system-ui, sans-serif（本文16px以上、見出しは大きく）
- **戦略大臣のカラールール厳守**:
  - Benefit強調色: 赤 #FF0000
  - Advantage強調色: 青 #1a6fd4
  - 本文: 黒 #1a1a14
  - 背景: 白 #ffffff or 薄いベージュ #fef3c7
- 日本語OK、絵文字は最小限
- プレースホルダー例:
  \`\`\`
  <div style="background:#e8e8e8;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#666;font-size:14px;border-radius:8px">[ヒーロー画像]</div>
  \`\`\`

## 印刷対応（必須）
<style>タグの冒頭に以下を必ず含めること（背景色・色を印刷時も保持するため）:
\`\`\`css
*, *::before, *::after {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
\`\`\`

## 出力形式
以下のJSONのみ返してください。改行・引用符は \\n \\" でエスケープ:

\`\`\`json
{
  "visual_mock_html": "<style>...</style><div>...</div>",
  "caption": "このファーストビューの意図や改善ポイントを1〜2行で説明"
}
\`\`\`

余計な説明や \`\`\`json マークは不要です。JSONだけ返してください。`;

  let rawText = "";
  let stopReason = "";
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    stopReason = message.stop_reason || "";
    rawText = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = rawText.replace(/```json|```/g, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    const jsonStr = firstBrace >= 0 && lastBrace > firstBrace ? clean.slice(firstBrace, lastBrace + 1) : clean;
    const result = JSON.parse(jsonStr);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[improve/visual] error:", e?.message, "stop_reason:", stopReason, "text head:", rawText.slice(0, 500));
    return NextResponse.json({
      error: "改善ビジュアルの生成に失敗しました。",
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
