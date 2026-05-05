import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 戦略診断チケットのPrice ID（有効期限1年・一括払い）
const ANALYSIS_PRICE_IDS = new Set([
  "price_1TMoucCYHZ66REnUcvtOwA19",
  "price_1TMov9CYHZ66REnUE9yV6bwO",
  "price_1TMovUCYHZ66REnUdqdw3Jcc",
]);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const { priceId } = await req.json();

    console.log('Creating checkout session for priceId:', priceId);
    console.log('User email:', session.user.email);

    // 戦略診断チケット（有効期限1年）は一括払い、戦略指南プランはサブスクリプション
    const isOneTime = ANALYSIS_PRICE_IDS.has(priceId);

    const checkoutParams = {
      mode: isOneTime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?canceled=true`,
      customer_email: session.user.email,
      // 一括払い（戦略診断チケット）でも Stripe Customer を作成しておく。
      // デフォルト ('if_required') では Customer が作られず、購入後にマイアカウントから
      // Customer Portal を開けなくなる（領収書も見られない）ため明示的に always を指定。
      // subscription モードでは Stripe が自動で Customer を作るので isOneTime のときだけ付ける。
      ...(isOneTime && { customer_creation: 'always' }),
      metadata: {
        email: session.user.email,
        priceId: priceId,
      },
    };

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
