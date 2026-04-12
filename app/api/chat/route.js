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

  const { messages, analysisResult, reanalyze, recruitMode, threadTheme, initialAdvice } = await req.json();

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

  const initialAdvicePrompts = initialAdvice ? {
    marketing: `\n【初回アドバイス】以下の集客チャネルについて、AB3C分析結果から導かれる優先順位を付けて具体的にアドバイスしてください:
1. SEO（検索エンジン最適化）— ターゲット顧客が検索しそうなキーワードと対策
2. SNS — 適切なプラットフォーム選定と発信内容
3. Googleマップ（MEO）— 地域ビジネスなら重要度を評価
4. プレスリリース — ニュース性のある切り口
5. ネット広告（リスティング/SNS広告）— 費用対効果の見込み
6. チラシ・DM — オフライン施策の有効性
各チャネルについて、この事業の戦略・ターゲットに照らして優先度（高/中/低）と具体的な施策案を提示してください。最も優先度が高いものから詳しく説明してください。`,
    recruit: `\n【初回アドバイス】AB3C分析結果から採用コンテンツの骨格を提案してください。以下の項目それぞれについて、戦略から導かれる具体的な案を書き出してください:
1. 会社のビジョン — 戦略メッセージをベースに、求職者向けの表現で提案
2. 会社の特徴・強み — Advantageから導かれる「働く人にとっての魅力」
3. 待遇案 — 差別化が十分かどうかの評価と改善提案
4. キャリアプラン案 — この会社で身につくスキル、同業界の一般的なキャリアパス、独立・転職の可能性
5. 求める人物像 — ターゲット顧客を理解できる人材像
それぞれ「こういう方向ではいかがでしょうか」という提案形式で書き、確認・修正を求めてください。`,
    website: `\n【初回アドバイス】AB3C分析結果とウェブサイト改善レポートの内容をもとに、以下の観点からウェブサイト改善の優先事項を提案してください:
1. 追加すべきコンテンツ — 戦略メッセージを伝えるために不足しているページや情報
2. デザイン・ビジュアルの改善 — ターゲットに刺さるデザインの方向性
3. サイト構造の改善 — ユーザー導線、CTA配置
具体的な改善案を優先度順に提示してください。`,
    subsidy: `\n【初回アドバイス】小規模事業者持続化補助金の事業計画書をベースに、AB3C分析結果から各記載項目の概要を書き出してください:
1. 企業概要 — 会社の事業内容、強み
2. 顧客ニーズと市場の動向 — 3C分析のCustomer・市場規模データを活用
3. 自社や自社の提供する商品・サービスの強み — Advantage・Companyの内容
4. 経営方針・目標と今後のプラン — 戦略メッセージに基づく方向性
5. 補助事業で行う事業名・内容・効果 — 具体的な施策案
各項目について概要を書き出し、「この方向で合っていますか？」と確認を求めてください。`,
    today: `\n【初回アドバイス】AB3C分析結果をもとに、今日すぐに取り組める具体的なアクションを優先度順に3つ提案してください。それぞれ30分以内で着手できる粒度で具体的に書いてください。`,
  }[threadTheme] || "" : "";

  const themeContext = (!initialAdvice && threadTheme) ? {
    marketing: "\n現在のテーマは「集客・広告」です。AB3C分析結果から導かれるターゲット顧客にリーチするための具体的な集客施策を提案してください。",
    website: "\n現在のテーマは「ウェブサイト改善」です。AB3C分析結果をもとに、戦略メッセージを正しく伝えるためのウェブサイト改善案を提案してください。",
    subsidy: "\n現在のテーマは「補助金申請」です。AB3C分析結果をもとに、申請書に活かせる事業の強み・差別化の表現方法をアドバイスしてください。",
    today: "\n現在のテーマは「今日のアクション」です。AB3C分析結果をもとに、今日取り組むべき具体的なタスクを優先度順に提案してください。",
  }[threadTheme] || "" : "";

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
アクション提案が不要な一般的な質疑応答の場合は[ACTION:]を付けないでください。${initialAdvicePrompts}${themeContext}${recruitPrompt}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: initialAdvice ? 2000 : 1000,
    system: systemPrompt,
    messages: messages,
  });

  return NextResponse.json({ message: response.content[0].text });
}
