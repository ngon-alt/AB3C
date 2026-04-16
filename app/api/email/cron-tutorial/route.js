import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  sendFollowUpEmail,
  sendTutorial2Email,
  sendTutorial3Email,
  sendTutorial4Email,
  sendTutorial5Email,
} from "@/app/lib/email";

// Vercel Cronで毎日叩くエンドポイント（schedule: "0 0 * * *" = UTC毎日0時 = JST 9時）
// 登録日からの経過日数に応じてチュートリアルメール#1〜#5を送信
// 同じメールは二度送らない（email_logsで管理）
function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  // Vercel Cron が自動付与する Authorization ヘッダ: "Bearer ${CRON_SECRET}"
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${expected}`) return true;
  // 手動トリガー時の x-cron-secret ヘッダ（既存互換）
  const xSecret = req.headers.get("x-cron-secret");
  if (xSecret === expected) return true;
  return false;
}

export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);

  // email_logsテーブル（なければ作成）
  await sql`
    CREATE TABLE IF NOT EXISTS email_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      email_type VARCHAR(50) NOT NULL,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email, email_type)`;

  // 配信定義: key = email_type, days = 送信タイミング（登録からN日後）, fn = 送信関数
  const tutorials = [
    { type: "tutorial_1", days: 3, fn: sendFollowUpEmail },
    { type: "tutorial_2", days: 5, fn: sendTutorial2Email },
    { type: "tutorial_3", days: 8, fn: sendTutorial3Email },
    { type: "tutorial_4", days: 12, fn: sendTutorial4Email },
    { type: "tutorial_5", days: 25, fn: sendTutorial5Email },
  ];

  const results = [];

  const now = new Date();

  for (const tutorial of tutorials) {
    try {
      // 対象ユーザー: 登録から「N日前〜N+1日前」の24時間枠に入るユーザー
      // かつ、まだ該当メールを送っていない
      const upperBound = new Date(now.getTime() - tutorial.days * 24 * 60 * 60 * 1000);
      const lowerBound = new Date(now.getTime() - (tutorial.days + 1) * 24 * 60 * 60 * 1000);
      const users = await sql`
        SELECT u.email, u.name
        FROM users u
        WHERE u.created_at <= ${upperBound.toISOString()}::timestamptz
          AND u.created_at >= ${lowerBound.toISOString()}::timestamptz
          AND NOT EXISTS (
            SELECT 1 FROM email_logs l
            WHERE l.email = u.email AND l.email_type = ${tutorial.type}
          )
      `;

      let sent = 0;
      let failed = 0;
      for (const user of users) {
        try {
          await tutorial.fn({ email: user.email, name: user.name });
          await sql`
            INSERT INTO email_logs (email, email_type)
            VALUES (${user.email}, ${tutorial.type})
          `;
          sent++;
        } catch (e) {
          console.error(`${tutorial.type} 送信エラー: ${user.email}`, e);
          failed++;
        }
      }

      results.push({
        type: tutorial.type,
        days: tutorial.days,
        targets: users.length,
        sent,
        failed,
      });
    } catch (e) {
      console.error(`${tutorial.type} 処理エラー:`, e);
      results.push({ type: tutorial.type, error: e.message });
    }
  }

  return NextResponse.json({ ok: true, results });
}

// 動作確認用: GET で過去30日分の送信ログを確認
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const recentLogs = await sql`
      SELECT email_type, COUNT(*) as count, MAX(sent_at) as last_sent
      FROM email_logs
      WHERE sent_at >= NOW() - INTERVAL '30 days'
      GROUP BY email_type
      ORDER BY email_type
    `;
    return NextResponse.json({ ok: true, recent_30days: recentLogs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
