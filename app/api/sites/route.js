import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// sitesテーブルを作成（なければ）
async function ensureTable(sql) {
  try {
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
        chat_history JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sites_user_email ON sites(user_email)`;
  } catch (e) {
    console.error("ensureTable error:", e);
  }
}

// GET: ユーザーのサイト一覧取得
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const sql = neon(process.env.DATABASE_URL);
    await ensureTable(sql);

    const sites = await sql`
      SELECT * FROM sites
      WHERE user_email = ${session.user.email}
      ORDER BY updated_at DESC
    `;

    return NextResponse.json({ sites });
  } catch (e) {
    console.error("GET /api/sites error:", e);
    return NextResponse.json({ error: "サーバーエラー: " + e.message }, { status: 500 });
  }
}

// POST: 新規サイト登録
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const body = await req.json();
    const { site_url, site_name, company_name, industry, target_customer } = body;

    if (!site_name) {
      return NextResponse.json({ error: "サイト名は必須です。" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    await ensureTable(sql);

    const rows = await sql`
      INSERT INTO sites (user_email, site_url, site_name, company_name, industry, target_customer)
      VALUES (${session.user.email}, ${site_url || null}, ${site_name}, ${company_name || null}, ${industry || null}, ${target_customer || null})
      RETURNING *
    `;

    return NextResponse.json({ site: rows[0] }, { status: 201 });
  } catch (e) {
    console.error("POST /api/sites error:", e);
    return NextResponse.json({ error: "サーバーエラー: " + e.message }, { status: 500 });
  }
}

// PUT: サイト情報更新
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const body = await req.json();
    const { id, site_url, site_name, company_name, industry, target_customer, latest_analysis, strategy_confirmed, chat_history } = body;

    if (!id) {
      return NextResponse.json({ error: "サイトIDは必須です。" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    await ensureTable(sql);

    // 所有権チェック
    const existing = await sql`SELECT id FROM sites WHERE id = ${id} AND user_email = ${session.user.email}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "サイトが見つかりません。" }, { status: 404 });
    }

    const analysisJson = latest_analysis ? JSON.stringify(latest_analysis) : null;
    const chatJson = chat_history ? JSON.stringify(chat_history) : null;
    const confirmed = strategy_confirmed === true || strategy_confirmed === false ? strategy_confirmed : null;

    const rows = await sql`
      UPDATE sites SET
        site_url = COALESCE(${site_url ?? null}, site_url),
        site_name = COALESCE(${site_name ?? null}, site_name),
        company_name = COALESCE(${company_name ?? null}, company_name),
        industry = COALESCE(${industry ?? null}, industry),
        target_customer = COALESCE(${target_customer ?? null}, target_customer),
        latest_analysis = CASE WHEN ${analysisJson} IS NOT NULL THEN ${analysisJson}::jsonb ELSE latest_analysis END,
        strategy_confirmed = CASE WHEN ${confirmed} IS NOT NULL THEN ${confirmed} ELSE strategy_confirmed END,
        strategy_confirmed_at = CASE WHEN ${confirmed} = TRUE AND strategy_confirmed = FALSE THEN NOW() ELSE strategy_confirmed_at END,
        chat_history = CASE WHEN ${chatJson} IS NOT NULL THEN ${chatJson}::jsonb ELSE chat_history END,
        updated_at = NOW()
      WHERE id = ${id} AND user_email = ${session.user.email}
      RETURNING *
    `;

    return NextResponse.json({ site: rows[0] });
  } catch (e) {
    console.error("PUT /api/sites error:", e);
    return NextResponse.json({ error: "サーバーエラー: " + e.message }, { status: 500 });
  }
}

// DELETE: サイト削除
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "サイトIDは必須です。" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    await ensureTable(sql);

    const rows = await sql`
      DELETE FROM sites WHERE id = ${id} AND user_email = ${session.user.email} RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "サイトが見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/sites error:", e);
    return NextResponse.json({ error: "サーバーエラー: " + e.message }, { status: 500 });
  }
}
