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
    lifetimeLimit: isPro ? Infinity : 1,
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

  // 戦略診断チケット: 残り回数がある限り実行可能（消費は全レポート成功後に /api/analyses/consume で）
  const analysisPlanRows = await sql`
    SELECT site_limit, analyses_used FROM user_plans
    WHERE user_email = ${session.user.email}
      AND plan_type = 'analysis'
      AND status = 'active'
    ORDER BY purchased_at DESC
    LIMIT 1
  `;
  if (analysisPlanRows.length > 0) {
    const p = analysisPlanRows[0];
    const used = parseInt(p.analyses_used || 0);
    if (used < p.site_limit) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({
      error: `戦略診断チケットの上限（${p.site_limit}回）に達しました。プランのアップグレードが必要です。`
    }, { status: 429 });
  }

  // 無料ユーザーは1アカウントにつき永久1回のみ（月次リセットなし）
  const today = new Date().toISOString().split("T")[0];
  const usageCount = user.usage_count || 0;

  if (usageCount >= 1) {
    return NextResponse.json({
      error: "無料お試しは1回のみご利用いただけます。引き続きご利用いただくには、戦略診断チケットまたは戦略指南サブスクをご購入ください。"
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
