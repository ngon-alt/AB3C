import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { neon } from "@neondatabase/serverless";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const sql = neon(process.env.DATABASE_URL);
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
      await sql`
        INSERT INTO users (email, name)
        VALUES (${user.email}, ${user.name})
        ON CONFLICT (email) DO UPDATE SET name = ${user.name}
      `;
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
});

export { handler as GET, handler as POST };
