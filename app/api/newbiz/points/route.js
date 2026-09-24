// 新規事業版のポイント操作（お試しの付与・消費・取り消し）
//
// 正典: docs/新規事業版-画面遷移設計-20260924.md 5章
// ・分析は「始める時に引き、失敗したら元の束に戻す」
// ・ヒアリングは0ポイント（分析の10,000ポイントに含む）
// ・お試し12,700ポイントは、ヒアリングを始めるとき（＝初回ログイン後）に一度だけ付与
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  getBalance, grantPoints, consumePoints, refundPoints,
  POINT_COSTS, TRIAL_POINTS,
} from "../../../lib/points";
import { neon } from "@neondatabase/serverless";

// 新規事業版で消費する操作だけを、サーバー側の表で持つ。
// ブラウザから金額を送らせない（送らせると値を書き換えられる）。
const SPEND = {
  analyze_standard: POINT_COSTS.analyze_standard, // 10,000
  reanalyze: POINT_COSTS.reanalyze,               //  1,000
  chat: POINT_COSTS.chat,                         //    100
  action_first: POINT_COSTS.action_first,         //  1,000
};

let sqlClient = null;
function getSql() {
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

// お試しを既に受け取っているか（同じ人に二度渡さない）
// 帳簿側は user_email を小文字に揃えて保存するので、ここでも同じ形に揃えて照らす
async function hasTrial(email) {
  const sql = getSql();
  const e = String(email || "").trim().toLowerCase();
  const rows = await sql`
    SELECT 1 FROM point_lots WHERE user_email = ${e} AND source = 'trial' LIMIT 1
  `;
  return rows.length > 0;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  try {
    const { balance, nextExpiry } = await getBalance(session.user.email);
    return NextResponse.json({ balance, nextExpiry, costs: SPEND, trialPoints: TRIAL_POINTS });
  } catch (e) {
    console.error("[newbiz/points] 残高の取得に失敗:", e?.message || e);
    return NextResponse.json({ error: "残高を取得できませんでした" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const email = session.user.email;
  const { action, feature, ref, businessId } = await req.json();

  try {
    if (action === "trial") {
      if (await hasTrial(email)) {
        const { balance } = await getBalance(email);
        return NextResponse.json({ granted: false, balance });
      }
      await grantPoints({
        email, points: TRIAL_POINTS, source: "trial",
        note: "新規事業版のお試し", createdBy: "newbiz",
      });
      const { balance } = await getBalance(email);
      return NextResponse.json({ granted: true, balance, points: TRIAL_POINTS });
    }

    if (action === "spend") {
      const points = SPEND[feature];
      if (points === undefined) return NextResponse.json({ error: "操作が不明です" }, { status: 400 });
      // 取り消しに使う一意の印
      const txRef = `newbiz:${feature}:${businessId || "-"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const res = await consumePoints({
        email, points, feature, ref: txRef,
        meta: { edition: "newbiz", businessId: businessId || null },
      });
      if (!res.ok) {
        return NextResponse.json({
          error: "ポイントが足りません", shortfall: res.shortfall, balance: res.balance, required: points,
        }, { status: 402 });
      }
      const { balance } = await getBalance(email);
      return NextResponse.json({ ok: true, ref: txRef, consumed: res.consumed, balance });
    }

    if (action === "refund") {
      if (!ref) return NextResponse.json({ error: "取り消す対象がありません" }, { status: 400 });
      await refundPoints({ email, ref });
      const { balance } = await getBalance(email);
      return NextResponse.json({ ok: true, balance });
    }

    return NextResponse.json({ error: "操作が不明です" }, { status: 400 });
  } catch (e) {
    console.error("[newbiz/points] 失敗:", e?.message || e);
    return NextResponse.json({ error: "処理できませんでした" }, { status: 500 });
  }
}
