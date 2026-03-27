import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  const { priceId } = await req.json();
  const sql = neon(process.env.DATABASE_URL);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/?canceled=true`,
    customer_email: session.user.email,
    metadata: {
      email: session.user.email,
      priceId: priceId,
    },
  });

  return Response.json({ url: checkoutSession.url });
}
