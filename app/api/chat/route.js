import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Vercel Functions のタイムアウト延長（再分析や初回アドバイス生成は時間がかかるため）
export const maxDuration = 300;

// 「商品LP」テーマの7つの観点（2026-06-12 確定。LPの物語順＝AB3Cの物語順）
// 楽天版v1.1では観点単位でこの定義を呼び出す構想のため、観点ごとに独立した記述として保つ。
// コード構造をリストの中身に依存させない（観点の追加・差し替えはこの配列の編集だけで済むこと）。
const LP_SEVEN_VIEWPOINTS = [
  { name: "① ターゲットの悩み", ab3c: "顧客（C）× ニーズ", desc: "「こんな方に、こんなお悩みありませんか」と絞った顧客の課題への共感から入る" },
  { name: "② ベネフィット", ab3c: "B", desc: "開いた瞬間に「何の商品で、何が得られるか」が分かる（最初の3秒が勝負）" },
  { name: "③ 他社との違い", ab3c: "A ＋ 自社・競合（2つのC）", desc: "差別的優位点。比較表があると構図が一目で伝わる" },
  { name: "④ 証拠（信頼コンテンツ）", ab3c: "Aの根拠 ＋ 自社（C）", desc: "(a)レビューの量と質＝「多くの人が選んでいる」安心 (b)ガイドコンテンツ＝売り手が専門家として「これはこういう意味で良い」と意味づけ・おすすめする説明 (c)第三者の証明＝認証・受賞・メディア掲載 (d)開発ストーリー＝物語による信頼。レビューが少なければ(b)(c)(d)で補う" },
  { name: "⑤ 使用シーン", ab3c: "顧客（C）のシーン × Bの情緒", desc: "絞ったターゲットの場面を具体的に描く。論理でなく情緒で「そのシーンなら、こう感じるな」を想起させる" },
  { name: "⑥ 不安解消", ab3c: "FAQ・保証", desc: "FAQ・保証・基本情報（スペック・納期・送料等）がページ内で分かるか" },
  { name: "⑦ 今買う理由", ab3c: "最終プッシュ", desc: "やりすぎると嫌味になるが、EC（特に楽天）では定番の作法なので適度に入れる" },
];
const lpViewpointsText = LP_SEVEN_VIEWPOINTS.map(v => `${v.name}〔AB3C対応: ${v.ab3c}〕— ${v.desc}`).join("\n");

// Web系（Webリニューアル/Web新規）でClaude Design用のデザインブリーフを生成する際の共通フォーマット＆ブランドルール。
// ビジュアルは作らず、デザインAIにそのまま貼れる「プロンプト（ブリーフ）」を出力するのが目的。
const WEB_BRIEF_FORMAT = `
【ブリーフのフォーマット】（プレーンテキスト。ブリーフ本体は「──────── ここからコピー ────────」と「──────── ここまで ────────」の区切り線で挟み、コピーしやすくする）
■ 依頼概要 … 何のサイトか／主なターゲット（3Cのcustomerから）／BtoB・BtoC両方あるなら導線を分ける旨
■ 戦略の核 … 中心メッセージ（戦略メッセージをそのまま）／競合と違う土俵で戦う差別化の軸（Benefit×Advantageから。「スペック競争を降りて○○を売る」のような言い切り）
■ 必要セクション … 戦略から導くページ構成を箇条書き（構成・レイアウト・装飾の具体はデザインAIに任せる）
■ 配色・トーン … 下記ブランドルールを必ず明記。業種・ターゲットに合う方向性を指定し、配色は「方向性の違う複数案で提案して」とデザインAIに促す
■ テキスト・タイポ … ナビ・見出しのラベルは短く、改行が出ないように。本文は読みやすい大きさ。日本語サイトは見出し明朝・本文ゴシックを基本
■ コピー素材 … 中心メッセージ／ポジショニングの対比（競合 vs 自社）／価値の要点／お客様の声の骨子 を確定戦略から起こして列挙（経営者本人の事実が未確認の部分は「たたき台」と明記）
■ 制作の進め方（デザインAIへの指示。先に確定させ、確認の質問票で止めさせない） … 次の既定値をブリーフに明記する：(1)まずトップページを完成度高く1枚仕上げる（サブページは構成のみ示し後追いで展開）(2)配色は複数案を1つのプロトタイプ上でワンタップ切替にし、まず1案目で組む (3)PC・モバイル両対応（本文モバイル16px以上、主要CTAは指で押しやすく・固定フッターCTA可）(4)写真は後で実写に差し替える前提のプレースホルダー、または上質な抽象ビジュアルで進める (5)実際に動くプロトタイプにする（タブ・切替・スクロール演出等）(6)不明点があっても質問票で止めず、最適なデフォルトで判断して一気に完成形まで作る。細部の調整は出来上がりを見てから後追いで行う

【ブランドルール（ブリーフに必ず"厳守事項"として書き込む）】
- 配色は、決まっていなければまずロゴカラーから検討する（戦略・ブランドイメージに合う場合のみ採用）。ベージュの多用は避ける（没個性でAI生成っぽく見える）
- 濃い色の面の上の文字は白。明るい淡色の面の上の文字は黒。彩度の高い2色（例：濃い青と濃い緑）を前景／背景として直接重ねない（見づらい）
- 隣り合うセクションは明暗差で分ける（白い余白で逃げない）
- 業種に合った信頼感をベースに、ターゲットの感性をアクセントで少しだけ効かせる。漫画的・素人っぽいイラストは避け、線画や写真前提の上質な構図にする
- 会社名・固有名詞・実績数値などの事実は分析結果から正確に引く。確証のない社名や実績を創作しない。確定でない情報は「要確認」と明記する（誤った断定をしない）
- （AB3Cフレームワーク自体を図解する場合のみ）公式カラーで色分けする：顧客・自社・競合＝黒(#1a1a14)、ベネフィット＝赤(#FF0000)、アドバンテージ＝青(#1a6fd4)。サイトのブランド配色では塗らない`;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL);

  // プロ会員チェック・チケットチェック
  let isPro = false, ticketRows = [], trialRows = [], hasTicket = false, hasTrial = false;
  try {
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
    isPro = proRows.length > 0;

    // 有料チケットチェック
    ticketRows = await sql`
      SELECT id, remaining_chats FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
      ORDER BY purchased_at ASC
      LIMIT 1
    `;
    hasTicket = ticketRows.length > 0;

    // トライアルチケットチェック（24時間フリーパス: expires_at > NOW() のみ有効）
    trialRows = await sql`
      SELECT id, remaining_chats FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY purchased_at ASC
      LIMIT 1
    `;
    hasTrial = trialRows.length > 0;
  } catch (dbErr) {
    console.error("DB error (chat auth):", dbErr?.message);
    return NextResponse.json({ error: "データベースエラーが発生しました。しばらくお待ちください。" }, { status: 500 });
  }

  let reqBody;
  try {
    reqBody = await req.json();
  } catch (parseErr) {
    return NextResponse.json({ error: "リクエストの解析に失敗しました。" }, { status: 400 });
  }
  const { messages, analysisResult, improveResult, reanalyze, recruitMode, threadTheme, initialAdvice, actionSummary, actionTitle, siteId } = reqBody;

  // initialAdvice（テーマ初回自動生成）と actionSummary はチケット消費しない
  if (!initialAdvice && !actionSummary) {
    if (!isPro && !hasTicket && !hasTrial) {
      return NextResponse.json({ error: "チャット機能を利用するにはチケットが必要です" }, { status: 403 });
    }
    // チケット消費（プロ会員は消費しない）
    if (!isPro) {
      try {
        if (hasTicket) {
          await sql`UPDATE tickets SET remaining_chats = remaining_chats - 1 WHERE id = ${ticketRows[0].id}`;
        } else if (hasTrial) {
          await sql`UPDATE tickets SET remaining_chats = remaining_chats - 1 WHERE id = ${trialRows[0].id}`;
        }
      } catch (dbUpdateErr) {
        console.error("DB error (ticket update):", dbUpdateErr?.message);
      }
    }
  }

  const getTextContent = (content) => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) return content.filter(b => b.type === "text").map(b => b.text).join(" ");
    return "";
  };

  // アクションまとめ生成（会話履歴から構造化された結論を生成）
  if (actionSummary) {
    const conversationText = (messages || [])
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => `${m.role === "user" ? "【ユーザー】" : "【AI】"}${getTextContent(m.content)}`)
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

    try {
      const sumRes = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: summaryPrompt }],
      });
      const sumText = sumRes.content.filter(b => b.type === "text").map(b => b.text).join("");
      return NextResponse.json({ summary: sumText });
    } catch (apiErr) {
      console.error("actionSummary API error:", apiErr?.message);
      return NextResponse.json({ error: "アクションのまとめ生成に失敗しました。" }, { status: 500 });
    }
  }

  if (reanalyze) {
    // analysisResult が空だと Claude が JSON を返せないので早めに弾く
    if (!analysisResult || typeof analysisResult !== "object") {
      return NextResponse.json({ error: "再分析の元になる分析結果が取得できませんでした。画面をリロードしてからもう一度お試しください。" }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "再分析するには、まずチャットでいくつかご相談ください。" }, { status: 400 });
    }
    // 会話全文を渡す（インタビュー議事録のような全体に関わる長文も取りこぼさない）。
    // 入力過大を防ぐため合計文字数に上限を設け、超える場合は新しい発言を優先して古い方から落とす。
    const MAX_CONV_CHARS = 24000;
    const convPieces = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => `【${m.role === 'user' ? 'ユーザー' : 'AI'}】${m.content}`);
    let conversationSummary = '';
    for (let i = convPieces.length - 1; i >= 0; i--) {
      if (conversationSummary.length + convPieces[i].length + 1 > MAX_CONV_CHARS) break;
      conversationSummary = convPieces[i] + '\n' + conversationSummary;
    }
    conversationSummary = conversationSummary.trim();

    const userPrompt = `あなたはAB3C分析の専門家です。以下の元の分析結果とユーザーとの会話内容をもとに、改善されたAB3C分析結果を return_analysis ツールで返してください。

## 元の分析結果
${JSON.stringify(analysisResult)}

## ユーザーとの会話（全文）
${conversationSummary}

このサービスは、ウェブサイトの記載だけでは拾いきれない実態を、運営者との対話で補正するためのものです。ウェブサイトには古い情報や、書き方のニュアンスからAIが誤解して受け取った点が含まれることがあります。会話の内容を一次情報として優先し、分析を実態に合わせて更新してください。

反映のしかた（最重要）:
- ユーザーが会話で述べたことは、benefit / advantage / three_c / strategy_message / checkpoints の【どのセクションでも】反映してよい。古い情報の訂正、AIの誤読の修正、価値・ターゲット・強み・競合などの追加 / 削除 / 統合 / 言い換えを含む。
- ユーザーが明示的に「不要」「外す」「切り捨てる」「違う」等と否定・削除した要素は、benefit や three_c.customer などから【必ず外す】こと（元の値をコピーで戻さない）。
- 会話にインタビューや議事録のような、戦略全体に関わる包括的な情報が含まれる場合は、上記5セクションを【一つずつ点検】し、会話と矛盾する箇所・古くなった箇所を【すべて洗い出して反映】すること。名指しされた点だけでなく、波及して見直すべき箇所も能動的に更新する。
- 判断基準は「会話の内容との整合性」。会話に整合させるために必要な変更はすべて行い、会話で触れられておらず、かつ会話の内容と矛盾もしない項目だけは、データ欠落防止のため元の値を保持する（その項目を省略・空配列・空文字列にしない）。
- checkpoints は元の5項目のラベル（label）は維持しつつ、会話を踏まえて status / comment を再評価してよい。

絶対に守ること:
- 必ず return_analysis ツールを呼び出して結果を返すこと
- 元の分析結果と同じトップレベル構造（benefit / advantage / three_c / strategy_message / checkpoints）を保持し、全フィールドを必ず含めること（中身は上記「反映のしかた」に従って更新・保持する）

## 強みの根拠評価（strength_evaluations）— チャット内容を必ず反映

three_c.company.strength と同じ並び順で strength_evaluations を必ず出力してください。
元の分析結果の company_core.all_strengths_evaluations を参考にしつつ、**チャットで明らかになった事実があれば必ず評価を更新**してください。

更新の判断基準:
- ユーザーが具体的な経歴・経験・実績・事実をチャットで提示し、それが強みの根拠として説得力がある
  → tier を verified（客観的根拠あり）または first_party_fact（本人の独自事実）に**引き上げ**
  → note にユーザーが提示した事実を反映
  → **needs_chat_confirmation を false に**（赤い吹き出しシグナルが消える）
- ユーザーが触れていない強み、または提示された情報が根拠として弱い
  → 元の評価をそのまま使う

5段階の tier:
- verified: 第三者調査、公的統計、受賞歴、業界認定、書籍出版、特許、明確な実績数値
- first_party_fact: 創業時の事実、先駆者性、独自経験など本人にとって確かな事実
- plausible_industry: 業界水準内の主張
- subjective_unsupported: 比較困難な主観的主張
- needs_owner_confirmation: 強み記載はあるが根拠未確認

## 市場規模の十分性（market.adequacy）— チャット内容を必ず反映

three_c.customer.market.adequacy を以下のルールで出力してください:

- ユーザーがチャットで現在の事業規模・目標事業規模を提示した場合:
  - SOM がユーザーの目標規模に対して**3倍以上**なら "sufficient"（赤いシグナルが消える）
  - それ以下なら "needs_confirmation"
- ユーザーが規模に触れていない場合:
  - SOM が ¥10億円以上なら "sufficient"
  - 未満なら "needs_confirmation"
- adequacy_note に判定の理由を1〜2行で（ユーザー提示の規模を引用する場合はそれを含める）

これらの更新により、チャットで疑問が解消された項目から赤い吹き出しシグナルが消える設計です。`;

    // AB3C 分析結果のスキーマ定義（Tool Use で構造化出力を強制）
    const ab3cSchema = {
      type: "object",
      properties: {
        benefit: {
          type: "object",
          properties: {
            core: { type: "string", description: "ベネフィットの核心" },
            needs: { type: "array", items: { type: "string" }, description: "ニーズ（欠乏感・曖昧な欲求）" },
            wants: { type: "array", items: { type: "string" }, description: "ウォンツ（具体的欲求）" },
          },
          required: ["core", "needs", "wants"],
        },
        advantage: {
          type: "object",
          properties: {
            what: { type: "string", description: "アドバンテージの内容" },
            why_good: { type: "string", description: "なぜ好ましいのか" },
            why_hard_to_copy: { type: "string", description: "なぜ真似されにくいか" },
          },
          required: ["what", "why_good", "why_hard_to_copy"],
        },
        three_c: {
          type: "object",
          properties: {
            customer: {
              type: "object",
              properties: {
                target: { type: "string" },
                profile: { type: "array", items: { type: "string" } },
                stage: { type: "string" },
                cutoff: { type: "string" },
                market: {
                  type: "object",
                  properties: {
                    sam: { type: "string" },
                    som: { type: "string" },
                    growth: { type: "string" },
                    basis: { type: "string" },
                    // 市場規模の十分性評価。ユーザーがチャットで目標事業規模を提示した場合、
                    // それを踏まえて再評価する（"sufficient"なら赤い吹き出しシグナル消える）。
                    adequacy: { type: "string", enum: ["sufficient", "needs_confirmation"] },
                    adequacy_note: { type: "string", description: "判定の理由を1〜2行で" },
                  },
                },
              },
              required: ["target", "profile", "stage", "cutoff"],
            },
            competitor: {
              type: "object",
              properties: {
                direct: { type: "array", items: { type: "string" } },
                indirect: { type: "array", items: { type: "string" } },
              },
              required: ["direct", "indirect"],
            },
            company: {
              type: "object",
              properties: {
                strength: { type: "array", items: { type: "string" } },
                // strength_evaluations: strength と同じ並び順で評価を持つ。
                // チャットでユーザーが根拠を提示した強みは tier を上方修正し、
                // needs_chat_confirmation を false に下げる（赤い吹き出しシグナルが消える）。
                strength_evaluations: {
                  type: "array",
                  description: "strength と同じ並び順で根拠評価を出力。チャットで根拠が明らかになった強みは tier を verified/first_party_fact に、needs_chat_confirmation を false に更新。",
                  items: {
                    type: "object",
                    properties: {
                      tier: {
                        type: "string",
                        enum: ["verified", "first_party_fact", "plausible_industry", "subjective_unsupported", "needs_owner_confirmation"],
                      },
                      note: { type: "string", description: "判定の根拠を1〜2行で（チャットで明らかになった事実があれば反映）" },
                      needs_chat_confirmation: { type: "boolean" },
                    },
                    required: ["tier", "note", "needs_chat_confirmation"],
                  },
                },
                structure: { type: "string" },
                passion: { type: "string" },
              },
              required: ["strength", "structure", "passion"],
            },
          },
          required: ["customer", "competitor", "company"],
        },
        strategy_message: {
          type: "object",
          properties: {
            message: { type: "string" },
            benefit_part: { type: "string" },
            advantage_part: { type: "string" },
          },
          required: ["message", "benefit_part", "advantage_part"],
        },
        checkpoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              status: { type: "string", enum: ["ok", "warn", "ng"] },
              comment: { type: "string" },
            },
            required: ["label", "status", "comment"],
          },
        },
      },
      required: ["benefit", "advantage", "three_c", "strategy_message", "checkpoints"],
    };

    let response;
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        tools: [{
          name: "return_analysis",
          description: "改善されたAB3C分析結果をクライアントに返します。元の構造を保持し、全フィールドを必ず含めてください。",
          input_schema: ab3cSchema,
        }],
        tool_choice: { type: "tool", name: "return_analysis" },
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (apiErr) {
      console.error("Anthropic API 呼び出し失敗:", apiErr?.message, apiErr?.status, apiErr?.error);
      const status = apiErr?.status || 500;
      const detail = apiErr?.error?.error?.message || apiErr?.message || "AI API への接続に失敗しました";
      return NextResponse.json({ error: `再分析に失敗しました: ${detail}（API ${status}）` }, { status: 502 });
    }

    try {
      const stopReason = response.stop_reason; // "end_turn" | "tool_use" | "max_tokens" | ...

      // Tool Use レスポンスから構造化データを抽出
      const toolUseBlock = (response.content || []).find(b => b.type === "tool_use" && b.name === "return_analysis");
      if (!toolUseBlock || !toolUseBlock.input) {
        throw new Error("Claude did not call return_analysis tool. stop_reason=" + stopReason);
      }
      let parsedResult = toolUseBlock.input;

      // max_tokens で切れた場合は input が部分的になっている可能性
      if (stopReason === "max_tokens") {
        console.warn("max_tokens reached during tool_use; input may be partial");
      }

      // === 欠落・空フィールドを元の値から補完（カスケード式損失対策） ===
      // 過去の再分析で一度フィールドが空になると、それ以降のorigも空のままになり復元不能。
      // → DBから v1（最古・最も完全な状態）を取得し、最終フォールバックとして使う。
      // 優先順位: parsedResult (np) > analysisResult (現在) > v1 (DBの初回) > 空
      const orig = analysisResult || {};
      const np = parsedResult || {};
      let v1 = {};
      if (siteId) {
        try {
          const v1Rows = await sql`
            SELECT analysis_versions FROM sites
            WHERE id = ${siteId} AND user_email = ${session.user.email}
          `;
          const versions = v1Rows[0]?.analysis_versions;
          if (Array.isArray(versions) && versions.length > 0) {
            // 配列は新しい順なので末尾が最古 = v1
            v1 = versions[versions.length - 1]?.result || {};
          }
        } catch (e) {
          console.error("v1 取得失敗:", e?.message);
        }
      }
      // 配列: 中身があれば new、なければ orig、最終的に v1
      const pickArr = (newArr, origArr, v1Arr) => {
        if (Array.isArray(newArr) && newArr.length > 0) return newArr;
        if (Array.isArray(origArr) && origArr.length > 0) return origArr;
        if (Array.isArray(v1Arr) && v1Arr.length > 0) return v1Arr;
        return [];
      };
      // 文字列: trim して中身があれば new、なければ orig、最終的に v1
      const pickStr = (newStr, origStr, v1Str) => {
        if (typeof newStr === "string" && newStr.trim() !== "") return newStr;
        if (typeof origStr === "string" && origStr.trim() !== "") return origStr;
        if (typeof v1Str === "string" && v1Str.trim() !== "") return v1Str;
        return "";
      };
      const newResult = {
        // 元の分析結果のトップレベル全フィールドを保持してから上書きする。
        // これがないと combinations / recommended_combination_id / confirmed_combination_id /
        // company_core 等の Tool スキーマに含まれないフィールドが失われ、
        // 戦略パターン選択ナビが消える事象が発生する。
        ...orig,
        benefit: {
          core: pickStr(np.benefit?.core, orig.benefit?.core, v1.benefit?.core),
          needs: pickArr(np.benefit?.needs, orig.benefit?.needs, v1.benefit?.needs),
          wants: pickArr(np.benefit?.wants, orig.benefit?.wants, v1.benefit?.wants),
        },
        advantage: {
          what: pickStr(np.advantage?.what, orig.advantage?.what, v1.advantage?.what),
          why_good: pickStr(np.advantage?.why_good, orig.advantage?.why_good, v1.advantage?.why_good),
          why_hard_to_copy: pickStr(np.advantage?.why_hard_to_copy, orig.advantage?.why_hard_to_copy, v1.advantage?.why_hard_to_copy),
        },
        three_c: {
          customer: {
            target: pickStr(np.three_c?.customer?.target, orig.three_c?.customer?.target, v1.three_c?.customer?.target),
            profile: pickArr(np.three_c?.customer?.profile, orig.three_c?.customer?.profile, v1.three_c?.customer?.profile),
            stage: pickStr(np.three_c?.customer?.stage, orig.three_c?.customer?.stage, v1.three_c?.customer?.stage),
            cutoff: pickStr(np.three_c?.customer?.cutoff, orig.three_c?.customer?.cutoff, v1.three_c?.customer?.cutoff),
            market: {
              sam: pickStr(np.three_c?.customer?.market?.sam, orig.three_c?.customer?.market?.sam, v1.three_c?.customer?.market?.sam),
              som: pickStr(np.three_c?.customer?.market?.som, orig.three_c?.customer?.market?.som, v1.three_c?.customer?.market?.som),
              growth: pickStr(np.three_c?.customer?.market?.growth, orig.three_c?.customer?.market?.growth, v1.three_c?.customer?.market?.growth),
              basis: pickStr(np.three_c?.customer?.market?.basis, orig.three_c?.customer?.market?.basis, v1.three_c?.customer?.market?.basis),
              // チャットでユーザーが規模を提示した場合に AI が再評価する。元の値があればそれを優先。
              adequacy: pickStr(np.three_c?.customer?.market?.adequacy, orig.three_c?.customer?.market?.adequacy, v1.three_c?.customer?.market?.adequacy),
              adequacy_note: pickStr(np.three_c?.customer?.market?.adequacy_note, orig.three_c?.customer?.market?.adequacy_note, v1.three_c?.customer?.market?.adequacy_note),
            },
          },
          competitor: {
            direct: pickArr(np.three_c?.competitor?.direct, orig.three_c?.competitor?.direct, v1.three_c?.competitor?.direct),
            indirect: pickArr(np.three_c?.competitor?.indirect, orig.three_c?.competitor?.indirect, v1.three_c?.competitor?.indirect),
          },
          company: {
            strength: pickArr(np.three_c?.company?.strength, orig.three_c?.company?.strength, v1.three_c?.company?.strength),
            // チャットで根拠が明らかになった強みは tier 上方修正 / needs_chat_confirmation: false に更新済み。
            // AI が新しい評価を返したらそれを優先、なければ元の評価をそのまま継承する。
            strength_evaluations: pickArr(np.three_c?.company?.strength_evaluations, orig.three_c?.company?.strength_evaluations, v1.three_c?.company?.strength_evaluations),
            structure: pickStr(np.three_c?.company?.structure, orig.three_c?.company?.structure, v1.three_c?.company?.structure),
            passion: pickStr(np.three_c?.company?.passion, orig.three_c?.company?.passion, v1.three_c?.company?.passion),
          },
        },
        strategy_message: {
          message: pickStr(np.strategy_message?.message, orig.strategy_message?.message, v1.strategy_message?.message),
          benefit_part: pickStr(np.strategy_message?.benefit_part, orig.strategy_message?.benefit_part, v1.strategy_message?.benefit_part),
          advantage_part: pickStr(np.strategy_message?.advantage_part, orig.strategy_message?.advantage_part, v1.strategy_message?.advantage_part),
        },
        checkpoints: (Array.isArray(np.checkpoints) && np.checkpoints.length > 0)
          ? np.checkpoints
          : ((Array.isArray(orig.checkpoints) && orig.checkpoints.length > 0)
              ? orig.checkpoints
              : (Array.isArray(v1.checkpoints) ? v1.checkpoints : [])),
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

      let chatSummary = "";
      try {
        const summaryResponse = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 100,
          messages: [{
            role: "user",
            content: `以下の会話内容を15文字以内で一言に要約してください。要約のみ返してください。\n\n${conversationSummary}`
          }],
        });
        chatSummary = summaryResponse.content[0].text.trim();
      } catch (sumErr) {
        // 要約失敗は致命的ではないので空文字列で続行
        console.warn("chatSummary 生成失敗:", sumErr?.message);
      }
      return NextResponse.json({ reanalyzed: true, result: newResult, chatSummary });
    } catch (e) {
      const stopReason = response?.stop_reason || "unknown";
      const blocks = response?.content || [];
      const blockSummary = blocks.map(b => `${b.type}${b.type === "text" ? `(${(b.text || "").length}chars)` : b.type === "tool_use" ? `(${b.name})` : ""}`).join(",");
      console.error("再分析エラー:", e?.message);
      console.error("stop_reason:", stopReason, "/ usage:", response?.usage, "/ blocks:", blockSummary);
      // テキストブロックがある場合は冒頭を出してデバッグ用に
      const textBlock = blocks.find(b => b.type === "text");
      if (textBlock) console.error("text block (first 500):", (textBlock.text || "").slice(0, 500));
      let reason;
      if (stopReason === "max_tokens" || /max_tokens/.test(e?.message || "")) {
        reason = "AIの応答が長すぎて途中で切れました。会話のメッセージを短くしてからもう一度お試しください。";
      } else if (/did not call/.test(e?.message || "")) {
        reason = "AIがツール経由の応答を返しませんでした。";
      } else {
        reason = "AIの応答を解釈できませんでした。";
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
    lp: `\n【初回アドバイス】「商品LP」テーマの開始です。LPの7つの観点（${LP_SEVEN_VIEWPOINTS.map(v => v.name).join("・")}）を簡潔に紹介したうえで、対象商品のLP（商品ページ）がすでにあるかを確認してください。あればURLを貼ってもらい、なければ①から一緒に組み立てる旨を伝えてください。この時点で構成案や質問の列挙はしないでください。`,
    lp_kikaku: `\n【初回アドバイス】「LP企画」テーマの開始です。確定済みのAB3C戦略（戦略メッセージ・ベネフィット・アドバンテージ・3C）をもとに、LPの7つの観点を物語順に沿ったコンテンツ案として今すぐ生成してください。

7つの観点とAB3C対応:
${lpViewpointsText}

出力ルール（厳守）:
- 冒頭に「AB3C戦略からLPを設計します」という一言を入れ、すぐに①から始めてください。進め方の解説・質問の列挙は不要です。
- 各観点について、以下の3点をセットで提示してください:
  1. 【構成案】この観点で伝えるべき内容（確定戦略から導いた設計図・40〜80字）
  2. 【文例たたき台】「」で囲んだ文例を1〜2文（戦略から自動生成した仮説。本人の事実が入っていないことを前提に「たたき台です」と明記）
  3. 【確認したいこと】経営者本人にしか分からない事実を引き出す質問を1問だけ
- ⑥不安解消・⑦今買う理由は、分析結果から業種・業態（EC/サービス業/BtoBなど）を判断し、使う言葉を適切に言い換えてください。例: EC→「納期・送料・返品保証」、サービス業→「対応エリア・料金体系・相談の流れ」、BtoB→「導入後サポート・解約条件・事例」
- あなたの役割はガイド型インタビューです。本人の事実が入っていない一般論の文章を量産しないでください。`,
    web_renewal: `\n【初回アドバイス】「Webリニューアル」テーマの開始です。確定済みのAB3C戦略（システムの「現在の分析結果」にある戦略メッセージ・ベネフィット・アドバンテージ・3C）と、もしあれば「ウェブサイト改善レポート」をもとに、既存ウェブサイトのリニューアル案を今すぐ作成してください。ゴールは、デザインAI（Claude Design）にそのまま貼り付けられる「デザインブリーフ（プロンプト）」を出力することです。ビジュアルそのものは作らず、ブリーフだけを作ります。

進め方（重要）:
- 冒頭に「確定した戦略から、ウェブサイトのリニューアル案（Claude Designに渡すブリーフ）を作成します」と一言だけ添え、すぐにブリーフを出力してください。先にヒアリングや質問はしないでください（"ぱっと出る"ことが大事です）。
- これは「既存サイトを戦略軸で整理し直す」リニューアルです。新しいコンテンツを発明するのではなく、確定戦略と改善レポートに沿って、既存の要素を再構成する方針で書いてください。
${WEB_BRIEF_FORMAT}

【ブリーフの後に必ず添えること】（区切り線の外で2点だけ）
1. 「まずこの案で一度リニューアルし、その後さらに戦略に沿ってコンテンツを足すと、もっと強くなります」と伝える
2. 改善レポートや戦略から、追加すると効果的なコンテンツを2〜3個だけ具体例として挙げ、「お持ちの素材や実績があれば教えてください。ブリーフに反映します」と促す`,
    web_new: `\n【初回アドバイス】「Web新規」テーマの開始です。確定済みのAB3C戦略をもとに、新しく立ち上げるウェブサイトの構築案を今すぐ作成してください。ゴールはWebリニューアルと同じく、デザインAI（Claude Design）にそのまま貼れる「デザインブリーフ（プロンプト）」の出力です。ビジュアルそのものは作らず、ブリーフだけを作ります。

進め方（重要）:
- 冒頭に「確定した戦略から、新規サイトの構築案（Claude Designに渡すブリーフ）を作成します」と一言だけ添え、すぐにブリーフを出力してください。先にヒアリングはしないでください。
- 既存サイトがない前提なので、戦略から導いた「一般的だが効果的な標準構成」を新規に書き起こしてください（リニューアルが既存の"整理し直し"であるのに対し、こちらは戦略からの"新規書き起こし"です）。
${WEB_BRIEF_FORMAT}

【ブリーフの後に必ず添えること】（区切り線の外で）
「この後、戦略に沿って具体的なコンテンツ（実績・お客様の声・料金など）を足すと、さらに強くなります。お持ちの素材があれば教えてください。ブリーフに反映します」と促す`,
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
    lp: `\n現在のテーマは「商品LP」です。AB3C分析結果をもとに、商品LP（ECの商品ページ・ランディングページ）のコンテンツを「7つの観点」の物語順で組み立てる支援をしてください。7つの観点:
${lpViewpointsText}

進め方（重要）:
- 会話の冒頭で、対象商品のLPがすでにあるか確認済みです。ユーザーがURLを送ってきたら、ウェブ取得・検索ツールでそのページを読み、7つの観点それぞれを「整っている／まだ弱い／見当たらない」で診断して一覧で提示してください。診断コメントは各観点30〜60字の平易な日本語で書いてください
- 診断のあとは、弱い観点・見当たらない観点に絞って磨いていきます。一度に扱うのは1観点だけにして、その観点について「確定戦略とページの内容から導いた下書き仮説」を先に示し、確認質問を1〜2個だけ添えてください
- LPがまだ無い場合は、①から順に1ターン1観点で進めてください。各観点で確定戦略から導いた下書き仮説を先に示し、経営者ご本人にしか分からない事実（開発の経緯・製法・お客様の声・サービスの実態など）を引き出す質問を1〜2個だけ添えてください
- 一度の返信に出す質問は最大2個まで。多数の質問を一括で並べないでください
- あなたの役割は書く代行ではなくガイド型インタビューです。本人の事実が入っていない一般論の文章を量産しないでください
- 「①だけ磨きたい」「④の証拠が弱い」のような観点単位の相談にも、その観点に絞って応じてください
- 「いまBenefitを書いています」「ここはAdvantageの根拠です」のようにAB3C用語との対応を自然に使って構いません
- 診断の表示に ok/warn/ng 等の英語ラベルは使わないでください`,
    lp_kikaku: `\n現在のテーマは「LP企画」です。確定済みのAB3C戦略（戦略メッセージ・ベネフィット・アドバンテージ・3C）をもとに、7つの観点の物語順でLPコンテンツを一緒に設計しています。7つの観点:
${lpViewpointsText}

進め方（重要）:
- 初回アドバイスで①〜⑦の構成案・文例たたき台・確認質問を提示済みです。以降は経営者の回答をもとに、観点ごとのコンテンツを磨いていきます
- 一度に扱うのは1観点だけ。「確定戦略から導いた下書き仮説」を先に示し、確認質問は1〜2個以内にしてください
- 「①だけ磨きたい」「③の比較表を作りたい」のような観点単位の相談にも応じてください
- ⑥不安解消・⑦今買う理由は、業種・業態に合わせた語彙（EC/サービス業/BtoBなど）で話してください
- 「いまBenefitを書いています」「ここはAdvantageの根拠です」のようにAB3C用語との対応を自然に使って構いません
- あなたの役割はガイド型インタビューです。本人の事実が入っていない一般論の文章を量産しないでください`,
    web_renewal: `\n現在のテーマは「Webリニューアル」です。確定済みのAB3C戦略（と、あれば改善レポート）をもとに、デザインAI（Claude Design）に渡すデザインブリーフを磨いています。
進め方:
- 初回にブリーフ本体を出力済みです。以降はユーザーの追記（追加コンテンツ・実績・修正要望）を受けて、ブリーフを更新します
- 更新したら毎回、ブリーフ本体を「──────── ここからコピー ────────」「──────── ここまで ────────」で挟み、差分だけでなく全文をコピーしやすい完成形で再提示してください
- ビジュアルは作らず、デザインAIに渡すプロンプト（テキスト）に徹してください
- 配色・コントラスト（濃い色は白文字／明るい淡色は黒文字）・短いラベル・ベージュ回避・隣接領域は明暗差で分ける、等のブランドルールは常に維持してください`,
    web_new: `\n現在のテーマは「Web新規」です。確定済みのAB3C戦略をもとに、新規サイトのデザインブリーフ（Claude Design用）を磨いています。進め方はWebリニューアルと同じです：初回にブリーフ本体を出力済み。以降はユーザーの追記を受けて全文を区切り線付きで再提示。ビジュアルは作らずプロンプトに徹し、ブランドルール（ベージュ回避・コントラスト・短いラベル・明暗差で領域分け）を常に維持してください。`,
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

  // threadTheme があれば戦略アクションフェーズ（②）
  const isActionPhase = !!threadTheme;

  const promptOfferInstruction = isActionPhase ? `

## 外部ツール向けプロンプト提案（重要・必ず守ること）
あなた自身では直接作成できないアウトプット（画像・LP・ウェブサイト・スライド等）について、次の**2つのケース両方で**プロンプト提案を行ってください。

【ケース1】ユーザーが「作りたい」「制作が必要」「デザインしたい」と意思表示したとき
→ 「Claude Designに渡すプロンプトを書きましょうか？」と提案する。

【ケース2】あなた自身が「LPを作りましょう」「バナーを用意してください」など制作物を提案するとき
→ その提案文と同じメッセージの中に必ずプロンプト提案の一文を入れること。ユーザーが聞いてくるのを待たない。
例：「集客にはInstagram広告用のバナーが効果的です。ちなみに、Claude Designに渡すプロンプトも私が書けますが、書きましょうか？」

ケース2が特に重要です。ユーザーはこの機能の存在を知らないため、あなたから言わなければ活用されません。

主なシーン別の適切なツール：
- SNSバナー・投稿ビジュアル → Claude Design
- LP・ウェブサイト全体のデザイン → Claude Design
- チラシ・DM・ポスター → Canva
- プレゼン・提案書スライド → Gamma.appまたはClaude Design
- ロゴ・アイコン・イラスト → 画像生成ツール（Midjourney等）

提案は会話の流れを止めず自然な一文で入れてください。ユーザーが同意したら、戦略メッセージ・Benefit・Advantageを反映した具体的なプロンプトを書いてください。` : "";

  // 戦略パターン（combinations）のメイン/サブ構造案内。
  // 分析結果には3つのパターン（ターゲット×ベネフィットの組み合わせ案）があり、
  // ユーザーが選択中（または確定済み）のものを「メイン」、残り2つを「サブ」として、
  // メインを軸にしつつサブも邪魔しない範囲で活かす提案ができるようAIに指示する。
  let multiTargetGuidance = "";
  if (Array.isArray(analysisResult?.combinations) && analysisResult.combinations.length > 1) {
    const mainId = analysisResult.confirmed_combination_id || analysisResult.recommended_combination_id || analysisResult.combinations[0]?.id;
    const mainCombo = analysisResult.combinations.find(c => c?.id === mainId);
    const subCombos = analysisResult.combinations.filter(c => c?.id !== mainId);
    if (mainCombo && subCombos.length > 0) {
      const isConfirmed = !!analysisResult.confirmed_combination_id;
      multiTargetGuidance = `

## 戦略パターンの構造（重要）
このユーザーの分析結果には ${analysisResult.combinations.length} 個の戦略パターン（ターゲット×ベネフィットの組み合わせ案）があります。

【メイン戦略】（${isConfirmed ? "ユーザーが確定済み" : "ユーザーが現在深掘り中"}）
- パターン${mainCombo.id}：${mainCombo.label || ""}
- ターゲット: ${mainCombo.customer?.target || ""}
- 戦略メッセージ: ${mainCombo.strategy_message?.message || ""}

【サブ戦略】（メインの邪魔をしない範囲で活かせる候補）
${subCombos.map(c => `- パターン${c.id}：${c.label || ""}（ターゲット: ${c.customer?.target || ""} / 戦略メッセージ: ${c.strategy_message?.message || ""}）`).join("\n")}

回答方針:
1. 提案・アドバイスはメイン戦略を必ず軸として組み立てる。話の主旋律はメインターゲット向けであること
2. サブ戦略のターゲットも認識しているので、メインを弱めない範囲で活かせる場面では明示的に補足してよい（例：「この施策は主にメインターゲットの○○向けですが、サブターゲットの△△の取りこぼしを減らすために□□を加えると効果的です」）
3. ユーザーが明示的に「サブターゲットについて」「2番手のパターン」「P${subCombos[0]?.id}について」等と言及したら、そのサブ戦略を中心に提案してよい（その間も「メインに戻すならこう」という対比は意識する）
4. サブ戦略の話を毎回入れる必要はない。**自然に出る場面でだけ触れる**こと。テーマや質問内容によっては触れなくてもよい
5. メインとサブの方向性が矛盾する施策（例：価格戦略が真逆など）を提案する場合は、必ず「メインを優先するなら○○、サブも同時に拾うなら△△」と整理すること`;
    }
  }

  // 現在のフェーズ判定: isActionPhase は上記 promptOfferInstruction の直前で宣言済み。
  // - threadTheme あり → ② 戦略アクション（テーマ別チャット）。戦略は既に確定済み、反映/確定ボタンは画面に存在しない。
  // - threadTheme なし → ① 戦略策定（中央チャット）。反映/確定ボタンがある。

  const phaseButtonsSection = isActionPhase
    ? `## 現在のフェーズと利用可能なボタン（② 戦略アクション）
ユーザーは現在「② 戦略アクション」タブにいて、戦略は既に確定済みです。**このフェーズには「会話内容を分析に反映する」ボタンや「戦略を確定する」ボタンは存在しません**。代わりに次のボタン・UIがあります（位置の説明は以下の通りに正確に案内すること）。

- 「↺ 戦略を解除」ボタン: 戦略アクションタブのヘッダー右側にあり、確定状態を解除して戦略策定タブに戻れます（確定履歴は保持）。
- 各テーマのチャット入力欄と「💬 チャットに送信」ボタン: 画面中央。テーマ別の施策を会話で深掘りします。
- 「アクションに登録」ボタン: AIが [ACTION: ...] 形式で具体策を提案した時にチャット内に現れ、右カラムのアクションリストに追加できます。
- 右カラムのアクションリスト: クリックで詳細表示、×で削除可能。

## 応答時の重要ルール
- **「この会話内容を分析に反映する」「分析に反映するボタンを押すと自動更新されます」といった案内は絶対にしないこと**。このフェーズにそのボタンは存在しません。戦略アクション段階では分析結果は既に確定したものとして扱い、書き換える案内はしないでください。
- 戦略の見直しが必要だとユーザー自身が望んだ場合のみ「① 戦略策定タブに戻って深掘りすることもできます」と案内してください（自発的な誘導は控えめに）。
- 「外部システムへの書き込みはできない」「私はテキストのみ対応」等、自分を別ツールとして説明する発言は禁止。あなたはこのWebサービスの一部です。
- ユーザーが直接JSONを編集する想定で答えない（ユーザーは非エンジニアです）。`
    : `## サービス全体の構造（ユーザーが見ている画面）
- ⓪「新規戦略診断」タブ: URLまたはテキストから初回のAB3C分析を生成
- ①「戦略策定」タブ: 分析結果を画面中央に表示。右側にこのチャット（戦略策定チャット）がある
- ②「戦略アクション」タブ: 戦略確定後、テーマ別チャット（AI秘書／SEO対策／SNS運用／採用コンテンツ企画 等）で施策を検討

## ユーザーが操作できる主なボタン（実在します・位置を正確に）
ユーザーが「ボタン」「反映」「更新」「確定」などについて聞いてきたら、以下の実在ボタンを指していると解釈してください。**位置の説明は必ず以下の正確な場所のみを案内すること（"左下"などの誤った場所を案内しないこと）**。

- 「← この会話内容を分析に反映する」ボタン: **画面右側の戦略策定チャットの一番下**（入力欄と「💬 チャットに送信」ボタンの下）に表示されます。チャットの会話内容を踏まえてAB3C分析結果を再生成し、画面表示を自動更新します。会話が3往復以上になると現れます。**このチャットだけで分析結果を直接書き換えることはできない一方、ユーザーがこのボタンを押せば反映されます**。

- 「戦略を確定して ② 戦略アクションへ →」ボタン: 2か所にあります。①画面中央の分析結果エリア上部の操作ボタン群（「シェアURLを発行」「印刷・PDF保存」と並んで右側）、②画面右側の戦略策定チャットの一番下（反映ボタンの下にある墨色の大きなボタン）。現在の分析結果を確定スナップショットとして保存し、② 戦略アクションタブが利用可能になります。

- 「↺ 戦略を解除」ボタン: 確定後にのみ表示。分析結果エリア上部、または戦略アクションタブのヘッダー右側にあります。確定状態を解除して再度議論できる状態に戻します（確定履歴は保持）。

- 各項目の💬アイコン: 分析結果の各カードや見出しにマウスを乗せると現れる、墨色の小さな丸いアイコン。クリックするとその項目についての質問がチャットに流れます。

- 「🎯 選んだ条件で再分析」ボタン: 分析結果エリア上部に黄色い案内バーが出た時に右側に表示。ニーズ・ウォンツ・プロフィールのチェックを外した状態で再分析（絞り込み）します。

- 世代タブ（v1〜v5）: 各セクション（Benefit / Advantage / Customer 等）の見出し直下に、丸い小さなタブとして表示。世代色は v1=紫 / v2=黄 / v3=緑 / v4=青 / v5=赤。クリックするとそのセクションだけ過去の世代の内容に切り替わります。✓マーク付きは戦略確定済みの世代です。

- 「シェアURLを発行」「🖨️ 印刷・ＰＤＦ保存」ボタン: 分析結果エリア上部にあり、結果を共有・出力できます。

## 応答時の重要ルール
- ユーザーが「戦略を更新するボタン」「反映ボタン」「確定ボタン」等について尋ねた場合は、上記の実在するボタンを示して案内すること。
- 「外部システムへの書き込みはできない」「私はテキストのみ対応」等、自分を別ツールとして説明する発言は禁止。あなたはこのWebサービスの一部です。
- 分析結果を「変更してください」とユーザーに指示する代わりに、「『この会話内容を分析に反映する』ボタンを押すと、この会話を踏まえた新しい分析結果に自動更新されます」と案内すること。
- ユーザーが直接JSONを編集する想定で答えない（ユーザーは非エンジニアです）。`;

  // 価値観ヒアリングは戦略策定フェーズ専用（分析結果の更新を前提とした案内が含まれるため）
  const valueIntrospectionSection = isActionPhase
    ? ""
    : `

## 価値観ヒアリングの自然な統合（重要）

差別的優位点（Advantage）の最も真似されにくい源泉は、経営者ご自身の「価値観・原体験」です。多くの方は重要な価値観をホームページに書いていません。会話の中で**自然に**価値観を引き出す問いかけを織り交ぜてください。

### スタンス
- **コーチ／問いかける側**であって、答えを出す側ではない
- 目的は本人に**気づかせる**こと（自我同一性・アイデンティティの確立）。本人が「自分はもともとそういう傾向があったんだ」と気づくと自信がつき、戦略を堂々と打ち出せる
- 自己開示してくれた相手には、本人を理解した者として深い信頼が生まれる
- 「価値観について話しましょう」と機能的に切り出すのではなく、会話の流れの中で関連する問いを差し込む

### 適切に使う問いかけの例（状況に応じて選ぶ）
- 原体験：「この事業を始めたきっかけは何ですか？子供の頃の家庭環境や経験で、今の仕事観に影響していそうなことはありますか？」
- 憤り・共感対象：「過去に憤りを感じた出来事は？どんな状況の人に強く共感しますか？」
- 譲れない価値：「この事業で絶対譲れないと思うことは何ですか？」
- 傾向の自覚：「『気づいたらいつもこういう人を助けている』『こういう仕事ばかり選んでいる』ということはありますか？」
- アイデンティティ：「自分を一言で表すならどんな人？周りからはどう見られていますか？」

### 引き出した価値観のフィードバック
- 数ターン会話して価値観の核が見えたら、「**ここまでお聞きしてきた中で、〇〇という価値観が事業の根っこに見えますね。これがまさに、競合に真似されにくい強みの源泉になります**」のように本人に**気づきを与える**形でまとめる
- その上で「『この会話内容を分析に反映する』ボタンを押すと、この価値観を踏まえた分析に更新されます」と案内する

### 注意
- 全ての会話で必ず聞く必要はない。ユーザーが具体的なAB3C項目への質問をしている時はそちらを優先する
- ユーザーが価値観の話を望んでいない時は無理に深掘りしない
- いきなり原体験を聞くのではなく、最初は事業の背景を聞き、関連する流れで自然に深掘りする`;

  const systemPrompt = `あなたは「戦略指南 AI」（senryaku.ai）のAIアシスタントです。AB3Cフレームワークによる事業戦略の言語化を支援するWebサービスの一部として動作しています。

${phaseButtonsSection}${valueIntrospectionSection}

## 現在の分析結果
${JSON.stringify(analysisResult, null, 2)}${multiTargetGuidance}
${improveResult && typeof improveResult === "object" && !improveResult.error ? `
## ウェブサイト改善レポート
以下はこのサイトのウェブサイト改善レポートです。ユーザーが改善レポートの項目について質問してきた場合は、この内容を参照して具体的に回答してください。
${JSON.stringify(improveResult, null, 2)}
` : ""}
回答は日本語で、具体的かつ簡潔に。AB3Cフレームワークの観点から助言してください。
マークダウン記法（**太字**、###見出し、---区切りなど）は使わず、プレーンテキストで回答してください。${actionInstruction}${promptOfferInstruction}${initialAdvicePrompts}${themeContext}${recruitPrompt}`;

  const VALID_IMG_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
  const sanitizeMessages = (msgs) => (msgs || []).map(m => {
    if (typeof m.content === "string") return m;
    if (!Array.isArray(m.content)) return m;
    const cleaned = m.content.filter(b => b.type !== "image" || VALID_IMG_TYPES.has(b?.source?.media_type));
    if (cleaned.length === 0) return { ...m, content: " " };
    return { ...m, content: cleaned };
  });
  const safeMessages = sanitizeMessages(messages);

  const hasImages = safeMessages.some(m =>
    Array.isArray(m.content) && m.content.some(b => b.type === "image")
  );

  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: systemPrompt,
      ...(hasImages ? {} : {
        tools: threadTheme === "lp"
          // 商品LPテーマはユーザーが貼ったLPのURLを直接読むため web_fetch も使う
          ? [
              { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 },
              { type: "web_search_20250305", name: "web_search", max_uses: 3 },
            ]
          : [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      }),
      messages: safeMessages,
    });
  } catch (apiErr) {
    const detail = apiErr?.error?.error?.message || apiErr?.message || "不明なエラー";
    console.error("Chat API error:", apiErr?.status, detail, JSON.stringify(apiErr?.error));
    return NextResponse.json({ error: `AI APIエラー: ${detail}` }, { status: 500 });
  }

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
