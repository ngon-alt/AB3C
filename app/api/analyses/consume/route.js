import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// 戦略診断チケット（plan_type='analysis'）の分析回数を1消費する
// 全3レポート成功後にクライアントから呼び出される
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // 戦略診断チケットを持っているか確認
    const planRows = await sql`
      SELECT id, site_limit, analyses_used FROM user_plans
      WHERE user_email = ${session.user.email}
        AND plan_type = 'analysis'
        AND status = 'active'
      ORDER BY purchased_at DESC
      LIMIT 1
    `;

    if (planRows.length === 0) {
      // 診断チケットを持っていない（戦略指南プラン or 無料）→ 消費処理不要
      return NextResponse.json({ ok: true, consumed: false, reason: "not_analysis_plan" });
    }

    const plan = planRows[0];
    const nextUsed = (plan.analyses_used || 0) + 1;

    if (nextUsed > plan.site_limit) {
      return NextResponse.json({
        error: "診断回数の上限に達しました。",
        used: plan.analyses_used,
        limit: plan.site_limit,
      }, { status: 403 });
    }

    await sql`
      UPDATE user_plans SET analyses_used = ${nextUsed}
      WHERE id = ${plan.id}
    `;

    return NextResponse.json({
      ok: true,
      consumed: true,
      used: nextUsed,
      limit: plan.site_limit,
      remaining: plan.site_limit - nextUsed,
    });
  } catch (e) {
    console.error("POST /api/analyses/consume error:", e);
    return NextResponse.json({ error: "消費処理に失敗しました。" }, { status: 500 });
  }
}
