import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ isPro: false });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      SELECT email FROM pro_users WHERE email = ${session.user.email}
    `;
    return Response.json({ isPro: result.length > 0 });
  } catch (e) {
    console.error(e);
    return Response.json({ isPro: false });
  }
}
