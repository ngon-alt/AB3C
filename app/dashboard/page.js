"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14",
  bg: "#ebebeb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#000000", muted: "#78716c", highlight: "#fef3c7",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

function SiteCard({ site, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(site.site_name);
  const hasAnalysis = !!site.latest_analysis;
  const confirmed = site.strategy_confirmed;

  const handleSaveName = () => {
    if (editName.trim() && editName !== site.site_name) {
      onRename(site.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "20px 24px", transition: "box-shadow 0.2s",
      borderLeft: confirmed ? `4px solid ${C.A}` : hasAnalysis ? `4px solid ${C.B}` : `4px solid ${C.border}`,
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* サイト名 + ステータス */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          {editing ? (
            <input value={editName} onChange={e => setEditName(e.target.value)}
              onBlur={handleSaveName} onKeyDown={e => e.key === "Enter" && handleSaveName()}
              autoFocus
              style={{ fontSize: 18, fontWeight: 700, color: C.ink, border: `1px solid ${C.A}`, borderRadius: 4, padding: "4px 8px", width: "100%", fontFamily: FONT }} />
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: FONT }}>{site.site_name}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {confirmed && <span style={{ background: C.A, color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>戦略確定</span>}
          {hasAnalysis && !confirmed && <span style={{ background: C.B, color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>分析済み</span>}
          {!hasAnalysis && <span style={{ background: "#e8e8e8", color: C.muted, fontSize: 11, padding: "3px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>未分析</span>}
        </div>
      </div>

      {/* URL */}
      {site.site_url && (
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {site.site_url}
        </div>
      )}

      {/* 日付 */}
      <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>
        {new Date(site.updated_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* アクションリンク */}
      <div style={{ display: "flex", gap: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onSelect(site); }}
          style={{ fontSize: 14, color: C.A, textDecoration: "underline", cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = "#0d4ea3"; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = C.A; }}>
          分析を開く
        </a>
        {site.site_url && (
          <a href={site.site_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, color: C.muted, textDecoration: "underline", fontFamily: FONT }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = C.ink; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = C.muted; }}>
            URLを開く
          </a>
        )}
        <a href="#" onClick={(e) => { e.preventDefault(); setEditing(true); }}
          style={{ fontSize: 14, color: C.muted, textDecoration: "underline", cursor: "pointer", fontFamily: FONT }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = C.ink; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = C.muted; }}>
          名前変更
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); onDelete(site.id); }}
          style={{ fontSize: 14, color: "#c0392b", textDecoration: "underline", cursor: "pointer", fontFamily: FONT }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = "#e74c3c"; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = "#c0392b"; }}>
          削除
        </a>
      </div>
    </div>
  );
}

function NewSiteForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ site_name: "", site_url: "", company_name: "", industry: "", target_customer: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.site_name) { setError("サイト名は必須です。"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "登録に失敗しました。"); return; }
      onCreated(data.site);
    } catch (e) { setError("エラーが発生しました: " + (e.message || "")); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4,
    color: C.ink, fontFamily: FONT, fontSize: 15, padding: "10px 14px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "28px 32px", maxWidth: 600 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 20 }}>
        新規サイト登録
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: C.muted, display: "block", marginBottom: 6, fontFamily: FONT }}>サイト名 *</label>
          <input value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} placeholder="例：株式会社ABC コーポレートサイト" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: C.muted, display: "block", marginBottom: 6, fontFamily: FONT }}>URL</label>
          <input type="url" value={form.site_url} onChange={e => setForm({ ...form, site_url: e.target.value })} placeholder="https://example.co.jp" style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 14, color: C.muted, display: "block", marginBottom: 6, fontFamily: FONT }}>会社名</label>
            <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="株式会社ABC" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 14, color: C.muted, display: "block", marginBottom: 6, fontFamily: FONT }}>業種</label>
            <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="例：IT / 飲食 / 製造業" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, color: C.muted, display: "block", marginBottom: 6, fontFamily: FONT }}>ターゲット顧客</label>
          <textarea value={form.target_customer} onChange={e => setForm({ ...form, target_customer: e.target.value })} placeholder="例：中小企業の経営者、30-50代" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {error && (
          <div style={{ background: "#fdf0ef", borderLeft: `3px solid #c0392b`, padding: "10px 14px", fontSize: 14, color: "#c0392b", marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving} style={{
            background: saving ? C.muted : C.ink, border: "none", borderRadius: 4, color: "#fff",
            cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "12px 28px",
          }}>
            {saving ? "登録中..." : "登録する"}
          </button>
          <button type="button" onClick={onCancel} style={{
            background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted,
            cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "12px 20px",
          }}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

const ACTIVE_PLAN_STORAGE_KEY = "ab3c_active_plan_id";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [sites, setSites] = useState([]);
  const [planLimit, setPlanLimit] = useState(1);
  const [monthlyRegLimit, setMonthlyRegLimit] = useState(null);
  const [monthlyRegUsed, setMonthlyRegUsed] = useState(null);
  const [monthlyRegRemaining, setMonthlyRegRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  // プラン情報とシェアURL一覧（診断チケットユーザー向け）
  const [activePlans, setActivePlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [shares, setShares] = useState([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchSites();
      fetchPlans();
    }
    // プラン切り替えイベントをリッスン
    const onPlanChange = () => {
      try {
        const id = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
        if (id) setActivePlanId(id);
      } catch (e) {}
    };
    window.addEventListener("ab3c-plan-changed", onPlanChange);
    return () => window.removeEventListener("ab3c-plan-changed", onPlanChange);
  }, [session]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/check-pro");
      const data = await res.json();
      setActivePlans(Array.isArray(data.activePlans) ? data.activePlans : []);
    } catch (e) {}
    try {
      const stored = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
      if (stored) setActivePlanId(stored);
    } catch (e) {}
  };

  // 選択中プラン
  const currentPlan = (activePlans.length > 0)
    ? (activePlans.find(p => p.id === activePlanId) || activePlans[0])
    : null;
  const isDiagnosisMode = currentPlan?.planType === 'analysis';

  // 診断モード時はシェアURL一覧を取得
  useEffect(() => {
    if (session && isDiagnosisMode) {
      setSharesLoading(true);
      fetch("/api/share/list")
        .then(r => r.json())
        .then(d => setShares(d.shares || []))
        .catch(() => {})
        .finally(() => setSharesLoading(false));
    }
  }, [session, isDiagnosisMode]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      setSites(data.sites || []);
      if (data.planLimit) setPlanLimit(data.planLimit);
      setMonthlyRegLimit(data.monthlyRegistrationLimit);
      setMonthlyRegUsed(data.monthlyRegistrationUsed);
      setMonthlyRegRemaining(data.monthlyRegistrationRemaining);
    } catch (e) { setError("サイト一覧の取得に失敗しました: " + (e.message || "")); }
    finally { setLoading(false); }
  };

  const isSupport = monthlyRegLimit !== null && monthlyRegLimit !== undefined;

  const handleDelete = async (id) => {
    const site = sites.find(s => s.id === id);
    const baseMsg = `「${site?.site_name || "このサイト"}」を削除しますか？\n分析結果・チャット履歴も全て削除されます。`;
    const warning = isSupport
      ? `\n\n⚠️ 戦略指南プランのご注意\n削除しても今月のサイト登録枠は戻りません。\n新しいサイトを登録する場合は、今月の残り${monthlyRegRemaining}回の登録枠を消費します。`
      : "";
    if (!confirm(baseMsg + warning)) return;
    try {
      await fetch(`/api/sites?id=${id}`, { method: "DELETE" });
      // localStorage掃除
      try {
        const threadsKey = `ab3c_threads_${id}`;
        const threads = JSON.parse(localStorage.getItem(threadsKey) || "[]");
        threads.forEach(t => localStorage.removeItem(`ab3c_thread_${t.id}`));
        localStorage.removeItem(threadsKey);
        localStorage.removeItem(`ab3c_theme_chats_${id}`);
        localStorage.removeItem(`ab3c_actions_${id}`);
      } catch (e) {}
      setSites(sites.filter(s => s.id !== id));
    } catch (e) { alert("削除に失敗しました。"); }
  };

  const handleRename = async (id, newName) => {
    try {
      await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, site_name: newName }),
      });
      setSites(sites.map(s => s.id === id ? { ...s, site_name: newName } : s));
    } catch (e) { alert("名前の変更に失敗しました。"); }
  };

  const handleSelect = (site) => {
    // サイトURLがあればURLモードで分析画面へ、なければテキストモードで
    if (site.site_url) {
      window.location.href = `/?site_id=${site.id}&url=${encodeURIComponent(site.site_url)}`;
    } else {
      window.location.href = `/?site_id=${site.id}`;
    }
  };

  if (status === "loading") return null;

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Header />
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 16 }}>ログインが必要です</div>
          <button onClick={() => signIn("google")} style={{
            background: C.A, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, padding: "12px 28px",
          }}>
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  const confirmedSites = sites.filter(s => s.strategy_confirmed);
  const analyzedSites = sites.filter(s => s.latest_analysis && !s.strategy_confirmed);
  const pendingSites = sites.filter(s => !s.latest_analysis);

  // 診断チケットユーザー向けダッシュボード（シェアURL一覧）
  if (isDiagnosisMode) {
    const validShares = shares.filter(s => !s.expired);
    const expiredShares = shares.filter(s => s.expired);
    return (
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Header />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink }}>ダッシュボード</div>
            <div style={{ fontSize: 15, color: C.muted, marginTop: 6, fontFamily: FONT }}>
              {session.user?.name} さんが発行したシェアURL一覧（戦略診断チケット）
            </div>
          </div>

          <div style={{ background: "#fff9e6", borderLeft: `3px solid ${C.highlight}`, padding: "14px 18px", fontSize: 13, color: C.ink, lineHeight: 1.8, marginBottom: 24, fontFamily: FONT, borderRadius: 4 }}>
            <b>📌 戦略診断チケットについて</b><br />
            戦略診断チケットでは、分析結果はダッシュボードに保存されません。代わりに、
            <strong>発行したシェアURL（発行から1年間有効）</strong> から結果を閲覧できます。
            期限が切れる前に PDF 保存や印刷での持ち帰りもご検討ください。
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
            {[
              { label: "発行済みURL", count: shares.length, color: C.ink },
              { label: "有効", count: validShares.length, color: C.phase1 || "#0d9488" },
              { label: "期限切れ", count: expiredShares.length, color: C.muted },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 6, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <a href="/" style={{
              background: C.ink, border: "none", borderRadius: 4, color: "#fff",
              textDecoration: "none", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px", display: "inline-block",
            }}>
              + 新しい分析を始める
            </a>
          </div>

          {sharesLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 15 }}>読み込み中...</div>
          ) : shares.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
                まだシェアURLを発行していません
              </div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 20, fontFamily: FONT }}>
                分析画面で「シェアURL発行」ボタンを押すと、ここに一覧が表示されます。
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shares.map(sh => (
                <div key={sh.id} style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "14px 18px", opacity: sh.expired ? 0.6 : 1,
                  borderLeft: sh.expired ? `4px solid ${C.muted}` : `4px solid ${C.A}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: C.ink, fontWeight: 600, fontFamily: FONT, marginBottom: 4, wordBreak: "break-all" }}>
                        {sh.input || "(テキスト入力による分析)"}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                        発行: {new Date(sh.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                        {sh.expires_at && (
                          <span style={{ marginLeft: 12 }}>
                            期限: {new Date(sh.expires_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {sh.expired ? (
                        <span style={{ background: "#e8e8e8", color: C.muted, fontSize: 12, padding: "4px 10px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>期限切れ</span>
                      ) : (
                        <a href={`/share?id=${sh.id}`} target="_blank" rel="noopener noreferrer" style={{
                          background: C.A, color: "#fff", textDecoration: "none", fontSize: 12, padding: "6px 14px", borderRadius: 3, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                        }}>
                          開く →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Header />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink }}>ダッシュボード</div>
            <div style={{ fontSize: 15, color: C.muted, marginTop: 6, fontFamily: FONT }}>
              {session.user?.name} さんのサイト管理
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="/" style={{
              background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted,
              cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "10px 20px",
              textDecoration: "none", display: "inline-block",
            }}>
              分析画面へ
            </a>
            {sites.length >= planLimit ? (
              <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT, textAlign: "right" }}>
                サイト上限（{planLimit}）に達しています<br/>
                <span style={{ color: C.B, fontWeight: 600 }}>プランのアップグレードで追加可能</span>
              </div>
            ) : isSupport && monthlyRegRemaining <= 0 ? (
              <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT, textAlign: "right" }}>
                今月のサイト登録上限（{monthlyRegLimit}）に達しました<br/>
                <span style={{ color: C.B, fontWeight: 600 }}>次回の契約更新日にリセットされます</span>
              </div>
            ) : (
              <button onClick={() => setShowForm(true)} style={{
                background: C.ink, border: "none", borderRadius: 4, color: "#fff",
                cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
              }}>
                + 新規サイト登録
              </button>
            )}
          </div>
        </div>

        {/* サマリーカード */}
        <div style={{ display: "grid", gridTemplateColumns: isSupport ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
          {[
            { label: "登録サイト", count: `${sites.length} / ${planLimit}`, sub: "登録数 / 上限", color: C.ink },
            ...(isSupport ? [{
              label: "今月の登録枠",
              count: `${monthlyRegRemaining} / ${monthlyRegLimit}`,
              sub: "残り / 月間上限",
              color: "#0d9488",
            }] : []),
            { label: "分析済み", count: analyzedSites.length + confirmedSites.length, color: C.B },
            { label: "戦略確定", count: confirmedSites.length, color: C.A },
          ].map(({ label, count, sub, color }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 6, padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color }}>{count}</div>
              {sub && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
              <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 戦略指南プラン契約者向け: 月次サイト登録ルールの案内 */}
        {isSupport && (
          <div style={{ background: "#e8f7f5", borderLeft: "3px solid #0d9488", padding: "12px 16px", fontSize: 13, color: C.ink, lineHeight: 1.7, marginBottom: 24, fontFamily: FONT, borderRadius: 4 }}>
            <b>📌 サイト登録ルール</b>: 1サイト枠につき月3回まで入替え可能です（初期登録1＋入れ替え2回）。
            <span style={{ color: C.muted }}>サイトを削除しても登録枠は戻りません。カウンタは次回のご契約更新日にリセットされます。</span>
          </div>
        )}

        {/* プラン上限超過の警告（過去の大きいプランから縮小ダウングレードした場合の legacy データ向け） */}
        {sites.length > planLimit && (
          <div style={{ background: "#fdf0ef", borderLeft: "3px solid #c0392b", padding: "12px 16px", fontSize: 13, color: C.ink, lineHeight: 1.7, marginBottom: 24, fontFamily: FONT, borderRadius: 4 }}>
            <b style={{ color: "#c0392b" }}>⚠️ 現在のプランの上限を超えるサイトが登録されています</b><br />
            現在のご契約上限: <b>{planLimit}サイト</b> / 登録済: <b>{sites.length}サイト</b>
            <span style={{ color: C.muted }}>（過去の大きいプランから変更された際の legacy データが残っている可能性があります。不要なサイトを削除してください。）</span>
          </div>
        )}

        {error && (
          <div style={{ background: "#fdf0ef", borderLeft: `3px solid #c0392b`, padding: "10px 14px", fontSize: 14, color: "#c0392b", marginBottom: 20 }}>{error}</div>
        )}

        {/* 新規登録フォーム */}
        {showForm && (
          <div style={{ marginBottom: 32 }}>
            <NewSiteForm
              onCreated={(site) => { setSites([site, ...sites]); setShowForm(false); fetchSites(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* サイト一覧 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 15 }}>読み込み中...</div>
        ) : sites.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
              まだサイトが登録されていません
            </div>
            <div style={{ fontSize: 15, color: C.muted, marginBottom: 20, fontFamily: FONT }}>
              「新規サイト登録」からサイトを追加して、AB3C分析を始めましょう。
            </div>
            <button onClick={() => setShowForm(true)} style={{
              background: C.ink, border: "none", borderRadius: 4, color: "#fff",
              cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "12px 28px",
            }}>
              + 新規サイト登録
            </button>
          </div>
        ) : (
          <div>
            {/* 戦略確定済み */}
            {confirmedSites.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.A, marginBottom: 12, borderBottom: `2px solid ${C.A}`, paddingBottom: 8 }}>
                  戦略確定済み ({confirmedSites.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {confirmedSites.map(site => <SiteCard key={site.id} site={site} onSelect={handleSelect} onDelete={handleDelete} onRename={handleRename} />)}
                </div>
              </div>
            )}

            {/* 分析済み（未確定） */}
            {analyzedSites.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.B, marginBottom: 12, borderBottom: `2px solid ${C.B}`, paddingBottom: 8 }}>
                  分析済み ({analyzedSites.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {analyzedSites.map(site => <SiteCard key={site.id} site={site} onSelect={handleSelect} onDelete={handleDelete} onRename={handleRename} />)}
                </div>
              </div>
            )}

            {/* 未分析 */}
            {pendingSites.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ink, marginBottom: 12, borderBottom: `2px solid ${C.ink}`, paddingBottom: 8 }}>
                  未分析 ({pendingSites.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {pendingSites.map(site => <SiteCard key={site.id} site={site} onSelect={handleSelect} onDelete={handleDelete} onRename={handleRename} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
