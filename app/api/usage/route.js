import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const rows = await sql`SELECT * FROM users WHERE email = ${session.user.email}`;
  if (rows.length === 0) return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });

  const user = rows[0];
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;

  return NextResponse.json({
    isPro,
    usageCount: user.usage_count,
    monthlyLimit: isPro ? Infinity : 1,
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const rows = await sql`SELECT * FROM users WHERE email = ${session.user.email}`;
  if (rows.length === 0) return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });

  const user = rows[0];

  // プロ会員は無制限
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;
  if (isPro) return NextResponse.json({ ok: true });

  // チケット所持者は無制限（チケット消費はanalyze側で行わない）
  const ticketRows = await sql`
    SELECT id, remaining_chats FROM tickets
    WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
    ORDER BY purchased_at ASC
    LIMIT 1
  `;
  if (ticketRows.length > 0) return NextResponse.json({ ok: true });

  // 無料ユーザーは月1回まで
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const resetMonth = (user.usage_reset_date?.toISOString?.()?.split("T")[0] || today).slice(0, 7);

  let usageCount = user.usage_count || 0;
  if (thisMonth !== resetMonth) usageCount = 0;

  if (usageCount >= 1) {
    return NextResponse.json({
      error: "無料プランの月1回の利用上限に達しました。チケットを購入してください。"
    }, { status: 429 });
  }

  await sql`
    UPDATE users SET
      usage_count = ${usageCount + 1},
      usage_reset_date = ${today}
    WHERE email = ${session.user.email}
  `;

  return NextResponse.json({ ok: true });
}
