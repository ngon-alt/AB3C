import { neon } from '@neondatabase/serverless';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req) {
  const { secret, email } = await req.json();
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);

  // usage_countをリセット
  await sql`UPDATE users SET usage_count = 0 WHERE email = ${email}`;

  // 既存のトライアルチケットを削除
  await sql`DELETE FROM tickets WHERE email = ${email} AND is_trial = TRUE`;

  // トライアルチケットを再発行
  await sql`INSERT INTO tickets (email, remaining_chats, is_trial) VALUES (${email}, 1, TRUE)`;

  return Response.json({ success: true, message: `${email} のトライアルをリセットしました` });
}
