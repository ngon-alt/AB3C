import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const PLAN_LIMITS = {
  free: 5,
  lite: 30,
  standard: Infinity,
  pro: Infinity,
};

const DAILY_LIMITS = {
  free: 5,
  lite: 30,
  standard: 30,
  pro: Infinity,
};

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const rows = await sql`SELECT * FROM users WHERE email = ${session.user.email}`;
  if (rows.length === 0) return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });

  const user = rows[0];

  // プロ会員チェック
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;
  const plan = isPro ? "pro" : (user.plan || "free");

  const monthlyLimit = PLAN_LIMITS[plan];
  const dailyLimit = DAILY_LIMITS[plan];

  return NextResponse.json({
    plan,
    usageCount: user.usage_count,
    monthlyLimit,
    dailyLimit,
    dailyUsage: user.daily_usage || 0,
  });
}

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const rows = await sql`SELECT * FROM users WHERE email = ${session.user.email}`;
  if (rows.length === 0) return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });

  const user = rows[0];

  // プロ会員チェック
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
  const isPro = proRows.length > 0;
  const plan = isPro ? "pro" : (user.plan || "free");

  const monthlyLimit = PLAN_LIMITS[plan];
  const dailyLimit = DAILY_LIMITS[plan];

  // プロ会員は無制限
  if (isPro) {
    return NextResponse.json({ ok: true, usageCount: 0, dailyUsage: 0 });
  }

  const today = new Date().toISOString().split("T")[0];
  const resetDate = user.usage_reset_date?.toISOString?.()?.split("T")[0] || today;
  const thisMonth = today.slice(0, 7);
  const resetMonth = resetDate.slice(0, 7);

  let usageCount = user.usage_count || 0;
  let dailyUsage = user.daily_usage || 0;
  let lastUsageDate = user.last_usage_date?.toISOString?.()?.split("T")[0] || "";

  if (thisMonth !== resetMonth) usageCount = 0;
  if (lastUsageDate !== today) dailyUsage = 0;

  if (monthlyLimit !== Infinity && usageCount >= monthlyLimit) {
    return NextResponse.json({ error: `月間利用上限（${monthlyLimit}回）に達しました。プランをアップグレードしてください。` }, { status: 429 });
  }

  if (dailyLimit !== Infinity && dailyUsage >= dailyLimit) {
    return NextResponse.json({ error: `1日の利用上限（${dailyLimit}回）に達しました。明日またお試しください。` }, { status: 429 });
  }

  await sql`
    UPDATE users SET
      usage_count = ${usageCount + 1},
      daily_usage = ${dailyUsage + 1},
      last_usage_date = ${today},
      usage_reset_date = ${today}
    WHERE email = ${session.user.email}
  `;

  return NextResponse.json({ ok: true, usageCount: usageCount + 1, dailyUsage: dailyUsage + 1 });
}
