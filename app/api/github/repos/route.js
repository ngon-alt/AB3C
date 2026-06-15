import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { listInstallationRepos } from "../../../lib/github";

// 接続済み GitHub App インストールがアクセスできるリポジトリ一覧を返す（Web更新 Phase 1）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  try {
    const repos = await listInstallationRepos();
    return NextResponse.json({ repos });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "リポジトリ一覧の取得に失敗しました" }, { status: 500 });
  }
}
