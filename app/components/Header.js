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

export default function Header({ onShowPricing, currentSiteUrl, phase, onConfirmStrategy, canAccessBansou: canAccessBansouProp }) {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [chatTickets, setChatTickets] = useState(0);
  const [currentPath, setCurrentPath] = useState("/");

  useEffect(() => {
    setCurrentPath(window.location.pathname + window.location.search);
    if (session?.user?.email) {
      fetch("/api/check-pro")
        .then((r) => r.json())
        .then((d) => { setIsPro(d.isPro); setChatTickets(d.chatTickets || 0); })
        .catch(() => { setIsPro(false); setChatTickets(0); });
    }
  }, [session]);

  const canAccessBansou = canAccessBansouProp !== undefined ? canAccessBansouProp : (isPro || chatTickets > 0);
  const bansouTooltip = !session ? "ログインが必要です" : !canAccessBansou ? "伴走プランのみ利用可" : "戦略確定後に利用可";

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
          <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: C.muted, letterSpacing: "0.05em", marginTop: 2 }}>
            選ばれる理由を言語化する 戦略策定AI
          </div>
        </a>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: C.muted, fontFamily: NAV_FONT }}>
                {session.user?.name}
                {isPro && <span style={{ marginLeft: 6, background: C.A, color: "#fff", fontSize: 12, padding: "2px 6px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>PRO</span>}
              </span>
              <button onClick={() => signOut()} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontFamily: NAV_FONT, fontSize: 13, color: C.muted }}>
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
              { label: "初めての方へ", href: "/howto" },
              { label: "AB3C分析とは", href: "/about" },
              { label: "料金とプラン", href: "/pricing" },
            ].map((item) => (
              <a key={item.label} href={item.href}
                style={{ fontSize: 13, color: C.muted, fontFamily: NAV_FONT, textDecoration: "none", whiteSpace: "nowrap" }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* 下段: メインナビ（分析タブ・伴走タブ・サイト管理 + サイトURL） */}
      <nav style={{ padding: "0 24px", display: "flex", alignItems: "flex-end", background: "#fff" }}>
        {/* 分析タブ */}
        <a href="/"
          style={{
            padding: "10px 20px", fontSize: 14, fontFamily: "'Space Mono', monospace", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.05em",
            background: isActive("analysis") ? C.phase1 : "#ccc",
            color: "#fff", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", gap: 6,
          }}>
          <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>1</span>
          分析
        </a>
        {/* 矢印 */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px 10px", color: "#999", fontSize: 14 }}>→</div>
        {/* 伴走タブ */}
        <span style={{ position: "relative", display: "inline-flex" }}
          onMouseEnter={e => { if (!canAccessBansou) { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "block"; } }}
          onMouseLeave={e => { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "none"; }}>
          <a href={canAccessBansou ? "/?phase=action" : undefined}
            onClick={e => { if (!canAccessBansou) e.preventDefault(); }}
            style={{
              padding: "10px 20px", fontSize: 14, fontFamily: "'Space Mono', monospace", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.05em",
              background: isActive("action") ? C.phase2 : canAccessBansou ? "#ccc" : "#ddd",
              color: canAccessBansou ? "#fff" : "#aaa", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", gap: 6,
              cursor: canAccessBansou ? "pointer" : "default",
            }}>
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>2</span>
            伴走
          </a>
          {!canAccessBansou && (
            <div className="nav-tip" style={{ display: "none", position: "absolute", top: "100%", left: 0, marginTop: 4, background: C.ink, color: "#fff", fontSize: 12, padding: "8px 12px", borderRadius: 4, whiteSpace: "nowrap", zIndex: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", fontFamily: NAV_FONT }}>
              {bansouTooltip}
            </div>
          )}
        </span>
        {/* 区切り */}
        <div style={{ width: 1, height: 24, background: C.border, margin: "0 12px", alignSelf: "center" }} />
        {/* サイト管理ボタン */}
        <a href="/dashboard"
          style={{
            padding: "8px 16px", fontSize: 14, fontFamily: NAV_FONT, textDecoration: "none", whiteSpace: "nowrap", fontWeight: 600,
            color: C.ink, display: "flex", alignItems: "center", gap: 6, alignSelf: "center",
            background: isActive("dashboard") ? "#e8e8e8" : "transparent", border: `1px solid ${isActive("dashboard") ? C.border : "transparent"}`, borderRadius: 4,
          }}>
          📋 サイト管理
        </a>
        {/* 現在のサイトURL */}
        {currentSiteUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px", alignSelf: "center" }}>
            <span style={{ fontSize: 12, color: C.muted }}>｜</span>
            <a href={currentSiteUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: C.A, fontFamily: NAV_FONT, textDecoration: "none", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
              {currentSiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          </div>
        )}
        {/* 戦略確定ボタン（右寄せ） */}
        {onConfirmStrategy && phase === "analysis" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <button onClick={onConfirmStrategy}
              style={{ background: C.phase2, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: NAV_FONT, fontSize: 13, fontWeight: 700, padding: "8px 20px", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
              戦略を確定して伴走へ →
            </button>
          </div>
        )}
      </nav>
      {/* フェーズカラーライン */}
      <div style={{ height: 4, background: phase === "action" ? C.phase2 : C.phase1 }} />
    </div>
  );
}
