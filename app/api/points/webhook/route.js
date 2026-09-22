// ポイント専用の Stripe webhook（2026-09-23）
//
// 今の戦略指南の決済処理（/api/stripe/webhook）には一切手を入れず、ポイントの決済だけをここで処理する。
// Stripe には新規事業版のドメイン宛ての送信先を別に登録し、その署名シークレットを
// STRIPE_POINTS_WEBHOOK_SECRET に入れる。
//
// 同じ Stripe アカウントの全イベントが届くので、metadata.kind === 'points' 以外はすべて読み飛ばす。
// 逆に senryaku.ai 宛ての既存の送信先にもポイントの決済は届くが、既存の処理は
// 「戦略指南以外の価格ID」として読み飛ばす（変更不要）。
//
// 付与は ref（決済ID／契約ID＋月の開始日）で一意なので、同じイベントが複数の送信先・再送で
// 何度届いても二重には付与しない。
import Stripe from "stripe";
import { POINT_PURCHASES, POINT_TIERS, grantPoints, handlePointSubscriptionInvoice, setPointSubscriptionStatus } from "../../../lib/points";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const secret = process.env.STRIPE_POINTS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[points/webhook] STRIPE_POINTS_WEBHOOK_SECRET が未設定");
    return Response.json({ error: "not configured" }, { status: 500 });
  }
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature"), secret);
  } catch (e) {
    console.error("[points/webhook] 署名検証エラー:", e.message);
    return Response.json({ error: "Webhook error" }, { status: 400 });
  }

  // 従量・追加購入の決済完了（サブスクのポイントは invoice.paid で付与する）
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.kind !== "points") return Response.json({ received: true, ignored: true });
    const email = session.metadata.email || session.customer_details?.email || session.customer_email;
    const type = session.metadata.type;
    let granted = 0;
    if (type === "payg" || type === "addon") {
      const item = POINT_PURCHASES[type];
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
      const qty = lineItems.data.filter(li => li.price?.id === item.priceId).reduce((s, li) => s + (li.quantity || 0), 0);
      if (qty > 0) {
        // 失敗時は例外 → 500 を返して Stripe に再送させる
        await grantPoints({ email, points: item.pointsPerUnit * qty, source: type, ref: session.id, note: `${item.label} ${qty}口` });
        granted = item.pointsPerUnit * qty;
      }
    }
    const label = type === "subscription"
      ? `${POINT_TIERS[session.metadata.tier]?.label || session.metadata.tier}（${session.metadata.interval === "year" ? "年間契約" : "月払い"}）`
      : (POINT_PURCHASES[type]?.label || type);
    await notify({ buyerEmail: email, label, points: granted, amountJpy: session.amount_total, stripeSessionId: session.id });
    console.log(`[points/webhook] 決済完了: ${email} / ${type} / 付与 ${granted}pt / ${session.id}`);
    return Response.json({ received: true });
  }

  // サブスクの請求（初回も含む）。年間契約は初月だけここで付与し、2か月目以降は cron が付与する
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    if (!invoice.subscription) return Response.json({ received: true, ignored: true });
    let meta = invoice.subscription_details?.metadata || null;
    if (!invoice.subscription_details) {
      try { meta = (await stripe.subscriptions.retrieve(invoice.subscription)).metadata; } catch (e) { meta = null; }
    }
    if (meta?.kind !== "points") return Response.json({ received: true, ignored: true });
    const line = invoice.lines?.data?.[0];
    const r = await handlePointSubscriptionInvoice({
      email: meta.email || invoice.customer_email,
      subscriptionId: invoice.subscription,
      customerId: typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id || null),
      tier: meta.tier,
      interval: meta.interval,
      periodStart: line?.period?.start ? new Date(line.period.start * 1000) : new Date(),
      periodEnd: line?.period?.end ? new Date(line.period.end * 1000).toISOString() : null,
    });
    console.log(`[points/webhook] サブスク請求: ${meta.email} / ${meta.tier} ${meta.interval} / ${invoice.billing_reason}`, r);
    return Response.json({ received: true });
  }

  // 解約（付与済みのポイントはその月の期限まで使える）
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    if (sub.metadata?.kind !== "points") return Response.json({ received: true, ignored: true });
    await setPointSubscriptionStatus(sub.id, "canceled");
    console.log(`[points/webhook] サブスク解約: ${sub.id}`);
    return Response.json({ received: true });
  }

  return Response.json({ received: true, ignored: true });
}

// 運営向けの決済通知（失敗しても付与の処理は成功扱い）
async function notify({ buyerEmail, label, points, amountJpy, stripeSessionId }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const amountStr = typeof amountJpy === "number" ? `¥${amountJpy.toLocaleString("ja-JP")}` : "—";
    const pointsStr = points > 0 ? `${points.toLocaleString("ja-JP")}ポイント` : "サブスク（毎月付与）";
    const row = (k, v) => `<tr><td style="padding:8px 12px;background:#f5f2eb;width:160px;font-weight:bold">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${v}</td></tr>`;
    await resend.emails.send({
      from: `戦略指南 AI <${process.env.FROM_EMAIL || "onboarding@resend.dev"}>`,
      to: [process.env.PAYMENT_NOTIFY_EMAIL || "info@digi-kaku.or.jp"],
      subject: `【ポイント決済】${label} ${amountStr} — ${buyerEmail}`,
      html: `<div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:32px 24px;color:#1a1a14">
        <div style="font-size:22px;font-weight:bold;margin-bottom:8px">ポイント決済の完了通知</div>
        <table style="width:100%;border-collapse:collapse;font-size:16px;margin:16px 0 24px">
          ${row("購入内容", label)}${row("付与", pointsStr)}${row("決済金額", `${amountStr}（税込）`)}
          ${row("購入者メール", buyerEmail)}${row("Stripe Session ID", stripeSessionId || "—")}
        </table>
        <p style="font-size:16px;color:#78716c">このメールは Stripe webhook により自動送信されています。</p>
      </div>`,
    });
  } catch (e) {
    console.error("[points/webhook] 通知メール送信エラー:", e?.message);
  }
}
