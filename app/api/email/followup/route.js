import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendFollowUpEmail } from "@/app/lib/email";

// Vercelのcronジョブまたは外部から叩くエンドポイント
// 登録から3日経過・まだチャットを使っていないユーザーにフォローメールを送る
export async function POST(req) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);

  // 登録から3日経過・チャット未使用ユーザーを取得
  const users = await sql`
    SELECT u.email, u.name
    FROM users u
    LEFT JOIN tickets t ON u.email = t.email AND t.is_trial = TRUE
    WHERE u.created_at <= NOW() - INTERVAL '3 days'
      AND u.created_at >= NOW() - INTERVAL '4 days'
      AND (t.remaining_chats = 1 OR t.remaining_chats IS NULL)
      AND u.plan = 'free'
  `;

  let sent = 0;
  for (const user of users) {
    try {
      await sendFollowUpEmail({ email: user.email, name: user.name });
      sent++;
    } catch (e) {
      console.error(`フォローメール送信エラー: ${user.email}`, e);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
