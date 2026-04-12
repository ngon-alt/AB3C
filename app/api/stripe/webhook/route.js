import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// === 新料金体系 ===
const PRICE_PLANS = {
  // 分析プラン（年間ライセンス）— TODO: Stripe Price ID作成後に差し替え
  'price_ANALYSIS_1_ANNUAL':   { type: 'analysis', sites: 1,   interval: 'year' },
  'price_ANALYSIS_10_ANNUAL':  { type: 'analysis', sites: 10,  interval: 'year' },
  'price_ANALYSIS_100_ANNUAL': { type: 'analysis', sites: 100, interval: 'year' },

  // 伴走プラン（月額）
  'price_SUPPORT_1_MONTHLY':   { type: 'support', sites: 1,   interval: 'month' },
  'price_SUPPORT_5_MONTHLY':   { type: 'support', sites: 5,   interval: 'month' },
  'price_SUPPORT_15_MONTHLY':  { type: 'support', sites: 15,  interval: 'month' },
  'price_SUPPORT_30_MONTHLY':  { type: 'support', sites: 30,  interval: 'month' },
  'price_SUPPORT_60_MONTHLY':  { type: 'support', sites: 60,  interval: 'month' },
  'price_SUPPORT_120_MONTHLY': { type: 'support', sites: 120, interval: 'month' },

  // 伴走プラン（年額＝月額×10）
  'price_SUPPORT_1_ANNUAL':    { type: 'support', sites: 1,   interval: 'year' },
  'price_SUPPORT_5_ANNUAL':    { type: 'support', sites: 5,   interval: 'year' },
  'price_SUPPORT_15_ANNUAL':   { type: 'support', sites: 15,  interval: 'year' },
  'price_SUPPORT_30_ANNUAL':   { type: 'support', sites: 30,  interval: 'year' },
  'price_SUPPORT_60_ANNUAL':   { type: 'support', sites: 60,  interval: 'year' },
  'price_SUPPORT_120_ANNUAL':  { type: 'support', sites: 120, interval: 'year' },
};

// チャット回数マッピング：伴走プランは1サイトあたり月100回
function getChatCount(plan) {
  if (!plan) return 0;
  if (plan.type === 'analysis') return 0; // 分析プランはチャットなし
  // 伴走プラン：サイト数 × 100回/月
  return plan.sites * 100;
}

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
      const plan = PRICE_PLANS[priceId];
      const chatCount = getChatCount(plan);

      // チケット付与
      await sql`
        INSERT INTO tickets (email, remaining_chats, is_trial)
        VALUES (${email}, ${chatCount}, FALSE)
      `;

      // プロユーザー登録（伴走プランのみ）
      if (plan?.type === 'support') {
        await sql`
          INSERT INTO pro_users (email, name, added_at)
          VALUES (${email}, ${email}, NOW())
          ON CONFLICT (email) DO NOTHING
        `;
      }

      console.log(`決済完了: ${email} / プラン: ${plan?.type || 'unknown'} / ${plan?.sites || 0}サイト / チャット${chatCount}回 / priceId: ${priceId}`);
    }
  }

  return Response.json({ received: true });
}
