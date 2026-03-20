import { neon } from '@neondatabase/serverless';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req) {
  const { secret, email, name } = await req.json();
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    INSERT INTO pro_users (email, name)
    VALUES (${email}, ${name})
    ON CONFLICT (email) DO NOTHING
  `;
  return Response.json({ success: true });
}

export async function DELETE(req) {
  const { secret, email } = await req.json();
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM pro_users WHERE email = ${email}`;
  return Response.json({ success: true });
}
