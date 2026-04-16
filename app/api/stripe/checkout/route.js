import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 戦略診断プランのPrice ID（年間ライセンス＝一括払い）
const ANALYSIS_PRICE_IDS = new Set([
  "price_1TMoucCYHZ66REnUcvtOwA19",
  "price_1TMov9CYHZ66REnUE9yV6bwO",
  "price_1TMovUCYHZ66REnUdqdw3Jcc",
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

    // 戦略診断プラン（年間ライセンス）は一括払い、フルプランはサブスクリプション
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
