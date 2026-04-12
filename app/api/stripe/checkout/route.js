import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 分析プランのPrice ID（年間ライセンス＝一括払い）
const ANALYSIS_PRICE_IDS = new Set([
  "price_ANALYSIS_1_ANNUAL",
  "price_ANALYSIS_10_ANNUAL",
  "price_ANALYSIS_100_ANNUAL",
]);

// キャンペーンクーポンID（TODO: Stripeで作成後に差し替え）
const CAMPAIGN_COUPON_ID = process.env.STRIPE_CAMPAIGN_COUPON_ID || null;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const { priceId } = await req.json();

    console.log('Creating checkout session for priceId:', priceId);
    console.log('User email:', session.user.email);

    // 分析プラン（年間ライセンス）は一括払い、伴走プランはサブスクリプション
    const isOneTime = ANALYSIS_PRICE_IDS.has(priceId);

    const checkoutParams = {
      mode: isOneTime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        email: session.user.email,
        priceId: priceId,
      },
    };

    // キャンペーンクーポンが設定されていれば自動適用
    if (CAMPAIGN_COUPON_ID) {
      if (isOneTime) {
        // 一括払い: discounts を使用
        checkoutParams.discounts = [{ coupon: CAMPAIGN_COUPON_ID }];
      } else {
        // サブスクリプション: discounts を使用
        checkoutParams.discounts = [{ coupon: CAMPAIGN_COUPON_ID }];
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    console.log('Checkout session created:', checkoutSession.id);
    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({
      error: error.message || 'チェックアウトセッションの作成に失敗しました',
      details: error.toString()
    }, { status: 500 });
  }
}
