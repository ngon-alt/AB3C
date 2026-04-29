import { neon } from '@neondatabase/serverless';
import { sendPlanDowngradeEmail } from '@/app/lib/email';

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

    // 切り替え前の support プラン site_limit 最大値（ダウングレード判定用）
    const preChangeSupport = await sql`
      SELECT site_limit FROM user_plans
      WHERE user_email = ${email} AND plan_type = 'support' AND status = 'active'
    `;
    const preChangeUserPlansMax = Math.max(0, ...preChangeSupport.map(r => parseInt(r.site_limit || 0)));
    // PRO（pro_users）も「実質無制限プラン」として扱い、契約サイト数までしか持てないようにする
    const preProCheck = await sql`SELECT email FROM pro_users WHERE email = ${email}`;
    const wasPro = preProCheck.length > 0;
    let preChangeProLimit = 0;
    if (wasPro) {
      const cnt = await sql`SELECT COUNT(*) as c FROM sites WHERE user_email = ${email}`;
      preChangeProLimit = parseInt(cnt[0].c);
    }
    const preChangeMaxSupport = Math.max(preChangeUserPlansMax, preChangeProLimit);

    // 既存プランを無効化
    await sql`UPDATE user_plans SET status = 'canceled' WHERE user_email = ${email} AND status = 'active'`;
    // 新規プラン登録
    await sql`
      INSERT INTO user_plans (user_email, plan_type, site_limit, interval, stripe_price_id)
      VALUES (${email}, ${p.type}, ${p.sites}, 'admin', 'admin_manual')
    `;

    // 切り替え後の support プラン site_limit（新プランが support でない場合は 0）
    const newSupportLimit = p.type === 'support' ? parseInt(p.sites) : 0;

    // ダウングレード判定: 旧 support 上限 > 新 support 上限 の場合のみ超過サイトを削除
    if (preChangeMaxSupport > newSupportLimit) {
      // 新しい N 件は残し、それより古い分を削除（ORDER BY DESC OFFSET N で古い方を取得）
      const sitesToDelete = await sql`
        SELECT id, site_name, site_url FROM sites
        WHERE user_email = ${email}
        ORDER BY created_at DESC
        OFFSET ${newSupportLimit}
      `;
      if (sitesToDelete.length > 0) {
        const ids = sitesToDelete.map(s => s.id);
        await sql`DELETE FROM sites WHERE id = ANY(${ids})`;
        console.log(`管理画面プラン切替によるダウングレード: ${email} / ${preChangeMaxSupport} → ${newSupportLimit} / ${sitesToDelete.length}サイト削除`);
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
            deletedSites: sitesToDelete,
            oldLimit: preChangeMaxSupport,
            newLimit: newSupportLimit,
          });
        } catch (e) {
          console.error('管理画面ダウングレード通知メール送信エラー:', e);
        }
      }
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
  return Response.json({ success: true });
}
