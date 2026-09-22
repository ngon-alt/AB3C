// ポイントの購入（従量・追加購入・サブスク）の Stripe チェックアウトを作る。
// 付与はポイント専用の webhook（/api/points/webhook）で行う。今の決済処理（/api/stripe/webhook）とは独立。
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { POINT_PURCHASES, POINT_TIERS, getActivePointSubscription } from "../../../lib/points";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const email = session.user.email;
  const { type, quantity, tier, interval } = await req.json();
  // 決済後の戻り先は、いま開いているドメインから組み立てる（preview・新規事業版の別ドメインでもそのまま動く）。
  // NEXTAUTH_URL は preview に https:// 付きで入っておらず、Stripe に「URLが不正」と断られた（2026-09-23）
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = `${proto}://${host}`;
  const successUrl = `${base}/points?purchased=1`;
  const cancelUrl = `${base}/points`;

  try {
    if (type === "payg" || type === "addon") {
      const item = POINT_PURCHASES[type];
      // 追加購入（1pt＝1円）はサブスク契約者だけ
      if (type === "addon" && !(await getActivePointSubscription(email))) {
        return Response.json({ error: "追加購入はプランをご契約中の方のみご利用いただけます" }, { status: 403 });
      }
      const qty = Math.min(Math.max(1, Math.floor(Number(quantity) || 1)), 100);
      const cs = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: item.priceId, quantity: qty, adjustable_quantity: { enabled: true, minimum: 1, maximum: 100 } }],
        customer_email: email,
        customer_creation: "always",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { kind: "points", type, email },
      });
      return Response.json({ url: cs.url });
    }

    if (type === "subscription") {
      const t = POINT_TIERS[tier];
      if (!t || !["month", "year"].includes(interval)) {
        return Response.json({ error: "プランの指定が不正です" }, { status: 400 });
      }
      // プラン変更の仕組みはまだ無いので、二重契約を止める
      const current = await getActivePointSubscription(email);
      if (current) {
        return Response.json({ error: `すでに「${current.tierLabel}」をご契約中です。プランの変更はお問い合わせください` }, { status: 409 });
      }
      const cs = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: interval === "year" ? t.priceYear : t.priceMonth, quantity: 1 }],
        customer_email: email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { kind: "points", type: "subscription", tier, interval, email },
        // 請求（invoice.paid）の側でもプランを判別できるよう、サブスク自体にも持たせる
        subscription_data: { metadata: { kind: "points", tier, interval, email } },
      });
      return Response.json({ url: cs.url });
    }

    return Response.json({ error: "購入の種類が不正です" }, { status: 400 });
  } catch (e) {
    console.error("[points/checkout] Stripe エラー:", e?.message || e);
    return Response.json({ error: "決済画面を開けませんでした。時間をおいてお試しください" }, { status: 500 });
  }
}
