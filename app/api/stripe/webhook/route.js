import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { sendPaymentNotificationEmail, sendCancellationNotificationEmail } from '@/app/lib/email';
// ※ ライセンス上限超過時のサイト削除はユーザー選択型 UI に変更したため、
//    webhook では自動削除しない（/api/sites/cap-resolve 経由で削除される）。

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// === 新料金体系 ===
const PRICE_PLANS = {
  // 戦略診断チケット（有効期限1年・一括払い）
  'price_1TMoucCYHZ66REnUcvtOwA19': { type: 'analysis', sites: 1,   interval: 'year' },
  'price_1TMov9CYHZ66REnUE9yV6bwO': { type: 'analysis', sites: 10,  interval: 'year' },
  'price_1TMovUCYHZ66REnUdqdw3Jcc': { type: 'analysis', sites: 100, interval: 'year' },

  // 戦略指南サブスク（戦略診断・策定・アクションプラン・月額）
  'price_1TMQJECYHZ66REnUvdtin0z3':  { type: 'support', sites: 1,   interval: 'month' },
  'price_1TMQJVCYHZ66REnUYOy5mlL4':  { type: 'support', sites: 5,   interval: 'month' },
  'price_1TMQJjCYHZ66REnUmEgb5GGN':  { type: 'support', sites: 15,  interval: 'month' },
  'price_1TMQJzCYHZ66REnUtmQuGBR0':  { type: 'support', sites: 30,  interval: 'month' },
  'price_1TMQKGCYHZ66REnUAg6NOSOK':  { type: 'support', sites: 60,  interval: 'month' },
  'price_1TMQKYCYHZ66REnUSM8rKr2n':  { type: 'support', sites: 120, interval: 'month' },

  // 戦略指南サブスク（戦略診断・策定・アクションプラン・年額＝月額×10）
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
    // 自前 /api/stripe/checkout 経由の場合は metadata に email/priceId が入っている
    let email = session.metadata?.email;
    let priceId = session.metadata?.priceId;

    // Payment Link 経由など metadata が空のケースにフォールバック対応
    // - email: Stripe が収集した customer_details.email を使う
    // - priceId: line_items を取得して最初の price.id を使う
    if (!email) {
      email = session.customer_details?.email || session.customer_email || null;
    }
    if (!priceId) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        if (lineItems?.data?.length > 0) {
          priceId = lineItems.data[0].price?.id || null;
        }
      } catch (e) {
        console.error('Payment Link 用 line_items 取得エラー:', e);
      }
    }

    if (email) {
      const sql = neon(process.env.DATABASE_URL);
      const plan = PRICE_PLANS[priceId];

      // AB3C 以外の決済をスキップ（同一 Stripe アカウント上の別事業の決済対策）。
      // 例: dmia「AIサービス開発合宿」の決済リンク。priceId が PRICE_PLANS に無い決済で
      // チケット付与・通知メールを行うと「不明プラン / undefinedサイト」の誤通知や、
      // 0チャットの不要チケットが DB に作られてしまうため、ここで打ち切る。
      // （新しい AB3C プランを追加した場合は PRICE_PLANS への登録を忘れないこと）
      if (!plan) {
        console.warn(`[webhook] AB3C 以外の priceId をスキップ: ${priceId} (email=${email}, sessionId=${session.id})`);
        return Response.json({ received: true, ignored: 'non-AB3C priceId' });
      }

      const chatCount = getChatCount(plan);

      // === 戦略指南サブスク置き換え処理 ===
      // 新規購入が support タイプの場合、既存 active な support プランを
      //   ・Stripe の subscription をキャンセル
      //   ・DB で status='replaced' にマーク
      //   ・ダウングレードなら古いサイトを自動削除（keep newest N）
      //   ・指南プランに紐づく既存チケットも一旦削除（下の INSERT で新数量に再発行）
      // 診断チケット（analysis）は合算仕様のため対象外。
      // === 戦略指南サブスク置き換え処理 ===
      // 新規購入が support タイプの場合、既存 active な support プランを Stripe 側でキャンセルし、
      // DB で status='replaced' にマーク、関連チケットもクリア。
      // ※ 超過サイトの削除はユーザー選択型 UI（/api/sites/cap-resolve）で実施
      //
      // 2026-06-04 修正（案 X）:
      //   旧実装は「既存 tickets を DELETE → 新 tickets を INSERT」を別コミットで
      //   実行していたため、DELETE 成功後に INSERT が失敗すると tickets が空に
      //   なる事故があった（FutureShop 5/30 月次更新で実発生）。
      //   sql.transaction() で 2 文を原子化し、片方失敗時は両方ロールバックする
      //   ようにした。
      let needsReplaceTickets = false;
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
          // 既存 tickets を「DELETE → INSERT」一括処理対象としてマーク
          needsReplaceTickets = true;
        }
      }

      // チケット付与（DELETE+INSERT を原子化）
      if (needsReplaceTickets) {
        // 既存 support 由来 tickets を消して新規発行を1トランザクションで行う。
        // どちらかが失敗すれば両方ロールバック → tickets が空になる事故を防ぐ。
        // 診断用チケット（is_trial 関係なく analysis 由来）は別管理なのでここでは触らない。
        await sql.transaction([
          sql`DELETE FROM tickets WHERE email = ${email} AND is_trial = FALSE`,
          sql`INSERT INTO tickets (email, remaining_chats, is_trial) VALUES (${email}, ${chatCount}, FALSE)`,
        ]);
      } else {
        // 既存 support なし（初回購入 or analysis）→ INSERT のみ
        await sql`
          INSERT INTO tickets (email, remaining_chats, is_trial)
          VALUES (${email}, ${chatCount}, FALSE)
        `;
      }

      // ※ 戦略指南サブスク契約者を pro_users に自動追加していた処理は廃止。
      //   理由:
      //    - pro_users は「テスト用無制限ユーザー」を表す管理テーブルで、
      //      有料契約者と混在すると管理画面の一覧で見分けがつかなくなる
      //    - 戦略指南サブスク契約者には tickets（サイト数×100回/月）が付与されるため、
      //      無制限チャット相当の体験は維持される（CLAUDE.md「1サイト月100回上限」を機能させる）
      //    - getSiteLimit() は user_plans の support を優先するためサイト上限への影響なし

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
          // 戦略指南サブスク: Stripeから次回更新日を取得
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

      // ※ ライセンス上限超過時のサイト削除は、購入後にユーザーが残すサイトを選択する UI
      //    （/api/sites/cap-resolve 経由）で行う。webhook では自動削除しない。
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

      // ※ ライセンス上限超過時のサイト削除はユーザー選択型 UI に移行したため、
      //    webhook での自動削除＋通知メールは廃止。代わりに次回ログイン時に
      //    モーダルで「残すサイトを選んでください」と案内し、確定時に削除＋通知を行う。
    }
  }

  // サブスクリプション解約予定（ユーザーが Stripe ポータルで解約手続きをした瞬間）
  // customer.subscription.updated は cancel_at_period_end の変化以外にも発火するので、
  // cancel_at_period_end が true になった時のみ運営通知メールを送る。
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const prevAttrs = event.data.previous_attributes || {};
    const justScheduledCancel = subscription.cancel_at_period_end === true
      && prevAttrs.cancel_at_period_end === false;
    if (justScheduledCancel) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql`
          SELECT user_email, plan_type, site_limit, interval FROM user_plans
          WHERE stripe_subscription_id = ${subscription.id} AND status = 'active'
          ORDER BY purchased_at DESC LIMIT 1
        `;
        const p = rows[0];
        if (p) {
          let userName = '';
          try {
            const u = await sql`SELECT name FROM users WHERE email = ${p.user_email} LIMIT 1`;
            userName = u[0]?.name || '';
          } catch (e) {}
          const endsAt = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : (subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null);
          await sendCancellationNotificationEmail({
            buyerEmail: p.user_email,
            buyerName: userName,
            planType: p.plan_type,
            siteLimit: p.site_limit,
            interval: p.interval,
            kind: 'scheduled',
            endsAt,
            stripeSubscriptionId: subscription.id,
          });
          console.log(`解約予定通知メール送信: ${subscription.id} (${p.user_email})`);
        }
      } catch (e) {
        console.error('解約予定通知メール送信エラー:', e?.message);
      }
    }
  }

  // サブスクリプション解約（期間終了で正式に解約完了）
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const sql = neon(process.env.DATABASE_URL);
    // 解約前にユーザー情報を取得（DB更新前に取らないとプラン情報が消える）
    let planInfo = null;
    try {
      const rows = await sql`
        SELECT user_email, plan_type, site_limit, interval FROM user_plans
        WHERE stripe_subscription_id = ${subscription.id}
        ORDER BY purchased_at DESC LIMIT 1
      `;
      planInfo = rows[0] || null;
    } catch (e) { console.error('解約前プラン情報取得エラー:', e?.message); }

    await sql`
      UPDATE user_plans SET status = 'canceled'
      WHERE stripe_subscription_id = ${subscription.id}
    `;
    console.log(`サブスクリプション解約: ${subscription.id}`);

    // 解約完了通知メール
    if (planInfo) {
      try {
        let userName = '';
        try {
          const u = await sql`SELECT name FROM users WHERE email = ${planInfo.user_email} LIMIT 1`;
          userName = u[0]?.name || '';
        } catch (e) {}
        const endsAt = subscription.ended_at
          ? new Date(subscription.ended_at * 1000).toISOString()
          : (subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : new Date().toISOString());
        await sendCancellationNotificationEmail({
          buyerEmail: planInfo.user_email,
          buyerName: userName,
          planType: planInfo.plan_type,
          siteLimit: planInfo.site_limit,
          interval: planInfo.interval,
          kind: 'completed',
          endsAt,
          stripeSubscriptionId: subscription.id,
        });
        console.log(`解約完了通知メール送信: ${subscription.id} (${planInfo.user_email})`);
      } catch (e) {
        console.error('解約完了通知メール送信エラー:', e?.message);
      }
    }
  }

  // 月次/年次更新（戦略指南サブスクのチャットチケットを強制リセット）
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
        // 2026-06-04 修正（案 X）: 月次更新の DB 更新を全て1トランザクションに統一。
        //   - DELETE tickets / INSERT tickets / UPDATE monthly_registrations / UPDATE expires_at
        //   - 旧実装は別コミットだったため、DELETE 成功後に INSERT が失敗すると
        //     tickets が空・expires_at も更新されない、という中途半端な状態で
        //     停止する事故があった（FutureShop 5/30 で実発生）。
        //   - 原子化により、いずれかが失敗すれば全部ロールバック → 元の状態のまま。
        //     Stripe は webhook 失敗時に自動リトライするので、次の試行で復旧する。
        const queries = [
          sql`DELETE FROM tickets WHERE email = ${p.user_email} AND is_trial = FALSE`,
          sql`INSERT INTO tickets (email, remaining_chats, is_trial) VALUES (${p.user_email}, ${newChatCount}, FALSE)`,
          // 月次サイト登録カウンタをリセット（戦略指南サブスクのみ該当）
          sql`UPDATE user_plans SET monthly_registrations_used = 0, monthly_registrations_reset_at = NOW() WHERE stripe_subscription_id = ${subscriptionId} AND status = 'active'`,
        ];
        // 次回更新日を記録（Stripe invoice の period_end）
        if (invoice.lines?.data?.[0]?.period?.end) {
          const nextRenewalAt = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
          queries.push(
            sql`UPDATE user_plans SET expires_at = ${nextRenewalAt} WHERE stripe_subscription_id = ${subscriptionId} AND status = 'active'`
          );
        }
        await sql.transaction(queries);
        console.log(`月次更新: ${p.user_email} / ${p.plan_type}${p.site_limit} / チャット${newChatCount}回・サイト登録カウンタをリセット`);
      }
    }
  }

  return Response.json({ received: true });
}
