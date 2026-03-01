"use client";
import { useState } from "react";

const C = {
  A: "#2c4a8c", B: "#1a6b3a", C: "#8c6914", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#8a8478", highlight: "#f0ebe0",
};

const Badge = ({ status }) => {
  const map = { ok: { bg: C.B, icon: "✓" }, warn: { bg: C.C, icon: "!" }, ng: { bg: C.red, icon: "✗" } };
  const { bg, icon } = map[status] || map.warn;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: bg, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace", flexShrink: 0, marginTop: 2 }}>
      {icon}
    </span>
  );
};

const Card = ({ color, title, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 4, padding: "16px 18px" }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const UL = ({ items }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: 14, lineHeight: 1.65, padding: "5px 0 5px 16px", borderBottom: i < items.length - 1 ? `1px dashed ${C.border}` : "none", position: "relative", color: "#3a3a2e" }}>
        <span style={{ position: "absolute", left: 0, color: C.muted }}>–</span>{item}
      </li>
    ))}
  </ul>
);

const SectionLabel = ({ color, letter, jp, en, desc }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${C.border}` }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 34, fontWeight: 700, color, lineHeight: 1, width: 56, flexShrink: 0 }}>{letter}</div>
    <div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700 }}>{jp}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{en}</div>
      {desc && <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", marginTop: 3 }}>{desc}</div>}
    </div>
  </div>
);

const Divider = () => <div style={{ borderTop: `1px solid ${C.border}`, margin: "32px 0" }} />;

const SubLabel = ({ color, text }) => (
  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color, textTransform: "uppercase", marginBottom: 8 }}>{text}</div>
);

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!input.trim()) { setError("事業概要を入力してください。"); return; }
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setInput(""); setError(""); };

  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };

  return (
    <main style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Noto Serif JP', serif", padding: "40px 20px 100px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 20, marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em" }}>
              <span style={{ color: C.A }}>A</span><span style={{ color: C.B }}>B</span><span style={{ color: C.C }}>3</span><span style={{ color: C.C }}>C</span>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 5 }}>
              「選ばれる理由」を見つけるフレームワーク
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted, textAlign: "right", lineHeight: 2 }}>
            <div><b style={{ fontFamily: "'Space Mono', monospace", color: C.A }}>A</b> — Advantage（差別的優位点）</div>
            <div><b style={{ fontFamily: "'Space Mono', monospace", color: C.B }}>B</b> — Benefit（お客様が求める価値）</div>
            <div><b style={{ fontFamily: "'Space Mono', monospace", color: C.C }}>3C</b> — Customer · Competitor · Company</div>
          </div>
        </div>
        {!result && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "26px 28px", marginBottom: 28, boxShadow: `2px 2px 0 ${C.border}` }}>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 10 }}>
              事業の概要を入力してください
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyze(); }}
              placeholder="例：地元農家と提携した無農薬野菜の定期宅配サービスです。週1回のボックス配送で旬の野菜を10〜12品目お届け。産地直送・中間業者なし、レシピカードも同封。"
              style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "'Noto Serif JP', serif", fontSize: 14, lineHeight: 1.8, padding: "14px 16px", resize: "vertical", minHeight: 120, outline: "none", boxSizing: "border-box" }}
            />
            {error && (
              <div style={{ background: "#fdf0ef", borderLeft: `3px solid ${C.red}`, padding: "10px 14px", fontSize: 13, color: C.red, marginTop: 12 }}>{error}</div>
            )}
            <div style={{ di
