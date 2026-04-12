import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL);

// sitesテーブルを作成（なければ）
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS sites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) NOT NULL,
      site_url VARCHAR(2048),
      site_name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255),
      industry VARCHAR(100),
      target_customer TEXT,
      latest_analysis JSONB,
      strategy_confirmed BOOLEAN DEFAULT FALSE,
      strategy_confirmed_at TIMESTAMPTZ,
      chat_history JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sites_user_email ON sites(user_email)`;
}

// GET: ユーザーのサイト一覧取得
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  await ensureTable();

  const sites = await sql`
    SELECT * FROM sites
    WHERE user_email = ${session.user.email}
    ORDER BY updated_at DESC
  `;

  return NextResponse.json({ sites });
}

// POST: 新規サイト登録
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { site_url, site_name, company_name, industry, target_customer } = await req.json();

  if (!site_name) {
    return NextResponse.json({ error: "サイト名は必須です。" }, { status: 400 });
  }

  await ensureTable();

  const rows = await sql`
    INSERT INTO sites (user_email, site_url, site_name, company_name, industry, target_customer)
    VALUES (${session.user.email}, ${site_url || null}, ${site_name}, ${company_name || null}, ${industry || null}, ${target_customer || null})
    RETURNING *
  `;

  return NextResponse.json({ site: rows[0] }, { status: 201 });
}

// PUT: サイト情報更新
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { id, site_url, site_name, company_name, industry, target_customer, latest_analysis, strategy_confirmed, chat_history } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "サイトIDは必須です。" }, { status: 400 });
  }

  await ensureTable();

  // 所有権チェック
  const existing = await sql`SELECT id FROM sites WHERE id = ${id} AND user_email = ${session.user.email}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "サイトが見つかりません。" }, { status: 404 });
  }

  const rows = await sql`
    UPDATE sites SET
      site_url = COALESCE(${site_url ?? null}, site_url),
      site_name = COALESCE(${site_name ?? null}, site_name),
      company_name = COALESCE(${company_name ?? null}, company_name),
      industry = COALESCE(${industry ?? null}, industry),
      target_customer = COALESCE(${target_customer ?? null}, target_customer),
      latest_analysis = COALESCE(${latest_analysis ? JSON.stringify(latest_analysis) : null}::jsonb, latest_analysis),
      strategy_confirmed = COALESCE(${strategy_confirmed ?? null}, strategy_confirmed),
      strategy_confirmed_at = CASE
        WHEN ${strategy_confirmed ?? null}::boolean = TRUE AND strategy_confirmed = FALSE THEN NOW()
        ELSE strategy_confirmed_at
      END,
      chat_history = COALESCE(${chat_history ? JSON.stringify(chat_history) : null}::jsonb, chat_history),
      updated_at = NOW()
    WHERE id = ${id} AND user_email = ${session.user.email}
    RETURNING *
  `;

  return NextResponse.json({ site: rows[0] });
}

// DELETE: サイト削除
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "サイトIDは必須です。" }, { status: 400 });
  }

  await ensureTable();

  const rows = await sql`
    DELETE FROM sites WHERE id = ${id} AND user_email = ${session.user.email} RETURNING id
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "サイトが見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
