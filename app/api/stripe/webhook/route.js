import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_CHAT_MAP = {
  'price_1TFVPQCYHZ66REnUPmSkDnV6': 0,  // ベーシック：チャットなし
  'price_1TGLh2CYHZ66REnUXIK6b8X7': 30, // スタンダード：チャット30回
};

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('Webhook署名検証エラー:', e.message);
    return Response.json({ error: 'Webhook error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.metadata?.email;
    const priceId = session.metadata?.priceId;

    if (email) {
      const sql = neon(process.env.DATABASE_URL);
      const chatCount = PRICE_CHAT_MAP[priceId] ?? 0;

      await sql`
        INSERT INTO tickets (email, remaining_chats, is_trial)
        VALUES (${email}, ${chatCount}, FALSE)
      `;
      console.log(`チケット付与完了: ${email} / チャット${chatCount}回 / priceId: ${priceId}`);
    }
  }

  return Response.json({ received: true });
}
