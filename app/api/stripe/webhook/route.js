import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { sendPaymentNotificationEmail, sendPlanDowngradeEmail } from '@/app/lib/email';
import { enforceLicenseSiteCap } from '@/app/lib/license-site-cap';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// === 新料金体系 ===
const PRICE_PLANS = {
  // 戦略診断チケット（有効期限1年・一括払い）
  'price_1TMoucCYHZ66REnUcvtOwA19': { type: 'analysis', sites: 1,   interval: 'year' },
  'price_1TMov9CYHZ66REnUE9yV6bwO': { type: 'analysis', sites: 10,  interval: 'year' },
  'price_1TMovUCYHZ66REnUdqdw3Jcc': { type: 'analysis', sites: 100, interval: 'year' },

  // 戦略指南プラン（戦略診断・策定・アクションプラン・月額）
  'price_1TMQJECYHZ66REnUvdtin0z3':  { type: 'support', sites: 1,   interval: 'month' },
  'price_1TMQJVCYHZ66REnUYOy5mlL4':  { type: 'support', sites: 5,   interval: 'month' },
  'price_1TMQJjCYHZ66REnUmEgb5GGN':  { type: 'support', sites: 15,  interval: 'month' },
  'price_1TMQJzCYHZ66REnUtmQuGBR0':  { type: 'support', sites: 30,  interval: 'month' },
  'price_1TMQKGCYHZ66REnUAg6NOSOK':  { type: 'support', sites: 60,  interval: 'month' },
  'price_1TMQKYCYHZ66REnUSM8rKr2n':  { type: 'support', sites: 120, interval: 'month' },

  // 戦略指南プラン（戦略診断・策定・アクションプラン・年額＝月額×10）
  'price_1TMQKvCYHZ66REnUomf2PJMh':  { type: 'support', sites: 1,   interval: 'year' },
  'price_1TMQLDCYHZ66REnU2w53yUAE':  { type: 'support', sites: 5,   interval: 'year' },
  'price_1TMQLYCYHZ66REnU9T2AlDh6':  { type: 'support', sites: 15,  interval: 'year' },
  'price_1TMQLtCYHZ66REnUpqPhuI24':  { type: 'support', sites: 30,  interval: 'year' },
  'price_1TMQMJCYHZ66REnU6KiAhHSz':  { type: 'support', sites: 60,  interval: 'year' },
  'price_1TMQMZCYHZ66REnULJsbJQy7':  { type: 'support', sites: 120, interval: 'year' },

  // FutureShop特別提携プラン
  'price_1TQmDFCYHZ66REnUX1TmwpWQ': { type: 'analysis', sites: 300, interval: 'year' },  // 診断チケット 300枚 ¥900,000
  // 指南プラン15サイトは既存の price_1TMQJjCYHZ66REnUmEgb5GGN（¥330,000/月）をそのまま流用し、プロモーションコード FUTURESHOP6M（50%OFF/6か月）を被せる
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

      // === 戦略指南プラン置き換え処理 ===
      // 新規購入が support タイプの場合、既存 active な support プランを
      //   ・Stripe の subscription をキャンセル
      //   ・DB で status='replaced' にマーク
      //   ・ダウングレードなら古いサイトを自動削除（keep newest N）
      //   ・指南プランに紐づく既存チケットも一旦削除（下の INSERT で新数量に再発行）
      // 診断チケット（analysis）は合算仕様のため対象外。
      // === 戦略指南プラン置き換え処理 ===
      // 新規購入が support タイプの場合、既存 active な support プランを Stripe 側でキャンセルし、
      // DB で status='replaced' にマーク、関連チケットもクリア。
      // ※ 超過サイトの削除は後段の enforceLicenseSiteCap で一元処理する
      if (plan?.type === 'support') {
        const existingSupport = await sql`
          SELECT id, stripe_subscription_id, stripe_price_id
          FROM user_plans
          WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
        `;
        if (existingSupport.length > 0) {
          for (const ep of existingSupport) {
            if (ep.stripe_subscription_id && ep.stripe_price_id !== 'admin_manual') {
              try {
                await stripe.subscriptions.cancel(ep.stripe_subscription_id);
              } catch (e) {
                console.error('Stripe subscription cancel error:', e);
              }
            }
          }
          await sql`
            UPDATE user_plans SET status = 'replaced'
            WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
          `;
          // 旧の支援プラン向けチケットをクリア（support タイプ由来）。診断用チケットは触らない
          await sql`DELETE FROM tickets WHERE email = ${email} AND is_trial = FALSE`;
        }
      }

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
        let expiresAt = null;
        const subscriptionId = session.subscription || null;
        if (plan.type === 'analysis') {
          // 戦略診断チケット: 1年後に有効期限
          expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else if (subscriptionId) {
          // 戦略指南プラン: Stripeから次回更新日を取得
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            if (sub.current_period_end) {
              expiresAt = new Date(sub.current_period_end * 1000).toISOString();
            }
          } catch (e) {
            console.error('Subscription取得エラー:', e);
          }
        }
        await sql`
          INSERT INTO user_plans (user_email, plan_type, site_limit, interval, stripe_price_id, stripe_subscription_id, expires_at)
          VALUES (${email}, ${plan.type}, ${plan.sites}, ${plan.interval}, ${priceId}, ${subscriptionId}, ${expiresAt})
        `;
      }

      // === ライセンス上限を超えるサイトを古い順に削除 ===
      // ルール:
      //  - PRO 在籍時はスキップ（実質無制限）
      //  - 戦略指南プランあり → 合計 site_limit までに削減
      //  - 戦略指南プランなし（戦略診断チケットのみ／無料）→ サイトを保持できる契約がないため全削除
      let planReplacement = null;
      try {
        const capResult = await enforceLicenseSiteCap(sql, email);
        if (!capResult.skipped && capResult.deleted > 0) {
          planReplacement = {
            isDowngrade: true,
            oldLimit: capResult.previousCount,
            newLimit: capResult.cap,
            deletedSites: capResult.deletedSites,
          };
          console.log(`ライセンス上限超過削除: ${email} / ${capResult.previousCount} → ${capResult.cap} / ${capResult.deleted}サイト削除`);
        }
      } catch (e) {
        console.error('enforceLicenseSiteCap error:', e);
      }

      console.log(`決済完了: ${email} / プラン: ${plan?.type || 'unknown'} / ${plan?.sites || 0}サイト / チャット${chatCount}回 / priceId: ${priceId}`);

      // 運営向け決済通知メール（info@digi-kaku.or.jp）
      try {
        // ユーザー名・利用目的をusersテーブルから取得
        let buyerName = null;
        let purpose = null;
        try {
          const rows = await sql`SELECT name, purpose FROM users WHERE email = ${email} LIMIT 1`;
          if (rows.length > 0) {
            buyerName = rows[0].name;
            purpose = rows[0].purpose;
          }
        } catch (e) {
          console.error('決済通知: ユーザー情報取得エラー:', e);
        }
        // 実際の決済額（クーポン適用後）— Stripeは最小通貨単位（円は1=1円）
        const amountJpy = typeof session.amount_total === 'number' ? session.amount_total : null;
        await sendPaymentNotificationEmail({
          buyerEmail: email,
          buyerName,
          purpose,
          planType: plan?.type,
          siteLimit: plan?.sites,
          interval: plan?.interval,
          amountJpy,
          priceId,
          stripeSessionId: session.id,
        });
      } catch (e) {
        console.error('決済通知メール送信エラー:', e);
        // 通知失敗でも webhook 自体は成功扱いにする（決済処理は既に完了しているため）
      }

      // ダウングレードによりサイトが削除された場合、ユーザーに通知
      if (planReplacement?.isDowngrade && planReplacement.deletedSites?.length > 0) {
        try {
          let buyerName = null;
          try {
            const rows = await sql`SELECT name FROM users WHERE email = ${email} LIMIT 1`;
            if (rows.length > 0) buyerName = rows[0].name;
          } catch (e) {}
          await sendPlanDowngradeEmail({
            email,
            name: buyerName,
            deletedSites: planReplacement.deletedSites,
            oldLimit: planReplacement.oldLimit,
            newLimit: planReplacement.newLimit,
          });
        } catch (e) {
          console.error('ダウングレード通知メール送信エラー:', e);
        }
      }
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

  // 月次/年次更新（戦略指南プランのチャットチケットを強制リセット）
  // - billing_reason === 'subscription_create' は初回（checkout.session.completedで処理済）なのでスキップ
  // - billing_reason === 'subscription_cycle' or 'subscription_update' のみ処理
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const reason = invoice.billing_reason;
    const subscriptionId = invoice.subscription;
    if (subscriptionId && reason !== 'subscription_create') {
      const sql = neon(process.env.DATABASE_URL);
      // 該当のuser_planを取得
      const plans = await sql`
        SELECT user_email, plan_type, site_limit FROM user_plans
        WHERE stripe_subscription_id = ${subscriptionId} AND status = 'active'
        ORDER BY purchased_at DESC LIMIT 1
      `;
      if (plans.length > 0) {
        const p = plans[0];
        const newChatCount = getChatCount(p);
        // 既存のnon-trialチケットを削除して新たに付与（強制リセット）
        await sql`DELETE FROM tickets WHERE email = ${p.user_email} AND is_trial = FALSE`;
        await sql`
          INSERT INTO tickets (email, remaining_chats, is_trial)
          VALUES (${p.user_email}, ${newChatCount}, FALSE)
        `;
        // 月次サイト登録カウンタをリセット（戦略指南プランのみ該当）
        await sql`
          UPDATE user_plans SET
            monthly_registrations_used = 0,
            monthly_registrations_reset_at = NOW()
          WHERE stripe_subscription_id = ${subscriptionId} AND status = 'active'
        `;
        // 次回更新日を記録（Stripe invoice の period_end）
        if (invoice.lines?.data?.[0]?.period?.end) {
          const nextRenewalAt = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
          await sql`
            UPDATE user_plans SET expires_at = ${nextRenewalAt}
            WHERE stripe_subscription_id = ${subscriptionId} AND status = 'active'
          `;
        }
        console.log(`月次更新: ${p.user_email} / ${p.plan_type}${p.site_limit} / チャット${newChatCount}回・サイト登録カウンタをリセット`);
      }
    }
  }

  return Response.json({ received: true });
}
