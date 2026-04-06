import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_PLANS = {
  // 分析プラン（月額）
  'price_1TJ9lcCYHZ66REnUFd8PP24z': { type: 'analysis', sites: 1, interval: 'month' },
  'price_1TJ9pNCYHZ66REnUCl03OmDO': { type: 'analysis', sites: 5, interval: 'month' },
  'price_1TJ9quCYHZ66REnUqJZIx23y': { type: 'analysis', sites: 10, interval: 'month' },
  'price_1TJ9rcCYHZ66REnUmtEZkCnz': { type: 'analysis', sites: 30, interval: 'month' },
  'price_1TJ9sQCYHZ66REnU4kQP9npL': { type: 'analysis', sites: 50, interval: 'month' },
  'price_1TJ9t9CYHZ66REnUeA49IVDs': { type: 'analysis', sites: 100, interval: 'month' },
  // 分析プラン（年額）
  'price_1TJ9ohCYHZ66REnUN2caOn5h': { type: 'analysis', sites: 1, interval: 'year' },
  'price_1TJ9q7CYHZ66REnUYfCKElz8': { type: 'analysis', sites: 5, interval: 'year' },
  'price_1TJ9rFCYHZ66REnUUhQVgOd0': { type: 'analysis', sites: 10, interval: 'year' },
  'price_1TJ9s3CYHZ66REnUsfzwrunm': { type: 'analysis', sites: 30, interval: 'year' },
  'price_1TJ9soCYHZ66REnUjwmC7fuu': { type: 'analysis', sites: 50, interval: 'year' },
  'price_1TJ9uQCYHZ66REnUjLQ39eKG': { type: 'analysis', sites: 100, interval: 'year' },
  // 伴走プラン（月額）
  'price_1TJ9urCYHZ66REnUiLMhvaYr': { type: 'support', sites: 1, interval: 'month' },
  'price_1TJ9vbCYHZ66REnUr4WTXEbW': { type: 'support', sites: 5, interval: 'month' },
  'price_1TJ9wFCYHZ66REnUNVJYhJYY': { type: 'support', sites: 10, interval: 'month' },
  'price_1TJ9wuCYHZ66REnUjeDnayHy': { type: 'support', sites: 30, interval: 'month' },
  'price_1TJ9xXCYHZ66REnUmUTzdDYC': { type: 'support', sites: 50, interval: 'month' },
  'price_1TJ9yECYHZ66REnU9fMw0D5g': { type: 'support', sites: 100, interval: 'month' },
  // 伴走プラン（年額）
  'price_1TJ9v7CYHZ66REnUKzAAIpZl': { type: 'support', sites: 1, interval: 'year' },
  'price_1TJ9vrCYHZ66REnUYWlCUrOB': { type: 'support', sites: 5, interval: 'year' },
  'price_1TJ9wUCYHZ66REnU1v2x2WPc': { type: 'support', sites: 10, interval: 'year' },
  'price_1TJ9x9CYHZ66REnUgnZwL8ym': { type: 'support', sites: 30, interval: 'year' },
  'price_1TJ9xtCYHZ66REnU2hqNs1M2': { type: 'support', sites: 50, interval: 'year' },
  'price_1TJ9yVCYHZ66REnUZOaH5iFs': { type: 'support', sites: 100, interval: 'year' },
};

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
