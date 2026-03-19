import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS shared_results (
      id VARCHAR(12) PRIMARY KEY,
      input_text TEXT,
      result JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

function generateId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export async function POST(req) {
  try {
    const { input, result } = await req.json();
    await ensureTable();
    const id = generateId();
    await sql`
      INSERT INTO shared_results (id, input_text, result)
      VALUES (${id}, ${input || ""}, ${JSON.stringify(result)})
    `;
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "シェアの作成に失敗しました。" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "IDが必要です。" }, { status: 400 });
    await ensureTable();
    const rows = await sql`SELECT * FROM shared_results WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: "見つかりませんでした。" }, { status: 404 });
    return NextResponse.json({ input: rows[0].input_text, result: rows[0].result, created_at: rows[0].created_at });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "データの取得に失敗しました。" }, { status: 500 });
  }
}
