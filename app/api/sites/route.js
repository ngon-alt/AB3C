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
        confirmations JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS improve_result JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS visual_mock JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS confirmations JSONB`;
    // 戦略アクションフェーズのデータ永続化用（別ブラウザでも履歴を引き継げるように）
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS threads JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS theme_chats JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS thread_messages JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS actions JSONB`;
    // 戦略策定タブの進行中チャット（確定前の議論）の永続化
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS analysis_chat JSONB`;
    // 分析結果の世代履歴（最大5世代・新しい順）。各要素 { id, result, created_at, source, confirmed }
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS analysis_versions JSONB DEFAULT '[]'::jsonb`;
    // パターン別の改善レポート/ビジュアルモックキャッシュ（{ comboId: data, ... }）
    // 全パターンを一度生成すれば次回以降の切替が高速。reload しても保持される。
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS improve_results_by_combination JSONB`;
    await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS visual_mocks_by_combination JSONB`;
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
    await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS monthly_registrations_used INTEGER DEFAULT 0`;
    await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS monthly_registrations_reset_at TIMESTAMPTZ`;
    // 既存の戦略指南プラン契約者に対する初回バックフィル:
    // 既に登録済みのサイト数分を「月次登録済み」としてカウントし、
    // 月初からの登録猶予が過剰に付与されないようにする。
    // monthly_registrations_reset_at が NULL のプランにのみ適用（＝未バックフィル）。
    await sql`
      UPDATE user_plans SET
        monthly_registrations_used = COALESCE((
          SELECT COUNT(*) FROM sites WHERE sites.user_email = user_plans.user_email
        ), 0),
        monthly_registrations_reset_at = NOW()
      WHERE plan_type = 'support' AND status = 'active' AND monthly_registrations_reset_at IS NULL
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_plans_email ON user_plans(user_email)`;
    tableReady = true;
  } catch (e) {
    console.error("ensureTable error:", e);
    throw e;
  }
}

// ユーザーのサイト登録上限を取得
//  - 戦略指南プラン（support）の site_limit が登録可能サイト数の上限
//  - 戦略診断チケット（analysis）は「回数チケット」のためサイトスロットにはカウントしない
//  - PRO会員は無制限
async function getSiteLimit(sql, email) {
  const supportPlans = await sql`
    SELECT COALESCE(SUM(site_limit), 0) as total_sites FROM user_plans
    WHERE user_email = ${email} AND status = 'active' AND plan_type = 'support'
  `;
  const proRows = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
  if (supportPlans[0]?.total_sites > 0) return parseInt(supportPlans[0].total_sites);
  if (proRows.length > 0) return 999;
  return 1; // 支援プランなし = 1サイト（無料 or 診断のみ）
}

// 戦略指南プラン契約者の月次登録上限情報を取得
// - 対象: 戦略指南プラン（type='support'）のみ。戦略診断チケットは対象外。
// - 上限: 契約サイト数 × 2（初期登録1 + 月1回までの入れ替え）
async function getMonthlyRegistrationInfo(sql, email) {
  const plans = await sql`
    SELECT id, site_limit, COALESCE(monthly_registrations_used, 0) as used
    FROM user_plans
    WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
    ORDER BY purchased_at ASC
  `;
  if (plans.length === 0) return { isSupport: false, limit: 0, used: 0, plans: [] };
  const totalSiteLimit = plans.reduce((s, p) => s + parseInt(p.site_limit || 0), 0);
  const totalUsed = plans.reduce((s, p) => s + parseInt(p.used || 0), 0);
  return {
    isSupport: true,
    limit: totalSiteLimit * 2,
    used: totalUsed,
    remaining: Math.max(0, totalSiteLimit * 2 - totalUsed),
    plans,
  };
}

// 既存サイト用: analysis_versions が空なら latest_analysis から v1 を生成して返す
// （DB の書き込みは行わない。フロントは常に analysis_versions を読めば良い形に整形）
function synthesizeVersionsForSite(site) {
  if (!site) return site;
  const hasVersions = Array.isArray(site.analysis_versions) && site.analysis_versions.length > 0;
  if (hasVersions) return site;
  if (!site.latest_analysis) return { ...site, analysis_versions: [] };
  const ts = site.analyzed_at ? new Date(site.analyzed_at).getTime() : Date.now();
  return {
    ...site,
    analysis_versions: [
      {
        id: ts,
        result: site.latest_analysis,
        created_at: site.analyzed_at ? new Date(site.analyzed_at).toISOString() : new Date().toISOString(),
        source: "initial",
        confirmed: !!site.strategy_confirmed,
      },
    ],
  };
}

// GET: ユーザーのサイト一覧取得
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const sql = neon(process.env.DATABASE_URL);
    await ensureTable(sql);

    const rawSites = await sql`
      SELECT * FROM sites
      WHERE user_email = ${session.user.email}
      ORDER BY updated_at DESC
    `;
    const sites = rawSites.map(synthesizeVersionsForSite);
    const planLimit = await getSiteLimit(sql, session.user.email);
    const monthly = await getMonthlyRegistrationInfo(sql, session.user.email);

    return NextResponse.json({
      sites,
      planLimit,
      monthlyRegistrationLimit: monthly.isSupport ? monthly.limit : null,
      monthlyRegistrationUsed: monthly.isSupport ? monthly.used : null,
      monthlyRegistrationRemaining: monthly.isSupport ? monthly.remaining : null,
    });
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

    // 月次登録上限チェック（戦略指南プラン契約者のみ: 契約サイト数 × 3）
    const monthly = await getMonthlyRegistrationInfo(sql, session.user.email);
    if (monthly.isSupport && monthly.used >= monthly.limit) {
      return NextResponse.json({
        error: `今月のサイト登録上限に達しました。次回のご契約更新日以降、新しいサイトを登録できます。`,
        monthlyLimit: monthly.limit,
        monthlyUsed: monthly.used,
      }, { status: 403 });
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

    // 戦略指南プラン契約者は月次登録カウンタを +1（購入日が古いプランから消費）
    if (monthly.isSupport && monthly.plans.length > 0) {
      const targetPlan = monthly.plans.find(p => parseInt(p.used || 0) < parseInt(p.site_limit || 0) * 3) || monthly.plans[0];
      await sql`
        UPDATE user_plans SET monthly_registrations_used = COALESCE(monthly_registrations_used, 0) + 1
        WHERE id = ${targetPlan.id}
      `;
    }

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
    const { id, site_url, site_name, company_name, industry, target_customer, latest_analysis, improve_result, visual_mock, analyzed_at, strategy_confirmed, chat_history, confirmations, threads, theme_chats, thread_messages, actions, analysis_chat, version_source, improve_results_by_combination, visual_mocks_by_combination } = body;

    if (!id) {
      return NextResponse.json({ error: "サイトIDは必須です。" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    await ensureTable(sql);

    // 所有権チェック + 現状の analysis_versions / latest_analysis / analyzed_at / strategy_confirmed を取得
    const existing = await sql`
      SELECT id, latest_analysis, analysis_versions, analyzed_at, strategy_confirmed
      FROM sites WHERE id = ${id} AND user_email = ${session.user.email}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: "サイトが見つかりません。" }, { status: 404 });
    }

    // === 分析結果の世代履歴を自動管理 ===
    // ルール:
    //  - latest_analysis が新規付与され、現行 versions[0] と中身が違う場合のみ新世代として先頭に追加
    //  - 最大5世代まで保持（古いものは末尾から削除）
    //  - versions が空でも既存 latest_analysis があれば、それを v1 として保存してから新結果を v2 に積む（既存サイトのマイグレーション）
    //  - strategy_confirmed=true を受け取ったら versions[0].confirmed を true に
    let versionsUpdate = null; // null の場合は変更しない
    const existingRow = existing[0];
    const currentVersions = Array.isArray(existingRow.analysis_versions) ? existingRow.analysis_versions : [];
    const existingLatest = existingRow.latest_analysis || null;
    const existingAnalyzedAt = existingRow.analyzed_at ? new Date(existingRow.analyzed_at).getTime() : null;

    if (latest_analysis) {
      const newResultStr = JSON.stringify(latest_analysis);
      const headResultStr = currentVersions[0] ? JSON.stringify(currentVersions[0].result) : null;
      if (currentVersions.length === 0) {
        // versions 未初期化のサイト
        // - 既存 latest_analysis がある & 新結果と異なる → 既存を v1、新規を v2
        // - 既存 latest_analysis がない、または新規と同じ → 新規だけを v1
        const existingLatestStr = existingLatest ? JSON.stringify(existingLatest) : null;
        if (existingLatest && existingLatestStr !== newResultStr) {
          const v1 = {
            id: existingAnalyzedAt || Date.now() - 1,
            result: existingLatest,
            created_at: new Date(existingAnalyzedAt || Date.now() - 1).toISOString(),
            source: "initial",
            confirmed: !!existingRow.strategy_confirmed,
          };
          const v2 = {
            id: Date.now(),
            result: latest_analysis,
            created_at: new Date().toISOString(),
            source: version_source || "reanalyze",
            confirmed: false,
          };
          versionsUpdate = [v2, v1];
        } else {
          versionsUpdate = [{
            id: Date.now(),
            result: latest_analysis,
            created_at: new Date().toISOString(),
            source: version_source || "initial",
            confirmed: !!existingRow.strategy_confirmed,
          }];
        }
      } else if (newResultStr !== headResultStr) {
        // 新世代: 先頭に追加して 5 件で打ち切り
        const newVersion = {
          id: Date.now(),
          result: latest_analysis,
          created_at: new Date().toISOString(),
          source: version_source || "reanalyze",
          confirmed: false,
        };
        versionsUpdate = [newVersion, ...currentVersions].slice(0, 5);
      }
      // 同じ内容なら versionsUpdate は null のまま（変更しない）
    }

    // 確定マークの反映
    if (strategy_confirmed === true) {
      const targetVersions = versionsUpdate || (currentVersions.length > 0 ? [...currentVersions] : null);
      if (targetVersions && targetVersions.length > 0) {
        targetVersions[0] = { ...targetVersions[0], confirmed: true };
        versionsUpdate = targetVersions;
      }
    }

    const versionsJson = versionsUpdate ? JSON.stringify(versionsUpdate) : null;
    const analysisJson = latest_analysis ? JSON.stringify(latest_analysis) : null;
    const improveJson = improve_result ? JSON.stringify(improve_result) : null;
    const visualJson = visual_mock ? JSON.stringify(visual_mock) : null;
    const analyzedAtVal = analyzed_at ? new Date(analyzed_at).toISOString() : null;
    const chatJson = chat_history ? JSON.stringify(chat_history) : null;
    // confirmations は空配列[] もユーザー意図（解除後の状態保存等）なので許容する
    const confirmationsJson = Array.isArray(confirmations) ? JSON.stringify(confirmations) : null;
    // 戦略アクションフェーズのデータ。null は「未指定」、空配列・空オブジェクトは「クリアの意図」として保存
    const threadsJson = Array.isArray(threads) ? JSON.stringify(threads) : null;
    const themeChatsJson = (theme_chats && typeof theme_chats === "object") ? JSON.stringify(theme_chats) : null;
    const threadMessagesJson = (thread_messages && typeof thread_messages === "object") ? JSON.stringify(thread_messages) : null;
    const actionsJson = Array.isArray(actions) ? JSON.stringify(actions) : null;
    // 戦略策定タブの進行中チャット
    const analysisChatJson = Array.isArray(analysis_chat) ? JSON.stringify(analysis_chat) : null;
    // パターン別の改善レポート/ビジュアルキャッシュ。空オブジェクト{} もクリア意図ではなく「指定なし」として無視
    const improveByComboJson = (improve_results_by_combination && typeof improve_results_by_combination === "object" && Object.keys(improve_results_by_combination).length > 0) ? JSON.stringify(improve_results_by_combination) : null;
    const visualByComboJson = (visual_mocks_by_combination && typeof visual_mocks_by_combination === "object" && Object.keys(visual_mocks_by_combination).length > 0) ? JSON.stringify(visual_mocks_by_combination) : null;
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
        confirmations = CASE WHEN ${confirmationsJson}::text IS NOT NULL THEN (${confirmationsJson}::jsonb) ELSE confirmations END,
        threads = CASE WHEN ${threadsJson}::text IS NOT NULL THEN (${threadsJson}::jsonb) ELSE threads END,
        theme_chats = CASE WHEN ${themeChatsJson}::text IS NOT NULL THEN (${themeChatsJson}::jsonb) ELSE theme_chats END,
        thread_messages = CASE WHEN ${threadMessagesJson}::text IS NOT NULL THEN (${threadMessagesJson}::jsonb) ELSE thread_messages END,
        actions = CASE WHEN ${actionsJson}::text IS NOT NULL THEN (${actionsJson}::jsonb) ELSE actions END,
        analysis_chat = CASE WHEN ${analysisChatJson}::text IS NOT NULL THEN (${analysisChatJson}::jsonb) ELSE analysis_chat END,
        analysis_versions = CASE WHEN ${versionsJson}::text IS NOT NULL THEN (${versionsJson}::jsonb) ELSE analysis_versions END,
        improve_results_by_combination = CASE WHEN ${improveByComboJson}::text IS NOT NULL THEN (${improveByComboJson}::jsonb) ELSE improve_results_by_combination END,
        visual_mocks_by_combination = CASE WHEN ${visualByComboJson}::text IS NOT NULL THEN (${visualByComboJson}::jsonb) ELSE visual_mocks_by_combination END,
        updated_at = NOW()
      WHERE id = ${id} AND user_email = ${session.user.email}
      RETURNING *
    `;

    return NextResponse.json({ site: synthesizeVersionsForSite(rows[0]) });
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
