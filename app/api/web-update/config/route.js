import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Web更新の接続状態を返す（UIが「接続済み/未接続」「既定リポジトリ」を判断するため）。
// v1 は環境変数による単一接続。秘密情報そのものは返さず、設定済みかどうかだけを返す。
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const connected = !!(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_APP_INSTALLATION_ID
  );
  return NextResponse.json({
    connected,
    repo: process.env.GITHUB_APP_REPO || null,
    base_branch: process.env.GITHUB_APP_BASE_BRANCH || "main",
    has_install_slug: !!process.env.GITHUB_APP_SLUG,
  });
}
