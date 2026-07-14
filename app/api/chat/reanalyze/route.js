import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 300;

export async function POST(req) {
  const encoder = new TextEncoder();

  const sendError = (msg, status = 400) =>
    new Response(
      encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\ndata: [DONE]\n\n`),
      { status, headers: { "Content-Type": "text/event-stream" } }
    );

  const session = await getServerSession(authOptions);
  if (!session) return sendError("ログインが必要です", 401);

  const sql = neon(process.env.DATABASE_URL);

  let isPro = false, ticketRows = [], trialRows = [], hasTicket = false, hasTrial = false;
  try {
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
    isPro = proRows.length > 0;

    ticketRows = await sql`
      SELECT id, remaining_chats FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
      ORDER BY purchased_at ASC LIMIT 1
    `;
    hasTicket = ticketRows.length > 0;

    trialRows = await sql`
      SELECT id, remaining_chats FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY purchased_at ASC LIMIT 1
    `;
    hasTrial = trialRows.length > 0;
  } catch (dbErr) {
    console.error("DB error (reanalyze auth):", dbErr?.message);
    return sendError("データベースエラーが発生しました。しばらくお待ちください。", 500);
  }

  if (!isPro && !hasTicket && !hasTrial) return sendError("チャット機能を利用するにはチケットが必要です", 403);

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

  let reqBody;
  try { reqBody = await req.json(); } catch { return sendError("リクエストの解析に失敗しました。", 400); }

  const { messages, analysisResult, siteId } = reqBody;

  if (!analysisResult || typeof analysisResult !== "object")
    return sendError("再分析の元になる分析結果が取得できませんでした。画面をリロードしてからもう一度お試しください。");
  if (!Array.isArray(messages) || messages.length === 0)
    return sendError("再分析するには、まずチャットでいくつかご相談ください。");

  const stream = new ReadableStream({
    async start(controller) {
      const pingInterval = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch {}
      }, 5000);

      const send = (data) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        // Build conversation summary (same logic as /api/chat)
        const MAX_CONV_CHARS = 24000;
        const convPieces = messages
          .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map(m => `【${m.role === "user" ? "ユーザー" : "AI"}】${m.content}`);
        let conversationSummary = "";
        for (let i = convPieces.length - 1; i >= 0; i--) {
          if (conversationSummary.length + convPieces[i].length + 1 > MAX_CONV_CHARS) break;
          conversationSummary = convPieces[i] + "\n" + conversationSummary;
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

        const ab3cSchema = {
          type: "object",
          properties: {
            benefit: {
              type: "object",
              properties: {
                core: { type: "string" },
                needs: { type: "array", items: { type: "string" } },
                wants: { type: "array", items: { type: "string" } },
              },
              required: ["core", "needs", "wants"],
            },
            advantage: {
              type: "object",
              properties: {
                what: { type: "string" },
                why_good: { type: "string" },
                why_hard_to_copy: { type: "string" },
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
                        adequacy: { type: "string", enum: ["sufficient", "needs_confirmation"] },
                        adequacy_note: { type: "string" },
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
                    strength_evaluations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tier: { type: "string", enum: ["verified", "first_party_fact", "plausible_industry", "subjective_unsupported", "needs_owner_confirmation"] },
                          note: { type: "string" },
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

        // Claude API call — the slow part; SSE pings keep the connection alive
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
          const detail = apiErr?.error?.error?.message || apiErr?.message || "AI API への接続に失敗しました";
          send({ error: `再分析に失敗しました: ${detail}（API ${apiErr?.status || 500}）` });
          return;
        }

        // Extract structured result
        const stopReason = response.stop_reason;
        const toolUseBlock = (response.content || []).find(b => b.type === "tool_use" && b.name === "return_analysis");
        if (!toolUseBlock || !toolUseBlock.input) {
          send({ error: `再分析に失敗しました: AIが応答を返しませんでした（${stopReason}）` });
          return;
        }
        const parsedResult = toolUseBlock.input;

        // Field merge with cascade fallback (orig > v1)
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
              v1 = versions[versions.length - 1]?.result || {};
            }
          } catch (e) {
            console.error("v1 取得失敗:", e?.message);
          }
        }

        const pickArr = (a, b, c) => {
          if (Array.isArray(a) && a.length > 0) return a;
          if (Array.isArray(b) && b.length > 0) return b;
          if (Array.isArray(c) && c.length > 0) return c;
          return [];
        };
        const pickStr = (a, b, c) => {
          if (typeof a === "string" && a.trim()) return a;
          if (typeof b === "string" && b.trim()) return b;
          if (typeof c === "string" && c.trim()) return c;
          return "";
        };

        const newResult = {
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
            : ((Array.isArray(orig.checkpoints) && orig.checkpoints.length > 0) ? orig.checkpoints : (Array.isArray(v1.checkpoints) ? v1.checkpoints : [])),
        };

        // Generate short summary label
        let chatSummary = "";
        try {
          const summaryResponse = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 100,
            messages: [{ role: "user", content: `以下の会話内容を15文字以内で一言に要約してください。要約のみ返してください。\n\n${conversationSummary}` }],
          });
          chatSummary = summaryResponse.content[0].text.trim();
        } catch (sumErr) {
          console.warn("chatSummary 生成失敗:", sumErr?.message);
        }

        send({ reanalyzed: true, result: newResult, chatSummary });

      } catch (e) {
        console.error("再分析ストリームエラー:", e?.message);
        send({ error: "予期しないエラーが発生しました。少し時間をおいてもう一度お試しください。" });
      } finally {
        clearInterval(pingInterval);
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
