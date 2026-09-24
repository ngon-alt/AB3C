// 新規事業版の「事業」データ（sites テーブルを kind='newbiz' で共用する）
//
// 正典: docs/新規事業版-画面遷移設計-20260924.md
// 混線防止（0-2章）: kind は **サーバー側の定数** で固定し、ブラウザからは指定させない。
// 現行版の /api/sites は kind = EDITION（senryaku.ai では 'site'）で絞っているので、
// ここで作った行が現行版の一覧に出ることはない。EDITION の設定有無に関わらず成立する。
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const KIND = "newbiz"; // ← ここだけ。リクエストからは絶対に受け取らない

let sqlClient = null;
function getSql() {
  // モジュールスコープで neon() を呼ぶと DATABASE_URL の無いビルド環境で next build が落ちる
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

let tableReady = false;
async function ensureTable(sql) {
  if (tableReady) return;
  // kind 列は /api/sites 側の ensureTable が作る。ここでは新規事業版だけが使う列を足す。
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS hearing JSONB`;
  tableReady = true;
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return session;
}

export async function GET(req) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const sql = getSql();
  await ensureTable(sql);
  const id = new URL(req.url).searchParams.get("id");
  const email = session.user.email;

  try {
    if (id) {
      const rows = await sql`
        SELECT id, site_name, input_text, hearing, latest_analysis, analysis_versions,
               strategy_confirmed, strategy_confirmed_at, created_at, updated_at
        FROM sites WHERE id::text = ${id} AND user_email = ${email} AND kind = ${KIND}
      `;
      // 相手側（現行版）の行を踏んでも中身は返さない
      if (!rows[0]) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
      return NextResponse.json({ business: rows[0] });
    }
    const rows = await sql`
      SELECT id, site_name, latest_analysis IS NOT NULL AS analyzed, strategy_confirmed, updated_at,
             (hearing->>'complete')::boolean AS hearing_complete
      FROM sites WHERE user_email = ${email} AND kind = ${KIND}
      ORDER BY updated_at DESC
    `;
    return NextResponse.json({ businesses: rows });
  } catch (e) {
    console.error("[newbiz/business] 取得に失敗:", e?.message || e);
    return NextResponse.json({ error: "取得できませんでした" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const sql = getSql();
  await ensureTable(sql);
  const email = session.user.email;
  const body = await req.json();
  const { action } = body;

  try {
    if (action === "create") {
      const rows = await sql`
        INSERT INTO sites (user_email, site_name, kind, hearing)
        VALUES (${email}, ${"（名称未設定）"}, ${KIND}, ${JSON.stringify({ messages: [], step: 1, complete: false })}::jsonb)
        RETURNING id, site_name
      `;
      return NextResponse.json({ business: rows[0] });
    }

    if (action === "save") {
      const { id, hearing, siteName, analysis, inputText } = body;
      if (!id) return NextResponse.json({ error: "事業が指定されていません" }, { status: 400 });
      // 自分の・新規事業版の行だけを対象にする
      const own = await sql`SELECT id FROM sites WHERE id::text = ${id} AND user_email = ${email} AND kind = ${KIND}`;
      if (!own[0]) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

      if (hearing !== undefined) {
        await sql`UPDATE sites SET hearing = ${JSON.stringify(hearing)}::jsonb, updated_at = NOW() WHERE id::text = ${id}`;
      }
      if (siteName) {
        await sql`UPDATE sites SET site_name = ${String(siteName).slice(0, 200)}, updated_at = NOW() WHERE id::text = ${id}`;
      }
      if (inputText !== undefined) {
        await sql`UPDATE sites SET input_text = ${inputText}, updated_at = NOW() WHERE id::text = ${id}`;
      }
      if (analysis !== undefined) {
        await sql`
          UPDATE sites
          SET latest_analysis = ${JSON.stringify(analysis)}::jsonb,
              analyzed_at = NOW(), updated_at = NOW()
          WHERE id::text = ${id}
        `;
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "事業が指定されていません" }, { status: 400 });
      const rows = await sql`
        DELETE FROM sites WHERE id::text = ${id} AND user_email = ${email} AND kind = ${KIND} RETURNING id
      `;
      if (!rows[0]) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "操作が不明です" }, { status: 400 });
  } catch (e) {
    console.error("[newbiz/business] 保存に失敗:", e?.message || e);
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }
}
