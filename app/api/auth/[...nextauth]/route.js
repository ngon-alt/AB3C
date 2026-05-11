import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { neon } from "@neondatabase/serverless";
import { sendWelcomeEmail, sendWelcomeEmailAgency, sendRegistrationEmail } from "@/app/lib/email";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const sql = neon(process.env.DATABASE_URL);

      // usersテーブル作成・ユーザー登録
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          plan VARCHAR(50) DEFAULT 'free',
          usage_count INTEGER DEFAULT 0,
          usage_reset_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
      const isNewUser = existing.length === 0;

      await sql`
        INSERT INTO users (email, name)
        VALUES (${user.email}, ${user.name})
        ON CONFLICT (email) DO UPDATE SET name = ${user.name}
      `;

      // 新規ユーザー処理: 24時間フリーパス（戦略指南サブスク1サイト体験）を発行
      // - user_plans に is_trial=TRUE / plan_type='support' / site_limit=1 / expires_at=NOW()+24h
      // - tickets に is_trial=TRUE / remaining_chats=100（既存の判定ロジックを再利用）
      // 期限切れ後は user_plans 側のクエリで自動的に除外される。sites データは温存し、
      // 本契約後にそのまま使えるようにする（指南プラン誘導の動線）。
      if (isNewUser) {
        try {
          // user_plans / tickets のテーブル/カラムが存在することを保証
          // （本来は sites/route.js の ensureTable 経由だが、初回ログイン時はそこを通らない可能性）
          await sql`
            CREATE TABLE IF NOT EXISTS user_plans (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_email VARCHAR(255) NOT NULL,
              plan_type VARCHAR(20) NOT NULL,
              site_limit INTEGER NOT NULL,
              analyses_used INTEGER DEFAULT 0,
              interval VARCHAR(10) NOT NULL,
              stripe_price_id VARCHAR(255),
              stripe_subscription_id VARCHAR(255),
              status VARCHAR(20) DEFAULT 'active',
              purchased_at TIMESTAMPTZ DEFAULT NOW(),
              expires_at TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;
          await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE`;
          // tickets にも expires_at を追加（トライアルチケットの24h失効に使用）
          await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;

          await sql`
            INSERT INTO user_plans (user_email, plan_type, site_limit, interval, status, expires_at, is_trial)
            VALUES (${user.email}, 'support', 1, 'trial', 'active', NOW() + INTERVAL '24 hours', TRUE)
          `;
          await sql`
            INSERT INTO tickets (email, remaining_chats, is_trial, expires_at)
            VALUES (${user.email}, 100, TRUE, NOW() + INTERVAL '24 hours')
          `;
        } catch (e) {
          console.error('24時間トライアル発行エラー:', e);
        }

        // 登録完了メール送信
        try {
          await sendRegistrationEmail({ email: user.email, name: user.name });
        } catch (e) {
          console.error('登録完了メール送信エラー:', e);
        }
      }

      return true;
    },
    async session({ session }) {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`SELECT * FROM users WHERE email = ${session.user.email}`;
      if (rows.length > 0) {
        session.user.plan = rows[0].plan;
        session.user.usageCount = rows[0].usage_count;
        session.user.usageResetDate = rows[0].usage_reset_date;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
