import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GitHub App のインストールURLを返す（Web更新 Phase 1）。
// ユーザーはこのURLでAppを自分のリポジトリにインストールし、callback で完了画面に戻る。
// App スラッグは環境変数 GITHUB_APP_SLUG（例: senryaku-web-update）に設定する。
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) {
    return NextResponse.json(
      { error: "GitHub App が未設定です（GITHUB_APP_SLUG）。管理者にお問い合わせください。" },
      { status: 500 }
    );
  }
  const url = `https://github.com/apps/${slug}/installations/new`;
  return NextResponse.json({ url });
}
