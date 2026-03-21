import { neon } from '@neondatabase/serverless';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  const users = await sql`SELECT * FROM pro_users ORDER BY added_at DESC`;
  return Response.json({ users });
}
