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
        improve_result JSONB,
        visual_mock JSONB,
        analyzed_at TIMESTAMPTZ,
        strategy_confirmed BOOLEAN DEFAULT FALSE,
        strategy_confirmed_at TIMESTAMPTZ,
        chat_history JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS improve_result JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS visual_mock JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sites_user_email ON sites(user_email)`;
    await sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        site_limit INTEGER NOT NULL,
        analyses_used INTEGER DEFAULT 0,
        interval VARCHAR(10) NOT NULL,
        stripe_price_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS analyses_used INTEGER DEFAULT 0`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_plans_email ON user_plans(user_email)`;
    tableReady = true;
  } catch (e) {
    console.error("ensureTable error:", e);
    throw e;
  }
}

// ユーザーのサイト上限を取得（複数プラン所持時はサイト枠を合算）
async function getSiteLimit(sql, email) {
  const plans = await sql`
    SELECT COALESCE(SUM(site_limit), 0) as total_sites FROM user_plans
    WHERE user_email = ${email} AND status = 'active'
  `;
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
  // user_plansにプランがあればその合計を優先
  if (plans[0]?.total_sites > 0) return parseInt(plans[0].total_sites);
  // PRO会員（プランなし）は無制限
  if (proRows.length > 0) return 999;
  return 1; // プランなし = 1サイト（無料）
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

    // URL重複チェック（末尾スラッシュ・プロトコルの違いを吸収）
    if (site_url) {
      const allSites = await sql`SELECT id, site_name, site_url FROM sites WHERE user_email = ${session.user.email}`;
      const normalize = u => u?.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
      const existing = allSites.find(s => normalize(s.site_url) === normalize(site_url));
      if (existing) {
        return NextResponse.json({ error: `このURLは既に「${existing.site_name}」として登録されています。`, existingSite: existing }, { status: 409 });
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
    const { id, site_url, site_name, company_name, industry, target_customer, latest_analysis, improve_result, visual_mock, analyzed_at, strategy_confirmed, chat_history } = body;

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
    const improveJson = improve_result ? JSON.stringify(improve_result) : null;
    const visualJson = visual_mock ? JSON.stringify(visual_mock) : null;
    const analyzedAtVal = analyzed_at ? new Date(analyzed_at).toISOString() : null;
    const chatJson = chat_history ? JSON.stringify(chat_history) : null;
    const confirmed = strategy_confirmed === true || strategy_confirmed === false ? strategy_confirmed : null;

    const siteUrlVal = site_url !== undefined ? site_url : null;
    const siteNameVal = site_name !== undefined ? site_name : null;
    const companyVal = company_name !== undefined ? company_name : null;
    const industryVal = industry !== undefined ? industry : null;
    const targetVal = target_customer !== undefined ? target_customer : null;

    const rows = await sql`
      UPDATE sites SET
        site_url = COALESCE(${siteUrlVal}::text, site_url),
        site_name = COALESCE(${siteNameVal}::text, site_name),
        company_name = COALESCE(${companyVal}::text, company_name),
        industry = COALESCE(${industryVal}::text, industry),
        target_customer = COALESCE(${targetVal}::text, target_customer),
        latest_analysis = CASE WHEN ${analysisJson}::text IS NOT NULL THEN (${analysisJson}::jsonb) ELSE latest_analysis END,
        improve_result = CASE WHEN ${improveJson}::text IS NOT NULL THEN (${improveJson}::jsonb) ELSE improve_result END,
        visual_mock = CASE WHEN ${visualJson}::text IS NOT NULL THEN (${visualJson}::jsonb) ELSE visual_mock END,
        analyzed_at = CASE WHEN ${analyzedAtVal}::text IS NOT NULL THEN ${analyzedAtVal}::timestamptz ELSE analyzed_at END,
        strategy_confirmed = CASE WHEN ${confirmed}::boolean IS NOT NULL THEN ${confirmed}::boolean ELSE strategy_confirmed END,
        strategy_confirmed_at = CASE WHEN ${confirmed}::boolean = TRUE AND strategy_confirmed = FALSE THEN NOW() ELSE strategy_confirmed_at END,
        chat_history = CASE WHEN ${chatJson}::text IS NOT NULL THEN (${chatJson}::jsonb) ELSE chat_history END,
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
