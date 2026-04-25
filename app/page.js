"use client";
// Updated: 2025-04-07 - Force page rebuild
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PricingModal from "./components/PricingModal";
import ShadowMock from "./components/ShadowMock";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#ebebeb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#000000", muted: "#000000", highlight: "#fef3c7",
  phase1: "#0d9488", phase1Bg: "#a7e9e0",
  phase2: "#ea580c", phase2Bg: "#fed7aa",
};

// チェックポイントの判定アイコン。
// onClick を渡すとクリック可能なボタンとして描画され、ホバー時に円形背景＋拡大で
// 「これは飾りではなく押せる」と一目でわかるインタラクションを提供する。
const Badge = ({ status, onClick, title }) => {
  const map = { ok: { icon: "✅", label: "OK" }, warn: { icon: "⚠️", label: "注意" }, ng: { icon: "❌", label: "NG" } };
  const { icon, label } = map[status] || map.warn;
  if (!onClick) {
    return (
      <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title || "クリックで改善方法をチャットで相談"}
      aria-label={`${label}: ${title || "改善方法をチャットで相談"}`}
      style={{
        width: 42, height: 42, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, lineHeight: 1, padding: 0,
        background: "#f8f8f6",
        border: `2px dashed ${C.border}`,
        borderRadius: "50%",
        cursor: "pointer",
        transition: "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.borderColor = C.phase1;
        e.currentTarget.style.borderStyle = "solid";
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,148,136,0.25)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "#f8f8f6";
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.borderStyle = "dashed";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {icon}
    </button>
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

// 見出し横のヘルプアイコン（? をホバーするとフロート説明表示）
function HelpTip({ text }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", marginLeft: 6, verticalAlign: "middle" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: "50%",
          background: "#aaa", color: "#fff",
          fontSize: 11, fontWeight: 700,
          cursor: "help", userSelect: "none",
          fontFamily: "system-ui, sans-serif",
        }}
        aria-label="説明を表示"
      >?</span>
      {hover && (
        <span
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: "0",
            background: "#1a1a14", color: "#fff",
            fontSize: 13, lineHeight: 1.7, fontWeight: 400,
            padding: "10px 14px", borderRadius: 4,
            width: 300, maxWidth: "min(60vw, 360px)",
            zIndex: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif",
            textTransform: "none", letterSpacing: "normal", whiteSpace: "normal",
            pointerEvents: "none",
          }}
        >{text}</span>
      )}
    </span>
  );
}

const Card = ({ color, title, children, onChat, help }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 4, padding: "16px 18px", position: "relative" }} {...(onChat ? hoverShow : {})}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, letterSpacing: "0.1em", textTransform: "uppercase", color, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
      <span>{title}</span>
      {help && <HelpTip text={help} />}
    </div>
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

function UL({ items, onChatItem, checkable, checkedIndexes, onToggle }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  return (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => {
      const isChecked = !checkable || (checkedIndexes || []).includes(i);
      const isHovered = checkable && hoveredIdx === i;
      return (
     <li key={i}
       onMouseEnter={() => setHoveredIdx(i)}
       onMouseLeave={() => setHoveredIdx(-1)}
       style={{ fontSize: 16, lineHeight: 1.75, padding: checkable ? "6px 8px" : "5px 0 5px 16px", borderBottom: i < items.length - 1 ? `1px dashed ${C.border}` : "none", position: "relative", color: "#000000", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, opacity: checkable && !isChecked ? 0.45 : 1, background: isHovered ? "#f0f0ea" : "transparent", borderRadius: checkable ? 4 : 0, transition: "opacity 0.15s, background 0.15s" }}
       {...(onChatItem ? hoverShow : {})}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, cursor: checkable ? "pointer" : "default" }}>
          {checkable && (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle && onToggle(i)}
              style={{ marginTop: 4, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
            />
          )}
          {!checkable && <span style={{ position: "absolute", left: 0, color: C.muted }}>–</span>}
          <span style={{ flex: 1, textDecoration: checkable && !isChecked ? "line-through" : "none" }}>{linkify(item)}</span>
        </label>
        {onChatItem && <ChatBtn onClick={() => onChatItem(item)} />}
      </li>
      );
    })}
  </ul>
  );
}

const SectionLabel = ({ color, letter, jp, en, desc, onChat, help }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${C.border}`, position: "relative" }} {...(onChat ? hoverShow : {})}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 34, fontWeight: 700, color, lineHeight: 1, width: 56, flexShrink: 0 }}>{letter}</div>
    <div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{jp}</span>
        {help && <HelpTip text={help} />}
      </div>
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

// ハイライトスタイル（反映回数で色が変わる）
var HL_COLORS = [
  { background: "#fff3cd", borderLeft: "3px solid #ffc107", paddingLeft: 8 }, // 1回目: 黄色
  { background: "#d4edda", borderLeft: "3px solid #28a745", paddingLeft: 8 }, // 2回目: 緑
  { background: "#cce5ff", borderLeft: "3px solid #007bff", paddingLeft: 8 }, // 3回目: 青
  { background: "#f8d7da", borderLeft: "3px solid #dc3545", paddingLeft: 8 }, // 4回目: 赤
  { background: "#e2d9f3", borderLeft: "3px solid #6f42c1", paddingLeft: 8 }, // 5回目+: 紫
];

const SubLabel = ({ color, text, onChat, help }) => (
  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.1em", color, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, position: "relative" }} {...(onChat ? hoverShow : {})}>
    <span>{text}</span>
    {help && <HelpTip text={help} />}
    {onChat && <ChatBtn onClick={onChat} />}
  </div>
);

function ResultView({ d, onChat, changedPaths, refineSelection, onRefineToggle }) {
  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };
  const q = (section, detail) => onChat && (() => onChat(`${section}の「${(detail||"").slice(0,30)}」について詳しく教えてください`));
  const qs = (section) => onChat && (() => onChat(`${section}について詳しく教えてください`));
  var cp = changedPaths || new Map();
  var hl = function(path) { try { if (cp.has && cp.has(path)) { var n = cp.get(path); return HL_COLORS[Math.min(n - 1, HL_COLORS.length - 1)]; } return {}; } catch (e) { return {}; } };
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.B} letter="B" jp="Benefit（お客様が求める価値）" en="Needs → Wants" desc={`核心：${d.benefit.core}`} onChat={qs("Benefit（お客様が求める価値）")} help="お客様がその商品・サービスを通じて得られる価値です。ニーズ（まだ曖昧な欠乏感）とウォンツ（具体的な欲求）の両面から捉えます。" />
        <div style={g2}>
          <div style={hl("benefit.needs")}><Card color={C.B} title="ニーズ（欠乏感・曖昧な欲求）" onChat={qs("ニーズ")} help="お客様がまだ言語化できていない、漠然とした欠乏感や欲求。『何かを変えたい』『もっとこうしたい』という状態です。チェックを外して『絞り込んで再分析』すると、残した項目を軸に戦略を研ぎ澄ませます。"><UL items={d.benefit.needs} onChatItem={onChat && ((item) => onChat(`ニーズの「${item.slice(0,30)}」について詳しく教えてください`))} checkable={!!onRefineToggle} checkedIndexes={refineSelection?.needs} onToggle={onRefineToggle && ((i) => onRefineToggle("needs", i))} /></Card></div>
          <div style={hl("benefit.wants")}><Card color={C.B} title="ウォンツ（具体的欲求）" onChat={qs("ウォンツ")} help="具体的に欲しいものが決まっている欲求。『これが欲しい』『これを買いたい』と明確に意識できる状態です。"><UL items={d.benefit.wants} onChatItem={onChat && ((item) => onChat(`ウォンツの「${item.slice(0,30)}」について詳しく教えてください`))} checkable={!!onRefineToggle} checkedIndexes={refineSelection?.wants} onToggle={onRefineToggle && ((i) => onRefineToggle("wants", i))} /></Card></div>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.A} letter="A" jp="Advantage（差別的優位点・好ましい違い）" en="競合より選ばれる理由" onChat={qs("Advantage（差別的優位点）")} help="競合と比較したとき『こちらのほうがいい』と思ってもらえる違い。単なる違いではなく、お客様にとって好ましく、真似されにくい自社の強みに根差していることが重要です。" />
        <div style={g3}>
          <div style={hl("advantage.what")}><Card color={C.A} title="アドバンテージ" onChat={q("アドバンテージ", d.advantage.what)} help="差別的優位点の内容を一言で表現したもの。"><div style={{ fontSize: 16, fontWeight: 700, color: C.A, lineHeight: 1.6 }}>{d.advantage.what}</div></Card></div>
          <div style={hl("advantage.why_good")}><Card color={C.A} title="なぜ好ましいのか" onChat={q("なぜ好ましいのか", d.advantage.why_good)} help="競合と比較してなぜお客様にとって好ましい違いなのかを示します。"><p style={{ fontSize: 16, lineHeight: 1.7, color: "#000000" }}>{d.advantage.why_good}</p></Card></div>
          <div style={hl("advantage.why_hard_to_copy")}><Card color={C.A} title="なぜ真似されにくいか" onChat={q("なぜ真似されにくいか", d.advantage.why_hard_to_copy)} help="自社の強みに根差し、競合が簡単には模倣できない理由を示します。"><p style={{ fontSize: 16, lineHeight: 1.7, color: "#000000" }}>{d.advantage.why_hard_to_copy}</p></Card></div>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.C} letter="3C" jp="3C分析" en="Customer · Competitor · Company" onChat={qs("3C分析")} help="Customer（お客様）・Competitor（競合）・Company（自社）の3つの観点から事業環境を分析するフレームワーク。" />
        <SubLabel color={C.C} text="Customer（お客様）" onChat={qs("Customer（お客様）分析")} help="ターゲット顧客の絞り込み。誰にとってのオンリーワンか、ニーズ段階かウォンツ段階か、切り捨てたお客様は誰かを明確にします。" />
        <div style={{ ...g2, marginBottom: 14 }}>
          <div style={hl("three_c.customer.target")}><Card color={C.C} title="ターゲット" onChat={q("ターゲット", d.three_c.customer.target)} help="主役となるお客様像。プロフィール項目のチェックを外して絞り込み再分析すると、特定ユーザーに研ぎ澄ませた戦略に変わります。">
            <div style={{ fontSize: 16, fontWeight: 700, color: C.C, marginBottom: 12 }}>{d.three_c.customer.target}</div>
            <UL items={d.three_c.customer.profile} onChatItem={onChat && ((item) => onChat(`ターゲットプロフィール「${item.slice(0,30)}」について詳しく教えてください`))} checkable={!!onRefineToggle} checkedIndexes={refineSelection?.profile} onToggle={onRefineToggle && ((i) => onRefineToggle("profile", i))} />
          </Card></div>
          <div style={hl("three_c.customer.stage")}><Card color={C.C} title="アプローチ段階 · 切り捨て" onChat={qs("アプローチ段階と切り捨て")} help="ターゲットが『ニーズ段階』（欠乏感・曖昧）か『ウォンツ段階』（具体的欲求）か。切り捨てたお客様（戦略的に対象外とした層）も明確化します。">
            <p style={{ fontSize: 16, lineHeight: 1.65, marginBottom: 12, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>段階：</b>{d.three_c.customer.stage}</p>
            <p style={{ fontSize: 16, lineHeight: 1.65 }}><b>切り捨てたお客様：</b>{d.three_c.customer.cutoff}</p>
          </Card></div>
        </div>
        {d.three_c.customer.market && (
          <div style={{ marginBottom: 14 }}>
            <Card color={C.C} title="市場規模" onChat={qs("市場規模")} help="SAM（獲得可能な最大市場）・SOM（実際に狙える市場）・成長率/トレンドから事業機会を定量化。中小企業は SOM が年商規模を上回れば十分成立します。">
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
            <SubLabel color={C.C} text="Competitor（競合）" onChat={qs("競合分析")} help="直接競合（同業）だけでなく、同じニーズを満たす異業種競合も含めて検討。『お客様がどれと比較するか』の視点で洗い出します。" />
            <Card color={C.C} title="直接競合 / 異業種競合" onChat={qs("競合について")}>
              <UL items={[...d.three_c.competitor.direct, ...d.three_c.competitor.indirect.map(i => `↳ ${i}`)]} onChatItem={onChat && ((item) => onChat(`競合「${item.replace("↳ ","").slice(0,30)}」について詳しく教えてください`))} />
            </Card>
          </div>
          <div>
            <SubLabel color={C.C} text="Company（自社）" onChat={qs("自社分析")} help="自社の具体的強み・その強みを生む構造的特徴・経営者の価値観/パッションの3層で掘り下げます。価値観の違いが最も真似されにくい。" />
            <Card color={C.C} title="強み · 構造 · パッション" onChat={qs("自社の強み・構造・パッション")}>
              <UL items={d.three_c.company.strength} onChatItem={onChat && ((item) => onChat(`自社の強み「${item.slice(0,30)}」について詳しく教えてください`))} />
              <p style={{ fontSize: 16, color: C.muted, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>構造：{d.three_c.company.structure}</p>
              <p style={{ fontSize: 16, color: C.muted, marginTop: 6 }}>💡 {d.three_c.company.passion}</p></Card>
          </div>
        </div>
      </div>
      <Divider />
      <div style={{ background: C.phase1, borderRadius: 4, padding: "28px 32px", marginBottom: 28, position: "relative", ...(cp.has && cp.has("strategy_message.message") ? { boxShadow: "0 0 0 3px " + (["#ffc107","#28a745","#007bff","#dc3545","#6f42c1"][Math.min((cp.get("strategy_message.message")||1)-1, 4)]) } : {}) }} {...(onChat ? hoverShow : {})}>
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
      <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", lineHeight: 1.6, position: "relative" }} {...(onChat ? hoverShow : {})}>
        <Badge
          status={cp.status}
          onClick={onChat ? () => onChat(`チェックポイント「${cp.label}」の改善方法を教えてください。現在の評価: ${cp.comment}`) : null}
          title={onChat ? `「${cp.label}」の改善方法をチャットで相談` : null}
        />
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
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: C.A, marginBottom: 12, letterSpacing: "0.1em" }}>WHAT IS 戦略指南 AI</div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.ink, margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                戦略指南 AIは、300万円の事業戦略策定サービスをボタン一つで可能にしたツールです。
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.ink, margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                生成AIに戦略を相談すると都度都度の対処療法的な回答になりがちです。先日はこう言っていたのに今日はこんなふうに言っている——矛盾した回答に戸惑うことがありませんか？
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: C.ink, margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                戦略指南 AIでは環境調査をした上で戦略を固めることで、その後のマーケティングの軸が定まり、一貫性のある経営戦略の実行が可能になります。
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
                style={{ background: "#f0f4ff", border: `2px solid #1a6fd4`, borderRadius: 8, cursor: "pointer", padding: "18px 24px", textAlign: "left", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.08)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(26,111,212,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.A, fontWeight: 700, marginBottom: 6 }}>SELF USE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>自社・自分のビジネスを分析したい</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>自社のWebサイトや事業戦略をAB3Cで整理し、経営判断に活かしたい。</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "#1a6fd4", fontWeight: 700, fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap" }}>こちらを選ぶ</div>
                  <div style={{ fontSize: 24, color: "#fff", background: "#1a6fd4", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, lineHeight: 1 }}>→</div>
                </div>
              </button>
              <button
                onClick={() => handleSelect("agency")}
                style={{ background: "#fff8f0", border: `2px solid #FF6B00`, borderRadius: 8, cursor: "pointer", padding: "18px 24px", textAlign: "left", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.08)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(255,107,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#FF6B00", fontWeight: 700, marginBottom: 6 }}>AGENCY USE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>クライアントへの戦略支援に活用したい</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>Web制作・コンサル・税理士など、クライアントへの提案・伴走サービスとして使いたい。</div>
                  <div style={{ fontSize: 12, color: "#FF6B00", marginTop: 8, fontFamily: "system-ui, sans-serif" }}>※ クライアント提供向けのサポート情報をお届けします。</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "#FF6B00", fontWeight: 700, fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap" }}>こちらを選ぶ</div>
                  <div style={{ fontSize: 24, color: "#fff", background: "#FF6B00", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, lineHeight: 1 }}>→</div>
                </div>
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
                {purpose === "agency" ? "戦略診断を始める" : "さっそく使ってみる"}
              </button>
              <a href="/pricing" onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, textDecoration: "none", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "12px 24px", color: C.muted, display: "inline-block" }}>
                プランを見る
              </a>
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
      setMessages([{ role: "assistant", content: "より詳細な説明が欲しい、分析内容に意見がある、変更したい、という場合は声をかけてください。\n\n説明が欲しい場合は、分析結果の項目タイトル横にある [[CHAT_ICON]] アイコンをクリックすると、その項目についての質問を送れます。" }]);
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
            }}>{m.content.includes("[[CHAT_ICON]]")
              ? m.content.split("[[CHAT_ICON]]").map((part, idx, arr) => (
                  <span key={idx}>
                    {part}
                    {idx < arr.length - 1 && (
                      <span style={{ display: "inline-flex", verticalAlign: "middle", background: C.phase1, width: 20, height: 20, borderRadius: 4, alignItems: "center", justifyContent: "center", margin: "0 2px" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/></svg>
                      </span>
                    )}
                  </span>
                ))
              : m.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 13, color: C.muted, padding: "8px 14px" }}>考え中...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, background: C.phase1Bg }}>
        {/* 1. 入力欄 */}
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder="分析結果について相談する..."
          rows={3}
          style={{ width: "100%", background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "system-ui, sans-serif", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
        />
        {/* 2. チャットに送信（黒：ニュートラルな日常操作） */}
        <button onClick={send} disabled={loading}
          style={{ width: "100%", marginTop: 8, background: loading ? C.muted : C.ink, border: "none", borderRadius: 4, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "10px 16px" }}>
          💬 チャットに送信
        </button>
        {/* 3. この会話内容を分析に反映する（ティール：戦略策定フェーズ色） */}
        {messages.length >= 3 && (
          <button onClick={reanalyze} disabled={loading}
            style={{ width: "100%", marginTop: 10, background: loading ? C.muted : C.phase1, border: "none", borderRadius: 6, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, padding: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            {loading ? "← 再分析中..." : "← この会話内容を分析に反映する"}
          </button>
        )}
        {/* 4. 戦略を確定 */}
        {onConfirmStrategy && (
          <button onClick={onConfirmStrategy}
            style={{ width: "100%", marginTop: 12, background: C.phase2, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            戦略を確定する →
          </button>
        )}
      </div>
    </div>
  );
}
function ThreadChat({ threadId, themeId, themeLabel, chatDescription, analysisResult, isPro, onAddAction, onGenerateRecruit, siteId: threadSiteId }) {
  const effectiveThemeId = themeId || threadId;
  const displayThemeName = themeLabel || effectiveThemeId;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizingIdx, setSummarizingIdx] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initialized = useRef(false);

  // メッセージ保存（初期化完了後のみ、準備中は保存しない）
  useEffect(() => {
    if (initialized.current && messages.length > 0 && !messages[0]?.content?.includes("準備中")) {
      try { localStorage.setItem(`ab3c_thread_${threadSiteId || "default"}_${threadId}`, JSON.stringify(messages)); } catch (e) {}
    }
  }, [messages, threadId]);

  // マウント時にロードまたは生成（key={threadId}によるリマウントで実行）
  useEffect(() => {
    initialized.current = false;
    const controller = new AbortController();
    const key = `ab3c_thread_${threadSiteId || "default"}_${threadId}`;
    try {
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : null;
      const hasPreparing = parsed && parsed.some(m => typeof m?.content === "string" && m.content.includes("準備中"));
      if (parsed && parsed.length > 0 && !hasPreparing) {
        setMessages(parsed);
        initialized.current = true;
      } else {
        // 初回アドバイス生成（全体アドバイス or サブチャット概要ベース）
        const isSubChat = !!chatDescription;
        const userPrompt = isSubChat
          ? `「${displayThemeName}」テーマの中で、以下について相談したいです:\n\n${chatDescription}\n\n戦略分析結果をもとに、この内容について具体的なアドバイスをお願いします。`
          : `「${displayThemeName}」テーマの初回アドバイスをお願いします。戦略分析結果をもとに、このテーマで最初に取り組むべきことを具体的に提案してください。`;
        setMessages([
          { role: "user", content: userPrompt, hidden: true },
          { role: "assistant", content: isSubChat ? `「${chatDescription}」について準備中...` : `「${displayThemeName}」のアドバイスを準備中...` }
        ]);
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
            setMessages([
              { role: "user", content: userPrompt, hidden: true },
              { role: "assistant", content: data.message || "このテーマについて相談できます。" }
            ]);
            initialized.current = true;
          }
        }).catch(err => {
          if (!controller.signal.aborted) {
            setMessages([
              { role: "user", content: userPrompt, hidden: true },
              { role: "assistant", content: "このテーマについて相談できます。何でも聞いてください！" }
            ]);
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
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), userMessage],
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
      {/* 補助金テーマの常設免責表示 */}
      {effectiveThemeId === "subsidy" && (
        <div style={{ flexShrink: 0, background: "#fffbe5", borderBottom: "1px solid #f0d98a", padding: "8px 12px", fontSize: 11, lineHeight: 1.6, color: "#1a1a14", fontFamily: "system-ui, sans-serif" }}>
          <strong>⚠️ 構想整理・記入のヒント提供のみ</strong>　本サービスは申請書の作成代行を行うものではありません。最終的な記載内容はご自身でご確認ください。申請書類の作成代行が必要な場合は行政書士等の専門家へ。
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, background: C.phase2Bg }}>
        {messages.map((m, i) => {
          if (m.hidden) return null;
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
                <button
                  disabled={summarizingIdx !== null}
                  onClick={async () => {
                    setSummarizingIdx(i);
                    try {
                      const convoForApi = messages
                        .slice(0, i + 1)
                        .filter(msg => !msg.hidden)
                        .map(msg => ({ role: msg.role, content: (msg.content || "").replace(/\[ACTION:\s*.+?\]/g, "").trim() }));
                      const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ actionSummary: true, actionTitle: actionMatch[1], messages: convoForApi, analysisResult }),
                      });
                      const data = await res.json();
                      const detail = data.summary && data.summary.trim() ? data.summary : displayContent;
                      onAddAction(actionMatch[1], detail, threadId);
                      setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, actionRegistered: true } : msg));
                    } catch (e) {
                      onAddAction(actionMatch[1], displayContent, threadId);
                      setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, actionRegistered: true } : msg));
                    } finally {
                      setSummarizingIdx(null);
                    }
                  }}
                  style={{ background: summarizingIdx === i ? C.muted : C.phase2, border: "none", borderRadius: 4, color: "#fff", cursor: summarizingIdx !== null ? "not-allowed" : "pointer", fontSize: 12, padding: "6px 14px", fontFamily: "system-ui, sans-serif" }}>
                  {summarizingIdx === i ? "まとめを生成中..." : `✓ 「${actionMatch[1]}」をアクションに登録`}
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
      {effectiveThemeId === "recruit" && messages.filter(m => m.role === "user" && !m.hidden).length >= 3 && onGenerateRecruit && (
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
          style={{ marginTop: 8, width: "100%", background: loading || !isPro ? C.muted : C.ink, border: "none", borderRadius: 4, color: "#fff", cursor: loading || !isPro ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "10px 16px" }}>
          💬 チャットに送信
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareExpiresAt, setShareExpiresAt] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [historyTitle, setHistoryTitle] = useState("");
  const [sharing, setSharing] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
const [showWelcome, setShowWelcome] = useState(false);
const [isPro, setIsPro] = useState(false);
const [chatTickets, setChatTickets] = useState(0);
const [trialChats, setTrialChats] = useState(0);
// 選択中プラン（ヘッダーのプラン切り替えと連動）
const [activePlans, setActivePlans] = useState([]);
const [activePlanId, setActivePlanId] = useState(null);
  const [improveResult, setImproveResult] = useState(null);
  const [visualMock, setVisualMock] = useState(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [refineSelection, setRefineSelection] = useState({ needs: [], wants: [], profile: [] });
  const [refining, setRefining] = useState(false);
  const [refineToast, setRefineToast] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
const [currentInput, setCurrentInput] = useState("");
const [overlayMessage, setOverlayMessage] = useState(null);
const [changedPaths, setChangedPaths] = useState(new Map());
const [chatWidth, setChatWidth] = useState(500);
const [chatMinimized, setChatMinimized] = useState(false);
const chatResizing = useRef(false);
const [confirmHistory, setConfirmHistory] = useState([]);
const [improveLoading, setImproveLoading] = useState(false);
const [siteId, setSiteId] = useState(null);
// ⓪新規戦略診断クリック時に「前のサイト」を記憶しておき、①戦略策定タブから戻れるようにする
const [previousSiteId, setPreviousSiteId] = useState(null);
const [previousSiteUrl, setPreviousSiteUrl] = useState(null);
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
  // 確定済みサイトを開いた場合も既定は「戦略策定」（analysis）。
  // 確定直後の自動遷移は confirmStrategy() で setViewOverride("action") を明示する。
  const [viewOverride, setViewOverride] = useState(null);
  const derivedPhase = !currentResult ? "input" : "analysis";
  const phase = viewOverride || derivedPhase;

  const [headerHeight, setHeaderHeight] = useState(120);
  useEffect(() => {
    const header = document.querySelector("#app-header");
    if (header) setHeaderHeight(header.offsetHeight);
  }, []);

  // 分析結果・改善レポート・ビジュアルが変わったらlocalStorage/sessionStorageに自動保存
  // sessionStorage はページ内遷移後や決済画面からの戻りでの復元用
  useEffect(function() {
    if (currentResult && currentInput) {
      try {
        var existing = {};
        try { existing = JSON.parse(localStorage.getItem("ab3c_analysis_" + currentInput) || "{}"); } catch (e) {}
        var savedAt = analyzedAt || existing.timestamp || Date.now();
        var toSave = { result: currentResult, improve: improveResult || existing.improve || null, visual: visualMock || existing.visual || null, timestamp: savedAt };
        localStorage.setItem("ab3c_analysis_" + currentInput, JSON.stringify(toSave));
        sessionStorage.setItem("ab3c_last_analysis", JSON.stringify({
          input: currentInput,
          siteId: siteId || null,
          result: currentResult,
          improveResult: improveResult || null,
          visualMock: visualMock || null,
          timestamp: savedAt,
        }));
      } catch (e) {}
    }
  }, [currentResult, improveResult, visualMock, currentInput, analyzedAt]);

  // 直前の分析結果を復元（ページ内遷移からの戻り・決済画面からの戻り対応）
  // URLパラメータに site_id / url がある場合は、それと一致する場合のみ復元（別サイトのデータ復元バグ防止）
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      const sidParam = params.get("site_id");
      const saved = sessionStorage.getItem("ab3c_last_analysis");
      if (!saved) return;
      const data = JSON.parse(saved);
      // 24時間以内の分析結果のみ復元
      if (!data.timestamp || Date.now() - data.timestamp >= 24 * 3600 * 1000) return;
      if (!data.result || !data.input) return;
      // URLパラメータがある場合、sessionStorage の input と一致するかチェック
      // 不一致ならその URL の新しい分析として扱うため、復元しない
      if (urlParam) {
        const norm = u => (u || "").replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
        if (norm(data.input) !== norm(urlParam)) return;
      } else if (sidParam && data.siteId && data.siteId !== sidParam) {
        return;
      }
      setResult(data.result);
      setCurrentResult(data.result);
      setCurrentInput(data.input);
      setAnalyzedAt(data.timestamp);
      if (data.input.startsWith("http")) { setUrl(data.input); setTab("url"); }
      else { setInput(data.input); setTab("text"); }
      if (data.improveResult) setImproveResult(data.improveResult);
      if (data.visualMock) setVisualMock(data.visualMock);
      if (data.result?.strategy_message?.message) setHistoryTitle(data.result.strategy_message.message);
    } catch (e) {}
  }, []);

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
  const deleteAction = (id) => {
    setActions(prev => {
      const next = prev.filter(a => a.id !== id);
      try { localStorage.setItem(`ab3c_actions_${siteId || "default"}`, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  const [expandedActionId, setExpandedActionId] = useState(null);

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  };

  const shareResult = async (inputText, resultData) => {
    setSharing(true); setShareUrl(""); setShareExpiresAt(""); setShareCopied(false);
    try {
      const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: inputText, result: resultData, improveResult: improveResult || null, visualMock: visualMock || null }) });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/share?id=${data.id}`;
        setShareUrl(url);
        if (data.expires_at) setShareExpiresAt(data.expires_at);
        const ok = await copyToClipboard(url);
        setShareCopied(ok);
      }
    } catch (e) { console.error(e); } finally { setSharing(false); }
  };

  useEffect(() => {
    try { const saved = localStorage.getItem("ab3c_history"); if (saved) setHistory(JSON.parse(saved)); } catch (e) {}
    try { const cs = localStorage.getItem("ab3c_chat_summaries"); if (cs) setChatSummaries(JSON.parse(cs)); } catch (e) {}
    try { const cm = localStorage.getItem("ab3c_chat_minimized"); if (cm === "1") setChatMinimized(true); } catch (e) {}
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
          // 戦略確定履歴を DB から復元（LS より DB を信頼）
          try {
            var lsConfKey = "ab3c_confirmations_" + site.id;
            var dbConfs = Array.isArray(site.confirmations) ? site.confirmations : null;
            if (dbConfs && dbConfs.length > 0) {
              localStorage.setItem(lsConfKey, JSON.stringify(dbConfs));
              setConfirmHistory(dbConfs);
            } else {
              // DB が空で LS にデータがあれば DB にマイグレーション push
              var lsData = localStorage.getItem(lsConfKey);
              if (lsData) {
                try {
                  var lsParsed = JSON.parse(lsData);
                  if (Array.isArray(lsParsed) && lsParsed.length > 0) {
                    fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: site.id, confirmations: lsParsed }) }).catch(function() {});
                  }
                } catch (e) {}
              }
            }
          } catch (e) {}
          if (site.latest_analysis) {
            setResult(site.latest_analysis);
            setCurrentResult(site.latest_analysis);
            setHistoryTitle(site.latest_analysis.strategy_message?.message || "");
            if (site.improve_result) setImproveResult(site.improve_result);
            if (site.visual_mock) setVisualMock(site.visual_mock);
            if (site.analyzed_at) setAnalyzedAt(new Date(site.analyzed_at).getTime());
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
    // 確定履歴の読み込み
    try {
      var chKey = "ab3c_confirmations_" + (sid || urlParam || "default");
      var chData = localStorage.getItem(chKey);
      if (chData) setConfirmHistory(JSON.parse(chData));
    } catch (e) {}
    // URLパラメータからphaseを読み取り（?phase=action なら戦略アクションタブへ明示遷移）
    const phaseParam = params.get("phase");
    if (phaseParam === "action") {
      setTimeout(() => setViewOverride("action"), 500);
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
        setActivePlans(Array.isArray(data.activePlans) ? data.activePlans : []);
      });
  }
  // プラン切り替えイベントを監視
  try {
    const stored = localStorage.getItem("ab3c_active_plan_id");
    if (stored) setActivePlanId(stored);
  } catch (e) {}
  const onPlanChange = () => {
    try {
      const id = localStorage.getItem("ab3c_active_plan_id");
      setActivePlanId(id || null);
    } catch (e) {}
  };
  window.addEventListener("ab3c-plan-changed", onPlanChange);
  return () => window.removeEventListener("ab3c-plan-changed", onPlanChange);
}, [session]);

  // 選択中プランの planType 導出。プランがなければ null（無料 or PRO のみ）
  const currentActivePlan = (activePlans.length > 0)
    ? (activePlans.find(p => p.id === activePlanId) || activePlans[0])
    : null;
  const activePlanType = currentActivePlan?.planType || null;
  // 選択中プランが analysis（診断チケット）なら戦略確定等の指南プラン機能を非表示に
  const isDiagnosisActive = activePlanType === 'analysis';
  
// siteId が変わったら confirmHistory を再読み込み（別サイト表示時のスタレ防止）
useEffect(() => {
  if (!siteId) { setConfirmHistory([]); return; }
  try {
    const chData = localStorage.getItem("ab3c_confirmations_" + siteId);
    setConfirmHistory(chData ? JSON.parse(chData) : []);
  } catch (e) { setConfirmHistory([]); }
}, [siteId]);

// currentResult が変わったら refineSelection を初期化（ニーズ等の項目が変わった時のみ）
// 絞り込み再分析時は origNeeds/Wants/Profile を保持するためリセットしない
const prevItemsKeyRef = useRef(null);
useEffect(() => {
  if (!currentResult) { setRefineSelection({ needs: [], wants: [], profile: [] }); prevItemsKeyRef.current = null; return; }
  const key = JSON.stringify({
    n: currentResult.benefit?.needs || [],
    w: currentResult.benefit?.wants || [],
    p: currentResult.three_c?.customer?.profile || [],
  });
  if (prevItemsKeyRef.current !== key) {
    setRefineSelection({
      needs: (currentResult.benefit?.needs || []).map((_, i) => i),
      wants: (currentResult.benefit?.wants || []).map((_, i) => i),
      profile: (currentResult.three_c?.customer?.profile || []).map((_, i) => i),
    });
    prevItemsKeyRef.current = key;
  }
}, [currentResult]);

useEffect(() => {
  try {
    localStorage.setItem("ab3c_chat_summaries", JSON.stringify(chatSummaries));
  } catch (e) {}
}, [chatSummaries]);
  const saveHistory = (inputText, resultData, title, improve = null, visual = null) => {
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleString("ja-JP"),
    preview: title || resultData?.strategy_message?.message || inputText.slice(0, 40) + (inputText.length > 40 ? "…" : ""),
    input: inputText,
    result: resultData,
    improveResult: improve,
    visualMock: visual
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
        // 確定スナップショットを先に組み立て（DBとLSに同じデータを保存）
        var chatKey2 = "ab3c_chat_" + (currentResult ? JSON.stringify(currentResult).slice(0, 50) : "default");
        var chatMsgs = [];
        try { var cm = localStorage.getItem(chatKey2); if (cm) chatMsgs = JSON.parse(cm); } catch (e) {}
        var snapshot = {
          id: Date.now(),
          date: new Date().toLocaleString("ja-JP"),
          result: currentResult,
          chatMessages: chatMsgs,
          chatSummaries: chatSummaries,
          strategyMessage: currentResult?.strategy_message?.message || "",
          url: siteUrl || currentInput || "",
        };
        var chKey2 = "ab3c_confirmations_" + (targetSiteId || "default");
        var existing2 = [];
        try { var e2 = localStorage.getItem(chKey2); if (e2) existing2 = JSON.parse(e2); } catch (e) {}
        existing2.push(snapshot);
        // DB に確定状態 + confirmations 配列を保存（チャット履歴もスナップショット内に同梱）
        await fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: targetSiteId, latest_analysis: currentResult, strategy_confirmed: true, confirmations: existing2 }) });
        setStrategyConfirmed(true);
        // 確定直後は戦略アクションタブへ遷移（"→" の遷移意図を保持）
        setViewOverride("action");
        window.scrollTo(0, 0);
        // LS にも保存（DBのキャッシュとして）
        try {
          localStorage.setItem(chKey2, JSON.stringify(existing2));
          setConfirmHistory(existing2);
        } catch (e) {}
      } catch (e) { alert("保存に失敗しました。"); }
    }
  };

  // 絞り込み再分析（選択項目だけにフォーカスした戦略を再生成）
  const refineAnalyze = async () => {
    if (!currentResult || refining) return;
    const origNeeds = currentResult.benefit?.needs || [];
    const origWants = currentResult.benefit?.wants || [];
    const origProfile = currentResult.three_c?.customer?.profile || [];
    const selectedNeeds = origNeeds.filter((_, i) => refineSelection.needs.includes(i));
    const selectedWants = origWants.filter((_, i) => refineSelection.wants.includes(i));
    const selectedProfile = origProfile.filter((_, i) => refineSelection.profile.includes(i));

    if (selectedNeeds.length === 0 || selectedWants.length === 0) {
      alert("ニーズとウォンツは最低1つは残してください。");
      return;
    }

    setRefining(true);
    setOverlayMessage("選んだ条件で再分析中...");
    try {
      const payload = {
        refineFrom: currentResult,
        refineSelection: {
          needs: selectedNeeds,
          wants: selectedWants,
          profile: selectedProfile,
          target: currentResult.three_c?.customer?.target,
        },
      };
      if (currentInput?.startsWith("http")) payload.url = currentInput;
      else payload.input = currentInput;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      // 元のニーズ・ウォンツ・プロフィール一覧は保持（取り消し線表示のため）
      // ユーザーが後でチェックを戻して再分析できるように、選択可能な項目は常に元のまま
      const merged = {
        ...data,
        benefit: {
          ...data.benefit,
          needs: origNeeds,
          wants: origWants,
        },
        three_c: {
          ...data.three_c,
          customer: {
            ...data.three_c?.customer,
            profile: origProfile,
            target: data.three_c?.customer?.target ?? currentResult.three_c?.customer?.target,
          },
        },
      };
      try {
        const diff = diffResults(currentResult || {}, merged);
        setChangedPaths(prev => {
          const next = new Map(prev);
          diff.forEach(path => next.set(path, (next.get(path) || 0) + 1));
          return next;
        });
      } catch (e) { console.error("diff error:", e); }
      setCurrentResult(merged);
      setResult(merged);
      setAnalyzedAt(Date.now());
      setHistoryTitle(merged?.strategy_message?.message || "");
    } catch (e) {
      alert("再分析に失敗しました: " + (e?.message || e));
    } finally {
      setRefining(false);
      setOverlayMessage(null);
    }
  };

  // 戦略の確定を解除（確定履歴は保持、フェーズだけ analysis に戻す）
  const unconfirmStrategy = async () => {
    const ok = confirm(
      "戦略の確定を解除しますか？\n\n" +
      "・確定履歴（サイドバー）は保持されます\n" +
      "・戦略策定タブに戻って内容を練り直せます\n" +
      "・解除後、再度確定することも可能です"
    );
    if (!ok) return;
    try {
      if (siteId) {
        await fetch("/api/sites", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: siteId, strategy_confirmed: false }),
        });
      }
      setStrategyConfirmed(false);
      setViewOverride("analysis"); // フェーズを①に戻す
      window.scrollTo(0, 0);
    } catch (e) { alert("解除に失敗しました。"); }
  };

 const notify = (text) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("戦略指南 AI 分析完了", { body: text.slice(0, 60), icon: "https://ab3c.jp/img/common/logo.svg" });
  };

  const analyze = async () => {
    // ログインチェックはAPI側で実施（sessionの読み込みタイミング問題を回避）
    if (tab === "text" && !input.trim()) { setError("事業概要を入力してください。"); return; }
    if (tab === "url" && !url.trim()) { setError("URLを入力してください。"); return; }

    // URL一致で既存サイトを先に DB から探す（クロスブラウザでの確定状態を判定するため）
    var prefoundSite = null;
    if (tab === "url" && url.trim()) {
      try {
        const sitesRes = await fetch("/api/sites");
        const sitesData = await sitesRes.json();
        const normalizeUrl = u => u?.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
        prefoundSite = (sitesData.sites || []).find(s => normalizeUrl(s.site_url) === normalizeUrl(url.trim())) || null;
      } catch (e) {}
    }

    // 戦略確定済みの状態で再分析しようとしている場合、警告を出す
    // - フロント state（同一ブラウザで確定済み）または
    // - DB上で一致した既存サイトが確定済み（別ブラウザ・初回ロード前等で state が空でも検出）
    const dbConfirmed = !!(prefoundSite && prefoundSite.strategy_confirmed === true);
    if ((strategyConfirmed && currentResult) || dbConfirmed) {
      const ok = confirm(
        "このサイトは戦略確定済みです。\n" +
        "再分析しても過去の確定履歴（サイドバー）は保持されますが、\n" +
        "現在表示中の分析結果は新しい内容で上書きされ、確定状態も解除されます。\n\n" +
        "続けて再分析しますか？"
      );
      if (!ok) return;
      // DB の strategy_confirmed=false を即時反映（別ブラウザでの不整合を防ぐ）
      if (dbConfirmed) {
        try {
          await fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: prefoundSite.id, strategy_confirmed: false }) });
        } catch (e) {}
      }
    }
setError(""); setResult(null); setSelectedHistory(null); setLoading(true); setChatSummaries([]); setImproveResult(null); setVisualMock(null);
// 新URLが既存サイトと一致しない場合に siteId が誤って残らないよう初期化（URL一致時は直後に再設定される）
setSiteId(null); setCurrentResult(null); setCurrentInput(""); setStrategyConfirmed(false); setActiveThemeId(null); setActiveChatId(null); setThreads([]);
// 注: localStorage "ab3c_history" は意図的に削除しない（履歴安全性のため）
    setOverlayMessage("AB3C分析中...");
    try {
      // URL分析時: 既存サイトがあれば自動紐付け（上で取得済みの prefoundSite を再利用）
      var analyzeSiteId = null;
      if (tab === "url" && url.trim() && prefoundSite) {
        analyzeSiteId = prefoundSite.id;
        setSiteId(prefoundSite.id);
      }
      const body = tab === "url" ? { url } : { input };
      // 既存サイトの再分析時は siteId を渡す → 完了メールのリンクを当該分析結果ページに直接飛ばすため
      if (analyzeSiteId) body.siteId = analyzeSiteId;
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); setOverlayMessage(null); return; }
      setResult(data);
setHistoryTitle(data?.strategy_message?.message || "");
const savedText = tab === "url" ? url : input;
setCurrentResult(data);
setCurrentInput(savedText);
setAnalyzedAt(Date.now());
setLoading(false);
setOverlayMessage(null);

// 既存サイト（再分析）の場合のみ、AB3C結果を即座にDBに反映
// 新規サイト作成は全レポート成功後まで遅延（戦略診断チケットの枠消費タイミング対応）
if (tab === "url" && savedText.startsWith("http") && analyzeSiteId) {
  try {
    setSiteId(analyzeSiteId);
    await fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: analyzeSiteId, latest_analysis: data, analyzed_at: Date.now() }) });
  } catch (e) { console.error("分析結果DB保存エラー:", e); }
}

// URL分析の場合、改善レポート（テキスト）→改善ビジュアル（HTMLモック）を順次生成
// ビジュアルは改善レポートの具体的な提案を反映させるため、テキスト完了後に生成
let improveData = null;
let visualData = null;
if (tab === "url" && savedText.startsWith("http")) {
  setImproveLoading(true);
  setVisualLoading(true); // ビジュアルも同時にローディング開始（改善レポートと同時表示のため）
  setOverlayMessage("ウェブサイト改善レポート生成中...");

  // Step 1: 改善レポート（テキスト）を先に生成
  try {
    const improveRes = await fetch("/api/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisResult: data, url: savedText }),
    });
    improveData = await improveRes.json();
    if (!improveData.error) {
      setImproveResult(improveData);
    } else {
      console.error("改善レポート生成エラー:", improveData.error, improveData.debug);
      setVisualLoading(false); // 改善レポート失敗時はビジュアルも走らないのでクリア
    }
  } catch (e) {
    console.error("改善レポート自動生成エラー:", e);
    improveData = { error: String(e?.message || e) };
    setVisualLoading(false);
  } finally {
    setImproveLoading(false);
  }

  // Step 2: 改善レポートをもとにビジュアル生成
  if (improveData && !improveData.error) {
    setOverlayMessage("改善ビジュアル生成中...");
    try {
      const visualRes = await fetch("/api/improve/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisResult: data, improveResult: improveData, url: savedText }),
      });
      visualData = await visualRes.json();
      if (!visualData.error) {
        setVisualMock(visualData);
      } else {
        console.error("改善ビジュアル生成エラー:", visualData.error, visualData.debug);
      }
    } catch (e) {
      console.error("改善ビジュアル自動生成エラー:", e);
      visualData = { error: String(e?.message || e) };
    } finally {
      setVisualLoading(false);
    }
  }

  setOverlayMessage(null);

  // サイト作成/保存の条件: AB3C分析＋改善レポートが成功していれば十分（ビジュアルは任意）
  // 失敗した場合もユーザーが分析結果を失わないよう、ビジュアル単独の失敗は許容する
  const coreReportsSucceeded = data && !data.error
    && improveData && !improveData.error;
  // チケット消費の条件: 全レポート（AB3C＋改善＋ビジュアル）成功時のみ
  // ユーザーがビジュアル失敗でチケットを消費してしまうのを防ぐ
  const allReportsSucceeded = coreReportsSucceeded
    && visualData && !visualData.error;

  try {
    let targetSid = analyzeSiteId;
    if (!targetSid && coreReportsSucceeded) {
      // 新規サイト作成（AB3C＋改善レポート成功時）
      var sn = "無題のサイト";
      try { sn = new URL(savedText).hostname.replace(/^www\./, ""); } catch (e) {}
      var cr = await fetch("/api/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_name: sn, site_url: savedText }) });
      var cd = await cr.json();
      if (cd.existingSite) { targetSid = cd.existingSite.id; setSiteId(targetSid); }
      else if (cd.site) { targetSid = cd.site.id; setSiteId(targetSid); }
      else if (cd.error) { console.error("サイト作成エラー:", cd.error); }
    }
    // 既存サイト または 新規サイト作成成功時に全データ保存
    if (targetSid) {
      await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetSid,
          latest_analysis: data,
          improve_result: improveData && !improveData.error ? improveData : null,
          visual_mock: visualData && !visualData.error ? visualData : null,
          analyzed_at: Date.now(),
        }),
      });
    }
    // 戦略診断チケットの場合、分析回数を1消費（再分析も含めて毎回）
    // 全3レポート成功時のみ消費、失敗時は消費しない
    if (allReportsSucceeded) {
      try {
        await fetch("/api/analyses/consume", { method: "POST" });
      } catch (e) { console.error("診断回数消費エラー:", e); }
    }
  } catch (e) { console.error("DB保存エラー:", e); }
}

saveHistory(savedText, data, data?.strategy_message?.message || "", improveData, visualData && !visualData.error ? visualData : null);
notify(savedText);
    } catch (e) { setError("通信エラーが発生しました。もう一度お試しください。"); setLoading(false); setOverlayMessage(null); }
  };

const reset = () => { setResult(null); setSelectedHistory(null); setInput(""); setUrl(""); setError(""); setChatSummaries([]); setImproveResult(null); setVisualMock(null); setCurrentResult(null); setCurrentInput(""); setStrategyConfirmed(false); setActiveThemeId(null); setActiveChatId(null); setThreads([]); };
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
{/* ローディングオーバーレイ（改善レポート生成中はスモークなし） */}
      {overlayMessage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: overlayMessage.includes("改善") ? "transparent" : "rgba(0,0,0,0.15)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 40, pointerEvents: overlayMessage.includes("改善") ? "none" : "auto" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 36px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", maxWidth: 360, display: "flex", alignItems: "center", gap: 16, pointerEvents: "auto" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e5e5e0", borderTop: `3px solid ${overlayMessage.includes("改善") ? "#ea580c" : "#0d9488"}`, borderRadius: "50%", flexShrink: 0, animation: "spin 1s linear infinite" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a14", marginBottom: 2 }}>{overlayMessage}</div>
              <div style={{ fontSize: 13, color: "#78716c" }}>2〜3分お待ちください</div>
            </div>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* 絞り込み再分析ボタン案内トースト（チェックを外した直後に上に出ていることを通知） */}
      {refineToast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: C.A, color: "#fff", padding: "14px 24px", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 9998, fontSize: 15, fontWeight: 700, fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 10, animation: "refineToastSlide 0.25s ease-out" }}>
          <span style={{ fontSize: 20 }}>⬆</span>
          <span>上の「選んだ条件で再分析」ボタンをクリックして戦略を研ぎ澄ませましょう</span>
          <style>{`@keyframes refineToastSlide { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
        </div>
      )}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showWelcome && <WelcomeModal session={session} onClose={() => setShowWelcome(false)} onShowPricing={() => setShowPricing(true)} />}

      <Header
        onShowPricing={() => setShowPricing(true)}
        currentSiteUrl={url?.startsWith("http") ? url : (currentInput?.startsWith("http") ? currentInput : null)}
        currentSiteId={siteId}
        phase={phase}
        strategyConfirmed={strategyConfirmed}
        canAccessBansou={!isDiagnosisActive && (isPro || chatTickets > 0)}
        previousSiteId={previousSiteId}
        previousSiteUrl={previousSiteUrl}
        onNewAnalysis={() => {
          // 「戻る先」として現在のサイトIDを保存（①戦略策定タブから復帰できるように）
          if (siteId) {
            setPreviousSiteId(siteId);
            const urlSnapshot = currentInput?.startsWith("http") ? currentInput : (url?.startsWith("http") ? url : null);
            if (urlSnapshot) setPreviousSiteUrl(urlSnapshot);
          }
          reset(); setSiteId(null); sessionStorage.removeItem("ab3c_last_analysis"); setViewOverride(null); window.history.replaceState(null, "", "/"); window.scrollTo(0, 0);
        }}
        onSwitchToAnalysis={() => {
          // 現在のサイトの分析結果があればそれを表示、なければ「戻る先」の previousSite へ遷移
          if (currentResult) {
            setViewOverride("analysis");
            window.scrollTo(0, 0);
          } else if (previousSiteId) {
            const params = [`site_id=${previousSiteId}`];
            if (previousSiteUrl) params.push(`url=${encodeURIComponent(previousSiteUrl)}`);
            window.location.href = `/?${params.join("&")}`;
          }
        }}
        onSwitchToAction={() => { if (strategyConfirmed) { setViewOverride("action"); window.scrollTo(0, 0); } }}
        onConfirmStrategy={currentResult && !strategyConfirmed && !isDiagnosisActive && (isPro || chatTickets > 0) ? confirmStrategy : null}
      />


      <div style={{ display: "grid", gridTemplateColumns: phase === "input" ? "1fr" : (sidebarOpen ? (chatMinimized ? "240px 1fr" : `240px 1fr ${chatWidth}px`) : (chatMinimized ? "1fr" : `1fr ${chatWidth}px`)), flex: 1, position: "relative" }}>
        {/* サイドバー（input フェーズでは非表示 — 戦略確定履歴は分析後にしか意味がない） */}
        {sidebarOpen && phase !== "input" && (
  <div id="sidebar" style={{ borderRight: `1px solid ${C.border}`, background: phase === "action" ? C.phase2 : phase === "analysis" ? C.phase1 : "#555", display: "flex", flexDirection: "column", color: "#fff", height: "calc(100vh - " + headerHeight + "px)", position: "sticky", top: headerHeight, overflowY: "auto" }}>
            {/* カラム見出し + 開閉ボタン */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 400, color: "#fff" }}>
                {phase === "action" ? "施策一覧" : "戦略確定履歴"}
              </div>
              <button onClick={function() { setSidebarOpen(false); }} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>◀ 閉じる</button>
            </div>

            {/* フェーズ別サイドバーコンテンツ */}
            {phase === "action" ? (
              <>
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
                {/* 施策追加 */}
                <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                  <button onClick={() => { const label = prompt("施策名を入力してください"); if (label?.trim()) { const newThread = { id: `custom_${Date.now()}`, label: label.trim(), icon: "💬", preset: false }; setThreads(prev => [...prev, newThread]); selectTheme(newThread.id); } }}
                    style={{ width: "100%", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 3, color: "#fff", cursor: "pointer", fontSize: 16, padding: "10px" }}>+ 施策を追加</button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                {confirmHistory.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6 }}>
                    戦略を確定すると<br/>ここに履歴が残ります
                  </div>
                ) : (
                  confirmHistory.slice().reverse().map(function(ch, i) {
                    var isActive = currentResult?.strategy_message?.message === ch.strategyMessage;
                    return (
                      <div key={ch.id} onClick={function() {
                        setCurrentResult(ch.result);
                        setResult(ch.result);
                        setHistoryTitle(ch.strategyMessage || "");
                        setStrategyConfirmed(true);
                        if (ch.chatSummaries) setChatSummaries(ch.chatSummaries);
                        if (ch.url) { setCurrentInput(ch.url); setUrl(ch.url); setTab("url"); }
                        setChangedPaths(new Map());
                      }}
                        style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.15)" : "transparent", borderLeft: isActive ? "3px solid #6db3f8" : "3px solid transparent" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>#{confirmHistory.length - i} · {ch.date}</div>
                        <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.4 }}>{(ch.strategyMessage || "").slice(0, 50)}</div>
                        {ch.chatSummaries && ch.chatSummaries.length > 0 && (
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>💬 {ch.chatSummaries.length}件反映</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}
        {/* サイドバー閉じ時の開くボタン（input フェーズでは非表示） */}
        {!sidebarOpen && phase !== "input" && (
          <button onClick={function() { setSidebarOpen(true); }} style={{ position: "fixed", left: 0, top: headerHeight + 10, zIndex: 200, background: phase === "action" ? C.phase2 : C.phase1, border: "none", borderRadius: "0 6px 6px 0", padding: "12px 10px", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 400, boxShadow: "2px 2px 8px rgba(0,0,0,0.2)", writingMode: "vertical-rl", letterSpacing: "0.15em" }}>
            {phase === "action" ? "施策一覧 ▶" : "戦略確定履歴 ▶"}
          </button>
        )}
        <div ref={mainContentRef} style={{ flex: 1, padding: "0", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: sidebarOpen ? "32px 24px 80px" : "32px 24px 80px 56px", maxWidth: 900, flex: 1 }}>
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
        <div style={{ fontSize: 16, color: C.ink, marginTop: 2 }}>使い方・入力方法・活用法</div>
      </div>
    </a>
    <a href="/about" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", textDecoration: "none", color: C.ink }}>
      <span style={{ fontSize: 24 }}>📖</span>
      <div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink }}>AB3C分析とは</div>
        <div style={{ fontSize: 16, color: C.ink, marginTop: 2 }}>フレームワークの詳細</div>
      </div>
    </a>
    <a href="/pricing" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", textDecoration: "none", color: C.ink }}>
      <span style={{ fontSize: 24 }}>💰</span>
      <div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink }}>料金とプラン</div>
        <div style={{ fontSize: 16, color: C.ink, marginTop: 2 }}>戦略診断チケット・戦略指南プランの詳細</div>
      </div>
    </a>
    <a href="/faq" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", textDecoration: "none", color: C.ink }}>
      <span style={{ fontSize: 24 }}>❓</span>
      <div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink }}>よくある質問</div>
        <div style={{ fontSize: 16, color: C.ink, marginTop: 2 }}>FAQ・お問い合わせ前にご確認ください</div>
      </div>
    </a>
</div>
)}

{!currentResult && !loading && (
  <div style={{ marginTop: 40, padding: "32px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 24 }}>戦略指南 AI 使い方</div>
    
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
          { icon: "📝", title: "補助金・事業計画の構想整理", desc: "AB3Cで整理した戦略を、補助金申請や事業計画を検討する際の構想整理・記入のヒントとしてご活用いただけます。" },

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
      <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.75)", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>戦略をクリアにし、関係者全員が同じ設計図を見られる「共通言語」をつくることが戦略指南 AIの役割です。</p>
    </div>
  </div>
)}
{loading && <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 16 }}>AIがAB3Cを分析中です…</div>}
          {currentResult && phase !== "action" && (
            <div>
             <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
  {currentInput && !currentInput.startsWith("http") && (
    <button onClick={() => editAndReanalyze(currentInput)} style={{ background: "#555", border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
      ✏️ このテキストを修正して再分析
    </button>
  )}
  <button onClick={() => shareResult(currentInput || "", currentResult)} disabled={sharing} style={{ background: "#555", border: "none", borderRadius: 2, color: "#fff", cursor: sharing ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
    {sharing ? "作成中…" : "🔗 シェアＵＲＬを発行"}
  </button>
  <button
    onClick={() => {
      var origTitle = document.title;
      var printName = "AB3C分析";
      try {
        if (currentInput?.startsWith("http")) printName = new URL(currentInput).hostname.replace(/^www\./, "");
      } catch (e) {}
      if (historyTitle) printName += " — " + historyTitle.slice(0, 60);
      document.title = printName;
      window.print();
      document.title = origTitle;
    }}
    style={{ background: "#555", border: "none", borderRadius: 2, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}
  >
🖨️ 印刷・ＰＤＦ保存
  </button>
  {(() => {
    const canConfirm = !isDiagnosisActive && (isPro || chatTickets > 0);
    return (
      <>
        <button
          onClick={canConfirm ? confirmStrategy : null}
          disabled={!canConfirm || strategyConfirmed}
          title={isDiagnosisActive ? "戦略診断チケットでは戦略確定はご利用いただけません" : !canConfirm ? "戦略指南プランで戦略確定・戦略アクションが利用可" : strategyConfirmed ? "戦略確定済み" : "戦略を確定して戦略アクションへ進む"}
          style={{
            background: !canConfirm ? "#cccccc" : strategyConfirmed ? "#888" : C.phase1,
            border: "none", borderRadius: 2,
            color: "#fff",
            cursor: (!canConfirm || strategyConfirmed) ? "not-allowed" : "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
            opacity: !canConfirm ? 0.7 : 1,
          }}
        >
          {strategyConfirmed ? "✅ 戦略確定済み" : "戦略を確定する →"}
        </button>
        {strategyConfirmed && (
          <button
            onClick={unconfirmStrategy}
            title="戦略の確定を解除して策定フェーズに戻ります（確定履歴は保持）"
            style={{
              background: C.B, border: "none", borderRadius: 2,
              color: "#fff", cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
            }}
          >
            ↺ 戦略を解除
          </button>
        )}
      </>
    );
  })()}
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
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.B, marginBottom: 6 }}>
                    {shareCopied ? "✓ URLをコピーしました" : "URLをコピーしてください"}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, fontSize: 13, color: C.ink, wordBreak: "break-all" }}>{shareUrl}</div>
                    <button
                      onClick={async () => { const ok = await copyToClipboard(shareUrl); setShareCopied(ok); if (!ok) alert("コピーに失敗しました。URLを選択してコピーしてください。"); }}
                      style={{ background: C.B, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "8px 14px", flexShrink: 0 }}>
                      {shareCopied ? "コピー済み" : "コピー"}
                    </button>
                  </div>
                  {shareExpiresAt && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                      閲覧期限: <strong>{new Date(shareExpiresAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</strong>（発行から1年間）
                    </div>
                  )}
                </div>
              )}
<div id="result-area">
  <div style={{ background: C.ink, borderRadius: 6, padding: "24px 28px", marginBottom: 28 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>AB3C STRATEGY ANALYSIS REPORT</div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>AB3C戦略分析レポート</div>
      </div>
      {analyzedAt && (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "right" }}>
          分析日時<br />
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>{new Date(analyzedAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      )}
    </div>
  </div>
  {(() => {
    const needsLen = currentResult.benefit?.needs?.length ?? 0;
    const wantsLen = currentResult.benefit?.wants?.length ?? 0;
    const profileLen = currentResult.three_c?.customer?.profile?.length ?? 0;
    const isPending = !strategyConfirmed && (
      (refineSelection.needs?.length ?? 0) < needsLen ||
      (refineSelection.wants?.length ?? 0) < wantsLen ||
      (refineSelection.profile?.length ?? 0) < profileLen
    );
    if (!isPending) return null;
    return (
      <div style={{ background: "#fff3cd", border: `2px solid ${C.A}`, borderRadius: 6, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, color: C.ink, fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
          <b>🎯 ターゲットを絞り込みました</b><br />
          <span style={{ fontSize: 13, color: C.muted }}>選んだ条件で再分析すると、より鋭い戦略メッセージに研ぎ澄ませます。</span>
        </div>
        <button
          onClick={refineAnalyze}
          disabled={refining}
          style={{
            background: refining ? C.muted : C.A, border: "none", borderRadius: 4,
            color: "#fff", cursor: refining ? "not-allowed" : "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
            whiteSpace: "nowrap",
          }}
        >
          {refining ? "再分析中…" : "🎯 選んだ条件で再分析"}
        </button>
      </div>
    );
  })()}
  <ResultView d={currentResult} onChat={(topic) => chatSendTopicRef.current?.(topic)} changedPaths={changedPaths} refineSelection={refineSelection} onRefineToggle={strategyConfirmed ? null : (key, i) => {
    setRefineSelection(prev => {
      const list = prev[key] || [];
      const next = list.includes(i) ? list.filter(x => x !== i) : [...list, i];
      const newSel = { ...prev, [key]: next };
      // いずれかの項目が外された状態になったら、上のボタンを案内するトースト表示
      const origNeeds = currentResult?.benefit?.needs?.length ?? 0;
      const origWants = currentResult?.benefit?.wants?.length ?? 0;
      const origProfile = currentResult?.three_c?.customer?.profile?.length ?? 0;
      const pending = (newSel.needs?.length ?? 0) < origNeeds
        || (newSel.wants?.length ?? 0) < origWants
        || (newSel.profile?.length ?? 0) < origProfile;
      if (pending) {
        setRefineToast(true);
        setTimeout(() => setRefineToast(false), 2800);
      }
      return newSel;
    });
  }} />
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
      {/* 5つのチェックポイントは上の AB3C 分析セクションで既に表示されているため、
          改善レポート側での再表示は重複になるためここには配置しない */}
      {(visualLoading || visualMock) && (
        <div className="visual-mock-section" style={{ marginBottom: 32 }}>
          <style>{`
            @media print {
              .visual-mock-section { break-inside: avoid-page; page-break-inside: avoid; }
              .visual-mock-banner { break-after: avoid-page; page-break-after: avoid; }
              .visual-mock-frame { break-before: avoid-page; page-break-before: avoid; }
              .visual-mock-caption { break-inside: avoid-page; page-break-inside: avoid; }
            }
          `}</style>
          <div className="visual-mock-banner" style={{ borderLeft: `4px solid ${C.ink}`, padding: "6px 14px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: C.muted, marginBottom: 2 }}>IMPROVED FIRST-VIEW MOCKUP</div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink }}>改善後のファーストビュー・イメージ</div>
          </div>
          {visualLoading && !visualMock && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 16, background: "#f8f8f6", borderRadius: 6 }}>
              <span style={{ display: "inline-block", width: 20, height: 20, border: "3px solid #e5e5e0", borderTop: `3px solid ${C.A}`, borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: 12, verticalAlign: "middle" }} />
              改善ビジュアルを生成中です…
            </div>
          )}
          {visualMock && (
            <div className="visual-mock-frame">
              <div style={{ border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", background: "#fff" }}>
                <ShadowMock html={visualMock.visual_mock_html} style={{ display: "block", width: "100%" }} />
              </div>
              {visualMock.caption && (
                <div className="visual-mock-caption" style={{ marginTop: 12, padding: "14px 18px", background: C.highlight, borderLeft: `4px solid ${C.A}`, fontSize: 15, color: C.ink, lineHeight: 1.7 }}>
                  <b style={{ color: C.A }}>💡 このビジュアルの意図：</b>{visualMock.caption}
                </div>
              )}
            </div>
          )}
        </div>
      )}
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


{/* 分析チャットは右カラムに配置 */}

{/* 伴走フェーズのコンテンツは分析結果ブロックの外に移動済み */}
            </div>
          )}
{/* 伴走フェーズ（分析結果ブロックの外） */}
{phase === "action" && currentResult && (
  <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 180px)" }}>
    {/* 戦略メッセージ */}
    <div style={{ padding: "20px 24px", background: C.phase1, flexShrink: 0, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>戦略メッセージ = Benefit + Advantage</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.6, fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
            {currentResult?.strategy_message?.message || ""}
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontFamily: "system-ui, sans-serif", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 8 }}>
            <b>Benefit：</b>{currentResult?.strategy_message?.benefit_part || ""}<br />
            <b>Advantage：</b>{currentResult?.strategy_message?.advantage_part || ""}
          </div>
        </div>
        {strategyConfirmed && (
          <button
            onClick={unconfirmStrategy}
            title="戦略の確定を解除して策定フェーズに戻ります（確定履歴は保持）"
            style={{
              background: C.B, border: "none", borderRadius: 2,
              color: "#fff", cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
              flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            ↺ 戦略を解除
          </button>
        )}
      </div>
    </div>
    {/* チャット */}
    <div style={{ flex: 1, overflow: "hidden" }}>
      {activeChatId ? (
        <ThreadChat key={siteId + "_" + activeChatId} threadId={activeChatId} themeId={activeThemeId} themeLabel={threads.find(t => t.id === activeThemeId)?.label} siteId={siteId} chatDescription={themeChats[activeThemeId]?.find(c => c.id === activeChatId)?.description} analysisResult={currentResult} isPro={isPro || chatTickets > 0 || trialChats > 0} onAddAction={addAction}
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
          <Footer />
          </div>{/* end inner padding wrapper */}
        </div>{/* end main content column */}

        {/* 右カラム最小化時の復元ボタン */}
        {phase !== "input" && chatMinimized && (
          <button
            onClick={function() { setChatMinimized(false); try { localStorage.removeItem("ab3c_chat_minimized"); } catch (e) {} }}
            style={{ position: "fixed", right: 0, top: headerHeight + 10, zIndex: 200, background: phase === "action" ? C.phase2 : C.phase1, border: "none", borderRadius: "6px 0 0 6px", padding: "12px 10px", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 400, boxShadow: "-2px 2px 8px rgba(0,0,0,0.2)", writingMode: "vertical-rl", letterSpacing: "0.15em" }}
            title={phase === "action" ? "アクションリストを開く" : "分析チャットを開く"}
          >
            ◀ {phase === "action" ? "アクション" : "チャット"}を開く
          </button>
        )}

        {/* 右カラム: チャットパネル（リサイズ可能） */}
        {phase !== "input" && !chatMinimized && (
            <div id="chat-column" style={{ position: "relative", borderLeft: `1px solid ${C.border}`, background: phase === "action" ? C.phase2Bg : phase === "analysis" ? C.phase1Bg : "#ecebe6", display: "flex", flexDirection: "column", height: "calc(100vh - " + headerHeight + "px)", position: "sticky", top: headerHeight, zIndex: 100 }}>
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
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: phase === "action" ? C.phase2 : phase === "analysis" ? C.phase1 : "#555", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {phase === "action" ? `アクションリスト${actions.length > 0 ? `（${actions.length}）` : ""}` : "分析チャット"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>
                  {phase !== "action" && chatSummaries.length > 0 ? `（${chatSummaries.length}回反映済み）` : ""}
                </span>
                <button
                  onClick={function() { setChatMinimized(true); try { localStorage.setItem("ab3c_chat_minimized", "1"); } catch (e) {} }}
                  style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 3, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "3px 10px", lineHeight: 1, fontFamily: "system-ui, sans-serif", flexShrink: 0 }}
                  title={phase === "action" ? "アクションリストを閉じる" : "チャットを閉じる"}
                >
                  ▶ 閉じる
                </button>
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
                (isPro || chatTickets > 0) ? (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  <AnalysisChatPanel
                    isPro={isPro || chatTickets > 0}
                    analysisResult={currentResult}
                    onSendTopic={chatSendTopicRef}
                    onReanalyze={function(newResult, summary) {
                      try {
                        var diff = diffResults(currentResult || {}, newResult);
                        setChangedPaths(function(prev) {
                          var next = new Map(prev);
                          diff.forEach(function(path) { next.set(path, (next.get(path) || 0) + 1); });
                          return next;
                        });
                      } catch (e) { console.error("diff error:", e); }
                      setResult(newResult);
                      setCurrentResult(newResult);
                      setHistoryTitle(newResult?.strategy_message?.message || "");
                      setSelectedHistory(null);
                      if (summary) setChatSummaries(function(prev) { return [].concat(prev, [summary]); });
                      saveHistory(currentInput || "", newResult, newResult?.strategy_message?.message || "");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onConfirmStrategy={!strategyConfirmed && !isDiagnosisActive && (isPro || chatTickets > 0) ? confirmStrategy : null}
                  />
                </div>
                ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", overflow: "auto" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                  <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 12, lineHeight: 1.6 }}>
                    AIチャットで戦略を磨きませんか？
                  </div>
                  <div style={{ fontSize: 15, color: C.ink, marginBottom: 24, lineHeight: 1.7 }}>
                    <b>戦略指南プラン</b>（戦略診断・策定・アクション）なら、<br/>
                    AIと対話しながら戦略を何度でも練り直せます。<br/>
                    確定した戦略から具体的なアクション計画も<br/>
                    自動で生成できます。
                  </div>
                  <a href="/pricing" style={{ display: "inline-block", background: C.A, color: "#fff", fontSize: 16, fontWeight: 700, padding: "12px 24px", borderRadius: 4, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>
                    戦略指南プランを見る →
                  </a>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 16 }}>
                    現在のプランでは<br/>分析結果のPDF保存・シェアURL発行が可能です
                  </div>
                </div>
                )
              ) : phase === "action" ? (
                actions.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", textAlign: "center", color: C.muted, fontSize: 14, lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                    <div style={{ color: C.ink, fontWeight: 700, marginBottom: 8 }}>まだアクションがありません</div>
                    <div style={{ fontSize: 13 }}>
                      チャットでAIが具体的な施策を提案したら<br/>
                      「✓ アクションに登録」ボタンで<br/>
                      ここに追加されます
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: C.phase2Bg }}>
                    {actions.map(function(a) {
                      var expanded = expandedActionId === a.id;
                      return (
                        <div key={a.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", fontFamily: "system-ui, sans-serif" }}>
                          <div onClick={function() { setExpandedActionId(expanded ? null : a.id); }} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                            <span style={{ fontSize: 13, color: C.phase2, marginTop: 2 }}>{expanded ? "▼" : "▶"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.5 }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.createdAt}</div>
                            </div>
                            <button onClick={function(e) { e.stopPropagation(); if (confirm("このアクションを削除しますか？")) deleteAction(a.id); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, padding: 2, lineHeight: 1 }} title="削除">×</button>
                          </div>
                          {expanded && a.detail && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.ink, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a.detail}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 16 }}>
                  分析結果をもとに相談できます
                </div>
              )}
            </div>
        )}
      </div>{/* end grid */}
    </div>
  );
}
