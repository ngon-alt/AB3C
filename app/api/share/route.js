import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL);

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS shared_results (
      id VARCHAR(12) PRIMARY KEY,
      input_text TEXT,
      result JSONB NOT NULL,
      improve_result JSONB,
      visual_mock JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE shared_results ADD COLUMN IF NOT EXISTS visual_mock JSONB`;
  // 閲覧期限: 発行から1年（expires_at がNULLの旧レコードは created_at + 1年 でバックフィル）
  await sql`ALTER TABLE shared_results ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`;
  await sql`
    UPDATE shared_results
      SET expires_at = created_at + INTERVAL '1 year'
      WHERE expires_at IS NULL
  `;
  ensured = true;
}

function generateId() {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).slice(2, 8);
  const random2 = Math.random().toString(36).slice(2, 6);
  return timestamp + random1 + random2;
}

export async function POST(req) {
  try {
    const { input, result, improveResult, visualMock } = await req.json();
    await ensureTable();
    const id = generateId();
    // 閲覧期限: 発行から1年後
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    await sql`
      INSERT INTO shared_results (id, input_text, result, improve_result, visual_mock, expires_at)
      VALUES (${id}, ${input || ""}, ${JSON.stringify(result)}, ${improveResult ? JSON.stringify(improveResult) : null}, ${visualMock ? JSON.stringify(visualMock) : null}, ${expiresAt.toISOString()})
    `;
    return NextResponse.json({ id, expires_at: expiresAt.toISOString() });
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
    const row = rows[0];
    // 閲覧期限チェック（expires_at がNULLの想定外ケースは許容）
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({
        error: "このシェアURLは閲覧期限（発行から1年）が切れました。",
        expired: true,
        created_at: row.created_at,
        expires_at: row.expires_at,
      }, { status: 410 });
    }
    return NextResponse.json({
      input: row.input_text,
      result: row.result,
      improveResult: row.improve_result,
      visualMock: row.visual_mock,
      created_at: row.created_at,
      expires_at: row.expires_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "データの取得に失敗しました。" }, { status: 500 });
  }
}
