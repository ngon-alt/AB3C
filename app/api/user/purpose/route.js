import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendWelcomeEmail, sendWelcomeEmailAgency } from "@/app/lib/email";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purpose } = await req.json();
  if (!["self", "agency"].includes(purpose)) {
    return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL);

  // usersテーブルにpurposeカラムを追加（なければ）
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS purpose VARCHAR(20)`;

  // 初回選択かどうか確認
  const existing = await sql`SELECT purpose FROM users WHERE email = ${session.user.email}`;
  const isFirstTime = !existing[0]?.purpose;

  await sql`
    UPDATE users SET purpose = ${purpose} WHERE email = ${session.user.email}
  `;

  // 初回選択時のみウェルカムメールを送信
  if (isFirstTime) {
    try {
      if (purpose === "agency") {
        await sendWelcomeEmailAgency({ email: session.user.email, name: session.user.name });
      } else {
        await sendWelcomeEmail({ email: session.user.email, name: session.user.name });
      }
    } catch (e) {
      console.error('ウェルカムメール送信エラー:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
