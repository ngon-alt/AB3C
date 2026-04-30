import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST: ユーザー向け Stripe Customer Portal セッションを発行し、リダイレクト用URLを返す
// - 支払い履歴の閲覧、領収書PDFダウンロード、カード情報更新、サブスク解約・プラン変更が可能
// - Customer ID は user_plans の stripe_subscription_id 経由で特定。なければ email で検索
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const email = session.user.email;
  try {
    const sql = neon(process.env.DATABASE_URL);
    let customerId = null;

    // 1. アクティブな subscription から customer ID を取得
    const planRows = await sql`
      SELECT stripe_subscription_id FROM user_plans
      WHERE user_email = ${email} AND status = 'active' AND stripe_subscription_id IS NOT NULL
      ORDER BY purchased_at DESC LIMIT 1
    `;
    if (planRows.length > 0 && planRows[0].stripe_subscription_id && planRows[0].stripe_subscription_id !== "admin_manual") {
      try {
        const sub = await stripe.subscriptions.retrieve(planRows[0].stripe_subscription_id);
        customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      } catch (e) {
        console.error("subscription retrieve error:", e?.message);
      }
    }

    // 2. フォールバック: email で Stripe 顧客検索
    if (!customerId) {
      try {
        const customers = await stripe.customers.search({
          query: `email:'${email}'`,
          limit: 1,
        });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      } catch (e) {
        console.error("customer search error:", e?.message);
      }
    }

    if (!customerId) {
      return NextResponse.json({
        error: "Stripe顧客情報が見つかりません。ご決済履歴がない場合はカスタマーポータルをご利用いただけません。",
      }, { status: 404 });
    }

    // リターン先 URL（Portal から戻ったときの遷移先）
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || `${url.protocol}//${url.host}`;
    const returnUrl = `${origin}/account`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (e) {
    console.error("Customer Portal session error:", e?.message);
    const detail = e?.raw?.message || e?.message || "不明なエラー";
    return NextResponse.json({
      error: "カスタマーポータルへのアクセスに失敗しました: " + detail,
    }, { status: 500 });
  }
}
