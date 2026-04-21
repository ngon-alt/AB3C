import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const sql = neon(process.env.DATABASE_URL);

// ログイン中ユーザーが発行したシェアURL一覧を返す
// 診断チケットユーザーのダッシュボードで利用
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const rows = await sql`
      SELECT id, input_text, created_at, expires_at
      FROM shared_results
      WHERE user_email = ${session.user.email}
      ORDER BY created_at DESC
      LIMIT 500
    `;
    const now = Date.now();
    const shares = rows.map(r => ({
      id: r.id,
      input: r.input_text,
      created_at: r.created_at,
      expires_at: r.expires_at,
      expired: r.expires_at ? new Date(r.expires_at).getTime() < now : false,
    }));
    return NextResponse.json({ shares });
  } catch (e) {
    console.error("GET /api/share/list error:", e);
    return NextResponse.json({ error: "シェア一覧の取得に失敗しました。" }, { status: 500 });
  }
}
