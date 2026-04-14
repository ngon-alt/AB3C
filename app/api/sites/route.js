import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// テーブル作成（なければ）
let tableReady = false;
async function ensureTable(sql) {
  if (tableReady) return;
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
    await sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        site_limit INTEGER NOT NULL,
        interval VARCHAR(10) NOT NULL,
        stripe_price_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_plans_email ON user_plans(user_email)`;
    tableReady = true;
  } catch (e) {
    console.error("ensureTable error:", e);
    throw e;
  }
}

// ユーザーのサイト上限を取得
async function getSiteLimit(sql, email) {
  const plans = await sql`
    SELECT MAX(site_limit) as max_sites FROM user_plans
    WHERE user_email = ${email} AND status = 'active'
  `;
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
  if (proRows.length > 0) return 999; // PRO会員は実質無制限
  return plans[0]?.max_sites || 1; // プランなし = 1サイト（無料）
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
    const planLimit = await getSiteLimit(sql, session.user.email);

    return NextResponse.json({ sites, planLimit });
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

    // サイト数制限チェック
    const planLimit = await getSiteLimit(sql, session.user.email);
    const countResult = await sql`SELECT COUNT(*) as count FROM sites WHERE user_email = ${session.user.email}`;
    const currentCount = parseInt(countResult[0].count);
    if (currentCount >= planLimit) {
      return NextResponse.json({ error: `サイト数の上限（${planLimit}サイト）に達しています。プランのアップグレードが必要です。`, planLimit, currentCount }, { status: 403 });
    }

    // URL重複チェック
    if (site_url) {
      const existing = await sql`SELECT id, site_name FROM sites WHERE user_email = ${session.user.email} AND site_url = ${site_url}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: `このURLは既に「${existing[0].site_name}」として登録されています。`, existingSite: existing[0] }, { status: 409 });
      }
    }

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
