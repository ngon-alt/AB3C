'use client';
// 管理画面：ポイントの付与と照会（2026-09-22）
// キャンプ第1期（10/15開始）の受講者への10万ポイント付与を主な用途として作った。
import { useState } from 'react';

const C = {
  ink: '#000000', muted: '#555', border: '#ccc', surface: '#fff', highlight: '#fef3c7', red: '#c0392b', ok: '#1a7e3a',
};
const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

// 付与の種類ごとの既定値（期限は発行から。どれも6か月を超えない）
const PRESETS = {
  camp: { label: 'キャンプ特典', points: 100000, months: 3 },
  admin: { label: '管理者付与', points: 10000, months: 6 },
  trial: { label: 'トライアル', points: 12700, months: 6 },
};

const inputStyle = { background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontSize: 16, fontFamily: FONT, outline: 'none' };
const btnStyle = { background: C.ink, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 16, fontWeight: 700, padding: '10px 20px' };

function fmtDate(d) {
  if (!d) return '—';
  const x = new Date(d);
  return `${x.getFullYear()}/${x.getMonth() + 1}/${x.getDate()}`;
}

function addMonthsISO(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const KIND_LABEL = { grant: '付与', consume: '消費', refund: '取り消し' };
// 内部の識別子は英語のまま、画面には日本語で出す
const DETAIL_LABEL = {
  trial: 'トライアル', payg: '従量購入', addon: '追加購入', subscription: 'サブスク', camp: 'キャンプ特典', admin: '管理者付与',
  analyze_standard: '標準分析', analyze_competitor: '競合徹底分析', reanalyze: '再分析', action_first: 'アクション', chat: 'チャット',
};

export default function PointsAdmin({ secret }) {
  const [source, setSource] = useState('camp');
  const [emails, setEmails] = useState('');
  const [points, setPoints] = useState(PRESETS.camp.points);
  const [expiresOn, setExpiresOn] = useState(addMonthsISO(PRESETS.camp.months));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookup, setLookup] = useState(null);

  const pickSource = (s) => {
    setSource(s);
    setPoints(PRESETS[s].points);
    setExpiresOn(addMonthsISO(PRESETS[s].months));
  };

  const grant = async () => {
    if (!secret) { setMessage('管理者認証がまだです'); return; }
    const count = emails.split(/[\s,、]+/).filter(Boolean).length;
    if (!count) { setMessage('メールアドレスを入力してください'); return; }
    if (!confirm(`${count}名に ${Number(points).toLocaleString()} ポイントを付与します（有効期限 ${expiresOn.replace(/-/g, '/')}）。よろしいですか？`)) return;
    setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 期限は「その日の終わり」まで使えるようにする
        body: JSON.stringify({ secret, emails, points: Number(points), source, expiresAt: `${expiresOn}T23:59:59+09:00`, note }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(`エラー: ${data.error}`); return; }
      const ok = data.results.filter(r => r.ok);
      const ng = data.results.filter(r => !r.ok);
      setMessage(`✓ ${ok.length}名に付与しました` + (ng.length ? `／失敗 ${ng.length}名: ${ng.map(r => `${r.email}（${r.error}）`).join('、')}` : ''));
      if (!ng.length) setEmails('');
    } catch (e) {
      setMessage(`エラー: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const doLookup = async () => {
    if (!secret || !lookupEmail.trim()) return;
    setLookup({ loading: true });
    try {
      const res = await fetch(`/api/admin/points?secret=${encodeURIComponent(secret)}&email=${encodeURIComponent(lookupEmail.trim())}`);
      const data = await res.json();
      setLookup(res.ok ? data : { error: data.error });
    } catch (e) {
      setLookup({ error: e.message || String(e) });
    }
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24, fontFamily: FONT, color: C.ink }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ポイント</div>
      <div style={{ fontSize: 16, color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
        付与したポイントは発行日から最長6か月で失効します（資金決済法の適用除外を保つため、6か月を超える期限は6か月に丸めます）。
      </div>

      {/* 付与 */}
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>付与する</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(PRESETS).map(([k, p]) => (
          <button key={k} onClick={() => pickSource(k)}
            style={{ ...btnStyle, background: source === k ? C.ink : '#d0d0d0', color: source === k ? '#fff' : C.ink, padding: '8px 16px' }}>
            {p.label}
          </button>
        ))}
      </div>
      <label style={{ display: 'block', fontSize: 16, marginBottom: 6 }}>メールアドレス（複数は改行かカンマで区切る）</label>
      <textarea value={emails} onChange={e => setEmails(e.target.value)} rows={4}
        placeholder={'taro@example.com\nhanako@example.com'}
        style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 12, resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <label style={{ fontSize: 16 }}>ポイント<br />
          <input type="number" min={1} value={points} onChange={e => setPoints(e.target.value)} style={{ ...inputStyle, width: 160 }} />
        </label>
        <label style={{ fontSize: 16 }}>有効期限<br />
          <input type="date" value={expiresOn} onChange={e => setExpiresOn(e.target.value)} style={{ ...inputStyle, width: 180 }} />
        </label>
        <label style={{ fontSize: 16, flex: 1, minWidth: 200 }}>メモ（任意）<br />
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="例：キャンプ第1期" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </label>
      </div>
      <button onClick={grant} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}>{busy ? '付与しています…' : '付与する'}</button>
      {message && <div style={{ marginTop: 12, fontSize: 16, color: message.startsWith('✓') ? C.ok : C.red, lineHeight: 1.7 }}>{message}</div>}

      {/* 照会 */}
      <div style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 10px' }}>残高と履歴を見る</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input type="email" value={lookupEmail} onChange={e => setLookupEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doLookup(); }}
          placeholder="メールアドレス" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={doLookup} style={btnStyle}>見る</button>
      </div>
      {lookup?.loading && <div style={{ marginTop: 12, fontSize: 16 }}>読み込んでいます…</div>}
      {lookup?.error && <div style={{ marginTop: 12, fontSize: 16, color: C.red }}>エラー: {lookup.error}</div>}
      {lookup && !lookup.loading && !lookup.error && (
        <div style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>残高 {lookup.balance.toLocaleString()} ポイント</div>
          {lookup.lots.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {lookup.lots.map(l => (
                <div key={l.id}>・{l.sourceLabel}：残り {l.remaining.toLocaleString()}（付与 {l.granted_points.toLocaleString()}）／有効期限 {fmtDate(l.expires_at)}</div>
              ))}
            </div>
          )}
          {lookup.transactions.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 16 }}>
              <thead>
                <tr style={{ background: C.highlight }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>日時</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>内容</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>ポイント</th>
                </tr>
              </thead>
              <tbody>
                {lookup.transactions.map((t, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</td>
                    <td style={{ padding: '6px 8px' }}>{KIND_LABEL[t.kind] || t.kind}{t.feature ? `（${DETAIL_LABEL[t.feature] || t.feature}）` : ''}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: t.delta < 0 ? C.red : C.ok }}>{t.delta > 0 ? '+' : ''}{t.delta.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
