import { neon } from '@neondatabase/serverless';
import { sendPlanDowngradeEmail } from '@/app/lib/email';
import { enforceLicenseSiteCap } from '@/app/lib/license-site-cap';

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

    // ライセンス上限を超えるサイトを古い順に削除
    try {
      const capResult = await enforceLicenseSiteCap(sql, email);
      if (!capResult.skipped && capResult.deleted > 0) {
        console.log(`管理画面プラン切替によるライセンス上限超過削除: ${email} / ${capResult.previousCount} → ${capResult.cap} / ${capResult.deleted}サイト削除`);
        // ダウングレード通知メール（対象ユーザーへ）
        try {
          let userName = null;
          try {
            const nameRows = await sql`SELECT name FROM users WHERE email = ${email} LIMIT 1`;
            if (nameRows.length > 0) userName = nameRows[0].name;
          } catch (e) {}
          await sendPlanDowngradeEmail({
            email,
            name: userName,
            deletedSites: capResult.deletedSites,
            oldLimit: capResult.previousCount,
            newLimit: capResult.cap,
          });
        } catch (e) {
          console.error('管理画面ダウングレード通知メール送信エラー:', e);
        }
      }
    } catch (e) {
      console.error('enforceLicenseSiteCap error:', e);
    }
  }

  return Response.json({ success: true });
}

export async function DELETE(req) {
  const { secret, email } = await req.json();
  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: '認証エラー' }, { status: 401 });
  }
  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM pro_users WHERE email = ${email}`;
  try { await sql`UPDATE user_plans SET status = 'canceled' WHERE user_email = ${email} AND status = 'active'`; } catch (e) {}
  // PRO 解除＋プラン無効化後、ライセンス上限を再評価して超過サイトを削除
  // （戦略指南プランがない状態になるので実質「全削除」が走る）
  try {
    const capResult = await enforceLicenseSiteCap(sql, email);
    if (!capResult.skipped && capResult.deleted > 0) {
      console.log(`PRO解除によるライセンス上限超過削除: ${email} / ${capResult.previousCount} → ${capResult.cap} / ${capResult.deleted}サイト削除`);
      try {
        let userName = null;
        try {
          const nameRows = await sql`SELECT name FROM users WHERE email = ${email} LIMIT 1`;
          if (nameRows.length > 0) userName = nameRows[0].name;
        } catch (e) {}
        await sendPlanDowngradeEmail({
          email,
          name: userName,
          deletedSites: capResult.deletedSites,
          oldLimit: capResult.previousCount,
          newLimit: capResult.cap,
        });
      } catch (e) {
        console.error('PRO解除ダウングレード通知メール送信エラー:', e);
      }
    }
  } catch (e) {
    console.error('enforceLicenseSiteCap error (DELETE):', e);
  }
  return Response.json({ success: true });
}
