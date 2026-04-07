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
};

export default function Header({ onShowPricing }) {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/check-pro")
        .then((r) => r.json())
        .then((d) => setIsPro(d.isPro))
        .catch(() => setIsPro(false));
    }
  }, [session]);

  return (
    <div style={{ borderBottom: `2px solid ${C.ink}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 900, lineHeight: 1 }}>
              <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: "clamp(20px, 4vw, 36px)", color: C.ink }}>戦略大臣</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(10px, 2vw, 14px)", color: C.muted, marginLeft: 8 }}>powered by AI</span>
            </div>
            <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.05em", marginTop: 4 }}>
              選ばれる理由を言語化する 戦略策定AI
            </div>
          </a>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, textAlign: "right", lineHeight: 2 }}>
          <div><b style={{ fontFamily: "'Space Mono', monospace", color: "#1a6fd4" }}>A</b> — Advantage（差別的優位点）</div>
          <div><b style={{ fontFamily: "'Space Mono', monospace", color: "#FF0000" }}>B</b> — Benefit（お客様が求める価値）</div>
          <div><b style={{ fontFamily: "'Space Mono', monospace", color: "#1a1a14" }}>3C</b> — Customer · Competitor · Company</div>
        </div>
        {session ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: C.muted }}>
                {session.user?.name}
                {isPro && <span style={{ marginLeft: 6, background: "#1a6fd4", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>PRO</span>}
              </span>
              <button onClick={() => signOut()} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted }}>
                ログアウト
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {onShowPricing && (
                <button onClick={onShowPricing} style={{ background: "#FF0000", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, padding: "6px 12px" }}>
                  プランを見る
                </button>
              )}
            </div>
          </div>
        ) : (
          <button onClick={() => signIn("google")} style={{ display: "flex", alignItems: "center", gap: 0, border: "none", borderRadius: 4, cursor: "pointer", padding: 0, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.25)", fontFamily: "Roboto, Arial, sans-serif" }}>
            <div style={{ background: "#fff", padding: "10px 12px 11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13 17.8 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
                <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.6 10.6l7.9-6z"/>
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.7 2.2-7.6 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.9 6C6.5 42.5 14.6 48 24 48z"/>
              </svg>
            </div>
            <div style={{ background: "#DB4437", padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              Googleでログイン
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
