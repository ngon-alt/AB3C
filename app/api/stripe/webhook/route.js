import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// === 新料金体系 ===
const PRICE_PLANS = {
  // 戦略診断プラン（年間ライセンス）
  'price_1TMoucCYHZ66REnUcvtOwA19': { type: 'analysis', sites: 1,   interval: 'year' },
  'price_1TMov9CYHZ66REnUE9yV6bwO': { type: 'analysis', sites: 10,  interval: 'year' },
  'price_1TMovUCYHZ66REnUdqdw3Jcc': { type: 'analysis', sites: 100, interval: 'year' },

  // フルプラン（戦略診断・策定・アクションプラン・月額）
  'price_1TMQJECYHZ66REnUvdtin0z3':  { type: 'support', sites: 1,   interval: 'month' },
  'price_1TMQJVCYHZ66REnUYOy5mlL4':  { type: 'support', sites: 5,   interval: 'month' },
  'price_1TMQJjCYHZ66REnUmEgb5GGN':  { type: 'support', sites: 15,  interval: 'month' },
  'price_1TMQJzCYHZ66REnUtmQuGBR0':  { type: 'support', sites: 30,  interval: 'month' },
  'price_1TMQKGCYHZ66REnUAg6NOSOK':  { type: 'support', sites: 60,  interval: 'month' },
  'price_1TMQKYCYHZ66REnUSM8rKr2n':  { type: 'support', sites: 120, interval: 'month' },

  // フルプラン（戦略診断・策定・アクションプラン・年額＝月額×10）
  'price_1TMQKvCYHZ66REnUomf2PJMh':  { type: 'support', sites: 1,   interval: 'year' },
  'price_1TMQLDCYHZ66REnU2w53yUAE':  { type: 'support', sites: 5,   interval: 'year' },
  'price_1TMQLYCYHZ66REnU9T2AlDh6':  { type: 'support', sites: 15,  interval: 'year' },
  'price_1TMQLtCYHZ66REnUpqPhuI24':  { type: 'support', sites: 30,  interval: 'year' },
  'price_1TMQMJCYHZ66REnU6KiAhHSz':  { type: 'support', sites: 60,  interval: 'year' },
  'price_1TMQMZCYHZ66REnULJsbJQy7':  { type: 'support', sites: 120, interval: 'year' },
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

      // プラン情報をuser_plansに記録
      if (plan) {
        await sql`
          CREATE TABLE IF NOT EXISTS user_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_email VARCHAR(255) NOT NULL,
            plan_type VARCHAR(20) NOT NULL,
            site_limit INTEGER NOT NULL,
            interval VARCHAR(10) NOT NULL,
            stripe_price_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            status VARCHAR(20) DEFAULT 'active',
            purchased_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;
        const expiresAt = plan.type === 'analysis' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;
        const subscriptionId = session.subscription || null;
        await sql`
          INSERT INTO user_plans (user_email, plan_type, site_limit, interval, stripe_price_id, stripe_subscription_id, expires_at)
          VALUES (${email}, ${plan.type}, ${plan.sites}, ${plan.interval}, ${priceId}, ${subscriptionId}, ${expiresAt})
        `;
      }

      console.log(`決済完了: ${email} / プラン: ${plan?.type || 'unknown'} / ${plan?.sites || 0}サイト / チャット${chatCount}回 / priceId: ${priceId}`);
    }
  }

  // サブスクリプション解約
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      UPDATE user_plans SET status = 'canceled'
      WHERE stripe_subscription_id = ${subscription.id}
    `;
    console.log(`サブスクリプション解約: ${subscription.id}`);
  }

  return Response.json({ received: true });
}
