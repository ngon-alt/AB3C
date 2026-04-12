"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "../components/Header";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14",
  bg: "#ebebeb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#000000", muted: "#78716c", highlight: "#fef3c7",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

function SiteCard({ site, onSelect, onDelete }) {
  const hasAnalysis = !!site.latest_analysis;
  const confirmed = site.strategy_confirmed;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "20px 24px", cursor: "pointer", transition: "box-shadow 0.2s",
      borderLeft: confirmed ? `4px solid ${C.A}` : hasAnalysis ? `4px solid ${C.B}` : `4px solid ${C.border}`,
    }}
      onClick={() => onSelect(site)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink }}>{site.site_name}</div>
          {site.company_name && <div style={{ fontSize: 14, color: C.muted, marginTop: 4, fontFamily: FONT }}>{site.company_name}</div>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {confirmed && (
            <span style={{ background: C.A, color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>
              戦略確定
            </span>
          )}
          {hasAnalysis && !confirmed && (
            <span style={{ background: C.B, color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>
              分析済み
            </span>
          )}
          {!hasAnalysis && (
            <span style={{ background: "#e8e8e8", color: C.muted, fontSize: 11, padding: "3px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>
              未分析
            </span>
          )}
        </div>
      </div>

      {site.site_url && (
        <div style={{ fontSize: 13, color: C.A, marginBottom: 8, fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {site.site_url}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {site.industry && (
          <span style={{ fontSize: 12, color: C.muted, background: "#f5f5f5", padding: "2px 8px", borderRadius: 3, fontFamily: FONT }}>{site.industry}</span>
        )}
        {site.target_customer && (
          <span style={{ fontSize: 12, color: C.muted, background: "#f5f5f5", padding: "2px 8px", borderRadius: 3, fontFamily: FONT }}>
            {site.target_customer.length > 20 ? site.target_customer.slice(0, 20) + "..." : site.target_customer}
          </span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
          {new Date(site.updated_at).toLocaleDateString("ja-JP")}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(site.id); }}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: C.muted, padding: "4px 8px", fontFamily: FONT }}
        >
          削除
        </button>
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
    } catch { setError("エラーが発生しました。"); }
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) fetchSites();
  }, [session]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      setSites(data.sites || []);
    } catch { setError("サイト一覧の取得に失敗しました。"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("このサイトを削除しますか？")) return;
    try {
      await fetch(`/api/sites?id=${id}`, { method: "DELETE" });
      setSites(sites.filter(s => s.id !== id));
    } catch { alert("削除に失敗しました。"); }
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
            <button onClick={() => setShowForm(true)} style={{
              background: C.ink, border: "none", borderRadius: 4, color: "#fff",
              cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
            }}>
              + 新規サイト登録
            </button>
          </div>
        </div>

        {/* サマリーカード */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
          {[
            { label: "登録サイト", count: sites.length, color: C.ink },
            { label: "分析済み", count: analyzedSites.length + confirmedSites.length, color: C.B },
            { label: "戦略確定", count: confirmedSites.length, color: C.A },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 6, padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color }}>{count}</div>
              <div style={{ fontSize: 14, color: C.muted, fontFamily: FONT }}>{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fdf0ef", borderLeft: `3px solid #c0392b`, padding: "10px 14px", fontSize: 14, color: "#c0392b", marginBottom: 20 }}>{error}</div>
        )}

        {/* 新規登録フォーム */}
        {showForm && (
          <div style={{ marginBottom: 32 }}>
            <NewSiteForm
              onCreated={(site) => { setSites([site, ...sites]); setShowForm(false); }}
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
                  {confirmedSites.map(site => <SiteCard key={site.id} site={site} onSelect={handleSelect} onDelete={handleDelete} />)}
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
                  {analyzedSites.map(site => <SiteCard key={site.id} site={site} onSelect={handleSelect} onDelete={handleDelete} />)}
                </div>
              </div>
            )}

            {/* 未分析 */}
            {pendingSites.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 12, borderBottom: `2px solid ${C.border}`, paddingBottom: 8 }}>
                  未分析 ({pendingSites.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {pendingSites.map(site => <SiteCard key={site.id} site={site} onSelect={handleSelect} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
