'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from "react";

const C = {
  bg: "#ebebeb",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
  A: "#1a6fd4",
  B: "#FF0000",
  phase1: "#2d6a30",
  phase2: "#8c5e1a",
};

const NAV_FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

export default function Header({ onShowPricing, currentSiteUrl, currentSiteId, phase, onConfirmStrategy, canAccessBansou: canAccessBansouProp, onSwitchToAnalysis, onSwitchToAction }) {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [chatTickets, setChatTickets] = useState(0);
  const [planLabel, setPlanLabel] = useState(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [sites, setSites] = useState([]);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  useEffect(() => {
    setCurrentPath(window.location.pathname + window.location.search);
    if (session?.user?.email) {
      fetch("/api/check-pro")
        .then((r) => r.json())
        .then((d) => { setIsPro(d.isPro); setChatTickets(d.chatTickets || 0); setPlanLabel(d.planLabel || null); })
        .catch(() => { setIsPro(false); setChatTickets(0); });
      fetch("/api/sites")
        .then((r) => r.json())
        .then((d) => setSites(d.sites || []))
        .catch(() => {});
    }
  }, [session]);

  const canAccessBansou = canAccessBansouProp !== undefined ? canAccessBansouProp : (isPro || chatTickets > 0);
  // 伴走タブのツールチップ: PRO/有料→戦略確定後に利用可、それ以外→サブスクプランで利用可
  const showBansouTip = !canAccessBansou || (canAccessBansou && phase !== "action");
  const bansouTooltip = !session ? "ログインが必要です" : !canAccessBansou ? "サブスクプランで利用可" : "戦略確定後に利用可";

  const isActive = (key) => {
    if (key === "analysis") return currentPath === "/" && (!currentPath.includes("phase=action"));
    if (key === "action") return currentPath.includes("phase=action") || phase === "action";
    if (key === "dashboard") return currentPath.startsWith("/dashboard");
    return false;
  };

  return (
    <div id="app-header" style={{ background: "#ffffff", position: "sticky", top: 0, zIndex: 200 }}>
      {/* 上段: ロゴ + サブナビ + ユーザー情報 */}
      <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 900, lineHeight: 1 }}>
            <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: "clamp(20px, 4vw, 36px)", color: C.ink }}>戦略大臣</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(10px, 2vw, 14px)", color: C.muted, marginLeft: 8 }}>powered by AI</span>
          </div>
          <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: C.ink, letterSpacing: "0.05em", marginTop: 2 }}>
            選ばれる理由を言語化する 戦略策定AI
          </div>
        </a>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT }}>
                {session.user?.name}
                {planLabel && <span style={{ marginLeft: 6, background: C.A, color: "#fff", fontSize: 14, padding: "2px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>{planLabel}</span>}
              {isPro && !planLabel && <span style={{ marginLeft: 6, background: C.A, color: "#fff", fontSize: 14, padding: "2px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>PRO</span>}
              </span>
              <button onClick={() => signOut()} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontFamily: NAV_FONT, fontSize: 16, color: C.ink }}>
                ログアウト
              </button>
            </div>
          ) : (
            <button onClick={() => signIn("google")} style={{ display: "flex", alignItems: "center", gap: 0, border: "none", borderRadius: 4, cursor: "pointer", padding: 0, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.25)", fontFamily: "Roboto, Arial, sans-serif" }}>
              <div style={{ background: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
                  <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.6 10.6l7.9-6z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.7 2.2-7.6 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.9 6C6.5 42.5 14.6 48 24 48z"/>
                </svg>
              </div>
              <div style={{ background: "#DB4437", padding: "8px 14px", color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                Googleでログイン
              </div>
            </button>
          )}
          {/* サブナビ */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[
              { label: "初めての方へ", href: "/howto", icon: "🔰" },
              { label: "AB3C分析とは", href: "/about", icon: "📖" },
              { label: "料金とプラン", href: "/pricing", icon: "💰" },
              { label: "よくある質問", href: "/faq", icon: "❓" },
            ].map((item) => (
              <a key={item.label} href={item.href}
                style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap" }}>
                <span style={{ marginRight: 4 }}>{item.icon}</span>{item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* 下段: メインナビ（分析タブ・伴走タブ・サイト管理 + サイトURL） */}
      <nav style={{ padding: "0 24px", display: "flex", alignItems: "flex-end", background: "#fff" }}>
        {/* 分析タブ */}
        <button onClick={() => {
          if (onSwitchToAnalysis) { onSwitchToAnalysis(); }
          else {
            const params = [];
            if (currentSiteId) params.push(`site_id=${currentSiteId}`);
            if (currentSiteUrl) params.push(`url=${encodeURIComponent(currentSiteUrl)}`);
            window.location.href = params.length > 0 ? `/?${params.join("&")}` : "/";
          }
        }}
          style={{
            padding: "10px 20px", fontSize: 14, fontFamily: "'Space Mono', monospace", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.05em",
            background: (phase === "analysis" || phase === "input") ? C.phase1 : C.phase1 + "88",
            color: "#fff", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer",
          }}>
          <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>1</span>
          戦略立案
        </button>
        {/* 矢印 */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px 10px", color: "#999", fontSize: 14 }}>→</div>
        {/* 戦略アクションタブ */}
        <span style={{ position: "relative", display: "inline-flex" }}
          onMouseEnter={e => { if (phase !== "action") { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "block"; } }}
          onMouseLeave={e => { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "none"; }}>
          <button
            onClick={() => { if (!canAccessBansou) return; if (onSwitchToAction) onSwitchToAction(); else window.location.href = "/?phase=action"; }}
            style={{
              padding: "10px 20px", fontSize: 14, fontFamily: "'Space Mono', monospace", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.05em",
              background: phase === "action" ? C.phase2 : canAccessBansou ? "#ccc" : "#ddd",
              color: canAccessBansou ? "#fff" : "#aaa", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", gap: 6,
              cursor: canAccessBansou ? "pointer" : "default", border: "none",
            }}>
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>2</span>
            戦略アクション
          </button>
          {phase !== "action" && (
            <div className="nav-tip" style={{ display: "none", position: "absolute", top: "100%", left: 0, marginTop: 4, background: C.ink, color: "#fff", fontSize: 12, padding: "8px 12px", borderRadius: 4, whiteSpace: "nowrap", zIndex: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", fontFamily: NAV_FONT }}>
              {bansouTooltip}
            </div>
          )}
        </span>
        {/* 区切り */}
        <div style={{ width: 1, height: 24, background: C.border, margin: "0 16px", alignSelf: "center" }} />
        {/* サイト管理ボタン */}
        <a href="/dashboard"
          style={{
            padding: "8px 16px", fontSize: 14, fontFamily: NAV_FONT, textDecoration: "none", whiteSpace: "nowrap", fontWeight: 600,
            color: "#fff", display: "flex", alignItems: "center", gap: 6, alignSelf: "center",
            background: isActive("dashboard") ? "#444" : "#555", border: "none", borderRadius: 4,
          }}>
          📋 サイト管理
        </a>
        {/* サイト切替プルダウン */}
        {session && sites.length > 0 && (
          <div style={{ position: "relative", alignSelf: "center", marginLeft: 4 }}>
            <button onClick={() => setShowSiteDropdown(!showSiteDropdown)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: `2px solid ${C.ink}`, borderRadius: 4, cursor: "pointer", fontFamily: NAV_FONT, fontSize: 14, color: C.ink }}>
              {currentSiteUrl ? currentSiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "サイトを選択"}
              <span style={{ fontSize: 12, color: C.ink }}>▼</span>
            </button>
            {showSiteDropdown && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 400, minWidth: 280, maxHeight: 300, overflowY: "auto" }}
                onMouseLeave={() => setShowSiteDropdown(false)}>
                {sites.map(site => (
                  <a key={site.id} href={`/?site_id=${site.id}${site.site_url ? `&url=${encodeURIComponent(site.site_url)}` : ""}`}
                    style={{ display: "block", padding: "10px 14px", fontSize: 13, color: C.ink, textDecoration: "none", borderBottom: `1px solid ${C.border}`, fontFamily: NAV_FONT, lineHeight: 1.5 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{site.site_name}</div>
                    {site.site_url && <div style={{ fontSize: 11, color: C.A }}>{site.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</div>}
                  </a>
                ))}
                <a href="/dashboard" style={{ display: "block", padding: "10px 14px", fontSize: 13, color: C.muted, textDecoration: "none", fontFamily: NAV_FONT, textAlign: "center", fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  サイト管理画面を開く →
                </a>
              </div>
            )}
          </div>
        )}
      </nav>
      {/* フェーズカラーライン */}
      <div style={{ height: 4, background: phase === "action" ? C.phase2 : C.phase1 }} />
    </div>
  );
}
