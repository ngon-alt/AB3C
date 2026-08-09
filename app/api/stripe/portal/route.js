import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST: ユーザー向け Stripe Customer Portal セッションを発行し、リダイレクト用URLを返す
// - 支払い履歴の閲覧、領収書PDFダウンロード、カード情報更新、サブスク解約・プラン変更が可能
// - Customer ID の特定は「このログインメールでの決済記録（user_plans）」を起点にする。
//   かつては無条件で「ログインメール＝Stripe請求メール」の一致検索をしていたが、
//   決済画面で別メールを入力できる Payment Link 経由の購入で、決済に関係ない
//   アカウントに会社ライセンスのポータル（解約・カード変更まで可能）が開く
//   アカウント混線が起きたため廃止（2026-08-01 FutureShop星野さんの件）。
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const email = session.user.email;
  try {
    const sql = neon(process.env.DATABASE_URL);
    let customerId = null;

    try {
      await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)`;
    } catch (e) {}

    // 1. 決済時に webhook が保存した Stripe 顧客ID（最優先・解約後も領収書閲覧できるよう status は問わない）
    const idRows = await sql`
      SELECT stripe_customer_id FROM user_plans
      WHERE user_email = ${email} AND stripe_customer_id IS NOT NULL
      ORDER BY purchased_at DESC LIMIT 1
    `;
    if (idRows.length > 0) {
      customerId = idRows[0].stripe_customer_id;
    }

    // 2. subscription 経由で customer ID を取得（顧客ID保存開始前の既存サブスク契約向け）
    if (!customerId) {
      const planRows = await sql`
        SELECT stripe_subscription_id FROM user_plans
        WHERE user_email = ${email} AND stripe_subscription_id IS NOT NULL
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
    }

    // 3. フォールバック: email で Stripe 顧客検索。
    //    ただし「このログインメールでの Stripe 決済記録が DB にある」ユーザーに限定する。
    //    自前チェックアウトは customer_email にログインメールを固定しているため、
    //    この条件下では検索結果が本人の顧客であることが保証される。
    //    （決済記録のないアカウント＝星野さんのテストユーザーのようなケースはここで弾く）
    if (!customerId) {
      const purchaseRows = await sql`
        SELECT id FROM user_plans
        WHERE user_email = ${email}
          AND stripe_price_id IS NOT NULL AND stripe_price_id != 'admin_manual'
        LIMIT 1
      `;
      if (purchaseRows.length > 0) {
        try {
          const customers = await stripe.customers.search({
            query: `email:'${email}'`,
            limit: 1,
          });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            // 次回以降は保存済みIDの最短経路で開けるよう遅延バックフィル
            try {
              await sql`
                UPDATE user_plans SET stripe_customer_id = ${customerId}
                WHERE user_email = ${email} AND stripe_customer_id IS NULL
                  AND stripe_price_id IS NOT NULL AND stripe_price_id != 'admin_manual'
              `;
            } catch (e) {}
          }
        } catch (e) {
          console.error("customer search error:", e?.message);
        }
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
