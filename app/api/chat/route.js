import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Vercel Functions のタイムアウト延長（再分析や初回アドバイス生成は時間がかかるため）
export const maxDuration = 300;

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

  const { messages, analysisResult, reanalyze, recruitMode, threadTheme, initialAdvice, actionSummary, actionTitle } = await req.json();

  // initialAdvice（テーマ初回自動生成）と actionSummary はチケット消費しない
  if (!initialAdvice && !actionSummary) {
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

  // アクションまとめ生成（会話履歴から構造化された結論を生成）
  if (actionSummary) {
    const conversationText = (messages || [])
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => `${m.role === "user" ? "【ユーザー】" : "【AI】"}${m.content || ""}`)
      .join("\n\n");
    const summaryPrompt = `以下は、AB3C戦略分析に基づく施策検討のチャット会話です。この会話の結論として決定したアクション「${actionTitle}」について、実行者が後で見返せるよう構造化してまとめてください。

## 戦略分析結果
${JSON.stringify(analysisResult, null, 2)}

## チャット会話
${conversationText}

## 出力形式（プレーンテキスト、マークダウン記法は使わない）
■ 背景・狙い
（なぜこのアクションが必要か。戦略のBenefit/Advantageとの紐付けを1-2文で）

■ 具体的な実施内容
（何を・どのように行うか。会話で出た具体案を箇条書きで3-6項目）

■ 期待効果
（このアクションで得られる成果を1-2文で）

■ 次のステップ
（最初に着手すべき具体タスクを1-3項目の箇条書きで）

重要：
- 上記4セクションのみ出力し、それ以外の前置き・後書きは一切不要
- マークダウン（**太字**、###見出しなど）は使わずプレーンテキストで
- 会話にない情報を勝手に補わず、会話で議論された内容をベースにまとめる`;

    const sumRes = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: summaryPrompt }],
    });
    const sumText = sumRes.content.filter(b => b.type === "text").map(b => b.text).join("");
    return NextResponse.json({ summary: sumText });
  }

  if (reanalyze) {
    // analysisResult が空だと Claude が JSON を返せないので早めに弾く
    if (!analysisResult || typeof analysisResult !== "object") {
      return NextResponse.json({ error: "再分析の元になる分析結果が取得できませんでした。画面をリロードしてからもう一度お試しください。" }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "再分析するには、まずチャットでいくつかご相談ください。" }, { status: 400 });
    }
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

絶対に守ること（最重要）：
- JSONのみ返す。説明文・前置き・コードブロック記号（\`\`\`）・JSON 後ろの追記コメントは一切不要
- 返却する JSON は **元の分析結果と完全に同じトップレベル構造** を保持すること:
  benefit, advantage, three_c (customer/competitor/company), strategy_message, checkpoints の **全フィールドを必ず含める**
- 変更がないセクション（competitor, company など会話で触れていないセクション）は、**元の値をそのままコピーして必ず含めること**。省略・空配列・空文字列にしてはいけない
- checkpoints は元の値（label/status/comment 各5項目）をそのまま全件コピーする
- 必ず有効な JSON のみを返す（JSON が完了したら、それ以降は何も書かない）`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000, // AB3C再生成は出力が大きい。8000では途中で切れることがあったため拡張
      messages: [{ role: "user", content: systemPrompt }],
    });

    try {
      const stopReason = response.stop_reason; // "end_turn" | "max_tokens" | ...
      const text = response.content?.[0]?.text || "";
      let clean = text.replace(/```json|```/g, "").trim();
      // JSON 開始位置（最初の `{`）から、波括弧バランスで真の終端を探す
      // 注: 文字列リテラル内の `{` `}` は数えない
      const jsonStart = clean.indexOf('{');
      if (jsonStart < 0) throw new Error("no JSON object found in response");
      let depth = 0;
      let inString = false;
      let escapeNext = false;
      let jsonEnd = -1;
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
      if (jsonEnd < 0) {
        // 開いた括弧が閉じていない = 切り捨ての可能性
        throw new Error("JSON not properly closed (likely truncated)");
      }
      clean = clean.substring(jsonStart, jsonEnd + 1);

      // max_tokens で切れた場合は途中までしかパースできない可能性が高いため明示エラー
      if (stopReason === "max_tokens") {
        throw new Error("max_tokens reached: response truncated");
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(clean);
      } catch (e1) {
        // 不正な制御文字を除去して再パース
        const cleaned2 = clean.replace(/[\x00-\x1F\x7F]/g, " ");
        try {
          parsedResult = JSON.parse(cleaned2);
        } catch (e2) {
          // 末尾カンマを除去（よくある Claude の癖）
          const cleaned3 = cleaned2.replace(/,\s*([}\]])/g, "$1");
          parsedResult = JSON.parse(cleaned3);
        }
      }

      // === 欠落・空フィールドを元の analysisResult から補完 ===
      // Claude は会話で触れたセクションだけ詳細に返して、他は省略 or 空構造で返すことがある。
      // 各「実フィールド」(配列・文字列)単位で空判定し、空なら元の値を採用する。
      // 「構造あり中身空」(例: { direct: [], indirect: [] }) も上書きしてしまわないようにする。
      const orig = analysisResult || {};
      const np = parsedResult || {};
      // 配列: 中身があれば new、なければ orig
      const pickArr = (newArr, origArr) => (Array.isArray(newArr) && newArr.length > 0) ? newArr : (Array.isArray(origArr) ? origArr : []);
      // 文字列: trim して中身があれば new、なければ orig
      const pickStr = (newStr, origStr) => (typeof newStr === "string" && newStr.trim() !== "") ? newStr : (typeof origStr === "string" ? origStr : "");
      const newResult = {
        benefit: {
          core: pickStr(np.benefit?.core, orig.benefit?.core),
          needs: pickArr(np.benefit?.needs, orig.benefit?.needs),
          wants: pickArr(np.benefit?.wants, orig.benefit?.wants),
        },
        advantage: {
          what: pickStr(np.advantage?.what, orig.advantage?.what),
          why_good: pickStr(np.advantage?.why_good, orig.advantage?.why_good),
          why_hard_to_copy: pickStr(np.advantage?.why_hard_to_copy, orig.advantage?.why_hard_to_copy),
        },
        three_c: {
          customer: {
            target: pickStr(np.three_c?.customer?.target, orig.three_c?.customer?.target),
            profile: pickArr(np.three_c?.customer?.profile, orig.three_c?.customer?.profile),
            stage: pickStr(np.three_c?.customer?.stage, orig.three_c?.customer?.stage),
            cutoff: pickStr(np.three_c?.customer?.cutoff, orig.three_c?.customer?.cutoff),
            market: {
              sam: pickStr(np.three_c?.customer?.market?.sam, orig.three_c?.customer?.market?.sam),
              som: pickStr(np.three_c?.customer?.market?.som, orig.three_c?.customer?.market?.som),
              growth: pickStr(np.three_c?.customer?.market?.growth, orig.three_c?.customer?.market?.growth),
              basis: pickStr(np.three_c?.customer?.market?.basis, orig.three_c?.customer?.market?.basis),
            },
          },
          competitor: {
            direct: pickArr(np.three_c?.competitor?.direct, orig.three_c?.competitor?.direct),
            indirect: pickArr(np.three_c?.competitor?.indirect, orig.three_c?.competitor?.indirect),
          },
          company: {
            strength: pickArr(np.three_c?.company?.strength, orig.three_c?.company?.strength),
            structure: pickStr(np.three_c?.company?.structure, orig.three_c?.company?.structure),
            passion: pickStr(np.three_c?.company?.passion, orig.three_c?.company?.passion),
          },
        },
        strategy_message: {
          message: pickStr(np.strategy_message?.message, orig.strategy_message?.message),
          benefit_part: pickStr(np.strategy_message?.benefit_part, orig.strategy_message?.benefit_part),
          advantage_part: pickStr(np.strategy_message?.advantage_part, orig.strategy_message?.advantage_part),
        },
        checkpoints: Array.isArray(np.checkpoints) && np.checkpoints.length > 0
          ? np.checkpoints
          : (Array.isArray(orig.checkpoints) ? orig.checkpoints : []),
      };
      // 補完が発火したフィールドをログ（デバッグ用）
      const fallbackFields = [];
      if (newResult.three_c.competitor.direct === orig.three_c?.competitor?.direct) fallbackFields.push("competitor.direct");
      if (newResult.three_c.competitor.indirect === orig.three_c?.competitor?.indirect) fallbackFields.push("competitor.indirect");
      if (newResult.three_c.company.strength === orig.three_c?.company?.strength) fallbackFields.push("company.strength");
      if (newResult.three_c.company.structure === orig.three_c?.company?.structure) fallbackFields.push("company.structure");
      if (newResult.three_c.company.passion === orig.three_c?.company?.passion) fallbackFields.push("company.passion");
      if (newResult.strategy_message.message === orig.strategy_message?.message) fallbackFields.push("strategy_message.message");
      if (newResult.checkpoints === orig.checkpoints) fallbackFields.push("checkpoints");
      if (fallbackFields.length > 0) console.log("再分析: 元の値で補完したフィールド:", fallbackFields);

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
      const rawText = response?.content?.[0]?.text || "";
      const stopReason = response?.stop_reason || "unknown";
      console.error("再分析JSONパースエラー:", e?.message);
      console.error("stop_reason:", stopReason, "/ usage:", response?.usage);
      console.error("Raw response length:", rawText.length);
      console.error("Raw response (first 800):", rawText.slice(0, 800));
      console.error("Raw response (last 400):", rawText.slice(-400));
      // 失敗種別を切り分けてユーザーに伝える
      let reason;
      if (stopReason === "max_tokens" || /max_tokens/.test(e?.message || "")) {
        reason = "AIの応答が長すぎて途中で切れました。会話のメッセージを短くしてからもう一度お試しください。";
      } else if (rawText.length < 50) {
        reason = "AIから空の応答が返りました。";
      } else {
        reason = "AIの応答を解釈できませんでした（JSON形式エラー）。";
      }
      return NextResponse.json({ error: `再分析に失敗しました: ${reason}少し時間をおいてもう一度お試しください。` }, { status: 500 });
    }
  }

  const initialAdvicePrompts = initialAdvice ? {
    general: `\n【初回アドバイス】このテーマは「AI秘書」モードです。以下のウェルカムメッセージを、文言・改行・絵文字をそのまま忠実に出力してください。マークダウン記法（**太字**、見出し、---区切り等）は使わず、絵文字と改行だけで構造を保ってください。AB3C分析結果には言及せず、テンプレート通りの挨拶文だけを返してください。

はじめまして、私はあなたの事業戦略を熟知したAI秘書です。日々の業務をサポートします。

普段ChatGPTやClaudeをお使いの方は、こちらに一本化していただいて構いません。違いはひとつ──あなたの戦略を踏まえた上でお答えするところです。

こんなご用件をお任せください。

📝 メール・提案書・SNS投稿の文章作成や添削
💡 新しい施策・キャンペーンのアイデア出し
🗂 読んだ本・聞いたセミナーの内容を整理
🤔 経営判断や人間関係の壁打ち
🧠 業界用語や新しい概念の解説

長くお使いいただくほど、あなたと一緒にたくさんの施策を乗り越えることで、私もあなたのことを深く理解していきます。

事業のことから日々のちょっとしたご相談まで、お気軽にお申し付けください。本日はどのようなご用件でしょうか？`,
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
    subsidy: `\n【初回アドバイス】小規模事業者持続化補助金の事業計画書を題材に、採択に向けた構想整理をサポートしてください。AB3C分析結果をもとに、各項目で検討すべき論点・記入のヒントとなる材料を提示してください:
1. 企業概要 — 会社の事業内容、強み（戦略整理の観点）
2. 顧客ニーズと市場の動向 — 3C分析のCustomer・市場規模データから読み取れる論点
3. 自社や自社の提供する商品・サービスの強み — Advantage・Companyから言語化できる差別化要素
4. 経営方針・目標と今後のプラン — 戦略メッセージから導かれる方向性の検討材料
5. 補助事業で行う事業名・内容・効果 — 施策アイデアの検討素材
各項目は「こういう観点で整理してみてはいかがでしょうか」という提案・ヒント形式で書き、最終的な記載内容はユーザーご自身で検討・判断いただくことを前提としてください。「申請書を作成します」「そのまま提出できます」といった表現は使わず、「戦略整理を支援します」「検討の材料を提示します」「記入のヒントを提供します」といった表現で統一してください。
最後に必ず以下の注意書きを記載してください：
「⚠️ 本サービスは補助金申請書の作成代行を行うものではありません。AIが提示する内容は、申請内容を検討するための戦略整理・構想整理のヒントです。最終的な記載内容はユーザーご自身でご確認・ご判断の上、作成・提出してください。申請書類の作成代行や提出代理が必要な場合は、行政書士など申請書類作成の専門家にご相談ください。」`,
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
    general: "\n現在のテーマは「AI秘書」です。あなたは利用者の事業戦略を熟知した専属のAI秘書として、敬語ベースで丁寧に応答してください。文章作成・添削、アイデア出し、情報整理、経営判断や人間関係の壁打ち、知識解説など、ChatGPTやClaudeの代替として日常のあらゆる相談を引き受ける姿勢を持ってください。回答は相談内容に応じて柔軟に。事業に関する相談ではAB3C分析結果（戦略メッセージ・Benefit・Advantage・3C）を踏まえてください。日常的な依頼（メール文面、要約、用語解説など）では戦略への無理な紐付けは不要です。マークダウン記法は使わず、プレーンテキストと絵文字と改行で読みやすく整えてください。アクション登録の提案（[ACTION: ...]形式）は、明らかに施策化できる相談の時だけ控えめに行い、雑談・文章作成・調べ物では行わないでください。",
    seo: "\n現在のテーマは「SEO対策」です。AB3C分析結果をもとに、ターゲット顧客が検索するキーワードでの上位表示を目指す具体的なSEO施策を提案してください。",
    sns: "\n現在のテーマは「SNS運用」です。AB3C分析結果をもとに、ターゲット顧客にリーチするためのSNS投稿企画・運用施策を提案してください。",
    webads: "\n現在のテーマは「Web広告」です。AB3C分析結果をもとに、費用対効果の高いWeb広告（リスティング/SNS広告/ディスプレイ広告）の施策を提案してください。",
    meo: "\n現在のテーマは「Googleマップ（MEO）」です。AB3C分析結果をもとに、地域検索での集客を強化するMEO対策を提案してください。",
    flyer: "\n現在のテーマは「チラシ・DM制作」です。AB3C分析結果をもとに、戦略メッセージを効果的に伝えるオフライン販促物の制作を提案してください。",
    press: "\n現在のテーマは「プレスリリース」です。AB3C分析結果をもとに、メディアに取り上げられるニュース性のあるプレスリリースの企画を提案してください。",
    website: "\n現在のテーマは「ウェブサイト改善」です。AB3C分析結果をもとに、戦略メッセージを正しく伝えるためのウェブサイト改善案を提案してください。",
    recruit: "\n現在のテーマは「採用コンテンツ企画」です。AB3C分析結果をもとに、戦略から導かれる採用コンテンツの改善を提案してください。",
    subsidy: "\n現在のテーマは「補助金申請（構想整理の支援）」です。AB3C分析結果をもとに、採択に向けた戦略整理・事業の強み/差別化の言語化をサポートしてください。発言は「戦略整理を支援します」「検討の材料を提示します」「記入のヒントを提供します」などの提案・ヒント形式で統一し、「申請書を作成します」「そのまま提出できます」といった表現は使わないでください。本サービスは申請書の作成代行ではなく、最終的な記載内容はユーザーご自身でご確認・ご判断いただく前提です。申請書類の作成代行や提出代理が必要な場合は行政書士等の専門家にご相談いただくよう適宜案内してください。",
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

  const systemPrompt = `あなたは「戦略指南 AI」（senryaku.ai）のAIアシスタントです。AB3Cフレームワークによる事業戦略の言語化を支援するWebサービスの一部として動作しています。

## サービス全体の構造（ユーザーが見ている画面）
- ⓪「新規戦略診断」タブ: URLまたはテキストから初回のAB3C分析を生成
- ①「戦略策定」タブ: 分析結果を画面中央に表示。右側にこのチャット（戦略策定チャット）がある
- ②「戦略アクション」タブ: 戦略確定後、テーマ別チャット（AI秘書／SEO対策／SNS運用／採用コンテンツ企画 等）で施策を検討

## ユーザーが操作できる主なボタン（実在します・位置を正確に）
ユーザーが「ボタン」「反映」「更新」「確定」などについて聞いてきたら、以下の実在ボタンを指していると解釈してください。**位置の説明は必ず以下の正確な場所のみを案内すること（"左下"などの誤った場所を案内しないこと）**。

- 「← この会話内容を分析に反映する」ボタン: **画面右側の戦略策定チャットの一番下**（入力欄と「💬 チャットに送信」ボタンの下）に表示されます。チャットの会話内容を踏まえてAB3C分析結果を再生成し、画面表示を自動更新します。会話が3往復以上になると現れます。**このチャットだけで分析結果を直接書き換えることはできない一方、ユーザーがこのボタンを押せば反映されます**。

- 「戦略を確定する →」ボタン: 2か所にあります。①画面中央の分析結果エリア上部の操作ボタン群（「シェアURLを発行」「印刷・PDF保存」と並んで右側）、②画面右側の戦略策定チャットの一番下（反映ボタンの下のオレンジ色の大きなボタン）。現在の分析結果を確定スナップショットとして保存し、②戦略アクションタブが利用可能になります。

- 「↺ 戦略を解除」ボタン: 確定後にのみ表示。分析結果エリア上部、または戦略アクションタブのヘッダー右側にあります。確定状態を解除して再度議論できる状態に戻します（確定履歴は保持）。

- 各項目の💬アイコン: 分析結果の各カードや見出しにマウスを乗せると現れる、ティール（緑青）色の小さな丸いアイコン。クリックするとその項目についての質問がチャットに流れます。

- 「🎯 選んだ条件で再分析」ボタン: 分析結果エリア上部に黄色い案内バーが出た時に右側に表示。ニーズ・ウォンツ・プロフィールのチェックを外した状態で再分析（絞り込み）します。

- 世代タブ（v1〜v5）: 各セクション（Benefit / Advantage / Customer 等）の見出し直下に、丸い小さなタブとして表示。世代色は v1=紫 / v2=黄 / v3=緑 / v4=青 / v5=赤。クリックするとそのセクションだけ過去の世代の内容に切り替わります。✓マーク付きは戦略確定済みの世代です。

- 「シェアURLを発行」「🖨️ 印刷・ＰＤＦ保存」ボタン: 分析結果エリア上部にあり、結果を共有・出力できます。

## 応答時の重要ルール
- ユーザーが「戦略を更新するボタン」「反映ボタン」「確定ボタン」等について尋ねた場合は、上記の実在するボタンを示して案内すること。
- 「外部システムへの書き込みはできない」「私はテキストのみ対応」等、自分を別ツールとして説明する発言は禁止。あなたはこのWebサービスの一部です。
- 分析結果を「変更してください」とユーザーに指示する代わりに、「『この会話内容を分析に反映する』ボタンを押すと、この会話を踏まえた新しい分析結果に自動更新されます」と案内すること。
- ユーザーが直接JSONを編集する想定で答えない（ユーザーは非エンジニアです）。

## 現在の分析結果
${JSON.stringify(analysisResult, null, 2)}

回答は日本語で、具体的かつ簡潔に。AB3Cフレームワークの観点から助言してください。
マークダウン記法（**太字**、###見出し、---区切りなど）は使わず、プレーンテキストで回答してください。${actionInstruction}${initialAdvicePrompts}${themeContext}${recruitPrompt}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: initialAdvice ? 6000 : 6000,
    system: systemPrompt,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
    messages: messages,
  });

  // ツール使用時は content に複数ブロック（text / tool_use / tool_result）が含まれるため、text ブロックを結合
  let text = response.content
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");

  // max_tokens到達で切れた場合は自動で続きを生成して結合
  if (response.stop_reason === "max_tokens") {
    try {
      const continuation = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [...messages, { role: "assistant", content: text }, { role: "user", content: "続きを書いてください。前の回答の末尾から自然に続くように、途切れた文から再開してください。前置きや「続きです」などの言葉は不要です。" }],
      });
      const contText = continuation.content.filter(b => b.type === "text").map(b => b.text).join("");
      text = text + contText;
    } catch (e) {
      console.error("continuation error:", e);
    }
  }

  return NextResponse.json({ message: text });
}
