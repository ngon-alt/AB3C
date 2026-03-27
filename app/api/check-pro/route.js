import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ isPro: false, chatTickets: 0, hasTrialChat: false });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // プロ会員チェック
    const proResult = await sql`SELECT email FROM pro_users WHERE email = ${session.user.email}`;
    const isPro = proResult.length > 0;

    // 有料チケット残数
    const ticketResult = await sql`
      SELECT COALESCE(SUM(remaining_chats), 0) as total
      FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = FALSE
    `;
    const chatTickets = parseInt(ticketResult[0].total);

    // トライアルチャット残数
    const trialResult = await sql`
      SELECT COALESCE(SUM(remaining_chats), 0) as total
      FROM tickets
      WHERE email = ${session.user.email} AND remaining_chats > 0 AND is_trial = TRUE
    `;
    const trialChats = parseInt(trialResult[0].total);

    return Response.json({ isPro, chatTickets, trialChats });
  } catch (e) {
    console.error(e);
    return Response.json({ isPro: false, chatTickets: 0, trialChats: 0 });
  }
}
