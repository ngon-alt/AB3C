import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import {
  getInstallationToken,
  getBranchHeadSha,
  getFileContent,
  createBranch,
  putFile,
  createPullRequest,
  buildWorkBranchName,
} from "../../../lib/github";

// Web更新フローの中核（後半）：承認された変更を、作業ブランチ＋コミット＋PRとして反映する。
// 直接 base_branch（main等）へは push しない。マージは人間がGitHub/プレビュー確認の上で行う。
export const maxDuration = 120;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  // 利用権限チェック（プロ会員 or 有効なチケット保有者のみ）
  try {
    const sql = neon(process.env.DATABASE_URL);
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
    if (proRows.length === 0) {
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
    console.error("DB error (web-update/apply):", dbErr?.message);
    return NextResponse.json({ error: "データベースエラーが発生しました。" }, { status: 500 });
  }

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "リクエストの解析に失敗しました。" }, { status: 400 }); }

  const {
    repo_full_name = process.env.GITHUB_APP_REPO,
    base_branch = process.env.GITHUB_APP_BASE_BRANCH || "main",
    path,
    after,
    sha,           // propose 時点の blob sha（任意。古ければ再取得する）
    instruction,
    summary,
    installation_id,
  } = body || {};

  if (!repo_full_name) return NextResponse.json({ error: "対象リポジトリが指定されていません。" }, { status: 400 });
  if (!path) return NextResponse.json({ error: "対象ファイルが指定されていません。" }, { status: 400 });
  if (typeof after !== "string" || !after) return NextResponse.json({ error: "変更後の内容がありません。" }, { status: 400 });

  let token;
  try {
    token = await getInstallationToken(installation_id);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "GitHub接続に失敗しました。" }, { status: 502 });
  }

  try {
    // ① base_branch の先端から作業ブランチを作成
    const baseSha = await getBranchHeadSha(token, repo_full_name, base_branch);
    if (!baseSha) return NextResponse.json({ error: `base ブランチ（${base_branch}）が見つかりませんでした。` }, { status: 422 });
    const workBranch = buildWorkBranchName();
    await createBranch(token, repo_full_name, workBranch, baseSha);

    // ② 最新の blob sha を取得して更新（propose からの間に他更新があってもconflictにしない）
    const current = await getFileContent(token, repo_full_name, path, base_branch);
    const fileSha = current?.sha || sha;
    const title = summary ? `戦略指南AI: ${summary}` : `戦略指南AI: ${path} を更新`;
    const commitMessage = `${title}\n\n${instruction ? `指示: ${instruction}\n` : ""}（戦略指南AI Web更新が自動生成。マージ前にプレビューでご確認ください）`;
    await putFile(token, repo_full_name, {
      path,
      content: after,
      message: commitMessage,
      branch: workBranch,
      sha: fileSha,
    });

    // ③ PR作成
    const prBody = [
      "戦略指南AI の「Web更新」から自動生成された変更提案です。",
      "",
      instruction ? `**指示**: ${instruction}` : "",
      summary ? `**変更概要**: ${summary}` : "",
      `**対象ファイル**: \`${path}\``,
      "",
      "自動デプロイ（Vercel/Netlify等）のプレビューで確認のうえ、問題なければマージしてください。",
    ].filter(Boolean).join("\n");
    const pr = await createPullRequest(token, repo_full_name, {
      head: workBranch,
      base: base_branch,
      title,
      body: prBody,
    });

    return NextResponse.json({
      ok: true,
      pr_url: pr.html_url,
      pr_number: pr.number,
      branch: workBranch,
      path,
    });
  } catch (e) {
    console.error("web-update/apply error:", e?.message);
    return NextResponse.json({ error: e?.message || "PRの作成に失敗しました。" }, { status: 502 });
  }
}
