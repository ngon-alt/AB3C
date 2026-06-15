import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { getInstallationToken, getRepoTree, getFileContent } from "../../../lib/github";
import { SENRYAKU_VOICE } from "../../../lib/voice";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Web更新フローの中核（前半）：チャット指示から「どのファイルをどう直すか」を推定し、
// 変更後の内容（差分案）を返す。ここではコミットしない（承認後に /api/web-update/apply が実行）。
export const maxDuration = 300;

// AIの出力に紛れがちなコードフェンスを除去して、純粋なファイル本文を取り出す。
function stripCodeFence(text) {
  let t = (text || "").trim();
  const fence = t.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  if (fence) t = fence[1];
  return t;
}

function parseJsonLoose(text) {
  const m = (text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  // 利用権限チェック（プロ会員 or 有効なチケット保有者のみ）。propose 自体ではチケットを消費しない。
  try {
    const sql = neon(process.env.DATABASE_URL);
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
    const isPro = proRows.length > 0;
    if (!isPro) {
      const tk = await sql`
        SELECT id FROM tickets
        WHERE email = ${session.user.email} AND remaining_chats > 0
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1`;
      if (tk.length === 0) {
        return NextResponse.json({ error: "この機能を利用するにはチケットが必要です" }, { status: 403 });
      }
    }
  } catch (dbErr) {
    console.error("DB error (web-update/propose):", dbErr?.message);
    return NextResponse.json({ error: "データベースエラーが発生しました。" }, { status: 500 });
  }

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "リクエストの解析に失敗しました。" }, { status: 400 }); }

  const {
    instruction,
    repo_full_name = process.env.GITHUB_APP_REPO,
    base_branch = process.env.GITHUB_APP_BASE_BRANCH || "main",
    installation_id,
    analysisResult,
    improveResult,
  } = body || {};

  if (!instruction || !instruction.trim()) {
    return NextResponse.json({ error: "更新の指示を入力してください。" }, { status: 400 });
  }
  if (!repo_full_name) {
    return NextResponse.json({ error: "対象リポジトリが指定されていません。先にGitHubに接続してください。" }, { status: 400 });
  }

  let token;
  try {
    token = await getInstallationToken(installation_id);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "GitHub接続に失敗しました。" }, { status: 502 });
  }

  // ① リポジトリのファイル一覧（編集対象になりやすいものだけ）
  let tree;
  try {
    tree = await getRepoTree(token, repo_full_name, base_branch);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "リポジトリ構成の取得に失敗しました。" }, { status: 502 });
  }
  if (!tree.paths.length) {
    return NextResponse.json({ error: "編集対象になりそうなファイルが見つかりませんでした。" }, { status: 422 });
  }

  const strategyContext = [
    analysisResult ? `【確定した戦略（AB3C）】\n${typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult)}` : "",
    improveResult ? `【ウェブサイト改善レポート】\n${typeof improveResult === "string" ? improveResult : JSON.stringify(improveResult)}` : "",
  ].filter(Boolean).join("\n\n");

  // ② AIに対象ファイルを1つ推定させる（パス一覧のみ渡してトークン節約）
  let targetPath, fileReason;
  try {
    const pick = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `あなたはウェブサイトのソースコードを編集するアシスタントです。次の更新指示に対して、リポジトリ「${repo_full_name}」の中で編集すべきファイルを1つだけ選んでください。

【更新指示】
${instruction}

【リポジトリのファイル一覧】
${tree.paths.join("\n")}

ルール:
- 対象は「サイトの表示内容（文章・見出し・各ページのテキストや画像差し替え 等）」の変更に限ります。
- 一覧に存在するパスだけを選ぶこと。トップページの見出し等なら index/トップに該当するファイルを選ぶ。
- 設定ファイル・CI・パッケージ定義など、表示内容でないものは選ばないこと。
- 指示が「内容の変更」ではない場合（例：公開する／本番に反映する／デプロイする／設定を変える など）は、ファイルを選ばず path を null にすること。すでにコミット時点で自動反映されるため、デプロイ等の操作指示は不要です。

出力は次のJSONのみ（説明文なし）:
{"path": "選んだファイルのパス（内容変更でなければ null）", "reason": "理由を20〜60字の日本語で"}`,
      }],
    });
    const picked = parseJsonLoose(pick.content?.[0]?.text || "");
    targetPath = picked?.path;
    fileReason = picked?.reason || "";
    // 内容変更でない指示（公開/デプロイ/設定変更 等）は path=null で返るので、ていねいに案内する
    if (picked && (picked.path === null || picked.path === "null")) {
      return NextResponse.json({ error: "これはサイトの内容変更の指示ではないようです。変更内容は指示するとそのまま反映され、公開（デプロイ）も自動で行われます。変えたい文章・見出しなどを具体的にお書きください（例：トップの見出しを〜に、会社概要に〜を追加 等）。" }, { status: 422 });
    }
    if (!targetPath || !tree.paths.includes(targetPath)) {
      return NextResponse.json({ error: "対象ファイルを特定できませんでした。指示をもう少し具体的にしてください（例：トップの見出し、会社概要のテキスト 等）。" }, { status: 422 });
    }
  } catch (e) {
    console.error("propose pick error:", e?.message);
    return NextResponse.json({ error: "対象ファイルの推定に失敗しました。" }, { status: 502 });
  }

  // ③ 対象ファイル本文を取得
  let file;
  try {
    file = await getFileContent(token, repo_full_name, targetPath, base_branch);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "ファイル取得に失敗しました。" }, { status: 502 });
  }
  if (!file) {
    return NextResponse.json({ error: `対象ファイルが見つかりませんでした（${targetPath}）。` }, { status: 422 });
  }

  // ④ 変更後の内容を生成（コミットはしない）
  let after, summary;
  try {
    const edit = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{
        role: "user",
        content: `あなたはウェブサイトのソースを編集するアシスタントです。次のファイルに、更新指示の変更だけを最小限に加えてください。

${strategyContext ? strategyContext + "\n\n" : ""}【更新指示】
${instruction}

【対象ファイル: ${targetPath}】
${file.content}

ルール（厳守）:
- 指示に関係する箇所だけを変更し、それ以外は1文字も変えない（インデント・空行も保持）
- ファイル全体の完全な内容を出力する（一部省略・「…」での省略は禁止）
- コードフェンス(\`\`\`)や説明文は付けず、ファイルの中身だけを出力する
- 事実（社名・実績・数値など）を創作しない。確証のない情報は加えない

最後の行に、利用者（経営者）への報告メッセージとして、変更内容の要約を次の形式で1行だけ付けてください:
###SUMMARY### （30〜60字・1行。例：「会社概要に小林真由子さん（理事）のプロフィールを追加しました」）

この要約（SUMMARY行）は、次の共通ルールに従って書いてください（このルールは報告文にのみ適用し、上のファイル本文には適用しないこと）:
${SENRYAKU_VOICE}`,
      }],
    });
    let raw = edit.content?.[0]?.text || "";
    const sm = raw.match(/###SUMMARY###\s*(.+)\s*$/);
    if (sm) { summary = sm[1].trim(); raw = raw.slice(0, sm.index); }
    after = stripCodeFence(raw);
  } catch (e) {
    console.error("propose edit error:", e?.message);
    return NextResponse.json({ error: "変更案の生成に失敗しました。" }, { status: 502 });
  }

  if (after === file.content) {
    return NextResponse.json({ error: "変更が生成されませんでした。指示を具体的にして再度お試しください。", path: targetPath }, { status: 422 });
  }

  return NextResponse.json({
    repo: repo_full_name,
    base_branch,
    path: targetPath,
    sha: file.sha,
    file_reason: fileReason,
    summary: summary || "",
    before: file.content,
    after,
  });
}
