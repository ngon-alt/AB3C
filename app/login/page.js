"use client";
import { signIn } from "next-auth/react";

const C = {
  A: "#1a6fd4", B: "#FF0000", ink: "#1a1a14",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc", muted: "#8a8478",
};

export default function LoginPage() {
  return (
    <main style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Noto Serif JP', serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "48px 40px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: `4px 4px 0 ${C.border}` }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>
          <span style={{ color: C.A }}>A</span><span style={{ color: C.B }}>B</span><span style={{ color: C.ink }}>3C</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>「選ばれる理由」を見つけるフレームワーク</div>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{ width: "100%", background: C.ink, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "14px 24px", marginBottom: 16 }}>
          Googleでログイン
        </button>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
          ログインすることで、<br />利用規約とプライバシーポリシーに同意したものとみなします。
        </p>
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <img src="https://ab3c.jp/img/common/digi_logo.png" alt="" style={{ height: 24 }} />
            <span style={{ fontSize: 11, color: C.muted }}>一般社団法人デジタル経営革新協会</span>
          </div>
        </div>
      </div>
    </main>
  );
}
