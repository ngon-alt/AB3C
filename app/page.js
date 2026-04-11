"use client";
// Updated: 2025-04-07 - Force page rebuild
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import PricingModal from "./components/PricingModal";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#ebebeb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#000000", muted: "#000000", highlight: "#fef3c7",
};

const Badge = ({ status }) => {
  const map = { ok: { color: "#1a6b3a", icon: "○" }, warn: { color: "#8c6914", icon: "△" }, ng: { color: "#c0392b", icon: "✕" } };
  const { color, icon } = map[status] || map.warn;
  return (
    <span style={{ fontSize: 18, fontWeight: 700, color, flexShrink: 0, marginTop: 2, lineHeight: 1 }}>
      {icon}
    </span>
  );
};

const Card = ({ color, title, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 4, padding: "16px 18px" }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, letterSpacing: "0.1em", textTransform: "uppercase", color, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const UL = ({ items }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => (
     <li key={i} style={{ fontSize: 18, lineHeight: 1.75, padding: "5px 0 5px 16px", borderBottom: i < items.length - 1 ? `1px dashed ${C.border}` : "none", position: "relative", color: "#000000", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
        <span style={{ position: "absolute", left: 0, color: C.muted }}>–</span>{item}
      </li>
    ))}
  </ul>
);

const SectionLabel = ({ color, letter, jp, en, desc }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${C.border}` }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 34, fontWeight: 700, color, lineHeight: 1, width: 56, flexShrink: 0 }}>{letter}</div>
    <div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700 }}>{jp}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{en}</div>
      {desc && <div style={{ fontSize: 16, color: C.muted, fontStyle: "italic", marginTop: 3 }}>{desc}</div>}
    </div>
  </div>
);

const Divider = () => <div style={{ borderTop: `1px solid ${C.border}`, margin: "32px 0" }} />;

const SubLabel = ({ color, text }) => (
  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.1em", color, textTransform: "uppercase", marginBottom: 8 }}>{text}</div>
);

function ResultView({ d }) {
  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.B} letter="B" jp="Benefit（お客様が求める価値）" en="Needs → Wants" desc={`核心：${d.benefit.core}`} />
        <div style={g2}>
          <Card color={C.B} title="ニーズ（欠乏感・曖昧な欲求）"><UL items={d.benefit.needs.map(i => `📌 ${i}`)} /></Card>
          <Card color={C.B} title="ウォンツ（具体的欲求）"><UL items={d.benefit.wants.map(i => `🎯 ${i}`)} /></Card>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.A} letter="A" jp="Advantage（差別的優位点・好ましい違い）" en="競合より選ばれる理由" />
        <div style={g3}>
          <Card color={C.A} title="アドバンテージ"><div style={{ fontSize: 18, fontWeight: 700, color: C.A, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.advantage.what}</div></Card>
          <Card color={C.A} title="なぜ好ましいのか"><p style={{ fontSize: 18, lineHeight: 1.7, color: "#000000", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.advantage.why_good}</p></Card>
          <Card color={C.A} title="なぜ真似されにくいか"><p style={{ fontSize: 18, lineHeight: 1.7, color: "#000000", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.advantage.why_hard_to_copy}</p></Card>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.C} letter="3C" jp="3C分析" en="Customer · Competitor · Company" />
        <SubLabel color={C.C} text="Customer（お客様）" />
        <div style={{ ...g2, marginBottom: 14 }}>
          <Card color={C.C} title="ターゲット">
            <div style={{ fontSize: 18, fontWeight: 700, color: C.C, marginBottom: 12, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.target}</div>
            <UL items={d.three_c.customer.profile} />
          </Card>
          <Card color={C.C} title="アプローチ段階 · 切り捨て">
            <p style={{ fontSize: 18, lineHeight: 1.65, marginBottom: 12, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>段階：</b>{d.three_c.customer.stage}</p>
            <p style={{ fontSize: 18, lineHeight: 1.65, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>切り捨てたお客様：</b>{d.three_c.customer.cutoff}</p>
          </Card>
        </div>
        {d.three_c.customer.market && (
          <div style={{ marginBottom: 14 }}>
            <Card color={C.C} title="市場規模">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SAM（獲得可能市場）</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.market.sam}</div>
                </div>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SOM（実際に狙える市場）</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.market.som}</div>
                </div>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>成長率・トレンド</div>
                  <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.market.growth}</div>
                </div>
              </div>
            </Card>
          </div>
        )}
        <div style={g2}>
          <div>
            <SubLabel color={C.C} text="Competitor（競合）" />
            <Card color={C.C} title="直接競合 / 異業種競合">
              <UL items={[...d.three_c.competitor.direct, ...d.three_c.competitor.indirect.map(i => `↳ ${i}`)]} />
            </Card>
          </div>
          <div>
            <SubLabel color={C.C} text="Company（自社）" />
            <Card color={C.C} title="強み · 構造 · パッション">
              <UL items={d.three_c.company.strength} />
              <p style={{ fontSize: 16, color: C.muted, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>構造：{d.three_c.company.structure}</p>
              <p style={{ fontSize: 16, color: C.muted, marginTop: 6 }}>💡 {d.three_c.company.passion}</p></Card>
          </div>
        </div>
      </div>
      <Divider />
      <div style={{ background: C.ink, borderRadius: 4, padding: "28px 32px", marginBottom: 28 }}>
<div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 12 }}>戦略メッセージ = Benefit + Advantage</div>        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.65, color: "#fff", marginBottom: 18, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.strategy_message.message}</div>
        <div style={{ fontSize: 18, lineHeight: 1.8, opacity: 0.75, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
          <b>Benefit：</b>{d.strategy_message.benefit_part}<br />
          <b>Advantage：</b>{d.strategy_message.advantage_part}
        </div>
      </div>
<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 28 }}>
<div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 16 }}>AB3C 5つのチェックポイント</div>  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {d.checkpoints.map((cp, i) => (
      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.6 }}>
        <Badge status={cp.status} />
        <div style={{ fontSize: 18, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>{cp.label}</b><br /><span style={{ color: C.ink, fontSize: 18 }}>{cp.comment}</span></div>
      </div>
    ))}
  </div>
  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "right" }}>
    {(() => {
      const score = d.checkpoints.reduce((acc, cp) => acc + (cp.status === "ok" ? 2 : cp.status === "warn" ? 1 : 0), 0);
      return <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: C.ink }}>AB3Cスコア：{score} / 10</span>;
    })()}
</div>
</div>
    </div>
  );
}

function WelcomeModal({ session, onClose, onShowPricing }) {
  const [step, setStep] = React.useState(1); // 1:アンケート 2:完了
  const [purpose, setPurpose] = React.useState(null); // 'self' or 'agency'

  const handleSelect = async (type) => {
    setPurpose(type);
    // DBに利用目的を保存
    try {
      await fetch("/api/user/purpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: type }),
      });
    } catch (e) {}
    setStep(2);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, padding: "32px", maxWidth: 480, width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>

        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4, textAlign: "center" }}>
          ようこそ、{session?.user?.name}さん！
        </div>
        <div style={{ fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 28, fontFamily: "system-ui, sans-serif" }}>
          まず一つだけ教えてください。
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16, fontFamily: "'Noto Serif JP', serif", textAlign: "center" }}>
              戦略大臣をどのように使いますか？
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => handleSelect("self")}
                style={{ background: "#f0f4ff", border: `2px solid #1a6fd4`, borderRadius: 8, cursor: "pointer", padding: "20px 24px", textAlign: "left" }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.A, fontWeight: 700, marginBottom: 6 }}>SELF USE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>自社・自分のビジネスを分析したい</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>自社のWebサイトや事業戦略をAB3Cで整理し、経営判断に活かしたい。</div>
              </button>
              <button
                onClick={() => handleSelect("agency")}
                style={{ background: "#fff8f0", border: `2px solid #FF6B00`, borderRadius: 8, cursor: "pointer", padding: "20px 24px", textAlign: "left" }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#FF6B00", fontWeight: 700, marginBottom: 6 }}>AGENCY USE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>クライアントへの戦略支援に活用したい</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>Web制作・コンサル・税理士など、クライアントへの提案・伴走サービスとして使いたい。</div>
                <div style={{ fontSize: 12, color: "#FF6B00", marginTop: 8, fontFamily: "system-ui, sans-serif" }}>※ クライアント提供向けのサポート情報・活用ガイドをお届けします。</div>
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
              ※ 後から変更できます
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              {purpose === "agency" ? "🤝" : "🎯"}
            </div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
              {purpose === "agency" ? "代理店・パートナー向けの情報をお届けします" : "さっそく自社の戦略を分析しましょう"}
            </div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontFamily: "system-ui, sans-serif" }}>
              {purpose === "agency"
                ? "クライアントへの提案方法・活用事例・単価設計のヒントなど、パートナー向けの情報をメールでお届けします。"
                : "無料トライアルでは分析1回・チャット1回をお試しいただけます。まずあなたのWebサイトのURLを入力してみてください。"
              }
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={onClose} style={{ background: C.A, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "12px 24px", color: "#fff" }}>
                {purpose === "agency" ? "分析を始める" : "さっそく使ってみる"}
              </button>
              <button onClick={() => { onClose(); onShowPricing(); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "12px 24px", color: C.muted }}>
                プランを見る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ChatWidget({ isPro, analysisResult, onReanalyze }) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
const chatKey = `ab3c_chat_${analysisResult ? JSON.stringify(analysisResult).slice(0, 50) : 'default'}`;
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

 useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: "分析結果をもとに相談できます。どんなことでも聞いてください！" }]);
    }
  }, [open]);

useEffect(() => {
    try {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0), userMessage];
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role === "user" || (m.role === "assistant" && messages.indexOf(m) > 0)),
          analysisResult,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
    } finally {
      setLoading(false);
    }
  };

 const reanalyze = async () => {
  if (loading || messages.length < 2) return;
  setLoading(true);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, analysisResult, reanalyze: true }),
    });
 const data = await res.json();
    console.log("再分析レスポンス:", data);
   if (data.reanalyzed && data.result) {
      const summary = data.chatSummary || messages
        .filter(m => m.role === "user")
        .slice(-1)
        .map(m => m.content.slice(0, 20))
        .join("、");
      onReanalyze(data.result, summary);
      setMessages(prev => [...prev, { role: "assistant", content: "✓ 会話内容を反映して分析を更新しました！" }]);
    } else {
      console.log("再分析条件未達:", data);
      setMessages(prev => [...prev, { role: "assistant", content: "再分析データの取得に失敗しました。" }]);
    }
  } catch {
    setMessages(prev => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
  } finally {
    setLoading(false);
  }
};
  
  if (!isPro) return null;

  return (
<div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {open && (
<div style={fullscreen ? { position: "fixed", inset: 0, width: "100%", height: "100%", background: "#fff", zIndex: 9999, borderRadius: 0, overflow: "hidden" } : { position: "absolute", bottom: 70, right: 0, width: 320, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>          {/* ヘッダー */}
          <div style={{ background: C.ink, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: 16, fontWeight: 700 }}>
                <span style={{ color: "#1a6fd4" }}>A</span>
                <span style={{ color: "#FF0000" }}>B</span>
                <span style={{ color: "#f0ebe0" }}>3C</span>
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>AI相談</span>
              <span style={{ background: "#1a6fd4", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 3, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>PRO</span>
            </div>
<div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setFullscreen(!fullscreen)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>
                {fullscreen ? "⊡" : "⊞"}
              </button>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          </div>
          {/* メッセージ */}
<div style={{ height: fullscreen ? "calc(100vh - 180px)" : 280, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, background: C.bg }}>
  {messages.map((m, i) => (
    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  background: m.role === "user" ? C.A : C.surface,
                  border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                  borderRadius: 8, padding: "10px 14px", fontSize: 15,
                  color: m.role === "user" ? "#fff" : C.ink,
                  maxWidth: "85%", lineHeight: 1.6,
                  fontFamily: "'Noto Serif JP', serif",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.muted }}>
                  考え中...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
{messages.length >= 3 && (
  <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, background: "#e8e8e8" }}>
    <button
      onClick={reanalyze}
      disabled={loading}
      style={{ width: "100%", background: loading ? C.muted : C.A, border: "none", borderRadius: 4, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, padding: "8px" }}
    >
      {loading ? "↻ 再分析中..." : "↻ この会話内容で再分析する"}
    </button>
  </div>
)}
          {/* 入力欄 */}
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.border}`, background: C.surface }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="分析結果について相談する..."
              style={{ flex: 1, background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "'Noto Serif JP', serif" }}
            />
            <button onClick={send} disabled={loading} style={{ background: loading ? C.muted : C.ink, border: "none", borderRadius: 4, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "8px 14px" }}>
              送信
            </button>
          </div>
        </div>
      )}
      {/* フローティングボタン */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{ width: 56, height: 56, background: C.ink, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
function TitleEditor({ title, onChange }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: "#f8f6f0", border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px" }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>タイトル</span>
      {editing ? (
        <input autoFocus value={title} onChange={onChange} onBlur={() => setEditing(false)} onKeyDown={e => { if (e.key === "Enter") setEditing(false); }}
          style={{ flex: 1, background: "#fff", border: `1px solid ${C.A}`, borderRadius: 2, color: C.ink, fontFamily: "'Noto Serif JP', serif", fontSize: 16, padding: "4px 8px", outline: "none" }} />
      ) : (

        <span style={{ flex: 1, fontSize: 13, color: C.ink, fontFamily: "'Noto Serif JP', serif" }}>{title || "（タイトルなし）"}</span>
      )}
      <button onClick={() => setEditing(!editing)} title="タイトルを編集"
        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px", color: editing ? C.A : C.muted }}>
        ✏️
      </button>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
const [tab, setTab] = useState("url");
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareUrl, setShareUrl] = useState("");
  const [historyTitle, setHistoryTitle] = useState("");
  const [sharing, setSharing] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
const [showWelcome, setShowWelcome] = useState(false);
const [isPro, setIsPro] = useState(false);
const [chatTickets, setChatTickets] = useState(0);
const [trialChats, setTrialChats] = useState(0);
  const [improveResult, setImproveResult] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
const [currentInput, setCurrentInput] = useState("");
const [improveLoading, setImproveLoading] = useState(false);
const [chatSummaries, setChatSummaries] = useState(() => {
  try {
    const saved = localStorage.getItem("ab3c_chat_summaries");
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
});
  
  const shareResult = async (inputText, resultData) => {
    setSharing(true); setShareUrl("");
    try {
const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: inputText, result: resultData, improveResult: improveResult || null }) });      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/share?id=${data.id}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch (e) { console.error(e); } finally { setSharing(false); }
  };

  useEffect(() => {
    const saved = localStorage.getItem("ab3c_history");
    if (saved) setHistory(JSON.parse(saved));
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (session) {
      const key = `welcomed_${session.user?.email}`;
      if (!localStorage.getItem(key)) {
        setShowWelcome(true);
        localStorage.setItem(key, "1");
      }
    }
  }, [session]);

  useEffect(() => {
  if (session) {
    fetch('/api/check-pro')
      .then(res => res.json())
      .then(data => {
        setIsPro(data.isPro);
        setChatTickets(data.chatTickets || 0);
        setTrialChats(data.trialChats || 0);
      });
  }
}, [session]);
  
useEffect(() => {
  try {
    localStorage.setItem("ab3c_chat_summaries", JSON.stringify(chatSummaries));
  } catch {}
}, [chatSummaries]);
  const saveHistory = (inputText, resultData, title, improve = null) => {
  const entry = { 
    id: Date.now(), 
    date: new Date().toLocaleString("ja-JP"), 
    preview: title || resultData?.strategy_message?.message || inputText.slice(0, 40) + (inputText.length > 40 ? "…" : ""), 
    input: inputText, 
    result: resultData,
    improveResult: improve
  };
  const newHistory = [entry, ...history];
  setHistory(newHistory);
  localStorage.setItem("ab3c_history", JSON.stringify(newHistory));
};

 const notify = (text) => {
    if (Notification.permission === "granted") new Notification("戦略大臣 分析完了", { body: text.slice(0, 60), icon: "https://ab3c.jp/img/common/logo.svg" });
  };

  const analyze = async () => {
    if (tab === "text" && !input.trim()) { setError("事業概要を入力してください。"); return; }
    if (tab === "url" && !url.trim()) { setError("URLを入力してください。"); return; }
setError(""); setResult(null); setSelectedHistory(null); setLoading(true); setChatSummaries([]); setImproveResult(null);
    try {
      const body = tab === "url" ? { url } : { input };
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
setHistoryTitle(data?.strategy_message?.message || "");
const savedText = tab === "url" ? url : input;
setCurrentResult(data);
setCurrentInput(savedText);
saveHistory(savedText, data, data?.strategy_message?.message || "");
notify(savedText);
    } catch { setError("通信エラーが発生しました。もう一度お試しください。"); } finally { setLoading(false); }
  };

const reset = () => { setResult(null); setSelectedHistory(null); setInput(""); setUrl(""); setError(""); setChatSummaries([]); setImproveResult(null); setCurrentResult(null); setCurrentInput(""); };
  const editAndReanalyze = (text) => { setInput(text); setTab("text"); setResult(null); setSelectedHistory(null); };
  const deleteHistory = (id) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ab3c_history", JSON.stringify(newHistory));
    if (selectedHistory?.id === id) setSelectedHistory(null);
  };

  const tabStyle = (t) => ({ padding: "8px 20px", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", border: "none", cursor: "pointer", borderBottom: tab === t ? `2px solid ${C.ink}` : "2px solid transparent", background: "transparent", color: tab === t ? C.ink : C.muted });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Noto Serif JP', serif", display: "flex", flexDirection: "column" }}>
<ChatWidget
  isPro={isPro || chatTickets > 0 || trialChats > 0}
  analysisResult={currentResult}
  onReanalyze={(newResult, summary) => {
    setResult(newResult);
    setSelectedHistory(null);
    if (summary) {
      setChatSummaries(prev => [...prev, summary]);
    }
    saveHistory(currentInput || "", newResult, newResult?.strategy_message?.message || "");
  }}
/>
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showWelcome && <WelcomeModal session={session} onClose={() => setShowWelcome(false)} onShowPricing={() => setShowPricing(true)} />}

      <Header onShowPricing={() => setShowPricing(true)} />

      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* サイドバートグルボタン - タブスタイル */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          style={{ 
            position: "absolute", 
            left: sidebarOpen ? 240 : 0, 
            top: 0, 
            zIndex: 100,
            background: C.surface, 
            border: `1px solid ${C.border}`, 
            borderLeft: sidebarOpen ? `1px solid ${C.border}` : "none",
            borderRadius: sidebarOpen ? "0 4px 4px 0" : "0 4px 4px 0", 
            padding: "8px 6px", 
            cursor: "pointer", 
            fontFamily: "'Space Mono', monospace", 
            fontSize: 14, 
            color: C.muted,
            boxShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            transition: "left 0.2s ease",
            lineHeight: 1
          }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

      {sidebarOpen && (
  <div id="sidebar" style={{ width: 240, minWidth: 240, borderRight: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>履歴</span>
              <button onClick={reset} style={{ background: C.ink, border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 10, padding: "4px 10px" }}>+ 新規</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {history.length === 0 ? (
                <div style={{ padding: 16, fontSize: 12, color: C.muted, textAlign: "center" }}>履歴はありません</div>
              ) : (
                history.map((h, i) => (
                  <div key={h.id} onClick={() => { 
  setSelectedHistory(h); 
  setResult(null); 
  setCurrentResult(h.result);
  setCurrentInput(h.input);
  setImproveResult(h.improveResult || null);
}}
                    style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: selectedHistory?.id === h.id ? C.highlight : "transparent", borderLeft: selectedHistory?.id === h.id ? `3px solid ${C.A}` : "3px solid transparent" }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.muted, marginBottom: 4 }}>#{history.length - i} · {h.date}</div>
                    <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.5 }}>{h.preview}</div>
                    <button onClick={(e) => { e.stopPropagation(); deleteHistory(h.id); }} style={{ marginTop: 6, background: "transparent", border: "none", cursor: "pointer", fontSize: 10, color: C.muted, padding: 0 }}>削除</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <div style={{ flex: 1, padding: "32px 24px 80px", overflowY: "auto", maxWidth: 900 }}>
          {!currentResult && !loading && (
<div style={{ marginBottom: 28 }}>
  {/* タブ */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: -1, position: "relative", zIndex: 1 }}>
    
    <button
      onClick={() => { setTab("url"); setError(""); }}
      style={{ 
        background: tab === "url" ? C.surface : "#d0d0d0", 
        border: `1px solid ${C.border}`, 
        borderTop: `4px solid ${C.B}`,
        borderBottom: tab === "url" ? "none" : `1px solid ${C.border}`, 
        borderRadius: "6px 6px 0 0", 
        padding: "12px 14px", 
        cursor: "pointer", 
        textAlign: "left" 
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 3 }}>🌐</div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 2 }}>URLで分析</div>
      <div style={{ fontSize: 16, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>WebサイトのURLを貼るだけ</div>
    </button>
      <button
      onClick={() => { setTab("text"); setError(""); }}
      style={{ 
        background: tab === "text" ? C.surface : "#d0d0d0", 
        border: `1px solid ${C.border}`, 
        borderTop: `4px solid ${C.A}`,
        borderBottom: tab === "text" ? "none" : `1px solid ${C.border}`, 
        borderRadius: "6px 6px 0 0", 
        padding: "12px 14px", 
        cursor: "pointer", 
        textAlign: "left" 
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 3 }}>✏️</div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 2 }}>テキストで入力</div>
      <div style={{ fontSize: 16, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>事業概要を自由に記述</div>
    </button>
  </div>

 {/* 入力エリア */}
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0 0 8px 8px", padding: "20px 28px 28px", boxShadow: `2px 2px 0 ${C.border}` }}>
    {tab === "text" ? (
      <>
        <label style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, color: C.muted, display: "block", marginBottom: 10 }}>事業の概要を入力してください</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyze(); }}
          placeholder="例：地元農家と提携した無農薬野菜の定期宅配サービスです。週1回のボックス配送で旬の野菜を10〜12品目お届け。産地直送・中間業者なし、レシピカードも同封。"
          style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.8, padding: "14px 16px", resize: "vertical", minHeight: 120, outline: "none", boxSizing: "border-box" }} />
      </>
    ) : (
      <>
        <label style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, color: C.muted, display: "block", marginBottom: 10 }}>分析したいウェブサイトのURLを入力してください</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") analyze(); }}
          placeholder="例：https://www.example.co.jp"
          style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.8, padding: "14px 16px", outline: "none", boxSizing: "border-box" }} />
        <p style={{ fontSize: 16, color: C.muted, marginTop: 8, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>※ サイトの内容を読み取りAB3C分析を行います。一部のサイトは読み取れない場合があります。</p>
      </>
    )}
{error && (
  <div style={{ background: "#fdf0ef", borderLeft: `3px solid ${C.red}`, padding: "10px 14px", fontSize: 16, color: C.red, marginTop: 12 }}>
    <div style={{ whiteSpace: "pre-line" }}>{error}</div>
    <div style={{ marginTop: 8, fontSize: 16, color: C.muted, lineHeight: 1.7 }}>
      AIを利用したシステムのため、まれに動作がおかしくなることがあります。その場合は5分ほどして再度分析してみてください。それでも回復しない場合は、<a href="https://status.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: C.A }}>Claudeのシステムの稼働状況</a>を確認してください。
    </div>
  </div>
)}
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
      <button onClick={analyze} disabled={loading} style={{ background: loading ? C.muted : C.ink, border: "none", borderRadius: 2, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 28px" }}>
        {loading ? "分析中…" : "▶ 分析する"}
      </button>
      <span style={{ fontSize: 16, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{tab === "text" ? "Ctrl + Enter でも実行できます" : "Enter でも実行できます"}</span>
    </div>
  </div>
</div>
          )}
{!currentResult && !loading && (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0" }}>
    <a href="/howto" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", textDecoration: "none", color: C.ink }}>
      <span style={{ fontSize: 24 }}>🔰</span>
      <div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink }}>初めての方へ</div>
        <div style={{ fontSize: 16, color: C.muted, marginTop: 2, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>使い方・入力方法・活用法</div>
      </div>
    </a>
    <a href="/about" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", textDecoration: "none", color: C.ink }}>
      <span style={{ fontSize: 24 }}>📖</span>
      <div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink }}>AB3C分析とは</div>
        <div style={{ fontSize: 16, color: C.muted, marginTop: 2, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>フレームワークの詳細</div>
      </div>
    </a>
</div>
)}

{!currentResult && !loading && (
  <div style={{ marginTop: 40, padding: "32px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 24 }}>戦略大臣 使い方</div>
    
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 10, borderLeft: `3px solid ${C.A}`, paddingLeft: 12 }}>AB3C分析とは</div>
      <p style={{ fontSize: 16, lineHeight: 1.9, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>AB3C分析は、「選ばれる理由」を明らかにする事業戦略フレームワークです。Benefit（お客様が求める価値）・Advantage（競合との好ましい違い）・3C（Customer・Competitor・Company）を構造化することで、事業にかかわるすべての人の共通言語をつくります。</p>
    </div>

    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 10, borderLeft: `3px solid ${C.A}`, paddingLeft: 12 }}>2つの使い方</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div style={{ background: "#e8e8e8", borderRadius: 6, padding: "16px 18px" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>🌐 URLで分析（既存事業向け）</div>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>すでにウェブサイトがある場合はURLを入力するだけ。現在のサイトが戦略を正しく伝えられているか、競合と比べてアドバンテージが伝わっているかを確認できます。</p>
        </div>
        <div style={{ background: "#e8e8e8", borderRadius: 6, padding: "16px 18px" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>✏️ テキストで入力（新規事業向け）</div>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>これから起業する、新規事業を立ち上げる、大幅に事業を刷新したい場合はテキストで事業概要を入力。試行錯誤しながら繰り返すことで事業モデルの精度を上げられます。</p>
        </div>
      </div>
    </div>

    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 10, borderLeft: `3px solid ${C.A}`, paddingLeft: 12 }}>分析結果の活用方法</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { icon: "🌐", title: "ウェブサイト改善", desc: "戦略メッセージをTOPページで表現。AB3Cがウェブ改善の指示書になります。" },
{ icon: "📊", title: "スライド資料を即作成", desc: "シェアURLをGoogle NotebookLMに読み込ませるだけで事業戦略の改善提案スライド資料が作成できます。" },
          { icon: "📝", title: "補助金・事業計画書", desc: "AB3Cで整理した戦略を補助金申請書や事業計画書にそのまま活用できます。" },

        ].map((item, i) => (
          <div key={i} style={{ background: "#e8e8e8", borderRadius: 6, padding: "14px 16px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{item.title}</div>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div style={{ background: C.ink, borderRadius: 6, padding: "20px 24px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 8 }}>分析はゴールではありません</div>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.75)", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>戦略をクリアにし、関係者全員が同じ設計図を見られる「共通言語」をつくることが戦略大臣の役割です。</p>
    </div>
  </div>
)}
{loading && <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 16 }}>AIがAB3Cを分析中です…</div>}
          {currentResult && (
            <div>
             <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
  <button onClick={reset} style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "10px 20px" }}>
    ← 新規分析
  </button>
  {currentInput && (
    <button onClick={() => editAndReanalyze(currentInput)} style={{ background: C.A, border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
      ✏️ このテキストを修正して再分析
    </button>
  )}
  <button onClick={() => shareResult(currentInput || "", currentResult)} disabled={sharing} style={{ background: C.B, border: "none", borderRadius: 2, color: "#fff", cursor: sharing ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
    {sharing ? "作成中…" : "🔗 シェアＵＲＬを発行"}
  </button>
  <button
    onClick={() => { window.print(); }}
    style={{ background: C.B, border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}
  >
🖨️ 印刷・ＰＤＦ保存
  </button>
</div>
           
{(currentInput || chatSummaries.length > 0) && (
  <div style={{ background: "#e8e8e8", border: `1px solid ${C.border}`, borderRadius: 4, padding: "14px 16px", marginBottom: 16 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>分析情報</div>
    <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
{currentInput?.startsWith("http") ? (
        <a href={currentInput} target="_blank" rel="noopener noreferrer" style={{ color: C.A }}>{currentInput}</a>
      ) : (
<span>{currentInput?.slice(0, 100)}{currentInput?.length > 100 ? "…" : ""}</span>
      )}
    </div>
    {chatSummaries.length > 0 && (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
        {chatSummaries.map((s, i) => (
         <div key={i} style={{ fontSize: 12, color: C.A, lineHeight: 1.8 }}>＋{typeof s === 'string' ? s.replace('＋', '') : JSON.stringify(s)}</div>
        ))}
      </div>
    )}
  </div>
)}
                    
              <TitleEditor title={historyTitle} onChange={e => {
                setHistoryTitle(e.target.value);
                const newHistory = [...history];
                if (newHistory.length > 0 && !selectedHistory) { newHistory[0].preview = e.target.value; setHistory(newHistory); localStorage.setItem("ab3c_history", JSON.stringify(newHistory)); }
              }} />
              {shareUrl && (
                <div style={{ background: "#e8e8e8", border: `1px solid ${C.B}`, borderRadius: 4, padding: "14px 18px", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.B, marginBottom: 6 }}>✓ URLをコピーしました</div>
                  <div style={{ fontSize: 13, color: C.ink, wordBreak: "break-all" }}>{shareUrl}</div>
                </div>
              )}
<div id="result-area">
  <ResultView d={currentResult} />
  {currentInput?.startsWith("http") && improveResult && (
    <div id="improve-area" style={{ marginTop: 40, paddingTop: 40, borderTop: `3px solid ${C.ink}` }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 24, borderBottom: `2px solid ${C.border}`, paddingBottom: 16 }}>🔧 ウェブサイト改善レポート</div>
      {[
        { key: "contents", label: "📝 追加すべきコンテンツ", color: C.A },
        { key: "design", label: "🎨 改善すべきデザイン・ビジュアル", color: C.B },
        { key: "structure", label: "🏗️ サイト構造の改善", color: C.C },
      ].map(section => (
        <div key={section.key} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: section.color, marginBottom: 14, borderLeft: `3px solid ${section.color}`, paddingLeft: 12 }}>{section.label}</div>
          {improveResult[section.key]?.map((item, i) => (
            <div key={i} style={{ background: "#e8e8e8", borderRadius: 6, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{i + 1}. {item.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 6 }}><b>理由：</b>{item.reason}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}><b>実装例：</b>{item.example}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )}
</div>

{currentInput?.startsWith("http") && (
  <div style={{ marginTop: 32 }}>
    {improveResult && (
      <button
        onClick={() => shareResult(currentInput || "", currentResult)}
        disabled={sharing}
        style={{ background: C.A, border: "none", borderRadius: 4, color: "#fff", cursor: sharing ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "14px 28px", marginBottom: 16, display: "block" }}
      >
        {sharing ? "作成中…" : "🔗 改善レポートを含むシェアURLを再発行"}
      </button>
    )}
    {!improveResult && (
      <button
        onClick={async () => {
          setImproveLoading(true);
          try {
            const res = await fetch("/api/improve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ analysisResult: currentResult, url: currentInput }),
            });
            const data = await res.json();
            if (data.error) {
              alert(data.error);
           } else {
  setImproveResult(data);
  // 履歴を更新（改善レポートを含める）
  const updatedHistory = history.map(item => 
    item.input === currentInput && item.result === currentResult 
      ? { ...item, improveResult: data }
      : item
  );
  setHistory(updatedHistory);
  localStorage.setItem("ab3c_history", JSON.stringify(updatedHistory));
}
          } catch {
            alert("エラーが発生しました。");
          } finally {
            setImproveLoading(false);
          }
        }}
        disabled={improveLoading}
        style={{ background: improveLoading ? C.muted : C.A, border: "none", borderRadius: 4, color: "#fff", cursor: improveLoading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "14px 28px" }}
      >
        {improveLoading ? "🔧 改善レポート生成中…" : "🔧 ウェブサイト改善レポートを生成する"}
      </button>
    )}

  </div>
)}
            </div>
          )}
          <footer style={{ textAlign: "center", marginTop: 60, paddingTop: 20, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 32 }} />
              <span style={{ fontSize: 16, color: C.ink, fontWeight: 600 }}>一般社団法人デジタル経営革新協会</span>
            </div>
            <div style={{ marginBottom: 8, fontSize: 16 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted, textDecoration: "underline" }}>ab3c.jp</a> · Powered by Claude AI</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: 16 }}>
              <a href="/terms" style={{ color: C.muted, textDecoration: "none" }}>利用規約</a>
              <span style={{ color: C.border }}>|</span>
              <a href="/privacy" style={{ color: C.muted, textDecoration: "none" }}>プライバシーポリシー</a>
              <span style={{ color: C.border }}>|</span>
              <a href="/legal" style={{ color: C.muted, textDecoration: "none" }}>特定商取引法</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
