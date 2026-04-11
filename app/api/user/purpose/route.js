import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

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

  await sql`
    UPDATE users SET purpose = ${purpose} WHERE email = ${session.user.email}
  `;

  return NextResponse.json({ ok: true });
}
