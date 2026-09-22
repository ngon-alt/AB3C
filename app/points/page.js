'use client';
// ポイントの残高と購入（2026-09-22）
// 価格・仕様の正典は docs/料金体系-ポイント制-20260919.md。
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

const C = {
  ink: '#000000', muted: '#555', border: '#ccc', surface: '#fff', bg: '#f5f2eb', card: '#e8e8e8',
  btn: '#555', red: '#c0392b', ok: '#1a7e3a',
};
const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
const HEAD = "'Noto Serif JP', serif";

const yen = (n) => `${Number(n).toLocaleString('ja-JP')}円`;
const pt = (n) => `${Number(n).toLocaleString('ja-JP')}ポイント`;
function fmtDate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}年${x.getMonth() + 1}月${x.getDate()}日`;
}
// 税込金額から税別（10%）を出す
const exTax = (inc) => Math.round(inc / 1.1);

const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 };
const btnStyle = { background: C.ink, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 18, fontWeight: 700, padding: '12px 20px' };

export default function PointsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [interval, setIntervalSel] = useState('month');
  const [qty, setQty] = useState({ payg: 1, addon: 1 });
  const [busy, setBusy] = useState('');
  const [purchased, setPurchased] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/points');
      const d = await res.json();
      if (!res.ok) { setError(d.error || '読み込めませんでした'); return; }
      setData(d); setError('');
    } catch (e) { setError('読み込めませんでした'); }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    load();
    // 決済直後は webhook の反映が数秒遅れることがあるので、少し待って読み直す
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchased')) {
      setPurchased(true);
      const t1 = setTimeout(load, 4000);
      const t2 = setTimeout(load, 12000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [status]);

  const checkout = async (body, key) => {
    setBusy(key); setError('');
    try {
      const res = await fetch('/api/points/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok || !d.url) { setError(d.error || '決済画面を開けませんでした'); setBusy(''); return; }
      window.location.href = d.url;
    } catch (e) { setError('決済画面を開けませんでした'); setBusy(''); }
  };

  if (status === 'loading') return <Shell><div style={{ fontSize: 18 }}>読み込んでいます…</div></Shell>;
  if (!session) return (
    <Shell>
      <div style={cardStyle}>
        <div style={{ fontSize: 18, marginBottom: 16 }}>ポイントの確認・購入にはログインが必要です。</div>
        <button onClick={() => signIn('google')} style={btnStyle}>Googleでログイン</button>
      </div>
    </Shell>
  );

  const sub = data?.subscription;

  return (
    <Shell>
      {purchased && (
        <div style={{ ...cardStyle, borderLeft: `4px solid ${C.ok}`, fontSize: 18, lineHeight: 1.7 }}>
          ご購入ありがとうございます。ポイントの反映まで数十秒かかることがあります。
        </div>
      )}
      {error && <div style={{ ...cardStyle, borderLeft: `4px solid ${C.red}`, fontSize: 18, color: C.red }}>{error}</div>}

      {/* 残高 */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, color: C.muted, marginBottom: 4 }}>現在のポイント</div>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: FONT }}>{data ? pt(data.balance) : '…'}</div>
        {sub && <div style={{ fontSize: 18, marginTop: 8 }}>ご契約中：{sub.tierLabel}（{sub.interval === 'year' ? '年間契約' : '月払い'}・毎月{pt(sub.monthlyPoints)}）</div>}
        {data?.lots?.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 18, lineHeight: 1.8 }}>
            {data.lots.map((l, i) => (
              <div key={i}>・{l.sourceLabel}：{pt(l.remaining)}（{fmtDate(l.expiresAt)}まで）</div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 16, color: C.muted, marginTop: 12, lineHeight: 1.7 }}>
          ポイントは有効期限の近いものから使われます。毎月のプランで付与されたポイントは、その月限りです。
        </div>
      </div>

      {/* プラン */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: HEAD, fontSize: 26, margin: '0 0 8px' }}>プラン</h2>
        <div style={{ fontSize: 18, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>毎月ポイントが付与されます（その月限り）。年間契約は月払いの10か月分で、途中解約はできません。</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['month', '月払い'], ['year', '年間契約']].map(([k, label]) => (
            <button key={k} onClick={() => setIntervalSel(k)}
              style={{ ...btnStyle, padding: '8px 18px', fontSize: 16, background: interval === k ? C.ink : '#d0d0d0', color: interval === k ? '#fff' : C.ink }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {(data?.menu?.tiers || []).map(t => {
            const inc = interval === 'year' ? t.monthYen * 10 : t.monthYen;
            const isCurrent = sub?.tier === t.id;
            return (
              <div key={t.id} style={{ background: C.card, borderRadius: 6, padding: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontSize: 18 }}>{interval === 'year' ? '年' : '月'} {yen(exTax(inc))}<span style={{ fontSize: 16, color: C.muted }}>（税込 {yen(inc)}）</span></div>
                <div style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 14px' }}>毎月 {pt(t.points)}</div>
                <button disabled={!!sub || !!busy} onClick={() => checkout({ type: 'subscription', tier: t.id, interval }, t.id)}
                  style={{ ...btnStyle, width: '100%', fontSize: 16, opacity: sub || busy ? 0.5 : 1, cursor: sub || busy ? 'default' : 'pointer' }}>
                  {isCurrent ? 'ご契約中' : busy === t.id ? '決済画面を開いています…' : '申し込む'}
                </button>
              </div>
            );
          })}
        </div>
        {sub && <div style={{ fontSize: 16, color: C.muted, marginTop: 12 }}>プランの変更はお問い合わせください。</div>}
      </div>

      {/* 単発の購入 */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: HEAD, fontSize: 26, margin: '0 0 8px' }}>ポイントを買う</h2>
        <div style={{ fontSize: 18, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>1口 1,000円（税込 1,100円）から。購入したポイントの有効期限は6か月です。</div>
        {(data?.menu?.purchases || []).map(p => {
          const locked = p.id === 'addon' && !sub;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 0', borderTop: `1px solid ${C.border}`, opacity: locked ? 0.55 : 1 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 18 }}>1口 {pt(p.pointsPerUnit)}（{p.id === 'addon' ? 'ご契約中の方のみ・1ポイント1円' : 'ご契約なしで購入できます・1ポイント2円'}）</div>
              </div>
              <label style={{ fontSize: 18 }}>
                <select value={qty[p.id]} disabled={locked} onChange={e => setQty({ ...qty, [p.id]: Number(e.target.value) })}
                  style={{ fontSize: 18, padding: '8px 10px', fontFamily: FONT, background: '#fef3c7', border: `1px solid ${C.border}`, borderRadius: 4 }}>
                  {[1, 2, 3, 5, 10, 20, 50].map(n => <option key={n} value={n}>{n}口</option>)}
                </select>
              </label>
              <div style={{ fontSize: 18, minWidth: 190 }}>{pt(p.pointsPerUnit * qty[p.id])}／{yen(p.unitYen * qty[p.id])}（税込）</div>
              <button disabled={locked || !!busy} onClick={() => checkout({ type: p.id, quantity: qty[p.id] }, p.id)}
                style={{ ...btnStyle, fontSize: 16, opacity: locked || busy ? 0.5 : 1, cursor: locked || busy ? 'default' : 'pointer' }}>
                {busy === p.id ? '決済画面を開いています…' : '購入する'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 16, color: C.muted, lineHeight: 1.8 }}>
        ご購入後の返金はできません（当方の責によりサービスが正常に提供されなかった場合、二重決済などの明らかな決済エラーを除く）。
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT, color: C.ink }}>
      <div style={{ borderBottom: `2px solid ${C.ink}`, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 700 }}>戦略指南 AI　ポイント</div>
        <a href="/" style={{ fontSize: 16, color: C.muted, textDecoration: 'none' }}>← トップに戻る</a>
      </div>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 16px' }}>{children}</div>
    </div>
  );
}
