import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// 戦略診断チケット（plan_type='analysis'）の分析回数を1消費する
// 全3レポート成功後にクライアントから呼び出される
// 複数回購入されている場合は FIFO（古い購入から順）で消費する
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // active な戦略診断チケットを古い順に全件取得（FIFO で消費するため）
    const planRows = await sql`
      SELECT id, site_limit, analyses_used, purchased_at FROM user_plans
      WHERE user_email = ${session.user.email}
        AND plan_type = 'analysis'
        AND status = 'active'
      ORDER BY purchased_at ASC
    `;

    if (planRows.length === 0) {
      // 診断チケットを持っていない（戦略指南プラン or 無料）→ 消費処理不要
      return NextResponse.json({ ok: true, consumed: false, reason: "not_analysis_plan" });
    }

    // 残り回数がある最も古いプランを特定
    const target = planRows.find(p => parseInt(p.analyses_used || 0) < parseInt(p.site_limit || 0));
    if (!target) {
      const totalLimit = planRows.reduce((s, r) => s + parseInt(r.site_limit || 0), 0);
      const totalUsed = planRows.reduce((s, r) => s + parseInt(r.analyses_used || 0), 0);
      return NextResponse.json({
        error: "診断回数の上限に達しました。",
        used: totalUsed,
        limit: totalLimit,
      }, { status: 403 });
    }

    const nextUsed = parseInt(target.analyses_used || 0) + 1;
    await sql`
      UPDATE user_plans SET analyses_used = ${nextUsed}
      WHERE id = ${target.id}
    `;

    // 合計ベースで残数を返す（UI 側の表示はすべて合算）
    const totalLimit = planRows.reduce((s, r) => s + parseInt(r.site_limit || 0), 0);
    const totalUsed = planRows.reduce((s, r) => s + parseInt(r.analyses_used || 0), 0) + 1;

    return NextResponse.json({
      ok: true,
      consumed: true,
      used: totalUsed,
      limit: totalLimit,
      remaining: Math.max(0, totalLimit - totalUsed),
      consumedFrom: target.id, // デバッグ用: どの購入レコードから消費したか
    });
  } catch (e) {
    console.error("POST /api/analyses/consume error:", e);
    return NextResponse.json({ error: "消費処理に失敗しました。" }, { status: 500 });
  }
}
