import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { analysisResult, company_name, industry, chatHistory } = await req.json();

  if (!analysisResult) {
    return NextResponse.json({ error: "AB3C分析結果が必要です。" }, { status: 400 });
  }

  try {
    const prompt = `あなたは採用マーケティングの専門家です。
以下のAB3C分析結果をもとに、この企業の求人コンテンツを作成してください。

## AB3C分析結果
${JSON.stringify(analysisResult, null, 2)}

${company_name ? `## 会社名: ${company_name}` : ""}
${industry ? `## 業種: ${industry}` : ""}
${chatHistory ? `## 採用に関するヒアリング内容\n${chatHistory}` : ""}

## 作成する採用コンテンツ企画

以下のJSON形式で出力してください：
{
  "catch_copy": "採用キャッチコピー（30文字以内）",
  "company_vision": "会社のビジョン（戦略メッセージに基づく、求職者向けの表現で100文字程度）",
  "mission": "ミッション（企業の使命を100文字程度で）",
  "unique_features": "この会社ならではの特徴・強み（働く人の観点で150文字程度）",
  "skills_gained": "この会社で身につくスキル・経験（具体的に150文字程度）",
  "career_paths": "キャリアパス・転職先の可能性（同業界の一般的なパスも含めて150文字程度）",
  "appeal_points": [
    "魅力ポイント1（AB3Cの強みに基づく）",
    "魅力ポイント2",
    "魅力ポイント3"
  ],
  "ideal_candidate": "求める人物像（AB3Cのターゲット顧客理解に基づく共感力のある人材像）",
  "work_description": "仕事内容の説明（具体的に150文字程度）",
  "company_culture": "社風・カルチャー（AB3Cの差別的優位点から推測される企業文化）",
  "message_to_applicants": "応募者へのメッセージ（熱意のこもった100文字程度のメッセージ）"
}

重要：
- AB3Cの「Advantage（差別的優位点）」を企業の魅力として求人に活かしてください
- 「Benefit（お客様が求める価値）」から、顧客志向の姿勢を伝えてください
- 3C分析の「Company」情報から、企業の強みを反映してください
- 求職者が「この会社で働きたい」と思えるような内容にしてください
- JSONのみを出力してください（説明文は不要）`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "求人コンテンツの生成に失敗しました。" }, { status: 500 });
    }

    const recruitContent = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recruitContent);
  } catch (e) {
    console.error("Recruit generation error:", e);
    return NextResponse.json({ error: "求人コンテンツの生成中にエラーが発生しました。" }, { status: 500 });
  }
}
