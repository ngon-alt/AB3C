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

  const { messages, analysisResult, reanalyze, recruitMode, threadTheme, initialAdvice } = await req.json();

  // initialAdvice（テーマ初回自動生成）はチケット消費しない
  if (!initialAdvice) {
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
  }

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
    seo: `\n【初回アドバイス】AB3C分析結果をもとに、SEO対策の具体的な施策を提案してください:
1. ターゲットキーワード候補 — 顧客が検索しそうなキーワードを10個以上、検索意図別に分類して提案
2. タイトル・メタディスクリプション改善案 — 戦略メッセージを反映した魅力的な表現
3. コンテンツ構成案 — ターゲット顧客の課題を解決する記事テーマを優先度順に5つ以上
4. 内部対策 — サイト構造・見出し構成・内部リンクの改善ポイント
各施策について、この事業のBenefit・Advantageに照らした具体的な案を提示してください。`,
    sns: `\n【初回アドバイス】AB3C分析結果をもとに、SNS運用の戦略を提案してください:
1. プラットフォーム選定 — ターゲット顧客の属性から最適なSNS（Instagram/X/Facebook/TikTok/YouTube/LINE等）を選定し理由を説明
2. 発信コンセプト — 戦略メッセージに基づく投稿の方向性・トーン
3. 投稿企画案 — 具体的な投稿ネタを10個、カテゴリ別に提案
4. 投稿カレンダー案 — 週何回、どの曜日・時間帯が効果的か
5. フォロワー獲得施策 — ハッシュタグ戦略、コラボ案など
それぞれ「こういう方向ではいかがでしょうか」という提案形式で書いてください。`,
    webads: `\n【初回アドバイス】AB3C分析結果をもとに、Web広告の戦略を提案してください:
1. 広告種別の選定 — 検索連動型（リスティング）/SNS広告/ディスプレイ広告から、この事業に最適な種別を選定し理由を説明
2. ターゲティング設計 — 年齢・地域・興味関心・キーワードなど具体的な設定案
3. 広告文案 — 戦略メッセージ（Benefit + Advantage）を反映したキャッチコピーと説明文を3パターン
4. LP（ランディングページ）構成案 — 広告から誘導するページの構成要素
5. 予算配分の目安 — 月額予算別の推奨プラン
費用対効果の見込みを含めて具体的に提案してください。`,
    meo: `\n【初回アドバイス】AB3C分析結果をもとに、Googleマップ（MEO）対策を提案してください:
1. Googleビジネスプロフィールの最適化 — ビジネス説明文を戦略メッセージに基づいて作成、カテゴリ選定
2. 写真・動画の掲載方針 — Advantageを視覚的に伝えるための撮影・掲載ポイント
3. 口コミ対策 — 口コミ依頼の仕組み、口コミ返信テンプレート（好評・改善要望別）
4. 投稿活用 — Googleビジネスの投稿機能で発信すべき内容（イベント、お知らせ、商品紹介）
5. 地域SEOとの連携 — 地域名+キーワードでの検索対策
地域ビジネスとしての強みを最大限活かす施策を優先度順に提案してください。`,
    flyer: `\n【初回アドバイス】AB3C分析結果をもとに、チラシ・DMの制作戦略を提案してください:
1. キャッチコピー案 — 戦略メッセージ（Benefit + Advantage）を凝縮した見出しを3パターン
2. 構成ラフ案 — 表面・裏面の情報配置（何をどこに載せるか）
3. 訴求ポイント — ターゲット顧客が「これは自分向けだ」と感じる要素
4. CTA（行動喚起） — 問い合わせ・来店・Web訪問など最適なアクション設計
5. 配布戦略 — 配布エリア・タイミング・配布方法（ポスティング/手渡し/同梱等）
オフライン施策ならではの強みを活かした提案をしてください。`,
    press: `\n【初回アドバイス】AB3C分析結果をもとに、プレスリリースの戦略を提案してください:
1. ニュース切り口 — この事業からプレスリリースにできるネタを5つ以上（新商品/イベント/調査結果/社会貢献/業界初など）
2. プレスリリース文案 — 最もニュース性の高いネタについて、タイトル・リード文・本文の構成案
3. 配信先メディア — ターゲット顧客が読んでいそうなメディア・記者への接触方法
4. 配信タイミング — 業界イベント・季節性を考慮した最適な時期
5. 取材対応準備 — 想定質問と回答案
Advantageを「ニュース」として伝える切り口を具体的に提案してください。`,
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
各項目について概要を書き出し、「この方向で合っていますか？」と確認を求めてください。
最後に必ず以下の注意書きを記載してください：
「⚠️ 本機能は補助金申請書の作成代行ではありません。AIが提案する内容はあくまで下書き・たたき台です。申請書の最終的な作成・提出はご自身の責任で行ってください。必要に応じて行政書士等の専門家にご相談ください。」`,
    sales: `\n【初回アドバイス】AB3C分析結果をもとに、営業資料・提案書の構成を提案してください:
1. 営業トーク構成 — 初回アプローチから成約までのトークフロー（戦略メッセージをベースに）
2. 提案書ドラフト — 表紙/課題提起/解決策/自社の強み/実績/料金/次のステップ の構成案
3. 差別化ポイント — 競合と比較されたときに「選ばれる理由」として伝えるべき要素
4. 想定FAQ — 顧客からよくある質問と、Advantageに基づく回答案を10個
5. クロージング戦略 — 成約率を高めるための提案方法・フォロー設計
BtoBの場合は意思決定者・現場担当者それぞれへのアプローチも提案してください。`,
    today: `\n【初回アドバイス】AB3C分析結果をもとに、今日すぐに取り組める具体的なアクションを優先度順に3つ提案してください。それぞれ30分以内で着手できる粒度で具体的に書いてください。`,
  }[threadTheme] || "" : "";

  const themeContext = (!initialAdvice && threadTheme) ? {
    seo: "\n現在のテーマは「SEO対策」です。AB3C分析結果をもとに、ターゲット顧客が検索するキーワードでの上位表示を目指す具体的なSEO施策を提案してください。",
    sns: "\n現在のテーマは「SNS運用」です。AB3C分析結果をもとに、ターゲット顧客にリーチするためのSNS投稿企画・運用施策を提案してください。",
    webads: "\n現在のテーマは「Web広告」です。AB3C分析結果をもとに、費用対効果の高いWeb広告（リスティング/SNS広告/ディスプレイ広告）の施策を提案してください。",
    meo: "\n現在のテーマは「Googleマップ（MEO）」です。AB3C分析結果をもとに、地域検索での集客を強化するMEO対策を提案してください。",
    flyer: "\n現在のテーマは「チラシ・DM制作」です。AB3C分析結果をもとに、戦略メッセージを効果的に伝えるオフライン販促物の制作を提案してください。",
    press: "\n現在のテーマは「プレスリリース」です。AB3C分析結果をもとに、メディアに取り上げられるニュース性のあるプレスリリースの企画を提案してください。",
    website: "\n現在のテーマは「ウェブサイト改善」です。AB3C分析結果をもとに、戦略メッセージを正しく伝えるためのウェブサイト改善案を提案してください。",
    recruit: "\n現在のテーマは「採用コンテンツ企画」です。AB3C分析結果をもとに、戦略から導かれる採用コンテンツの改善を提案してください。",
    subsidy: "\n現在のテーマは「補助金申請」です。AB3C分析結果をもとに、申請書に活かせる事業の強み・差別化の表現方法をアドバイスしてください。なお、本機能は申請書の作成代行ではなく、あくまで下書き・たたき台の提案です。",
    sales: "\n現在のテーマは「営業資料・提案書」です。AB3C分析結果をもとに、競合と差別化された営業資料・提案書の作成を提案してください。",
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

  const actionInstruction = threadTheme ? `
具体的なアクション（やるべきこと）を提案する場合は、回答の最後に [ACTION: アクションのタイトル] の形式で1つだけ明記してください。例：[ACTION: トップページのキャッチコピーを変更する]
アクション提案が不要な一般的な質疑応答の場合は[ACTION:]を付けないでください。` : "";

  const systemPrompt = `あなたはAB3C分析の専門家です。以下の分析結果をもとに、ユーザーの相談に答えてください。
## 現在の分析結果
${JSON.stringify(analysisResult, null, 2)}
回答は日本語で、具体的かつ簡潔に。AB3Cフレームワークの観点から助言してください。
マークダウン記法（**太字**、###見出し、---区切りなど）は使わず、プレーンテキストで回答してください。${actionInstruction}${initialAdvicePrompts}${themeContext}${recruitPrompt}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: initialAdvice ? 2000 : 1000,
    system: systemPrompt,
    messages: messages,
  });

  return NextResponse.json({ message: response.content[0].text });
}
