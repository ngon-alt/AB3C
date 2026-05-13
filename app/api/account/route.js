import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Stripe からサブスクリプションの解約予定状態を取得する。
// cancel_at_period_end が true なら解約予定で、cancel_at（または current_period_end）の日付で終了する。
// 失敗時は null を返して既存挙動にフォールバック。
async function getSubscriptionCancellationStatus(subscriptionId) {
  if (!stripe || !subscriptionId) return null;
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    // status は 'active' / 'canceled' / 'past_due' 等
    return {
      status: sub.status,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    };
  } catch (e) {
    console.error("Stripe subscription retrieve error:", subscriptionId, e?.message);
    return null;
  }
}

// GET: マイアカウントページに表示する情報をまとめて返す
// - users テーブル: メール / 名前 / 利用目的 / 登録日
// - pro_users / user_plans: 契約状況
// - sites: 登録サイト数
// - tickets: 残チャットチケット数（has 月次リセット）
// - 月次サイト登録枠の残数（戦略指南サブスク）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const email = session.user.email;
  try {
    const sql = neon(process.env.DATABASE_URL);

    // ユーザー情報
    let user = { email, name: session.user.name || "", purpose: null, created_at: null };
    try {
      const userRows = await sql`
        SELECT email, name, purpose, created_at FROM users WHERE email = ${email} LIMIT 1
      `;
      if (userRows.length > 0) {
        user = {
          email: userRows[0].email,
          name: userRows[0].name || session.user.name || "",
          purpose: userRows[0].purpose,
          created_at: userRows[0].created_at,
        };
      }
    } catch (e) { console.error("users table read error:", e?.message); }

    // プロ会員チェック
    const proRows = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
    const isPro = proRows.length > 0;

    // 契約プラン（active のみ）
    let plans = [];
    try {
      plans = await sql`
        SELECT id, plan_type, site_limit, analyses_used, expires_at, interval, purchased_at,
               stripe_subscription_id,
               COALESCE(monthly_registrations_used, 0) as monthly_registrations_used,
               COALESCE(is_trial, FALSE) as is_trial
        FROM user_plans
        WHERE user_email = ${email} AND status = 'active'
          AND (COALESCE(is_trial, FALSE) = FALSE OR expires_at > NOW())
        ORDER BY CASE WHEN plan_type = 'support' THEN 0 ELSE 1 END, purchased_at DESC
      `;
    } catch (e) { console.error("user_plans read error:", e?.message); }

    // 各サブスクリプションプランの解約予定状態を Stripe から取得して plans にマージ。
    // 戦略診断チケットはサブスクではないので不要（stripe_subscription_id が無いものはスキップ）。
    if (stripe && plans.length > 0) {
      const enriched = await Promise.all(plans.map(async (p) => {
        if (!p.stripe_subscription_id || p.plan_type !== "support") return p;
        const status = await getSubscriptionCancellationStatus(p.stripe_subscription_id);
        if (!status) return p;
        return Object.assign({}, p, {
          stripe_status: status.status,
          cancel_at_period_end: status.cancelAtPeriodEnd,
          cancel_at: status.cancelAt,
          current_period_end: status.currentPeriodEnd,
        });
      }));
      plans = enriched;
    }

    // 過去のプラン履歴（Portal リンク表示判定用 — 解約済みでも領収書は閲覧可能なため）
    let hasAnyPlan = false;
    try {
      const r = await sql`SELECT COUNT(*) as count FROM user_plans WHERE user_email = ${email}`;
      hasAnyPlan = parseInt(r[0]?.count || 0) > 0;
    } catch (e) {}

    // 登録サイト数
    let siteCount = 0;
    try {
      const r = await sql`SELECT COUNT(*) as count FROM sites WHERE user_email = ${email}`;
      siteCount = parseInt(r[0]?.count || 0);
    } catch (e) {}

    // チャット残（is_trial=FALSE）
    let chatTickets = 0;
    try {
      const r = await sql`
        SELECT COALESCE(SUM(remaining_chats), 0) as total FROM tickets
        WHERE email = ${email} AND remaining_chats > 0 AND is_trial = FALSE
      `;
      chatTickets = parseInt(r[0]?.total || 0);
    } catch (e) {}

    // トライアルチャット残
    let trialChats = 0;
    try {
      const r = await sql`
        SELECT COALESCE(SUM(remaining_chats), 0) as total FROM tickets
        WHERE email = ${email} AND remaining_chats > 0 AND is_trial = TRUE
          AND (expires_at IS NULL OR expires_at > NOW())
      `;
      trialChats = parseInt(r[0]?.total || 0);
    } catch (e) {}

    // 月次登録枠（指南プラン）の使用状況
    const supportPlans = plans.filter(p => p.plan_type === "support");
    const totalSiteLimit = supportPlans.reduce((s, p) => s + parseInt(p.site_limit || 0), 0);
    const totalMonthlyUsed = supportPlans.reduce((s, p) => s + parseInt(p.monthly_registrations_used || 0), 0);
    const monthlyLimit = totalSiteLimit * 2; // 契約サイト数 × 2 が月次登録上限
    const monthlyRemaining = Math.max(0, monthlyLimit - totalMonthlyUsed);

    // Stripe customer ID が紐付いているかどうか（Portal リンクの表示制御に使用）
    // active プラン or 過去のプラン履歴 or PROユーザーなら Portal を試す価値あり
    const hasStripeCustomer = hasAnyPlan || isPro;

    return NextResponse.json({
      user,
      isPro,
      plans,
      siteCount,
      chatTickets,
      trialChats,
      monthly: {
        limit: monthlyLimit,
        used: totalMonthlyUsed,
        remaining: monthlyRemaining,
        isSupport: supportPlans.length > 0,
      },
      hasStripeCustomer,
    });
  } catch (e) {
    console.error("/api/account error:", e?.message);
    return NextResponse.json({ error: "アカウント情報の取得に失敗しました" }, { status: 500 });
  }
}
