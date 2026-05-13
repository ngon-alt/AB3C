'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

const ADMIN_EMAIL = 'webconsultant2022@gmail.com';

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#8a8478", highlight: "#f0ebe0",
  red: "#c0392b",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [proUsers, setProUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('unlimited');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

 useEffect(() => {
  if (isAdmin) {
    fetch('/api/admin/secret')
      .then(res => res.json())
      .then(data => {
        if (data.secret) {
          setSecret(data.secret);
        }
      });
  }
}, [isAdmin]);

useEffect(() => {
  if (isAdmin && secret) { fetchProUsers(); fetchStats(); }
}, [isAdmin, secret]);

  const fetchProUsers = async () => {
    const res = await fetch('/api/admin/pro-users/list?secret=' + secret);
    const data = await res.json();
    if (data.users) setProUsers(data.users);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/subscription-stats?secret=' + secret);
      const data = await res.json();
      if (data.support || data.analysis) setStats(data);
    } catch (e) {}
  };

  const addUser = async () => {
    if (!email || !secret) return;
    setLoading(true);
    const res = await fetch('/api/admin/pro-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, email, name, plan }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✓ ${email} を追加しました（${plan}）`);
      setEmail(''); setName(''); setPlan('unlimited');
      fetchProUsers();
    } else {
      setMessage(`エラー: ${data.error}`);
    }
    setLoading(false);
  };

  const changePlan = async (targetEmail, newPlan) => {
    try {
      await fetch('/api/admin/pro-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, email: targetEmail, name: '', plan: newPlan }),
      });
      setMessage(`✓ ${targetEmail} のプランを変更しました`);
      fetchProUsers();
    } catch (e) { setMessage('エラー: プラン変更に失敗しました'); }
  };

  const deleteUser = async (emailToDelete) => {
    if (!confirm(`${emailToDelete} を削除しますか？`)) return;
    const res = await fetch('/api/admin/pro-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, email: emailToDelete }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✓ ${emailToDelete} を削除しました`);
      fetchProUsers();
    }
  };

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>読み込み中...</div>;

  if (!session) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          <span style={{ color: C.C }}>戦略指南 AI</span>
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>管理者ページ</div>
        <button onClick={() => signIn('google')} style={{ background: C.A, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: '10px 24px' }}>
          Googleでログイン
        </button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: C.red }}>アクセス権限がありません</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{ borderBottom: `2px solid ${C.ink}`, padding: '20px 32px', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: C.C }}>戦略指南 AI</span>
          <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>管理者ページ</span>
        </div>
        <a href="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>← トップに戻る</a>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {/* 認証 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>管理者認証</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="password"
              placeholder="ADMIN_SECRET を入力"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={{ flex: 1, background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Space Mono', monospace" }}
            />
            <button onClick={fetchProUsers} style={{ background: C.ink, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: '8px 20px' }}>
              読み込む
            </button>
          </div>
        </div>

        {/* 契約者統計 */}
        {stats && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>契約者統計</div>
              <button onClick={fetchStats} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted, cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 11, padding: '4px 10px' }}>
                ↻ 更新
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {/* 戦略指南サブスク */}
              <div style={{ padding: '14px 16px', background: '#fef5e9', border: `1px solid #f0c068`, borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>戦略指南サブスク</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#1a7e3a', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>有料</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1a7e3a', fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{stats.support.paidCount}<span style={{ fontSize: 13, color: C.muted, marginLeft: 2 }}>名</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#a06800', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>トライアル</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#a06800', fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{stats.support.trialCount}<span style={{ fontSize: 13, color: C.muted, marginLeft: 2 }}>名</span></div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, borderTop: `1px solid #f0c068`, paddingTop: 8 }}>
                  有料の内訳: 月額 {stats.support.monthlyCount} / 年額 {stats.support.yearlyCount}<br/>
                  契約サイト合計: <b style={{ color: C.ink }}>{stats.support.totalSites}</b> サイト<br/>
                  <span style={{ color: '#888' }}>過去の解約: {stats.support.canceledTotal}</span>
                </div>
              </div>
              {/* 戦略診断チケット */}
              <div style={{ padding: '14px 16px', background: '#e8f0fb', border: `1px solid #a0c0e8`, borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>戦略診断チケット</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{stats.analysis.count}<span style={{ fontSize: 14, color: C.muted, marginLeft: 4 }}>名</span></div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                  チケット総数: <b style={{ color: C.ink }}>{stats.analysis.totalTickets}</b><br/>
                  使用済: {stats.analysis.usedTickets} / 残: <b style={{ color: C.ink }}>{stats.analysis.remainingTickets}</b>
                </div>
              </div>
            </div>
            {stats.support.plans && stats.support.plans.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <button onClick={() => setStatsExpanded(!statsExpanded)} style={{ background: 'transparent', border: 'none', color: C.A, cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 12, padding: 0 }}>
                  {statsExpanded ? '▼' : '▶'} 戦略指南サブスク契約者一覧（{stats.support.plans.length}件）
                </button>
                {statsExpanded && (
                  <div style={{ marginTop: 10, maxHeight: 360, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 4 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: C.highlight, position: 'sticky', top: 0 }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>区分</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>メール</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>名前</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>サイト</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>周期</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>契約日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.support.plans.map((p, i) => (
                          <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: p.is_trial ? '#fff8e6' : 'transparent', opacity: p.is_trial ? 0.85 : 1 }}>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                              {p.is_trial ? (
                                <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>TRIAL</span>
                              ) : (
                                <span style={{ background: '#1a7e3a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>PAID</span>
                              )}
                            </td>
                            <td style={{ padding: '6px 10px' }}>{p.email}</td>
                            <td style={{ padding: '6px 10px' }}>{p.name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{p.site_limit}</td>
                            <td style={{ padding: '6px 10px' }}>{p.is_trial ? 'トライアル' : (p.interval === 'year' ? '年額' : '月額')}</td>
                            <td style={{ padding: '6px 10px', color: C.muted, fontFamily: "'Space Mono', monospace" }}>{p.purchased_at ? new Date(p.purchased_at).toLocaleDateString('ja-JP') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 新規追加 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>プロ会員を追加</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontSize: 13, outline: 'none' }}
            />
            <input
              type="text"
              placeholder="名前"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontSize: 13, outline: 'none' }}
            />
            <select
              value={plan}
              onChange={e => setPlan(e.target.value)}
              style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontSize: 13, outline: 'none' }}
            >
              <option value="unlimited">無制限</option>
              <optgroup label="戦略診断チケット">
                <option value="analysis_1">診断 1サイト</option>
                <option value="analysis_10">診断 10サイト</option>
                <option value="analysis_100">診断 100サイト</option>
              </optgroup>
              <optgroup label="戦略指南サブスク">
                <option value="support_1">指南1サイト</option>
                <option value="support_5">指南5サイト</option>
                <option value="support_15">指南15サイト</option>
                <option value="support_30">指南30サイト</option>
                <option value="support_60">指南60サイト</option>
                <option value="support_120">指南120サイト</option>
              </optgroup>
            </select>
          </div>
          <button onClick={addUser} disabled={loading} style={{ background: C.A, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: '10px 24px' }}>
            {loading ? '追加中...' : '+ 追加する'}
          </button>
          {message && <div style={{ marginTop: 10, fontSize: 13, color: message.startsWith('✓') ? '#1a6b3a' : C.red }}>{message}</div>}
        </div>

        {/* 会員一覧 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            プロ会員一覧（{proUsers.length}名）
          </div>
          {proUsers.length === 0 ? (
            <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 20 }}>会員がいません</div>
          ) : (
            proUsers.map((user, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < proUsers.length - 1 ? `1px solid ${C.border}` : 'none', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{user.email}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{user.added_at?.slice(0, 10)}</div>
                </div>
                <select defaultValue={user.plan_label === '無制限' ? 'unlimited' : `${user.plan_label?.includes('伴走') ? 'support' : 'analysis'}_${user.plan_label?.replace(/[^0-9]/g, '')}`}
                  onChange={e => changePlan(user.email, e.target.value)}
                  style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 11 }}>
                  <option value="unlimited">無制限</option>
                  <option value="analysis_1">分析1</option>
                  <option value="analysis_10">分析10</option>
                  <option value="analysis_100">分析100</option>
                  <option value="support_1">伴走1</option>
                  <option value="support_5">伴走5</option>
                  <option value="support_15">伴走15</option>
                  <option value="support_30">伴走30</option>
                  <option value="support_60">伴走60</option>
                  <option value="support_120">伴走120</option>
                </select>
                <button onClick={() => deleteUser(user.email)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.red, cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 11, padding: '6px 12px' }}>
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
