import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { getInstallationToken, getFileContent, putFile } from "../../../lib/github";

// Web更新フローの中核（後半）：変更を base_branch（既定 main）へ直接コミットして即反映する。
// 2026-06-15 方針：プレビュー/PRは挟まず直接反映。git履歴は追記のみで残るため、UI側の
// 「戻る矢印」（= 直前の内容で再コミット）でいつでも前の見た目に戻せる（履歴は破壊しない）。
// マージ・force push・reset は一切しない。コミットには [senryaku-web-update] マーカーを付ける。
export const maxDuration = 120;

const MARKER = "[senryaku-web-update]";

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
    instruction,
    summary,
    kind = "update",   // "update" | "undo" | "redo"
    installation_id,
  } = body || {};

  if (!repo_full_name) return NextResponse.json({ error: "対象リポジトリが指定されていません。" }, { status: 400 });
  if (!path) return NextResponse.json({ error: "対象ファイルが指定されていません。" }, { status: 400 });
  if (typeof after !== "string") return NextResponse.json({ error: "変更後の内容がありません。" }, { status: 400 });

  let token;
  try {
    token = await getInstallationToken(installation_id);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "GitHub接続に失敗しました。" }, { status: 502 });
  }

  try {
    // 最新の blob sha を取得（直接コミットには既存ファイルの sha が必要）
    const current = await getFileContent(token, repo_full_name, path, base_branch);
    const headline = kind === "undo"
      ? `ひとつ前に戻す: ${path}`
      : kind === "redo"
        ? `やり直し: ${path}`
        : (summary ? summary : `${path} を更新`);
    const message = [
      `戦略指南AI: ${headline}`,
      "",
      instruction ? `指示: ${instruction}` : "",
      "（戦略指南AI Web更新が直接反映。元に戻すにはアプリの戻る矢印、または履歴から復元できます）",
      MARKER,
    ].filter(Boolean).join("\n");

    const res = await putFile(token, repo_full_name, {
      path,
      content: after,
      message,
      branch: base_branch,
      sha: current?.sha,
    });

    return NextResponse.json({
      ok: true,
      repo: repo_full_name,
      base_branch,
      path,
      kind,
      commit_sha: res.commit?.sha,
      commit_url: res.commit?.html_url,
    });
  } catch (e) {
    console.error("web-update/apply error:", e?.message);
    return NextResponse.json({ error: e?.message || "反映に失敗しました。" }, { status: 502 });
  }
}
