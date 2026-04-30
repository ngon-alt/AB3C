import { neon } from '@neondatabase/serverless';
// ※ プラン切替・PRO 解除時のサイト削除はユーザー選択型 UI に変更したため、
//    管理画面操作では自動削除しない（次回ログイン時に /api/sites/cap-resolve 経由で削除）。

const ADMIN_SECRET = process.env.ADMIN_SECRET;

const PLAN_MAP = {
  analysis_1: { type: 'analysis', sites: 1 },
  analysis_10: { type: 'analysis', sites: 10 },
  analysis_100: { type: 'analysis', sites: 100 },
  support_1: { type: 'support', sites: 1 },
  support_5: { type: 'support', sites: 5 },
  support_15: { type: 'support', sites: 15 },
  support_30: { type: 'support', sites: 30 },
  support_60: { type: 'support', sites: 60 },
  support_120: { type: 'support', sites: 120 },
};

export async function POST(req) {
  const { secret, email, name, plan } = await req.json();
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  if (name) {
    await sql`
      INSERT INTO pro_users (email, name)
      VALUES (${email}, ${name})
      ON CONFLICT (email) DO NOTHING
    `;
  }

  // プラン登録（unlimited以外）
  if (plan && plan !== 'unlimited' && PLAN_MAP[plan]) {
    const p = PLAN_MAP[plan];
    await sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        site_limit INTEGER NOT NULL,
        interval VARCHAR(10) NOT NULL,
        stripe_price_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // 既存プランを無効化
    await sql`UPDATE user_plans SET status = 'canceled' WHERE user_email = ${email} AND status = 'active'`;
    // 新規プラン登録
    await sql`
      INSERT INTO user_plans (user_email, plan_type, site_limit, interval, stripe_price_id)
      VALUES (${email}, ${p.type}, ${p.sites}, 'admin', 'admin_manual')
    `;
    // ※ サイト超過分の削除はユーザー側のモーダル操作（/api/sites/cap-resolve）で実施
  }

  return Response.json({ success: true });
}

export async function DELETE(req) {
  const { secret, email } = await req.json();
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  // PRO（テスト用無制限）解除のみ。
  // ※ かつては user_plans の active を canceled に書き換えていたが、
  //   有料契約者が誤って pro_users に混在していた場合に、削除操作で
  //   実ライセンス（user_plans）まで無効化される事故が発生したため廃止。
  //   有料プランの解約は Stripe Customer Portal もしくは admin POST 経由で行うこと。
  await sql`DELETE FROM pro_users WHERE email = ${email}`;
  // ※ サイト超過分の削除はユーザー側のモーダル操作（/api/sites/cap-resolve）で実施
  return Response.json({ success: true });
}
