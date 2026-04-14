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
  phase1: "#2d6a30", phase1Bg: "#8bb88b",
  phase2: "#8c5e1a", phase2Bg: "#e4d9c8",
};

const Badge = ({ status }) => {
  const map = { ok: { icon: "✅", label: "OK" }, warn: { icon: "⚠️", label: "注意" }, ng: { icon: "❌", label: "NG" } };
  const { icon } = map[status] || map.warn;
  return (
    <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>
      {icon}
    </span>
  );
};

const ChatBtn = ({ onClick, abs }) => (
  <span className="chat-btn" style={abs ? { position: "absolute", top: 4, right: 4, zIndex: 2, display: "none" } : { display: "none", flexShrink: 0 }}>
    <button onClick={e => { e.stopPropagation(); onClick(); }} title="チャットで質問"
      style={{ background: C.phase1, border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/></svg>
    </button>
  </span>
);
const hoverShow = {
  onMouseEnter: (e) => { const b = e.currentTarget.querySelector(":scope > .chat-btn"); if (b) b.style.display = "inline-flex"; },
  onMouseLeave: (e) => { const b = e.currentTarget.querySelector(":scope > .chat-btn"); if (b) b.style.display = "none"; },
};

const Card = ({ color, title, children, onChat }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 4, padding: "16px 18px", position: "relative" }} {...(onChat ? hoverShow : {})}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, letterSpacing: "0.1em", textTransform: "uppercase", color, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12 }}>{title}</div>
    {onChat && <ChatBtn onClick={onChat} abs />}
    {children}
  </div>
);

// テキスト内のURLをリンク化するヘルパー
const linkify = (text) => {
  if (!text || typeof text !== "string") return text;
  // 「テキスト｜URL」パターン
  if (text.includes("｜http")) {
    var parts2 = text.split("｜");
    return <>{parts2[0]} <a href={(parts2[1] || "").trim()} target="_blank" rel="noopener noreferrer" style={{ color: C.A, textDecoration: "underline", fontSize: 13 }}>🔗</a></>;
  }
  // テキスト内のURL
  var parts3 = text.split(/(https?:\/\/[^\s）」]+)/);
  if (parts3.length === 1) return text;
  return parts3.map(function(part, i) { return part.match(/^https?:\/\//) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: C.A, textDecoration: "underline", wordBreak: "break-all" }}>{part}</a> : part; });
};

const UL = ({ items, onChatItem }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => (
     <li key={i} style={{ fontSize: 16, lineHeight: 1.75, padding: "5px 0 5px 16px", borderBottom: i < items.length - 1 ? `1px dashed ${C.border}` : "none", position: "relative", color: "#000000", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}
       {...(onChatItem ? hoverShow : {})}>
        <span><span style={{ position: "absolute", left: 0, color: C.muted }}>–</span>{linkify(item)}</span>
        {onChatItem && <ChatBtn onClick={() => onChatItem(item)} />}
      </li>
    ))}
  </ul>
);

const SectionLabel = ({ color, letter, jp, en, desc, onChat }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${C.border}`, position: "relative" }} {...(onChat ? hoverShow : {})}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 34, fontWeight: 700, color, lineHeight: 1, width: 56, flexShrink: 0 }}>{letter}</div>
    <div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700 }}>{jp}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{en}</div>
      {desc && <div style={{ fontSize: 14, color: C.muted, marginTop: 3 }}>{desc}</div>}
    </div>
    {onChat && <ChatBtn onClick={onChat} abs />}
  </div>
);

const Divider = () => <div style={{ borderTop: `1px solid ${C.border}`, margin: "32px 0" }} />;

// 2つの分析結果を比較して変更されたパスを返す
function diffResults(oldR, newR, prefix) {
  if (!oldR || !newR) return new Set();
  var changed = new Set();
  var p = prefix || "";
  Object.keys(newR).forEach(function(key) {
    var path = p ? p + "." + key : key;
    var oldVal = oldR[key];
    var newVal = newR[key];
    if (Array.isArray(newVal)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) changed.add(path);
    } else if (typeof newVal === "object" && newVal !== null) {
      var sub = diffResults(oldVal || {}, newVal, path);
      sub.forEach(function(s) { changed.add(s); });
    } else if (oldVal !== newVal) {
      changed.add(path);
    }
  });
  return changed;
}

// ハイライトスタイル
var HL = { background: "#fff3cd", borderLeft: "3px solid #ffc107", paddingLeft: 8, transition: "background 2s" };

const SubLabel = ({ color, text, onChat }) => (
  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.1em", color, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, position: "relative" }} {...(onChat ? hoverShow : {})}>{text}{onChat && <ChatBtn onClick={onChat} />}</div>
);

function ResultView({ d, onChat, changedPaths }) {
  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };
  const q = (section, detail) => onChat && (() => onChat(`${section}の「${(detail||"").slice(0,30)}」について詳しく教えてください`));
  const qs = (section) => onChat && (() => onChat(`${section}について詳しく教えてください`));
  var cp = changedPaths || new Set();
  var hl = function(path) { try { return cp.has && cp.has(path) ? HL : {}; } catch (e) { return {}; } };
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.B} letter="B" jp="Benefit（お客様が求める価値）" en="Needs → Wants" desc={`核心：${d.benefit.core}`} onChat={qs("Benefit（お客様が求める価値）")} />
        <div style={g2}>
          <div style={hl("benefit.needs")}><Card color={C.B} title="ニーズ（欠乏感・曖昧な欲求）" onChat={qs("ニーズ")}><UL items={d.benefit.needs.map(i => `📌 ${i}`)} onChatItem={onChat && ((item) => onChat(`ニーズの「${item.replace("📌 ","").slice(0,30)}」について詳しく教えてください`))} /></Card></div>
          <div style={hl("benefit.wants")}><Card color={C.B} title="ウォンツ（具体的欲求）" onChat={qs("ウォンツ")}><UL items={d.benefit.wants.map(i => `🎯 ${i}`)} onChatItem={onChat && ((item) => onChat(`ウォンツの「${item.replace("🎯 ","").slice(0,30)}」について詳しく教えてください`))} /></Card></div>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.A} letter="A" jp="Advantage（差別的優位点・好ましい違い）" en="競合より選ばれる理由" onChat={qs("Advantage（差別的優位点）")} />
        <div style={g3}>
          <div style={hl("advantage.what")}><Card color={C.A} title="アドバンテージ" onChat={q("アドバンテージ", d.advantage.what)}><div style={{ fontSize: 16, fontWeight: 700, color: C.A, lineHeight: 1.6 }}>{d.advantage.what}</div></Card></div>
          <div style={hl("advantage.why_good")}><Card color={C.A} title="なぜ好ましいのか" onChat={q("なぜ好ましいのか", d.advantage.why_good)}><p style={{ fontSize: 16, lineHeight: 1.7, color: "#000000" }}>{d.advantage.why_good}</p></Card></div>
          <div style={hl("advantage.why_hard_to_copy")}><Card color={C.A} title="なぜ真似されにくいか" onChat={q("なぜ真似されにくいか", d.advantage.why_hard_to_copy)}><p style={{ fontSize: 16, lineHeight: 1.7, color: "#000000" }}>{d.advantage.why_hard_to_copy}</p></Card></div>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.C} letter="3C" jp="3C分析" en="Customer · Competitor · Company" onChat={qs("3C分析")} />
        <SubLabel color={C.C} text="Customer（お客様）" onChat={qs("Customer（お客様）分析")} />
        <div style={{ ...g2, marginBottom: 14 }}>
          <div style={hl("three_c.customer.target")}><Card color={C.C} title="ターゲット" onChat={q("ターゲット", d.three_c.customer.target)}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.C, marginBottom: 12 }}>{d.three_c.customer.target}</div>
            <UL items={d.three_c.customer.profile} onChatItem={onChat && ((item) => onChat(`ターゲットプロフィール「${item.slice(0,30)}」について詳しく教えてください`))} />
          </Card></div>
          <div style={hl("three_c.customer.stage")}><Card color={C.C} title="アプローチ段階 · 切り捨て" onChat={qs("アプローチ段階と切り捨て")}>
            <p style={{ fontSize: 16, lineHeight: 1.65, marginBottom: 12, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>段階：</b>{d.three_c.customer.stage}</p>
            <p style={{ fontSize: 16, lineHeight: 1.65 }}><b>切り捨てたお客様：</b>{d.three_c.customer.cutoff}</p>
          </Card></div>
        </div>
        {d.three_c.customer.market && (
          <div style={{ marginBottom: 14 }}>
            <Card color={C.C} title="市場規模" onChat={qs("市場規模")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px", position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SAM（獲得可能市場）</div>
                  <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.market.sam}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`SAM（獲得可能市場）「${(d.three_c.customer.market.sam||"").slice(0,30)}」について詳しく教えてください`)} abs />}
                </div>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px", position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SOM（実際に狙える市場）</div>
                  <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.market.som}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`SOM（実際に狙える市場）「${(d.three_c.customer.market.som||"").slice(0,30)}」について詳しく教えてください`)} abs />}
                </div>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px", position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>成長率・トレンド</div>
                  <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{d.three_c.customer.market.growth}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`市場成長率・トレンドについて詳しく教えてください`)} abs />}
                </div>
              </div>
              {d.three_c.customer.market.basis && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#f5f5f5", borderRadius: 4, borderLeft: `3px solid ${C.C}`, position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>算出根拠</div>
                  <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.8, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>{linkify(d.three_c.customer.market.basis)}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`市場規模の算出根拠について詳しく教えてください`)} abs />}
                </div>
              )}
            </Card>
          </div>
        )}
        <div style={g2}>
          <div>
            <SubLabel color={C.C} text="Competitor（競合）" onChat={qs("競合分析")} />
            <Card color={C.C} title="直接競合 / 異業種競合" onChat={qs("競合について")}>
              <UL items={[...d.three_c.competitor.direct, ...d.three_c.competitor.indirect.map(i => `↳ ${i}`)]} onChatItem={onChat && ((item) => onChat(`競合「${item.replace("↳ ","").slice(0,30)}」について詳しく教えてください`))} />
            </Card>
          </div>
          <div>
            <SubLabel color={C.C} text="Company（自社）" onChat={qs("自社分析")} />
            <Card color={C.C} title="強み · 構造 · パッション" onChat={qs("自社の強み・構造・パッション")}>
              <UL items={d.three_c.company.strength} onChatItem={onChat && ((item) => onChat(`自社の強み「${item.slice(0,30)}」について詳しく教えてください`))} />
              <p style={{ fontSize: 16, color: C.muted, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>構造：{d.three_c.company.structure}</p>
              <p style={{ fontSize: 16, color: C.muted, marginTop: 6 }}>💡 {d.three_c.company.passion}</p></Card>
          </div>
        </div>
      </div>
      <Divider />
      <div style={{ background: C.phase1, borderRadius: 4, padding: "28px 32px", marginBottom: 28, position: "relative", ...(cp.has("strategy_message.message") ? { boxShadow: "0 0 0 3px #ffc107" } : {}) }} {...(onChat ? hoverShow : {})}>
        {onChat && <ChatBtn onClick={() => onChat("戦略メッセージの改善案を提案してください")} abs />}
<div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 12 }}>戦略メッセージ = Benefit + Advantage</div>        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.65, color: "#fff", marginBottom: 18 }}>{d.strategy_message.message}</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.85, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 16 }}>
          <b>Benefit：</b>{d.strategy_message.benefit_part}<br />
          <b>Advantage：</b>{d.strategy_message.advantage_part}
        </div>
      </div>
<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 28, position: "relative" }} {...(onChat ? hoverShow : {})}>
{onChat && <ChatBtn onClick={() => onChat("5つのチェックポイント全体の改善方法を教えてください")} abs />}
<div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16 }}>AB3C 5つのチェックポイント</div>  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {d.checkpoints.map((cp, i) => (
      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.6, position: "relative" }} {...(onChat ? hoverShow : {})}>
        <Badge status={cp.status} />
        <div style={{ flex: 1, fontSize: 16, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>{cp.label}</b><br /><span style={{ color: C.ink, fontSize: 16 }}>{cp.comment}</span></div>
        {onChat && <ChatBtn onClick={() => onChat(`チェックポイント「${cp.label}」の改善方法を教えてください。現在の評価: ${cp.comment}`)} abs />}
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
  const [step, setStep] = useState(1); // 1:概要+アンケート 2:完了
  const [purpose, setPurpose] = useState(null);

  const handleSelect = async (type) => {
    setPurpose(type);
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
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, padding: "32px", maxWidth: 520, width: "100%", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>

        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 20, textAlign: "center" }}>
          ようこそ、{session?.user?.name}さん！
        </div>

        {step === 1 && (
          <>
            {/* サービス概要 */}
            <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "20px 24px", marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: C.A, marginBottom: 12, letterSpacing: "0.1em" }}>WHAT IS 戦略大臣</div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.ink, margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                戦略大臣は、300万円の事業戦略立案サービスをボタン一つで可能にしたツールです。
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.ink, margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                生成AIに戦略を相談すると都度都度の対処療法的な回答になりがちです。先日はこう言っていたのに今日はこんなふうに言っている——矛盾した回答に戸惑うことがありませんか？
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.ink, margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                戦略大臣では環境調査をした上で戦略を固めることで、その後のマーケティングの軸が定まり、一貫性のある経営戦略の実行が可能になります。
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.A, margin: 0, fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
                あなたのWebサイトのURLを入れてお試しください。
              </p>
            </div>

            {/* 利用目的選択 */}
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16, fontFamily: "'Noto Serif JP', serif", textAlign: "center" }}>
              あなたの利用目的を教えてください
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => handleSelect("self")}
                style={{ background: "#f0f4ff", border: `2px solid #1a6fd4`, borderRadius: 8, cursor: "pointer", padding: "18px 24px", textAlign: "left" }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.A, fontWeight: 700, marginBottom: 6 }}>SELF USE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>自社・自分のビジネスを分析したい</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>自社のWebサイトや事業戦略をAB3Cで整理し、経営判断に活かしたい。</div>
              </button>
              <button
                onClick={() => handleSelect("agency")}
                style={{ background: "#fff8f0", border: `2px solid #FF6B00`, borderRadius: 8, cursor: "pointer", padding: "18px 24px", textAlign: "left" }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#FF6B00", fontWeight: 700, marginBottom: 6 }}>AGENCY USE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>クライアントへの戦略支援に活用したい</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>Web制作・コンサル・税理士など、クライアントへの提案・伴走サービスとして使いたい。</div>
                <div style={{ fontSize: 12, color: "#FF6B00", marginTop: 8, fontFamily: "system-ui, sans-serif" }}>※ クライアント提供向けのサポート情報をお届けします。</div>
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
                ? "クライアントへの提案方法・活用事例など、パートナー向けの情報をメールでお届けします。"
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
function AnalysisChatPanel({ isPro, analysisResult, onReanalyze, onSendTopic, onConfirmStrategy }) {
  const chatKey = `ab3c_chat_${analysisResult ? JSON.stringify(analysisResult).slice(0, 50) : 'default'}`;
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    try { const saved = localStorage.getItem(chatKey); if (saved) setMessages(JSON.parse(saved)); } catch (e) {}
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: "分析結果をもとに相談できます。どんなことでも聞いてください！" }]);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(chatKey, JSON.stringify(messages)); } catch (e) {}
  }, [messages]);

  // トピックチップからの送信
  useEffect(() => {
    if (onSendTopic) {
      onSendTopic.current = (topic) => {
        if (topic && !loading) {
          setInput("");
          const userMessage = { role: "user", content: topic };
          setMessages(prev => [...prev, userMessage]);
          sendMessage(topic, [...messages, userMessage]);
        }
      };
    }
  }, [messages, loading]);

  const sendMessage = async (text, allMessages) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.filter(m => m.role === "user" || allMessages.indexOf(m) > 0),
          analysisResult,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
    } finally { setLoading(false); }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    await sendMessage(input, newMessages);
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
      if (data.reanalyzed && data.result) {
        const summary = data.chatSummary || messages.filter(m => m.role === "user").slice(-1).map(m => m.content.slice(0, 20)).join("、");
        onReanalyze(data.result, summary);
        setMessages(prev => [...prev, { role: "assistant", content: "✓ 会話内容を反映して分析を更新しました！" }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "再分析データの取得に失敗しました。" }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
    } finally { setLoading(false); }
  };

  if (!isPro) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.phase1Bg }}>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 16, lineHeight: 1.8, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: C.ink }}>分析チャットを利用するにはログインが必要です</div>
          <div>Googleアカウントでログインすると、分析結果をもとにAIと相談できます。</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, background: C.phase1Bg }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              background: m.role === "user" ? C.phase1 : "#ffffff",
              border: m.role === "user" ? "none" : `1px solid ${C.border}`,
              borderRadius: 8, padding: "10px 14px", fontSize: 14,
              color: m.role === "user" ? "#fff" : C.ink,
              maxWidth: "80%", lineHeight: 1.7,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 13, color: C.muted, padding: "8px 14px" }}>考え中...</div>}
        <div ref={messagesEndRef} />
      </div>
      {messages.length >= 3 && (
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, background: C.phase1Bg }}>
          <button onClick={reanalyze} disabled={loading}
            style={{ width: "100%", background: loading ? C.muted : "#e74c3c", border: "none", borderRadius: 6, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, padding: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            {loading ? "↻ 再分析中..." : "↻ この会話内容を分析に反映する"}
          </button>
        </div>
      )}
      <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, background: C.phase1Bg }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder="分析結果について相談する..."
          rows={3}
          style={{ width: "100%", background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "system-ui, sans-serif", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
        />
        <button onClick={send} disabled={loading}
          style={{ width: "100%", marginTop: 8, background: loading ? C.muted : C.phase1, border: "none", borderRadius: 4, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "10px 16px" }}>
          送信
        </button>
        {onConfirmStrategy && (
          <button onClick={onConfirmStrategy}
            style={{ width: "100%", marginTop: 12, background: C.phase2, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            戦略を確定
          </button>
        )}
      </div>
    </div>
  );
}
function ThreadChat({ threadId, themeId, chatDescription, analysisResult, isPro, onAddAction, onGenerateRecruit }) {
  const effectiveThemeId = themeId || threadId;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initialized = useRef(false);

  // メッセージ保存（初期化完了後のみ、準備中は保存しない）
  useEffect(() => {
    if (initialized.current && messages.length > 0 && !messages[0]?.content?.includes("準備中")) {
      try { localStorage.setItem(`ab3c_thread_${threadId}`, JSON.stringify(messages)); } catch (e) {}
    }
  }, [messages, threadId]);

  // マウント時にロードまたは生成（key={threadId}によるリマウントで実行）
  useEffect(() => {
    initialized.current = false;
    const controller = new AbortController();
    const key = `ab3c_thread_${threadId}`;
    try {
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && parsed.length > 0 && !parsed[0]?.content?.includes("準備中")) {
        setMessages(parsed);
        initialized.current = true;
      } else {
        // 初回アドバイス生成（全体アドバイス or サブチャット概要ベース）
        const isSubChat = !!chatDescription;
        const userPrompt = isSubChat
          ? `「${effectiveThemeId}」テーマの中で、以下について相談したいです:\n\n${chatDescription}\n\n戦略分析結果をもとに、この内容について具体的なアドバイスをお願いします。`
          : `「${effectiveThemeId}」テーマの初回アドバイスをお願いします。戦略分析結果をもとに、このテーマで最初に取り組むべきことを具体的に提案してください。`;
        setMessages([{ role: "assistant", content: isSubChat ? `「${chatDescription}」について準備中...` : `「${effectiveThemeId}」のアドバイスを準備中...` }]);
        setLoading(true);
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [{ role: "user", content: userPrompt }],
            analysisResult,
            threadTheme: effectiveThemeId,
            initialAdvice: !isSubChat,
          }),
        }).then(r => r.json()).then(data => {
          if (!controller.signal.aborted) {
            setMessages([{ role: "assistant", content: data.message || "このテーマについて相談できます。" }]);
            initialized.current = true;
          }
        }).catch(err => {
          if (!controller.signal.aborted) {
            setMessages([{ role: "assistant", content: "このテーマについて相談できます。何でも聞いてください！" }]);
            initialized.current = true;
          }
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
      }
    } catch (e) {
      setMessages([{ role: "assistant", content: "このテーマについて相談できます。" }]);
      initialized.current = true;
    }
    setInput("");
    return () => controller.abort();
  }, []);

  const send = async () => {
    if (!input.trim() || loading || !isPro) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.role === "user" || messages.indexOf(m) > 0), userMessage],
          analysisResult,
          recruitMode: effectiveThemeId === "recruit",
          threadTheme: effectiveThemeId,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, background: C.phase2Bg }}>
        {messages.map((m, i) => {
          const actionMatch = m.role === "assistant" && m.content?.match(/\[ACTION:\s*(.+?)\]/);
          const displayContent = actionMatch ? m.content.replace(/\[ACTION:\s*.+?\]/g, "").trim() : m.content;
          return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                background: m.role === "user" ? C.phase2 : "#ffffff",
                border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                borderRadius: 8, padding: "10px 14px", fontSize: 14,
                color: m.role === "user" ? "#fff" : C.ink,
                maxWidth: "80%", lineHeight: 1.7,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "pre-wrap",
              }}>{displayContent}</div>
            </div>
            {actionMatch && onAddAction && !m.actionRegistered && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 6, marginLeft: 8 }}>
                <button onClick={() => {
                  onAddAction(actionMatch[1], displayContent, threadId);
                  setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, actionRegistered: true } : msg));
                }} style={{ background: C.phase2, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12, padding: "6px 14px", fontFamily: "system-ui, sans-serif" }}>
                  ✓ 「{actionMatch[1]}」をアクションに登録
                </button>
              </div>
            )}
            {actionMatch && m.actionRegistered && (
              <div style={{ fontSize: 11, color: C.phase2, marginTop: 4, marginLeft: 8 }}>✓ アクションに登録済み</div>
            )}
          </div>
          );
        })}
        {loading && <div style={{ fontSize: 13, color: C.muted, padding: "8px 14px" }}>考え中...</div>}
        <div ref={messagesEndRef} />
      </div>
      {effectiveThemeId === "recruit" && messages.filter(m => m.role === "user").length >= 3 && onGenerateRecruit && (
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, background: C.phase2Bg }}>
          <button onClick={() => onGenerateRecruit(messages)} style={{ width: "100%", background: C.phase2, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "10px" }}>
            📝 採用コンテンツ企画レポートを生成する
          </button>
        </div>
      )}
      <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, background: C.phase2Bg }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder={isPro ? "メッセージを入力..." : "プロプランでチャットが利用できます"}
          disabled={!isPro}
          rows={3}
          style={{ width: "100%", background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "system-ui, sans-serif", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
        />
        <button onClick={send} disabled={loading || !isPro}
          style={{ marginTop: 8, width: "100%", background: loading || !isPro ? C.muted : C.phase2, border: "none", borderRadius: 4, color: "#fff", cursor: loading || !isPro ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "10px 16px" }}>
          送信
        </button>
      </div>
    </div>
  );
}

function TitleEditor({ title, onChange }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px" }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>タイトル</span>
      {editing ? (
        <input autoFocus value={title} onChange={onChange} onBlur={() => setEditing(false)} onKeyDown={e => { if (e.key === "Enter") setEditing(false); }}
          style={{ flex: 1, background: "#fff", border: `1px solid ${C.A}`, borderRadius: 2, color: C.ink, fontSize: 16, padding: "4px 8px", outline: "none" }} />
      ) : (

        <span style={{ flex: 1, fontSize: 16, color: C.ink }}>{title || "（タイトルなし）"}</span>
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
const [overlayMessage, setOverlayMessage] = useState(null);
const [changedPaths, setChangedPaths] = useState(new Set());
const [chatWidth, setChatWidth] = useState(500);
const chatResizing = useRef(false);
const [improveLoading, setImproveLoading] = useState(false);
const [siteId, setSiteId] = useState(null);
const [strategyConfirmed, setStrategyConfirmed] = useState(false);
const chatSendTopicRef = useRef(null);
const [recruitResult, setRecruitResult] = useState(null);
const [recruitLoading, setRecruitLoading] = useState(false);
const [threads, setThreads] = useState([]);
const [activeThemeId, setActiveThemeId] = useState(null);
const [activeChatId, setActiveChatId] = useState(null);
const [themeChats, setThemeChats] = useState({});
const [actions, setActions] = useState([]);
const [selectedActionId, setSelectedActionId] = useState(null);
const [chatExpanded, setChatExpanded] = useState(false);
const [chatSummaries, setChatSummaries] = useState([]);
  
  // フェーズ導出（viewOverrideで表示タブを切り替え、strategyConfirmedは変更しない）
  const [viewOverride, setViewOverride] = useState(null);
  const derivedPhase = !currentResult ? "input" : strategyConfirmed ? "action" : "analysis";
  const phase = viewOverride || derivedPhase;

  const [headerHeight, setHeaderHeight] = useState(120);
  useEffect(() => {
    const header = document.querySelector("#app-header");
    if (header) setHeaderHeight(header.offsetHeight);
  }, []);

  // 分析結果・改善レポートが変わったらlocalStorageに自動保存
  useEffect(function() {
    if (currentResult && currentInput) {
      try {
        var existing = {};
        try { existing = JSON.parse(localStorage.getItem("ab3c_analysis_" + currentInput) || "{}"); } catch (e) {}
        var toSave = { result: currentResult, improve: improveResult || existing.improve || null, timestamp: Date.now() };
        localStorage.setItem("ab3c_analysis_" + currentInput, JSON.stringify(toSave));
      } catch (e) {}
    }
  }, [currentResult, improveResult, currentInput]);

  // タブ切替時にページトップへスクロール
  const mainContentRef = useRef(null);
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      // DOM更新後の次フレームでスクロール（ブラウザの復元処理より後に実行）
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
      });
    }
  }, [phase]);

  const DEFAULT_THREADS = [
    // 集客系
    { id: "seo", label: "SEO対策", icon: "🔍", preset: true },
    { id: "sns", label: "SNS運用", icon: "📱", preset: true },
    { id: "webads", label: "Web広告", icon: "📣", preset: true },
    { id: "meo", label: "Googleマップ", icon: "📍", preset: true },
    { id: "flyer", label: "チラシ・DM", icon: "📄", preset: true },
    { id: "press", label: "プレスリリース", icon: "📰", preset: true },
    // 事業改善系
    { id: "website", label: "ウェブサイト改善", icon: "🔧", preset: true },
    { id: "recruit", label: "採用コンテンツ企画", icon: "👥", preset: true },
    { id: "subsidy", label: "補助金申請", icon: "📋", preset: true },
    { id: "sales", label: "営業資料・提案書", icon: "💼", preset: true },
  ];

  // スレッド初期化（戦略確定時）
  useEffect(() => {
    if (strategyConfirmed && threads.length === 0) {
      const storageKey = `ab3c_threads_${siteId || "default"}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setThreads(JSON.parse(saved));
        } else {
          setThreads(DEFAULT_THREADS);
        }
      } catch (e) {
        setThreads(DEFAULT_THREADS);
      }
    }
  }, [strategyConfirmed]);

  // themeChats永続化
  useEffect(() => {
    if (strategyConfirmed && Object.keys(themeChats).length === 0) {
      try {
        const saved = localStorage.getItem(`ab3c_theme_chats_${siteId || "default"}`);
        if (saved) setThemeChats(JSON.parse(saved));
      } catch (e) {}
    }
  }, [strategyConfirmed]);
  useEffect(() => {
    if (Object.keys(themeChats).length > 0) {
      try { localStorage.setItem(`ab3c_theme_chats_${siteId || "default"}`, JSON.stringify(themeChats)); } catch (e) {}
    }
  }, [themeChats]);

  // テーマ選択: 初回クリック時に「全体アドバイス」チャットを自動作成
  const selectTheme = (themeId) => {
    setActiveThemeId(themeId);
    if (!themeChats[themeId] || themeChats[themeId].length === 0) {
      const mainChat = { id: `${themeId}_main`, label: "全体アドバイス" };
      setThemeChats(prev => ({ ...prev, [themeId]: [mainChat] }));
      setActiveChatId(mainChat.id);
    } else {
      setActiveChatId(themeChats[themeId][0].id);
    }
  };

  // サブチャット追加
  const addSubChat = (themeId) => {
    const label = prompt("チャット名を入力してください（例: TOPページのSEO）");
    if (!label?.trim()) return;
    const description = prompt("話し合いたい内容の概要を入力してください\n（例: TOPページのタイトルとメタディスクリプションを改善したい）");
    if (!description?.trim()) return;
    const newChat = { id: `${themeId}_${Date.now()}`, label: label.trim(), description: description.trim() };
    setThemeChats(prev => ({ ...prev, [themeId]: [...(prev[themeId] || []), newChat] }));
    setActiveChatId(newChat.id);
  };

  // スレッド永続化
  useEffect(() => {
    if (threads.length > 0) {
      const storageKey = `ab3c_threads_${siteId || "default"}`;
      try { localStorage.setItem(storageKey, JSON.stringify(threads)); } catch (e) {}
    }
  }, [threads]);

  // アクション永続化
  useEffect(() => {
    if (strategyConfirmed) {
      const key = `ab3c_actions_${siteId || "default"}`;
      try { const saved = localStorage.getItem(key); if (saved && actions.length === 0) setActions(JSON.parse(saved)); } catch (e) {}
    }
  }, [strategyConfirmed]);
  useEffect(() => {
    if (actions.length > 0) {
      try { localStorage.setItem(`ab3c_actions_${siteId || "default"}`, JSON.stringify(actions)); } catch (e) {}
    }
  }, [actions]);

  const addAction = (title, detail, threadId) => {
    setActions(prev => [...prev, { id: Date.now(), title, detail, threadId, createdAt: new Date().toLocaleString("ja-JP") }]);
  };

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
    try { const saved = localStorage.getItem("ab3c_history"); if (saved) setHistory(JSON.parse(saved)); } catch (e) {}
    try { const cs = localStorage.getItem("ab3c_chat_summaries"); if (cs) setChatSummaries(JSON.parse(cs)); } catch (e) {}
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
    // URLパラメータからsite_idを読み取り
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("site_id");
    const urlParam = params.get("url");
    if (sid || urlParam) {
      if (sid) setSiteId(sid);
      if (urlParam) { setUrl(urlParam); setTab("url"); setCurrentInput(urlParam); }
      // DBからサイトの分析結果を復元
      fetch("/api/sites").then(function(r) { return r.json(); }).then(function(data) {
        var sites = data.sites || [];
        var site = sid ? sites.find(function(s) { return s.id === sid; }) : null;
        if (!site && urlParam) {
          site = sites.find(function(s) { return s.site_url === urlParam; });
        }
        if (site) {
          setSiteId(site.id);
          if (site.latest_analysis) {
            setResult(site.latest_analysis);
            setCurrentResult(site.latest_analysis);
            setHistoryTitle(site.latest_analysis.strategy_message?.message || "");
            if (site.site_url) { setCurrentInput(site.site_url); setUrl(site.site_url); setTab("url"); }
            if (site.strategy_confirmed) setStrategyConfirmed(true);
            return; // DB復元成功
          }
          if (site.site_url) { setCurrentInput(site.site_url); setUrl(site.site_url); setTab("url"); }
          if (site.strategy_confirmed) setStrategyConfirmed(true);
        }
        // DBに分析結果がない場合、localStorageから復元
        var lsKey = urlParam ? "ab3c_analysis_" + urlParam : null;
        if (lsKey) {
          try {
            var lsData = localStorage.getItem(lsKey);
            if (lsData) {
              var parsed = JSON.parse(lsData);
              if (parsed.result) {
                setResult(parsed.result);
                setCurrentResult(parsed.result);
                setHistoryTitle(parsed.result.strategy_message?.message || "");
                if (parsed.improve) setImproveResult(parsed.improve);
              }
            }
          } catch (e) {}
        }
      }).catch(function() {
        // API失敗時もlocalStorageから復元
        if (urlParam) {
          try {
            var lsData2 = localStorage.getItem("ab3c_analysis_" + urlParam);
            if (lsData2) {
              var parsed2 = JSON.parse(lsData2);
              if (parsed2.result) { setResult(parsed2.result); setCurrentResult(parsed2.result); setHistoryTitle(parsed2.result.strategy_message?.message || ""); }
              if (parsed2.improve) setImproveResult(parsed2.improve);
            }
          } catch (e) {}
        }
      });
    }
    // URLパラメータからphaseを読み取り
    const phaseParam = params.get("phase");
    if (phaseParam === "action") {
      setTimeout(() => setViewOverride(null), 500);
    }
    // ブラウザの戻る/進むでURLパラメータが変わった時にリロード
    const handlePopState = () => window.location.reload();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
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
  } catch (e) {}
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

  // 戦略確定の共通処理（URL重複チェック+上書き確認付き）
  const confirmStrategy = async () => {
    const siteUrl = currentInput?.startsWith("http") ? currentInput : null;
    let siteName = "無題のサイト";
    try { if (siteUrl) siteName = new URL(siteUrl).hostname.replace(/^www\./, ""); } catch (e) {}
    let targetSiteId = siteId;
    if (!targetSiteId && siteUrl) {
      try {
        const sitesRes = await fetch("/api/sites");
        const sitesData = await sitesRes.json();
        const existing = (sitesData.sites || []).find(s => s.site_url === siteUrl);
        if (existing) {
          if (existing.strategy_confirmed) {
            if (!confirm(`このURLは既に戦略が確定されています（「${existing.site_name}」）。\n上書きしますか？`)) return;
          }
          targetSiteId = existing.id;
          setSiteId(existing.id);
        }
      } catch (e) {}
    }
    if (!targetSiteId) {
      try {
        const createRes = await fetch("/api/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_name: siteName, site_url: siteUrl }) });
        const createData = await createRes.json();
        if (createData.error && createData.existingSite) {
          targetSiteId = createData.existingSite.id;
          setSiteId(targetSiteId);
        } else if (createData.site) {
          targetSiteId = createData.site.id;
          setSiteId(targetSiteId);
        }
      } catch (e) { alert("保存に失敗しました。"); return; }
    }
    if (targetSiteId) {
      try {
        await fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: targetSiteId, latest_analysis: currentResult, strategy_confirmed: true, site_name: siteName }) });
        setStrategyConfirmed(true);
      } catch (e) { alert("保存に失敗しました。"); }
    }
  };

 const notify = (text) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("戦略大臣 分析完了", { body: text.slice(0, 60), icon: "https://ab3c.jp/img/common/logo.svg" });
  };

  const analyze = async () => {
    if (!session) { setError("分析にはGoogleログインが必要です。右上の「Googleでログイン」からログインしてください。"); return; }
    if (tab === "text" && !input.trim()) { setError("事業概要を入力してください。"); return; }
    if (tab === "url" && !url.trim()) { setError("URLを入力してください。"); return; }
setError(""); setResult(null); setSelectedHistory(null); setLoading(true); setChatSummaries([]); setImproveResult(null);
    setOverlayMessage("AB3C分析中...");
    try {
      // URL分析時: 既存サイトがあれば自動紐付け
      var analyzeSiteId = siteId;
      if (tab === "url" && url.trim()) {
        try {
          const sitesRes = await fetch("/api/sites");
          const sitesData = await sitesRes.json();
          const existingSite = (sitesData.sites || []).find(s => s.site_url === url.trim());
          if (existingSite) {
            analyzeSiteId = existingSite.id;
            setSiteId(existingSite.id);
          }
        } catch (e) {}
      }
      const body = tab === "url" ? { url } : { input };
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
setHistoryTitle(data?.strategy_message?.message || "");
const savedText = tab === "url" ? url : input;
setCurrentResult(data);
setCurrentInput(savedText);
setLoading(false);
if (tab === "url" && savedText.startsWith("http")) {
  setOverlayMessage("ウェブサイト改善レポート生成中...");
} else {
  setOverlayMessage(null);
}

// 分析結果をDBにも保存（非同期・ブロックしない）
if (tab === "url" && savedText.startsWith("http")) {
  (async function() {
    try {
      var saveSid = analyzeSiteId;
      if (!saveSid) {
        var sn = "無題のサイト";
        try { sn = new URL(savedText).hostname.replace(/^www\./, ""); } catch (e) {}
        var cr = await fetch("/api/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_name: sn, site_url: savedText }) });
        var cd = await cr.json();
        if (cd.existingSite) { saveSid = cd.existingSite.id; }
        else if (cd.site) { saveSid = cd.site.id; }
      }
      if (saveSid) {
        setSiteId(saveSid);
        await fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: saveSid, latest_analysis: data }) });
      }
    } catch (e) {}
  })();
}

// URL分析の場合、ウェブサイト改善レポートも同時に生成
let improveData = null;
if (tab === "url" && savedText.startsWith("http")) {
  setImproveLoading(true);
  try {
    const improveRes = await fetch("/api/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisResult: data, url: savedText }),
    });
    improveData = await improveRes.json();
    if (!improveData.error) {
      setImproveResult(improveData);
    }
  } catch (e) {
    console.error("改善レポート自動生成エラー:", e);
  } finally {
    setImproveLoading(false);
    setOverlayMessage(null);
  }
}

saveHistory(savedText, data, data?.strategy_message?.message || "", improveData);
notify(savedText);
    } catch (e) { setError("通信エラーが発生しました。もう一度お試しください。"); setLoading(false); setOverlayMessage(null); }
  };

const reset = () => { setResult(null); setSelectedHistory(null); setInput(""); setUrl(""); setError(""); setChatSummaries([]); setImproveResult(null); setCurrentResult(null); setCurrentInput(""); setStrategyConfirmed(false); setActiveThreadId(null); setThreads([]); };
  const editAndReanalyze = (text) => { setInput(text); setTab("text"); setResult(null); setSelectedHistory(null); };
  const deleteHistory = (id) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ab3c_history", JSON.stringify(newHistory));
    if (selectedHistory?.id === id) setSelectedHistory(null);
  };

  const tabStyle = (t) => ({ padding: "8px 20px", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", border: "none", cursor: "pointer", borderBottom: tab === t ? `2px solid ${C.ink}` : "2px solid transparent", background: "transparent", color: tab === t ? C.ink : C.muted });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", display: "flex", flexDirection: "column" }}>
{/* ローディングオーバーレイ */}
      {overlayMessage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.15)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 40 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 36px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", maxWidth: 360, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e5e5e0", borderTop: `3px solid ${overlayMessage.includes("改善") ? "#8c5e1a" : "#2d6a30"}`, borderRadius: "50%", flexShrink: 0, animation: "spin 1s linear infinite" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a14", marginBottom: 2 }}>{overlayMessage}</div>
              <div style={{ fontSize: 13, color: "#78716c" }}>しばらくお待ちください</div>
            </div>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showWelcome && <WelcomeModal session={session} onClose={() => setShowWelcome(false)} onShowPricing={() => setShowPricing(true)} />}

      <Header
        onShowPricing={() => setShowPricing(true)}
        currentSiteUrl={url?.startsWith("http") ? url : (currentInput?.startsWith("http") ? currentInput : null)}
        currentSiteId={siteId}
        phase={phase}
        canAccessBansou={isPro || chatTickets > 0}
        onSwitchToAnalysis={() => setViewOverride("analysis")}
        onSwitchToAction={() => { if (strategyConfirmed) setViewOverride(null); }}
        onConfirmStrategy={currentResult && (isPro || chatTickets > 0) ? confirmStrategy : null}
      />


      <div style={{ display: "grid", gridTemplateColumns: sidebarOpen ? (phase !== "input" ? `240px 1fr ${chatWidth}px` : "240px 1fr") : (phase !== "input" ? `1fr ${chatWidth}px` : "1fr"), flex: 1, position: "relative" }}>
        {/* サイドバー */}
        {sidebarOpen && (
  <div id="sidebar" style={{ borderRight: `1px solid ${C.border}`, background: phase === "action" ? C.phase2 : C.phase1, display: "flex", flexDirection: "column", color: "#fff", minHeight: "calc(100vh - 60px)" }}>
            {/* フェーズヘッダー */}
            <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                {phase === "action" ? "STEP 2" : "STEP 1"}
              </div>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {phase === "action" ? "伴走フェーズ" : "分析フェーズ"}
              </div>
            </div>

            {/* フェーズ別サイドバーコンテンツ */}
            {phase === "action" ? (
              <>
                {/* 確定戦略サマリー */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>確定戦略</div>
                  <div style={{ fontSize: 11, color: "#fff", lineHeight: 1.5 }}>{currentResult?.strategy_message?.message?.slice(0, 60) || "（未設定）"}</div>
                </div>
                {/* 施策ナビ */}
                <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
                  {threads.map(t => (
                    <div key={t.id}>
                      <div onClick={() => selectTheme(t.id)}
                        style={{ padding: "8px 14px", cursor: "pointer", fontSize: 18, color: "#fff", background: activeThemeId === t.id ? "rgba(255,255,255,0.15)" : "transparent", display: "flex", alignItems: "center", gap: 8, borderLeft: activeThemeId === t.id ? "3px solid #fff" : "3px solid transparent", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
                        <span style={{ fontSize: 18 }}>{t.icon}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                      </div>
                      {/* サブチャット一覧（施策展開時） */}
                      {activeThemeId === t.id && themeChats[t.id] && (
                        <div style={{ paddingLeft: 24 }}>
                          {themeChats[t.id].map(chat => (
                            <div key={chat.id} onClick={() => setActiveChatId(chat.id)}
                              style={{ padding: "6px 10px", cursor: "pointer", fontSize: 16, color: activeChatId === chat.id ? "#fff" : "rgba(255,255,255,0.6)", background: activeChatId === chat.id ? "rgba(255,255,255,0.1)" : "transparent", borderRadius: 3, marginBottom: 1, display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
                              {activeChatId === chat.id && <span style={{ fontSize: 8, color: "#6db3f8" }}>●</span>}
                              <span>{chat.label}</span>
                            </div>
                          ))}
                          <div onClick={() => addSubChat(t.id)}
                            style={{ padding: "6px 10px", cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.4)", fontFamily: "system-ui, sans-serif" }}>
                            + チャット追加
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* 施策追加・リセット */}
                <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", gap: 6 }}>
                  <button onClick={() => { const label = prompt("施策名を入力してください"); if (label?.trim()) { const newThread = { id: `custom_${Date.now()}`, label: label.trim(), icon: "💬", preset: false }; setThreads(prev => [...prev, newThread]); selectTheme(newThread.id); } }}
                    style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 3, color: "#fff", cursor: "pointer", fontSize: 13, padding: "8px" }}>+ 施策</button>
                  <button onClick={() => {
                    Object.values(themeChats).flat().forEach(c => localStorage.removeItem(`ab3c_thread_${c.id}`));
                    threads.forEach(t => localStorage.removeItem(`ab3c_thread_${t.id}`));
                    setThemeChats({});
                    setActiveThemeId(null);
                    setActiveChatId(null);
                  }}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 3, color: "#fff", cursor: "pointer", fontSize: 10, padding: "6px 10px" }}>↻ リセット</button>
                </div>
              </>
            ) : (
              <>
                {/* 分析履歴 */}
                <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>分析履歴</span>
                  <button onClick={reset} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "3px 8px" }}>+ 新規</button>
                </div>
              </>
            )}

            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* サイドバーコンテンツ（フェーズ別に上で表示済み） */}
            </div>

            {/* サイドバートグルボタン */}
            <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 10, padding: 0 }}>◀ 閉じる</button>
            </div>
          </div>
        )}
        {/* サイドバー閉じ時の開くボタン */}
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} style={{ position: "fixed", left: 0, top: 70, zIndex: 100, background: C.ink, border: "none", borderRadius: "0 4px 4px 0", padding: "8px 6px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14 }}>▶</button>
        )}
        <div ref={mainContentRef} style={{ flex: 1, padding: "0", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "32px 24px 80px", maxWidth: 900, flex: 1 }}>
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
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 2 }}>URLで分析</div>
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
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 2 }}>テキストで入力</div>
      <div style={{ fontSize: 16, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>事業概要を自由に記述</div>
    </button>
  </div>

 {/* 入力エリア */}
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0 0 8px 8px", padding: "20px 28px 28px", boxShadow: `2px 2px 0 ${C.border}` }}>
    {tab === "text" ? (
      <>
        <label style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, color: C.muted, display: "block", marginBottom: 10 }}>事業の概要を入力してください</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) analyze(); }}
          placeholder="例：地元農家と提携した無農薬野菜の定期宅配サービスです。週1回のボックス配送で旬の野菜を10〜12品目お届け。産地直送・中間業者なし、レシピカードも同封。"
          style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.8, padding: "14px 16px", resize: "vertical", minHeight: 120, outline: "none", boxSizing: "border-box" }} />
      </>
    ) : (
      <>
        <label style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, color: C.muted, display: "block", marginBottom: 10 }}>分析したいウェブサイトのURLを入力してください</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) analyze(); }}
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
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink }}>初めての方へ</div>
        <div style={{ fontSize: 16, color: C.muted, marginTop: 2, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>使い方・入力方法・活用法</div>
      </div>
    </a>
    <a href="/about" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", textDecoration: "none", color: C.ink }}>
      <span style={{ fontSize: 24 }}>📖</span>
      <div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink }}>AB3C分析とは</div>
        <div style={{ fontSize: 16, color: C.muted, marginTop: 2, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>フレームワークの詳細</div>
      </div>
    </a>
</div>
)}

{!currentResult && !loading && (
  <div style={{ marginTop: 40, padding: "32px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 24 }}>戦略大臣 使い方</div>
    
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 10, borderLeft: `3px solid ${C.A}`, paddingLeft: 12 }}>AB3C分析とは</div>
      <p style={{ fontSize: 16, lineHeight: 1.9, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>AB3C分析は、「選ばれる理由」を明らかにする事業戦略フレームワークです。Benefit（お客様が求める価値）・Advantage（競合との好ましい違い）・3C（Customer・Competitor・Company）を構造化することで、事業にかかわるすべての人の共通言語をつくります。</p>
    </div>

    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 10, borderLeft: `3px solid ${C.A}`, paddingLeft: 12 }}>2つの使い方</div>
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
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 10, borderLeft: `3px solid ${C.A}`, paddingLeft: 12 }}>分析結果の活用方法</div>
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
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>分析はゴールではありません</div>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.75)", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>戦略をクリアにし、関係者全員が同じ設計図を見られる「共通言語」をつくることが戦略大臣の役割です。</p>
    </div>
  </div>
)}
{loading && <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 16 }}>AIがAB3Cを分析中です…</div>}
          {currentResult && phase !== "action" && (
            <div>
             <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
  <button onClick={reset} style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "10px 20px" }}>
    ← 新規分析
  </button>
  {currentInput && !currentInput.startsWith("http") && (
    <button onClick={() => editAndReanalyze(currentInput)} style={{ background: "#555", border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
      ✏️ このテキストを修正して再分析
    </button>
  )}
  <button onClick={() => shareResult(currentInput || "", currentResult)} disabled={sharing} style={{ background: "#555", border: "none", borderRadius: 2, color: "#fff", cursor: sharing ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
    {sharing ? "作成中…" : "🔗 シェアＵＲＬを発行"}
  </button>
  <button
    onClick={() => { window.print(); }}
    style={{ background: "#555", border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}
  >
🖨️ 印刷・ＰＤＦ保存
  </button>
</div>
           
{(currentInput || chatSummaries.length > 0) && (
  <div style={{ background: "#e8e8e8", border: `1px solid ${C.border}`, borderRadius: 4, padding: "14px 16px", marginBottom: 16 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>分析情報</div>
    <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.6 }}>
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
  <ResultView d={currentResult} onChat={(topic) => chatSendTopicRef.current?.(topic)} changedPaths={changedPaths} />
  {currentInput?.startsWith("http") && improveLoading && !improveResult && (
    <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 16, borderTop: `3px solid ${C.ink}`, marginTop: 40 }}>
      ウェブサイト改善レポートを生成中です…
    </div>
  )}
  {currentInput?.startsWith("http") && improveResult && (
    <div id="improve-area" style={{ marginTop: 48 }}>
      <div style={{ background: C.ink, borderRadius: 6, padding: "24px 28px", marginBottom: 28 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>WEBSITE IMPROVEMENT REPORT</div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>ウェブサイト改善レポート</div>
      </div>
      {[
        { key: "contents", label: "追加すべきコンテンツ", color: C.A },
        { key: "design", label: "改善すべきデザイン・ビジュアル", color: C.B },
        { key: "structure", label: "サイト構造の改善", color: C.C },
      ].map(section => (
        <div key={section.key} style={{ marginBottom: 28 }}>
          <Card color={section.color} title={section.label} onChat={() => chatSendTopicRef.current?.(`ウェブサイト改善レポートの「${section.label}」について詳しく教えてください`)}>
          {improveResult[section.key]?.map((item, i) => (
            <div key={i} style={{ background: "#f8f8f6", border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px", marginBottom: 10, position: "relative" }} {...hoverShow}>
              <ChatBtn onClick={() => chatSendTopicRef.current?.(`改善レポート「${item.title?.slice(0,30)}」について詳しく教えてください`)} abs />
              <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{i + 1}. {item.title}</div>
              <div style={{ fontSize: 16, color: C.muted, lineHeight: 1.75, marginBottom: 6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>理由：</b>{item.reason}</div>
              <div style={{ fontSize: 16, color: C.muted, lineHeight: 1.75, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>実装例：</b>{item.example}</div>
            </div>
          ))
          }</Card>
        </div>
      ))}
    </div>
  )}
</div>

{currentInput?.startsWith("http") && !improveResult && (
  <div style={{ marginTop: 32 }}>
    {(
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
          } catch (e) {
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

{/* 分析チャットは右カラムに配置 */}

{/* 伴走フェーズのコンテンツは分析結果ブロックの外に移動済み */}
            </div>
          )}
{/* 伴走フェーズ（分析結果ブロックの外） */}
{phase === "action" && currentResult && (
  <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 180px)" }}>
    {/* 戦略メッセージ */}
    <div style={{ padding: "20px 24px", background: C.phase1, flexShrink: 0 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>戦略メッセージ = Benefit + Advantage</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.6, fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
        {currentResult?.strategy_message?.message || ""}
      </div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontFamily: "system-ui, sans-serif", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 8 }}>
        <b>Benefit：</b>{currentResult?.strategy_message?.benefit_part || ""}<br />
        <b>Advantage：</b>{currentResult?.strategy_message?.advantage_part || ""}
      </div>
    </div>
    {/* チャット */}
    <div style={{ flex: 1, overflow: "hidden" }}>
      {activeChatId ? (
        <ThreadChat key={activeChatId} threadId={activeChatId} themeId={activeThemeId} chatDescription={themeChats[activeThemeId]?.find(c => c.id === activeChatId)?.description} analysisResult={currentResult} isPro={isPro || chatTickets > 0 || trialChats > 0} onAddAction={addAction}
          onGenerateRecruit={async (msgs) => {
            setRecruitLoading(true);
            try { const chatHistory = msgs.filter(m => m.role === "user" || m.role === "assistant").map(m => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`).join("\n"); const res = await fetch("/api/recruit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysisResult: currentResult, chatHistory }) }); const data = await res.json(); if (data.error) { alert(data.error); } else { setRecruitResult(data); } } catch (e) { alert("エラーが発生しました。"); } finally { setRecruitLoading(false); }
          }} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 16, fontFamily: "system-ui, sans-serif" }}>
          ← サイドバーから施策を選択してください
        </div>
      )}
    </div>
  </div>
)}
          <footer style={{ textAlign: "center", marginTop: 60, paddingTop: 20, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 32 }} />
              <span style={{ fontSize: 16, color: C.ink, fontWeight: 600 }}>一般社団法人デジタル経営革新協会</span>
            </div>
            <div style={{ marginBottom: 8, fontSize: 16 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted, textDecoration: "underline" }}>ab3c.jp</a> · Powered by Claude AI</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: 16 }}>
              <a href="/terms" style={{ color: C.muted, textDecoration: "underline" }}>利用規約</a>
              <span style={{ color: C.border }}>|</span>
              <a href="/privacy" style={{ color: C.muted, textDecoration: "underline" }}>プライバシーポリシー</a>
              <span style={{ color: C.border }}>|</span>
              <a href="/legal" style={{ color: C.muted, textDecoration: "underline" }}>特定商取引法</a>
            </div>
          </footer>
          </div>{/* end inner padding wrapper */}
        </div>{/* end main content column */}

        {/* 右カラム: チャットパネル（リサイズ可能） */}
        {phase !== "input" && (
            <div id="chat-column" style={{ position: "relative", borderLeft: `1px solid ${C.border}`, background: phase === "action" ? C.phase2Bg : C.phase1Bg, display: "flex", flexDirection: "column", height: "calc(100vh - " + headerHeight + "px)", position: "sticky", top: headerHeight, zIndex: 100 }}>
              {/* リサイズハンドル */}
              <div
                onMouseDown={function() {
                  chatResizing.current = true;
                  var handleMove = function(e) {
                    if (!chatResizing.current) return;
                    var newWidth = window.innerWidth - e.clientX;
                    if (newWidth >= 350 && newWidth <= 800) setChatWidth(newWidth);
                  };
                  var handleUp = function() { chatResizing.current = false; document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
                  document.addEventListener("mousemove", handleMove);
                  document.addEventListener("mouseup", handleUp);
                  document.body.style.cursor = "col-resize";
                  document.body.style.userSelect = "none";
                }}
                style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, cursor: "col-resize", background: "transparent", zIndex: 101 }}
                onMouseEnter={function(e) { e.currentTarget.style.background = C.phase1; }}
                onMouseLeave={function(e) { if (!chatResizing.current) e.currentTarget.style.background = "transparent"; }}
              />
              {/* チャットヘッダー */}
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: phase === "action" ? C.phase2 : C.phase1, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {phase === "action" ? "施策チャット" : "分析チャット"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>
                  {chatSummaries.length > 0 ? `（${chatSummaries.length}回反映済み）` : ""}
                </span>
              </div>

              {/* チャット履歴（開閉式） */}
              {phase === "analysis" && chatSummaries.length > 0 && (
                <div style={{ borderBottom: `1px solid ${C.border}`, background: "#f8f6f0" }}>
                  <div onClick={function() { setChatExpanded(!chatExpanded); }} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
                    <span>{chatExpanded ? "▼" : "▶"}</span>
                    <span>チャット履歴（{chatSummaries.length}件）</span>
                  </div>
                  {chatExpanded && (
                    <div style={{ padding: "0 14px 8px" }}>
                      {chatSummaries.map(function(s, i) {
                        return <div key={i} style={{ fontSize: 12, color: C.ink, padding: "4px 0", borderBottom: i < chatSummaries.length - 1 ? "1px solid " + C.border : "none" }}>#{i + 1} {typeof s === "string" ? s : JSON.stringify(s)}</div>;
                      })}
                    </div>
                  )}
                </div>
              )}

              {phase === "analysis" ? (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  <AnalysisChatPanel
                    isPro={isPro || chatTickets > 0 || trialChats > 0}
                    analysisResult={currentResult}
                    onSendTopic={chatSendTopicRef}
                    onReanalyze={function(newResult, summary) {
                      try {
                        var diff = diffResults(currentResult || {}, newResult);
                        setChangedPaths(diff);
                      } catch (e) { console.error("diff error:", e); }
                      setResult(newResult);
                      setCurrentResult(newResult);
                      setHistoryTitle(newResult?.strategy_message?.message || "");
                      setSelectedHistory(null);
                      if (summary) setChatSummaries(function(prev) { return [].concat(prev, [summary]); });
                      saveHistory(currentInput || "", newResult, newResult?.strategy_message?.message || "");
                      setTimeout(function() { setChangedPaths(new Set()); }, 10000);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onConfirmStrategy={(isPro || chatTickets > 0) ? confirmStrategy : null}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
                  施策を選択してください
                </div>
              )}
            </div>
        )}
      </div>{/* end grid */}
    </div>
  );
}
