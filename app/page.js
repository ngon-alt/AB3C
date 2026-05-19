"use client";
// Updated: 2025-04-07 - Force page rebuild
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PricingModal from "./components/PricingModal";
import ShadowMock from "./components/ShadowMock";
import UpdateHistoryModal from "./components/UpdateHistoryModal";
import CreatorProfileBlock from "./components/CreatorProfileBlock";
import ProUseCaseBlock from "./components/ProUseCaseBlock";
// SiteCapResolveModal は layout.js の SiteCapGuard 経由で全ページ共通表示に移行
import { latestUpdateId } from "./data/updates";
import { buildSlides } from "./lib/exporters/build-slides";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#ebebeb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#000000", muted: "#000000", highlight: "#fef3c7",
  // フェーズ色は廃止し「墨色＋生成り」で統一。tab ①② の番号と矢印で進行方向を語る。
  // phase1/phase2 のキーは下流コードの破壊を避けるため残しているが、値は同一（墨色）。
  phase1: "#2a2a26", phase1Bg: "#faf8f4",
  phase2: "#2a2a26", phase2Bg: "#faf8f4",
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
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(42,42,38,0.25)";
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
            background: "#2a2a26", color: "#fff",
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

const Card = ({ color, title, children, onChat, help, textColor, titleColor }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${textColor || color}`, borderRadius: 4, padding: "16px 18px", position: "relative", boxShadow: textColor ? "0 0 0 2px " + textColor + "33" : "none" }} {...(onChat ? hoverShow : {})}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, letterSpacing: "0.1em", textTransform: "uppercase", color: textColor || titleColor || color, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
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

// evaluations: アイテムと並列配列。各要素 { tier, note, needs_chat_confirmation } を持ち、
//   needs_chat_confirmation === true の項目には赤丸シグナルを表示する。
//   onConfirmItem(item, evalObj) が指定されていれば赤丸クリックでチャットに問いを投げる。
function UL({ items, onChatItem, checkable, checkedIndexes, onToggle, textColor, evaluations, onConfirmItem }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  return (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => {
      const isChecked = !checkable || (checkedIndexes || []).includes(i);
      const isHovered = checkable && hoveredIdx === i;
      const ev = Array.isArray(evaluations) ? evaluations[i] : null;
      const needsConfirm = !!(ev && ev.needs_chat_confirmation);
      return (
     <li key={i}
       onMouseEnter={() => setHoveredIdx(i)}
       onMouseLeave={() => setHoveredIdx(-1)}
       style={{ fontSize: 16, lineHeight: 1.75, padding: checkable ? "6px 8px" : "5px 0 5px 16px", borderBottom: i < items.length - 1 ? `1px dashed ${C.border}` : "none", position: "relative", color: textColor || "#000000", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, opacity: checkable && !isChecked ? 0.45 : 1, background: isHovered ? "#f0f0ea" : "transparent", borderRadius: checkable ? 4 : 0, transition: "opacity 0.15s, background 0.15s" }}
       {...((onChatItem && !needsConfirm) ? hoverShow : {})}>
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
          {/* 要チャット確認の赤い吹き出しマーク。クリックでチャットに該当の問いを投げる。
              既存の hover 💬（teal）と区別するため常時表示で赤色。
              意図: 「この項目は根拠の確認が推奨」のシグナルを 💬 アイコンで自然に伝える。 */}
          {needsConfirm && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onConfirmItem) onConfirmItem(item, ev); }}
              title={`この強みは根拠の確認が推奨されています：${ev.note || "本人だからこそ語れる事実・経験を整理しましょう"}\nクリックでチャットに質問が投稿されます。`}
              style={{ flexShrink: 0, marginTop: 2, width: 24, height: 24, borderRadius: 6, border: "none", padding: 0, background: "#d23a2a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="この強みの根拠をチャットで確認"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/></svg>
            </button>
          )}
        </label>
        {/* 黒い ChatBtn は赤い吹き出し（needsConfirm）と重なるので、需要確認項目では表示しない（権さん指摘・2026-05-15）。
            赤い吹き出しが既に「この項目をチャットで深掘る」アクションを持つため、二重表示は冗長で誤クリックの原因になる。 */}
        {onChatItem && !needsConfirm && <ChatBtn onClick={() => onChatItem(item)} />}
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

// ハイライトスタイル（反映回数で色が変わる）— 旧仕様。世代タブ機構に置き換え予定
var HL_COLORS = [
  { background: "#fff3cd", borderLeft: "3px solid #ffc107", paddingLeft: 8 }, // 1回目: 黄色
  { background: "#d4edda", borderLeft: "3px solid #28a745", paddingLeft: 8 }, // 2回目: 緑
  { background: "#cce5ff", borderLeft: "3px solid #007bff", paddingLeft: 8 }, // 3回目: 青
  { background: "#f8d7da", borderLeft: "3px solid #dc3545", paddingLeft: 8 }, // 4回目: 赤
  { background: "#e2d9f3", borderLeft: "3px solid #6f42c1", paddingLeft: 8 }, // 5回目+: 紫
];

// === 世代タブ機構 ===
// 各セクションごとに「そのセクションが変わった世代」をタブとして表示し、
// タブをクリックするとそのセクションだけ該当世代の内容に切り替わる。
// バージョン色: v1=紫, v2=黄, v3=緑, v4=青, v5=赤（最大5世代）
var VERSION_COLOR_PALETTE = [
  { tab: "#6f42c1", tabText: "#fff", text: "#6f42c1", name: "紫" }, // v1
  { tab: "#ffc107", tabText: "#1a1a14", text: "#a06800", name: "黄" }, // v2
  { tab: "#28a745", tabText: "#fff", text: "#1e7e34", name: "緑" }, // v3
  { tab: "#007bff", tabText: "#fff", text: "#0056b3", name: "青" }, // v4
  { tab: "#dc3545", tabText: "#fff", text: "#a71d2a", name: "赤" }, // v5
];

// セクション定義: 中区分7セクション。タブ判定とテキスト色変更の基準パスを保持
var SECTION_DEFS = [
  { key: "benefit", paths: ["benefit"] },
  { key: "advantage", paths: ["advantage"] },
  { key: "customer", paths: ["three_c.customer"] },
  { key: "competitor", paths: ["three_c.competitor"] },
  { key: "company", paths: ["three_c.company"] },
  { key: "strategy_message", paths: ["strategy_message"] },
  { key: "checkpoints", paths: ["checkpoints"] },
];

function getValueByPath(obj, path) {
  if (!obj) return undefined;
  return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
}

function pathChangedBetween(path, resultA, resultB) {
  return JSON.stringify(getValueByPath(resultA, path)) !== JSON.stringify(getValueByPath(resultB, path));
}

// セクションが画面上で実際に表示するデータを抽出する。
// 組み合わせパターン（combinations）がある場合は選択中の combo のデータ、
// 無い場合は top-level の該当パスのデータを返す。
// これがないと、top-level だけが更新されても表示は combo データから来ているため
// 「v1 と v2 で内容が同じなのに v2 タブが出る」という事象が起きる。
function getDisplayedSectionData(result, sectionKey, selectedCombinationId) {
  if (!result) return undefined;
  var hasCombos = Array.isArray(result.combinations) && result.combinations.length > 0;
  if (hasCombos) {
    var combo = result.combinations.find(function (c) { return c && c.id === selectedCombinationId; }) || result.combinations[0];
    if (!combo) return undefined;
    switch (sectionKey) {
      case "benefit": return combo.benefit;
      case "advantage": return combo.advantage;
      case "customer": return combo.customer;
      case "competitor": return combo.competitor;
      case "company": {
        var allStrengths = Array.isArray(result.company_core?.all_strengths) ? result.company_core.all_strengths : [];
        var usedIdx = Array.isArray(combo.strengths_used) ? combo.strengths_used : [];
        var usedStrengths = usedIdx.length > 0
          ? usedIdx.map(function (i) { return allStrengths[i]; }).filter(Boolean)
          : allStrengths;
        return {
          strength: usedStrengths,
          structure: result.company_core?.structure || "",
          passion: result.company_core?.passion || "",
        };
      }
      case "strategy_message": return combo.strategy_message;
      case "checkpoints": return combo.checkpoints;
      default: return undefined;
    }
  }
  // combinations なしの旧形式
  switch (sectionKey) {
    case "benefit": return result.benefit;
    case "advantage": return result.advantage;
    case "customer": return result.three_c?.customer;
    case "competitor": return result.three_c?.competitor;
    case "company": return result.three_c?.company;
    case "strategy_message": return result.strategy_message;
    case "checkpoints": return result.checkpoints;
    default: return undefined;
  }
}

// セクションが「currentIdx vs prevIdx」で実際に表示データとして変化していれば true
function sectionChangedBetween(versions, sectionKey, currentIdx, prevIdx, selectedCombinationId) {
  if (!versions[currentIdx] || !versions[prevIdx]) return false;
  var a = getDisplayedSectionData(versions[currentIdx].result, sectionKey, selectedCombinationId);
  var b = getDisplayedSectionData(versions[prevIdx].result, sectionKey, selectedCombinationId);
  return JSON.stringify(a) !== JSON.stringify(b);
}

// 指定セクションのタブ配列を返す（古い順 = 表示順）
// versions は新しい順（[0]=最新）。タブの index は versions の data index。
// selectedCombinationId を渡すと、その combo のデータベースで差分判定する（combo がある場合）。
function getSectionTabs(versions, sectionKey, selectedCombinationId) {
  if (!Array.isArray(versions) || versions.length === 0) return [];
  var tabs = [];
  // 一番古い（v1）から新しい方へ走査
  for (var i = versions.length - 1; i >= 0; i--) {
    var isInitial = i === versions.length - 1;
    if (isInitial || sectionChangedBetween(versions, sectionKey, i, i + 1, selectedCombinationId)) {
      tabs.push({ index: i, isInitial: isInitial });
    }
  }
  return tabs;
}

// versions の dataIdx に対する「v番号」(1始まり、古い=v1)
function versionDisplayNumber(versions, dataIdx) {
  return versions.length - dataIdx;
}

// ----------------------------------------------------------------------
// 新規事業向けの構造化入力（テキスト分析）ヘルパー
// 構想フェーズの方向け: フリーテキスト1枠ではなく、観点別に分けて入力してもらう。
// 入力された各フィールドを 【ラベル】...\n... の形式で結合して /api/analyze に渡す。
// ----------------------------------------------------------------------
const BUSINESS_PLAN_FIELDS = [
  { key: "origin", label: "事業を始めたきっかけ・原体験", placeholder: "例：自分が子育てで困った経験から、同じ悩みを持つ親を助けたいと思った。前職で○○の課題を肌で感じていた。" },
  { key: "problem", label: "解決したい問題と現状の代替手段", placeholder: "例：地方の高齢者がスマホ操作で困っている。現状は家族に聞くか、量販店スタッフに頼るしかない。" },
  { key: "value", label: "商品・サービスの構想", placeholder: "例：訪問型でスマホ操作を1時間マンツーマン指導。本人が自分で使えるようになるまで伴走する。" },
  { key: "customer", label: "想定顧客の具体像", placeholder: "例：60代以上の方で、スマホは持っているが LINE と電話以外は使えていない人。子供は遠方に住んでいる。" },
  { key: "revenue", label: "想定収益モデル", placeholder: "例：1回1時間 5,000円の訪問サポート。月額3,000円の電話サポートも併売。" },
];

function buildBusinessPlanText(bp) {
  if (!bp || typeof bp !== "object") return "";
  var parts = BUSINESS_PLAN_FIELDS
    .filter(function(f) { return (bp[f.key] || "").trim(); })
    .map(function(f) { return "【" + f.label + "】\n" + (bp[f.key] || "").trim(); });
  // タイトルは特別扱い: 結合テキストの先頭に置く
  if ((bp.title || "").trim()) {
    parts = ["【タイトル】\n" + bp.title.trim()].concat(parts);
  }
  return parts.join("\n\n");
}

// 構造化入力テキスト（【ラベル】...）を戦略策定チャットで読みやすい形式に変換する。
// 【ラベル】 を ■ ラベル に置き換え、ユーザーが書いた構造化入力を user role メッセージとして
// チャット冒頭に表示するため。
function formatStructuredInputForChat(text) {
  if (typeof text !== "string" || !text.trim()) return "";
  if (!/【[^】]+】/.test(text)) return ""; // マーカーが無ければ構造化入力ではないので無視
  var body = text.replace(/【([^】]+)】/g, "■ $1");
  return "以下の内容で分析を依頼しました。\n\n" + body;
}

// currentInput や savedText からタイトルだけを抽出する。
// 戻り値: { title: 抽出されたタイトル文字列 or "", rest: タイトルを除いた本文 }
function extractBusinessPlanTitle(text) {
  if (typeof text !== "string" || !text.trim()) return { title: "", rest: text || "" };
  var m = text.match(/【タイトル】([\s\S]*?)(?=【[^】]+】|$)/);
  if (m) {
    var t = m[1].trim();
    var rest = (text.slice(0, m.index) + text.slice(m.index + m[0].length)).trim();
    return { title: t, rest: rest };
  }
  return { title: "", rest: text };
}

// 過去のラベル名（リネーム前）も復元できるよう alias 一覧を持つ。
// key → そのキーで過去に使われた可能性のあるラベル名（新→旧の順）
const BUSINESS_PLAN_LABEL_ALIASES = {
  value: ["商品・サービスの構想", "提供価値の仮説"],
};

function parseBusinessPlanText(text) {
  var parsed = { title: "", origin: "", problem: "", value: "", customer: "", revenue: "" };
  if (typeof text !== "string" || !text.trim()) return { parsed: parsed, foundAny: false };
  var foundAny = false;
  // タイトルの抽出
  var titleMatch = text.match(/【タイトル】([\s\S]*?)(?=【[^】]+】|$)/);
  if (titleMatch) {
    parsed.title = titleMatch[1].trim();
    foundAny = true;
  }
  BUSINESS_PLAN_FIELDS.forEach(function(f) {
    var candidates = (BUSINESS_PLAN_LABEL_ALIASES[f.key] || [f.label]);
    if (candidates.indexOf(f.label) === -1) candidates = [f.label].concat(candidates);
    for (var i = 0; i < candidates.length; i++) {
      var escaped = candidates[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var re = new RegExp("【" + escaped + "】([\\s\\S]*?)(?=【[^】]+】|$)");
      var m = text.match(re);
      if (m) {
        parsed[f.key] = m[1].trim();
        foundAny = true;
        break; // 1キー1ヒットで打ち切り
      }
    }
  });
  return { parsed: parsed, foundAny: foundAny };
}

// バージョン番号 1〜5 に対応する色を返す（5世代を超えても5色目を使い続ける）
function getVersionColor(versionNumber) {
  var idx = Math.min(Math.max(versionNumber - 1, 0), VERSION_COLOR_PALETTE.length - 1);
  return VERSION_COLOR_PALETTE[idx];
}

// セクション内のカードについて「activeIdx で変わったカードのパス集合」を返す
// 比較は activeIdx vs activeIdx+1（古い方）。activeIdx が末尾（v1）なら空集合。
function getChangedCardPathsAt(versions, cardPaths, activeIdx) {
  if (!Array.isArray(versions) || activeIdx == null) return new Set();
  if (activeIdx >= versions.length - 1) return new Set();
  var changed = new Set();
  cardPaths.forEach(function (p) {
    if (pathChangedBetween(p, versions[activeIdx].result, versions[activeIdx + 1].result)) {
      changed.add(p);
    }
  });
  return changed;
}

// セクション単位で「実際に切替可能な世代タブが存在するか」を判定するヘルパー。
// idx === 0 は常に「最新表示中」。idx > 0 でもタブが1個以下なら、UI上タブは出ていないので
// 「過去の世代表示中」とは扱わない（avps が前の操作で残っていても無効化）。
function isViewingOldForSection(versions, sectionKey, idx, selectedCombinationId) {
  if (!Array.isArray(versions) || versions.length <= 1) return false;
  if (!idx || idx === 0) return false;
  var tabs = getSectionTabs(versions, sectionKey, selectedCombinationId);
  return tabs.length > 1;
}

// 世代タブのスタイル小コンポーネント
function VersionTabBar({ versions, sectionKey, selectedCombinationId, active, onChange, disabled }) {
  if (!Array.isArray(versions) || versions.length <= 1) return null;
  var tabs = getSectionTabs(versions, sectionKey, selectedCombinationId);
  // タブが1つ以下のセクション（＝そのセクションは世代間で変化していない）は
  // 世代切替コントロール自体を表示しない。1個しかないタブを押せてしまうと
  // 「実質的に最新と同じ内容なのに過去の世代扱い」というおかしい状態になるため。
  if (tabs.length <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#78716c", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em", marginRight: 4 }}>世代</span>
      {tabs.map(function (t) {
        var num = versionDisplayNumber(versions, t.index);
        var col = getVersionColor(num);
        var isActive = active === t.index;
        var isLatest = t.index === 0;
        var confirmed = versions[t.index]?.confirmed === true;
        return (
          <button
            key={t.index}
            onClick={disabled ? undefined : function () { onChange && onChange(sectionKey, t.index); }}
            disabled={disabled}
            title={(isLatest ? "最新" : "過去の世代") + (confirmed ? "・確定済み" : "") + (t.isInitial ? "・初回" : "")}
            style={{
              background: isActive ? col.tab : "#fff",
              color: isActive ? col.tabText : col.text,
              border: "1.5px solid " + col.tab,
              borderRadius: 14,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.04em",
              cursor: disabled ? "not-allowed" : "pointer",
              lineHeight: 1.4,
              opacity: disabled ? 0.6 : 1,
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            v{num}{isLatest ? "（最新）" : ""}{confirmed ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

const SubLabel = ({ color, text, onChat, help }) => (
  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, letterSpacing: "0.1em", color, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, position: "relative" }} {...(onChat ? hoverShow : {})}>
    <span>{text}</span>
    {help && <HelpTip text={help} />}
    {onChat && <ChatBtn onClick={onChat} />}
  </div>
);

// 戦略の組み合わせパターン3案を縦並びで表示するセクション（サマリー表示）。
// 新スキーマ（per-combination 完全AB3C）から、各パターンの要点を抽出して表示。
// 各パターンに「深掘りする」ボタンがあり、選択中のパターンは赤枠でハイライトされる。
// Phase B再 でタブ式の完全AB3C表示UIに作り直す予定。
function CombinationsSection({ d, selectedCombinationId, onSelectCombination, onChat }) {
  if (!d?.combinations || !Array.isArray(d.combinations) || d.combinations.length === 0) {
    return null;
  }
  const combinations = d.combinations;
  const recommendedId = d.recommended_combination_id;
  const selectedId = selectedCombinationId || recommendedId || combinations[0]?.id;
  const companyCore = d.company_core || {};
  return (
    <div style={{ marginBottom: 32 }}>
      <SectionLabel
        color={C.phase1}
        letter="P"
        jp="戦略の組み合わせパターン"
        en="STRATEGY COMBINATIONS"
        desc="ターゲット×ベネフィットの切り口を3案提示。深掘りしたい1つを選んでください"
        help="AB3C本来の考え方では、ターゲットとベネフィットがセットで決まり、それに応じて競合・自社の強み・戦略メッセージが絞り込まれます。最も強い1つを選んで深掘りしましょう。"
      />
      <div style={{ background: C.phase1Bg, padding: "12px 16px", borderRadius: 4, fontSize: 15, lineHeight: 1.7, marginBottom: 18, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
        AIが3つの組み合わせを提案しました。各パターンは <b>別のターゲット・別の競合・別の自社強み</b> に焦点を当てています。
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {combinations.map(combo => (
          <CombinationCard
            key={combo.id}
            combo={combo}
            companyCore={companyCore}
            isSelected={combo.id === selectedId}
            isRecommended={combo.id === recommendedId}
            onSelect={() => onSelectCombination && onSelectCombination(combo.id)}
            onChat={onChat}
          />
        ))}
      </div>
    </div>
  );
}

// 新スキーマ対応: combo.benefit/advantage/strategy_message などはオブジェクト構造に。
// サマリー表示なので各オブジェクトから要点（core, what, message, target, etc.）だけ抽出する。
function CombinationCard({ combo, companyCore, isSelected, isRecommended, onSelect, onChat }) {
  const borderColor = isSelected ? C.B : C.border;
  const headerBg = isSelected ? C.B : C.ink;
  const cardBg = isSelected ? "#fff5f5" : "#ffffff";
  const askChat = onChat ? () => onChat(`組み合わせパターン「${trimRouteSuffix(combo?.label) || ""}」をベースにさらに深掘りしてください`) : null;
  const sansFont = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

  // 新スキーマからサマリー表示用の文字列を安全に抽出
  const targetText = combo?.customer?.target || "";
  const benefitText = combo?.benefit?.core || "";
  const advantageText = combo?.advantage?.what || "";
  const strategyMessageText = combo?.strategy_message?.message || "";
  // 競合：direct から最大2件、URL部分は表示しない
  const directList = Array.isArray(combo?.competitor?.direct) ? combo.competitor.direct : [];
  const competitorText = directList.slice(0, 2)
    .map(d => (typeof d === "string" ? d.split("｜")[0] : ""))
    .filter(Boolean)
    .join(" / ");
  // 自社強み：strengths_used のindexで company_core.all_strengths を解決
  const allStrengths = Array.isArray(companyCore?.all_strengths) ? companyCore.all_strengths : [];
  const usedIdx = Array.isArray(combo?.strengths_used) ? combo.strengths_used : [];
  const strengthText = usedIdx.length > 0 && allStrengths.length > 0
    ? usedIdx.slice(0, 2).map(i => allStrengths[i]).filter(Boolean).join(" / ")
    : "";

  const Row = ({ label, labelColor, valueBold, value }) => (
    <>
      <div style={{ fontWeight: 700, color: labelColor || "#444", paddingTop: 8, fontSize: 14, fontFamily: sansFont }}>{label}</div>
      <div style={{ paddingTop: 8, fontSize: 16, lineHeight: 1.7, fontWeight: valueBold ? 700 : 400, color: C.ink, fontFamily: sansFont }}>{value || "—"}</div>
    </>
  );
  return (
    <div style={{
      background: cardBg,
      border: `2px solid ${borderColor}`,
      borderRadius: 6,
      padding: "20px 24px",
      boxShadow: isSelected ? `0 0 0 4px rgba(255,0,0,0.12)` : "none",
      transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
      position: "relative",
    }} {...(askChat ? hoverShow : {})}>
      {/* ラベルとバッジ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{
          background: headerBg, color: "#fff",
          padding: "8px 16px", fontSize: 17, fontWeight: 700,
          borderRadius: 4, fontFamily: "'Noto Serif JP', serif",
        }}>
          パターン{combo?.id || ""}：{trimRouteSuffix(combo?.label) || ""}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isRecommended && (
            <span style={{ background: "#fef3c7", color: "#854d0e", padding: "6px 12px", fontSize: 13, fontWeight: 700, borderRadius: 4, border: "1px solid #fbbf24", fontFamily: sansFont }}>
              ⭐ AIのおすすめ
            </span>
          )}
          {isSelected && (
            <span style={{ background: C.B, color: "#fff", padding: "6px 12px", fontSize: 13, fontWeight: 700, borderRadius: 4, fontFamily: sansFont }}>
              ✓ 深掘り中
            </span>
          )}
        </div>
      </div>

      {/* 詳細グリッド */}
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", columnGap: 14, rowGap: 0, marginBottom: 16, borderTop: `1px dashed ${C.border}`, borderBottom: `1px dashed ${C.border}`, paddingBottom: 8 }}>
        <Row label="ターゲット" value={targetText} />
        <Row label="Benefit" labelColor={C.B} valueBold value={benefitText} />
        <Row label="競合" value={competitorText} />
        <Row label="自社の強み" value={strengthText} />
        <Row label="Advantage" labelColor={C.A} valueBold value={advantageText} />
      </div>

      {/* 戦略メッセージ */}
      <div style={{ background: "#2a2a26", color: "#fff", padding: "16px 20px", borderRadius: 4, marginBottom: 16 }}>
        <div style={{ display: "inline-block", background: "#fff", color: "#2a2a26", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: 999, marginBottom: 12 }}>戦略メッセージ</div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, lineHeight: 1.6, fontWeight: 700 }}>{strategyMessageText || "—"}</div>
      </div>

      {/* アクションボタン */}
      {!isSelected ? (
        <button
          onClick={onSelect}
          style={{
            background: C.B, color: "#fff", border: "none", borderRadius: 4,
            padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: sansFont,
          }}
        >
          このパターンで深掘りする →
        </button>
      ) : (
        <div style={{ fontSize: 14, color: C.ink, fontFamily: sansFont }}>
          ✓ このパターンで深掘り中（チャットで磨いてください）
        </div>
      )}

      {askChat && <ChatBtn onClick={askChat} abs />}
    </div>
  );
}

// パターンラベル末尾の「ルート」を除去（ボタンが2行に折り返すのを防ぐため）。
// 既存データへの後方互換のため、表示直前にトリムする方式。
function trimRouteSuffix(label) {
  if (!label || typeof label !== "string") return label;
  return label.replace(/[\s　]*ルート$/, "");
}

// パターン別の固有色（AB3Cの赤・青・黒、フェーズ色のティール・オレンジを避けて選定）。
// 選択中の色とラベル色を一致させることで、どのパターンを見ているかを直感的に伝える。
// P1の緑は phase1 ティールと紛らわしかったため、ローズに変更。
const PATTERN_COLORS = ["#be185d", "#6b21a8", "#78350f"]; // ローズ・紫・茶
function patternColor(id) {
  if (!id) return "#444";
  return PATTERN_COLORS[(Number(id) - 1) % PATTERN_COLORS.length] || "#444";
}

// 組み合わせパターンの切替コントロール（ピル型ボタン群＋現在表示中の大見出し帯）。
// タブUIではなく「切替スイッチ＋見出し」で構成し、下のAB3C本体とは
// セクション見出しによって接続される（タブのような容器メタファは持たない）。
function CombinationTabBar({ combinations, selectedId, recommendedId, onSelect }) {
  if (!Array.isArray(combinations) || combinations.length === 0) return null;
  const sansFont = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
  const selectedCombo = combinations.find(c => c?.id === selectedId);
  return (
    <div style={{ marginBottom: 32 }}>
      {/* 切替コントロール（ピル型ボタン群） — 気付かれにくいというフィードバックを受けて余白・文字サイズ・影を強化 */}
      <div style={{
        marginBottom: 18,
        background: "#fff8e6",
        border: "1px solid #fbbf24",
        borderRadius: 8,
        padding: "16px 18px 18px",
      }}>
        <div style={{ fontSize: 17, color: C.ink, marginBottom: 12, fontFamily: sansFont, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>👇</span>
          <span>戦略パターンを切り替え</span>
          <span style={{ fontWeight: 400, color: "#666", marginLeft: 4, fontSize: 14 }}>
            （AIが3案提案。ボタンを押すと下の分析が切り替わります）
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {combinations.map(combo => {
            const isSelected = combo.id === selectedId;
            const isRecommended = combo.id === recommendedId;
            const myColor = patternColor(combo.id);
            return (
              <button
                key={combo.id}
                onClick={() => onSelect && onSelect(combo.id)}
                style={{
                  // 選択中：パターン固有色（緑/紫/茶）。未選択でも左側に色帯を残してパターン色を予告。
                  background: isSelected ? myColor : "#ffffff",
                  color: isSelected ? "#fff" : C.ink,
                  border: isSelected ? `2px solid ${myColor}` : `2px solid #c8c8c4`,
                  borderLeft: isSelected ? `2px solid ${myColor}` : `8px solid ${myColor}`,
                  borderRadius: 999,
                  padding: "14px 24px",
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: sansFont,
                  transition: "background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  lineHeight: 1.2,
                  boxShadow: isSelected ? "0 3px 8px rgba(0,0,0,0.18)" : "0 2px 4px rgba(0,0,0,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = isSelected ? "0 5px 12px rgba(0,0,0,0.25)" : "0 4px 10px rgba(0,0,0,0.18)";
                  if (!isSelected) {
                    e.currentTarget.style.background = "#f5f5f0";
                    e.currentTarget.style.borderColor = "#888";
                    e.currentTarget.style.borderLeftColor = myColor;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isSelected ? "0 3px 8px rgba(0,0,0,0.18)" : "0 2px 4px rgba(0,0,0,0.08)";
                  if (!isSelected) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#c8c8c4";
                    e.currentTarget.style.borderLeftColor = myColor;
                  }
                }}
              >
                {/* 「PX」ピル：選択中は白抜き＋色文字（ボタン背景の反転）、未選択は色＋白文字（見出し帯のバッジと同じ） */}
                <span style={{
                  background: isSelected ? "#fff" : myColor,
                  color: isSelected ? myColor : "#fff",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 999,
                  letterSpacing: "0.05em",
                }}>P{combo.id}</span>
                <span>{trimRouteSuffix(combo.label)}</span>
                {isRecommended && (
                  <span style={{
                    background: isSelected ? "rgba(255,255,255,0.22)" : "#fef3c7",
                    color: isSelected ? "#fff" : "#854d0e",
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    border: isSelected ? "1px solid rgba(255,255,255,0.4)" : "1px solid #fbbf24",
                  }}>
                    ⭐ おすすめ
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択中パターンの紹介＋戦略メッセージ（タイトル）を一体化したカード */}
      {selectedCombo && (
        <div style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <div style={{ background: patternColor(selectedCombo.id), height: 10 }} />
          <div style={{ padding: "16px 22px" }}>
            {/* パターン識別行：P{id} バッジ + ターゲット説明（誰向け？） */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                background: patternColor(selectedCombo.id),
                color: "#fff",
                fontFamily: "'Space Mono', monospace",
                fontSize: 14,
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: 999,
                letterSpacing: "0.05em",
              }}>
                P{selectedCombo.id}
              </span>
              <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
                {trimRouteSuffix(selectedCombo.label)}
              </span>
            </div>
            {/* 戦略メッセージ（タイトル）：このパターンの提供価値の核心 */}
            {selectedCombo.strategy_message?.message && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "inline-block", background: "#2a2a26", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: 999, marginBottom: 12 }}>戦略メッセージ</div>
                <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: C.ink, lineHeight: 1.5 }}>
                  {selectedCombo.strategy_message.message}
                </div>
                {(selectedCombo.strategy_message.benefit_part || selectedCombo.strategy_message.advantage_part) && (
                  <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.8, color: "#555", fontFamily: sansFont }}>
                    {selectedCombo.strategy_message.benefit_part && (
                      <div><b style={{ color: C.B }}>Benefit：</b>{selectedCombo.strategy_message.benefit_part}</div>
                    )}
                    {selectedCombo.strategy_message.advantage_part && (
                      <div><b style={{ color: C.A }}>Advantage：</b>{selectedCombo.strategy_message.advantage_part}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 1つの combination から、ResultView の既存セクション表示用の result-like オブジェクト（shadowResult）を組み立てる。
// 既存の `d.benefit / d.advantage / d.three_c / d.strategy_message / d.checkpoints` を読む render コードに、
// 組み合わせごとのデータをそのまま流し込めるようにすることで、ResultView 本体の render 部の大幅な書き換えを避ける。
// company.strength は company_core.all_strengths を strengths_used のindexで解決する。
function buildShadowResultFromCombo(combo, companyCore) {
  if (!combo) return null;
  const allStrengths = Array.isArray(companyCore?.all_strengths) ? companyCore.all_strengths : [];
  const allEvals = Array.isArray(companyCore?.all_strengths_evaluations) ? companyCore.all_strengths_evaluations : [];
  const usedIdx = Array.isArray(combo.strengths_used) ? combo.strengths_used : [];
  const pickByIdx = (arr) => usedIdx.length > 0 ? usedIdx.map(i => arr[i]).filter(Boolean) : arr;
  const usedStrengths = pickByIdx(allStrengths);
  const usedEvaluations = pickByIdx(allEvals);
  return {
    benefit: combo.benefit || {},
    advantage: combo.advantage || {},
    three_c: {
      customer: combo.customer || {},
      competitor: combo.competitor || { direct: [], indirect: [] },
      company: {
        strength: usedStrengths,
        // 強みの根拠評価（5段階）を並列配列で持つ。
        // needs_chat_confirmation: true の項目に UI で赤丸シグナルを表示する。
        strength_evaluations: usedEvaluations,
        structure: companyCore?.structure || "",
        passion: companyCore?.passion || "",
      },
    },
    strategy_message: combo.strategy_message || {},
    checkpoints: Array.isArray(combo.checkpoints) ? combo.checkpoints : [],
  };
}

function ResultView({ d, onChat, changedPaths, refineSelection, onRefineToggle, versions: rawVersions, activeVersionPerSection, onSectionTabChange, selectedCombinationId, onSelectCombination }) {
  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };
  const q = (section, detail) => onChat && (() => onChat(`${section}の「${(detail||"").slice(0,30)}」について詳しく教えてください`));
  const qs = (section) => onChat && (() => onChat(`${section}について詳しく教えてください`));
  var cp = changedPaths || new Map();
  var hl = function(path) { try { if (cp.has && cp.has(path)) { var n = cp.get(path); return HL_COLORS[Math.min(n - 1, HL_COLORS.length - 1)]; } return {}; } catch (e) { return {}; } };

  // === Phase B再: 組み合わせパターン対応 ===
  // d.combinations[] がある場合、選択中パターンの完全AB3Cを下のセクションで表示する。
  // 既存の `d.benefit / d.three_c / d.checkpoints` を読む render コードはそのまま活かしつつ、
  // shadowResult 経由で組み合わせごとのデータに切り替える（versions タブは抑制）。
  var hasCombinations = !!(d?.combinations && Array.isArray(d.combinations) && d.combinations.length > 0);
  var currentCombo = hasCombinations
    ? (d.combinations.find(function(c) { return c && c.id === selectedCombinationId; }) || d.combinations[0])
    : null;
  var shadowResult = currentCombo ? buildShadowResultFromCombo(currentCombo, d.company_core) : null;
  // combinations が存在しても世代タブは表示する（反映で世代履歴が追加された場合の比較を可能にする）
  var versions = rawVersions;

  // === 世代タブ機構: セクション別に表示する result を選ぶ ===
  // versions が未指定（旧呼び出し）の場合は d をそのまま使用（後方互換）
  var hasVersions = Array.isArray(versions) && versions.length > 0;
  var avps = activeVersionPerSection || {};
  // セクションキー → 表示する result
  function sectionResult(sectionKey) {
    if (hasVersions) {
      var idx = avps[sectionKey] || 0;
      if (idx > 0) {
        // 古い世代を閲覧中: その世代に combinations があれば同じ選択IDの combo を、なければ top-level を表示
        var oldR = versions[idx]?.result;
        if (oldR) {
          if (Array.isArray(oldR.combinations) && oldR.combinations.length > 0) {
            var oldCombo = oldR.combinations.find(function(c) { return c && c.id === selectedCombinationId; }) || oldR.combinations[0];
            return buildShadowResultFromCombo(oldCombo, oldR.company_core);
          }
          return oldR;
        }
      }
    }
    if (hasCombinations) return shadowResult; // 最新世代 + combinations あり
    if (!hasVersions) return d;
    return d; // 最新世代 (idx=0) または versions の先頭
  }
  // セクションキー → 「そのセクションが今アクティブな世代で変わったカードのパス集合」
  // path -> 色（カードテキストに適用する色）。changed = true なら getVersionColor(versionNumber).text
  function changedPathsForSection(sectionKey, cardPaths) {
    if (!hasVersions) return { changed: new Set(), color: null };
    var idx = avps[sectionKey] || 0;
    var changed = getChangedCardPathsAt(versions, cardPaths, idx);
    if (changed.size === 0) return { changed: changed, color: null };
    var num = versionDisplayNumber(versions, idx);
    return { changed: changed, color: getVersionColor(num).text };
  }
  function isViewingOld(sectionKey) {
    if (!hasVersions) return false;
    return isViewingOldForSection(versions, sectionKey, avps[sectionKey] || 0, selectedCombinationId);
  }
  // テキスト色適用ヘルパー（セクション内で使用）
  function txt(color, baseStyle) {
    return color ? Object.assign({}, baseStyle || {}, { color: color }) : (baseStyle || {});
  }

  // 各セクションのデータ・変更カード集合を準備
  var benefitData = (sectionResult("benefit") || {}).benefit || {};
  var benefitChanges = changedPathsForSection("benefit", ["benefit.needs", "benefit.wants"]);
  var advantageData = (sectionResult("advantage") || {}).advantage || {};
  var advantageChanges = changedPathsForSection("advantage", ["advantage.what", "advantage.why_good", "advantage.why_hard_to_copy"]);
  var customerData = ((sectionResult("customer") || {}).three_c || {}).customer || {};
  var customerChanges = changedPathsForSection("customer", ["three_c.customer.target", "three_c.customer.profile", "three_c.customer.stage", "three_c.customer.cutoff", "three_c.customer.market"]);
  var competitorData = ((sectionResult("competitor") || {}).three_c || {}).competitor || { direct: [], indirect: [] };
  var competitorChanges = changedPathsForSection("competitor", ["three_c.competitor.direct", "three_c.competitor.indirect"]);
  var companyData = ((sectionResult("company") || {}).three_c || {}).company || {};
  var companyChanges = changedPathsForSection("company", ["three_c.company.strength", "three_c.company.structure", "three_c.company.passion"]);
  var smData = (sectionResult("strategy_message") || {}).strategy_message || {};
  var smChanges = changedPathsForSection("strategy_message", ["strategy_message.message", "strategy_message.benefit_part", "strategy_message.advantage_part"]);
  var cpData = (sectionResult("checkpoints") || {}).checkpoints || d.checkpoints || [];
  var cpChanges = changedPathsForSection("checkpoints", ["checkpoints"]);

  // 旧世代閲覧中・組み合わせ表示中はチェックボックス操作を無効化（Phase B再: refinement は Phase E で per-combo 対応予定）
  var anyOld = ["benefit", "advantage", "customer", "competitor", "company", "strategy_message", "checkpoints"].some(isViewingOld);
  var refineToggleEffective = (anyOld || hasCombinations) ? null : onRefineToggle;
  return (
    <div>
      {/* Phase B再: 組み合わせパターンタブバー（選択中タブの完全AB3Cが下に表示される） */}
      {hasCombinations && (
        <CombinationTabBar
          combinations={d.combinations}
          selectedId={currentCombo?.id}
          recommendedId={d.recommended_combination_id}
          onSelect={onSelectCombination}
        />
      )}
      {/* === Benefit セクション === */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.B} letter="B" jp="Benefit（お客様が求める価値）" en="Needs → Wants" desc={`核心：${benefitData.core || ""}`} onChat={qs("Benefit（お客様が求める価値）")} help="お客様がその商品・サービスを通じて得られる価値です。ニーズ（まだ曖昧な欠乏感）とウォンツ（具体的な欲求）の両面から捉えます。" />
        <VersionTabBar versions={versions} sectionKey="benefit" selectedCombinationId={selectedCombinationId} active={avps.benefit || 0} onChange={onSectionTabChange} />
        <div style={g2}>
          <div style={hasVersions ? {} : hl("benefit.needs")}><Card color={C.B} title="ニーズ（欠乏感・曖昧な欲求）" onChat={qs("ニーズ")} help="お客様がまだ言語化できていない、漠然とした欠乏感や欲求。『何かを変えたい』『もっとこうしたい』という状態です。チェックを外して『絞り込んで再分析』すると、残した項目を軸に戦略を研ぎ澄ませます。" textColor={benefitChanges.changed.has("benefit.needs") ? benefitChanges.color : null}><UL items={benefitData.needs || []} onChatItem={onChat && ((item) => onChat(`ニーズの「${item.slice(0,30)}」について詳しく教えてください`))} checkable={!!refineToggleEffective} checkedIndexes={refineSelection?.needs} onToggle={refineToggleEffective && ((i) => refineToggleEffective("needs", i))} textColor={benefitChanges.changed.has("benefit.needs") ? benefitChanges.color : null} /></Card></div>
          <div style={hasVersions ? {} : hl("benefit.wants")}><Card color={C.B} title="ウォンツ（具体的欲求）" onChat={qs("ウォンツ")} help="具体的に欲しいものが決まっている欲求。『これが欲しい』『これを買いたい』と明確に意識できる状態です。" textColor={benefitChanges.changed.has("benefit.wants") ? benefitChanges.color : null}><UL items={benefitData.wants || []} onChatItem={onChat && ((item) => onChat(`ウォンツの「${item.slice(0,30)}」について詳しく教えてください`))} checkable={!!refineToggleEffective} checkedIndexes={refineSelection?.wants} onToggle={refineToggleEffective && ((i) => refineToggleEffective("wants", i))} textColor={benefitChanges.changed.has("benefit.wants") ? benefitChanges.color : null} /></Card></div>
        </div>
      </div>
      <Divider />
      {/* === Advantage セクション === */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.A} letter="A" jp="Advantage（差別的優位点・好ましい違い）" en="競合より選ばれる理由" onChat={qs("Advantage（差別的優位点）")} help="競合と比較したとき『こちらのほうがいい』と思ってもらえる違い。単なる違いではなく、お客様にとって好ましく、真似されにくい自社の強みに根差していることが重要です。" />
        <VersionTabBar versions={versions} sectionKey="advantage" selectedCombinationId={selectedCombinationId} active={avps.advantage || 0} onChange={onSectionTabChange} />
        <div style={g3}>
          <div style={hasVersions ? {} : hl("advantage.what")}><Card color={C.A} titleColor="#1a1a14" title="アドバンテージ" onChat={q("アドバンテージ", advantageData.what)} help="差別的優位点の内容を一言で表現したもの。" textColor={advantageChanges.changed.has("advantage.what") ? advantageChanges.color : null}><div style={txt(advantageChanges.changed.has("advantage.what") ? advantageChanges.color : null, { fontSize: 16, fontWeight: 700, color: "#000000", lineHeight: 1.6 })}>{advantageData.what}</div></Card></div>
          <div style={hasVersions ? {} : hl("advantage.why_good")}><Card color={C.A} titleColor="#1a1a14" title="なぜ好ましいのか" onChat={q("なぜ好ましいのか", advantageData.why_good)} help="競合と比較してなぜお客様にとって好ましい違いなのかを示します。" textColor={advantageChanges.changed.has("advantage.why_good") ? advantageChanges.color : null}><p style={txt(advantageChanges.changed.has("advantage.why_good") ? advantageChanges.color : null, { fontSize: 16, lineHeight: 1.7, color: "#000000" })}>{advantageData.why_good}</p></Card></div>
          <div style={hasVersions ? {} : hl("advantage.why_hard_to_copy")}><Card color={C.A} titleColor="#1a1a14" title="なぜ真似されにくいか" onChat={q("なぜ真似されにくいか", advantageData.why_hard_to_copy)} help="自社の強みに根差し、競合が簡単には模倣できない理由を示します。" textColor={advantageChanges.changed.has("advantage.why_hard_to_copy") ? advantageChanges.color : null}><p style={txt(advantageChanges.changed.has("advantage.why_hard_to_copy") ? advantageChanges.color : null, { fontSize: 16, lineHeight: 1.7, color: "#000000" })}>{advantageData.why_hard_to_copy}</p></Card></div>
        </div>
      </div>
      <Divider />
      {/* === 3C: Customer / Competitor / Company（それぞれ独立タブ） === */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.C} letter="3C" jp="3C分析" en="Customer · Competitor · Company" onChat={qs("3C分析")} help="Customer（お客様）・Competitor（競合）・Company（自社）の3つの観点から事業環境を分析するフレームワーク。" />
        <SubLabel color={C.C} text="Customer（お客様）" onChat={qs("Customer（お客様）分析")} help="ターゲット顧客の絞り込み。誰にとってのオンリーワンか、ニーズ段階かウォンツ段階か、切り捨てたお客様は誰かを明確にします。" />
        <VersionTabBar versions={versions} sectionKey="customer" selectedCombinationId={selectedCombinationId} active={avps.customer || 0} onChange={onSectionTabChange} />
        <div style={{ ...g2, marginBottom: 14 }}>
          <div style={hasVersions ? {} : hl("three_c.customer.target")}><Card color={C.C} title="ターゲット" onChat={q("ターゲット", customerData.target)} help="主役となるお客様像。プロフィール項目のチェックを外して絞り込み再分析すると、特定ユーザーに研ぎ澄ませた戦略に変わります。" textColor={(customerChanges.changed.has("three_c.customer.target") || customerChanges.changed.has("three_c.customer.profile")) ? customerChanges.color : null}>
            <div style={txt(customerChanges.changed.has("three_c.customer.target") ? customerChanges.color : null, { fontSize: 16, fontWeight: 700, color: C.C, marginBottom: 12 })}>{customerData.target}</div>
            <UL items={customerData.profile || []} onChatItem={onChat && ((item) => onChat(`ターゲットプロフィール「${item.slice(0,30)}」について詳しく教えてください`))} checkable={!!refineToggleEffective} checkedIndexes={refineSelection?.profile} onToggle={refineToggleEffective && ((i) => refineToggleEffective("profile", i))} textColor={customerChanges.changed.has("three_c.customer.profile") ? customerChanges.color : null} />
          </Card></div>
          <div style={hasVersions ? {} : hl("three_c.customer.stage")}><Card color={C.C} title="アプローチ段階 · 切り捨て" onChat={qs("アプローチ段階と切り捨て")} help="ターゲットが『ニーズ段階』（欠乏感・曖昧）か『ウォンツ段階』（具体的欲求）か。切り捨てたお客様（戦略的に対象外とした層）も明確化します。" textColor={(customerChanges.changed.has("three_c.customer.stage") || customerChanges.changed.has("three_c.customer.cutoff")) ? customerChanges.color : null}>
            <p style={txt(customerChanges.changed.has("three_c.customer.stage") ? customerChanges.color : null, { fontSize: 16, lineHeight: 1.65, marginBottom: 12, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" })}><b>段階：</b>{customerData.stage}</p>
            <p style={txt(customerChanges.changed.has("three_c.customer.cutoff") ? customerChanges.color : null, { fontSize: 16, lineHeight: 1.65 })}><b>切り捨てたお客様：</b>{customerData.cutoff}</p>
          </Card></div>
        </div>
        {customerData.market && (
          <div style={{ marginBottom: 14 }}>
            <Card color={C.C} title="市場規模" onChat={qs("市場規模")} help="SAM（獲得可能な最大市場）・SOM（実際に狙える市場）・成長率/トレンドから事業機会を定量化。中小企業は SOM が年商規模を上回れば十分成立します。" textColor={customerChanges.changed.has("three_c.customer.market") ? customerChanges.color : null}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px", position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SAM（獲得可能市場）</div>
                  <div style={txt(customerChanges.changed.has("three_c.customer.market") ? customerChanges.color : null, { fontSize: 16, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" })}>{customerData.market.sam}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`SAM（獲得可能市場）「${(customerData.market.sam||"").slice(0,30)}」について詳しく教えてください`)} abs />}
                </div>
                {(() => {
                  // SOM カードも UL と同様、赤い吹き出し（needs_confirmation）がある時は
                  // 黒い ChatBtn を抑制して二重表示を防ぐ（権さん指摘・2026-05-15）。
                  const somNeedsConfirm = customerData.market.adequacy === "needs_confirmation";
                  return (
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px", position: "relative" }} {...((onChat && !somNeedsConfirm) ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>SOM（実際に狙える市場）</span>
                    {/* 市場規模が ¥10億未満（needs_confirmation）の時に赤い吹き出しシグナル。
                        クリックでチャットに「目指す事業規模」の問いを投稿。 */}
                    {somNeedsConfirm && onChat && (
                      <button
                        type="button"
                        onClick={() => onChat(`SOM「${customerData.market.som || ""}」は私の目指す事業規模に対して十分でしょうか？私の現在の事業規模と、5年後の目標規模について質問してください。それを踏まえて、このパターンの市場規模が私にとって十分かどうかを判断してください。`)}
                        title={`市場規模の十分性は、本人の事業規模・目標規模を確認した方が正確に判断できます。\n${customerData.market.adequacy_note || ""}\nクリックでチャットに質問が投稿されます。`}
                        style={{ width: 22, height: 22, borderRadius: 6, border: "none", padding: 0, background: "#d23a2a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        aria-label="目標事業規模をチャットで確認"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/></svg>
                      </button>
                    )}
                  </div>
                  <div style={txt(customerChanges.changed.has("three_c.customer.market") ? customerChanges.color : null, { fontSize: 16, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" })}>{customerData.market.som}</div>
                  {/* 黒い ChatBtn は赤い吹き出しと重なるので、需要確認時は表示しない */}
                  {onChat && !somNeedsConfirm && <ChatBtn onClick={() => onChat(`SOM（実際に狙える市場）「${(customerData.market.som||"").slice(0,30)}」について詳しく教えてください`)} abs />}
                </div>
                  );
                })()}
                <div style={{ background: "#e8e8e8", borderRadius: 4, padding: "12px 14px", position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>成長率・トレンド</div>
                  <div style={txt(customerChanges.changed.has("three_c.customer.market") ? customerChanges.color : null, { fontSize: 16, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" })}>{customerData.market.growth}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`市場成長率・トレンドについて詳しく教えてください`)} abs />}
                </div>
              </div>
              {customerData.market.basis && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#f5f5f5", borderRadius: 4, borderLeft: `3px solid ${C.C}`, position: "relative" }} {...(onChat ? hoverShow : {})}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>算出根拠</div>
                  <div style={txt(customerChanges.changed.has("three_c.customer.market") ? customerChanges.color : null, { fontSize: 14, color: C.ink, lineHeight: 1.8, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" })}>{linkify(customerData.market.basis)}</div>
                  {onChat && <ChatBtn onClick={() => onChat(`市場規模の算出根拠について詳しく教えてください`)} abs />}
                </div>
              )}
            </Card>
          </div>
        )}
        <div style={g2}>
          <div>
            <SubLabel color={C.C} text="Competitor（競合）" onChat={qs("競合分析")} help="直接競合（同業）だけでなく、同じニーズを満たす異業種競合も含めて検討。『お客様がどれと比較するか』の視点で洗い出します。" />
            <VersionTabBar versions={versions} sectionKey="competitor" selectedCombinationId={selectedCombinationId} active={avps.competitor || 0} onChange={onSectionTabChange} />
            <Card color={C.C} title="直接競合 / 異業種競合" onChat={qs("競合について")} textColor={(competitorChanges.changed.has("three_c.competitor.direct") || competitorChanges.changed.has("three_c.competitor.indirect")) ? competitorChanges.color : null}>
              <UL items={[...(competitorData.direct || []), ...((competitorData.indirect || []).map(i => `↳ ${i}`))]} onChatItem={onChat && ((item) => onChat(`競合「${item.replace("↳ ","").slice(0,30)}」について詳しく教えてください`))} textColor={(competitorChanges.changed.has("three_c.competitor.direct") || competitorChanges.changed.has("three_c.competitor.indirect")) ? competitorChanges.color : null} />
            </Card>
          </div>
          <div>
            <SubLabel color={C.C} text="Company（自社）" onChat={qs("自社分析")} help="強み（できること）・仕組み（強みを生む体制やプロセス）・価値観（その源にある経営者の信念）の3層で掘り下げます。外側ほど目に見え、内側ほど真似されにくい。" />
            <VersionTabBar versions={versions} sectionKey="company" selectedCombinationId={selectedCombinationId} active={avps.company || 0} onChange={onSectionTabChange} />
            <Card color={C.C} title="強み ← 仕組み ← 価値観" onChat={qs("自社の強み・仕組み・価値観")} textColor={(companyChanges.changed.has("three_c.company.strength") || companyChanges.changed.has("three_c.company.structure") || companyChanges.changed.has("three_c.company.passion")) ? companyChanges.color : null}>
              <p style={txt(companyChanges.changed.has("three_c.company.strength") ? companyChanges.color : null, { fontSize: 16, color: C.muted, marginBottom: 4 })}>強み</p>
              <UL
                items={companyData.strength || []}
                evaluations={companyData.strength_evaluations || []}
                onConfirmItem={onChat && ((item, ev) => onChat(`「${item}」について、本人だからこそ語れる事実・経験を一緒に整理したいです。いつから、どんなきっかけで、どんな実績や経験で「これは確かな強み」と言えるのか、具体的に質問してください。`))}
                onChatItem={onChat && ((item) => onChat(`自社の強み「${item.slice(0,30)}」について詳しく教えてください`))}
                textColor={companyChanges.changed.has("three_c.company.strength") ? companyChanges.color : null}
              />
              <p style={txt(companyChanges.changed.has("three_c.company.structure") ? companyChanges.color : null, { fontSize: 16, color: C.muted, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` })}>仕組み：{companyData.structure}</p>
              <p style={txt(companyChanges.changed.has("three_c.company.passion") ? companyChanges.color : null, { fontSize: 16, color: C.muted, marginTop: 6 })}>価値観：{companyData.passion}</p></Card>
          </div>
        </div>
      </div>
      <Divider />
      {/* 戦略メッセージは選択中Pカード内（上部）に統合済みのため、ここでの重複表示は廃止 */}
      {/* === チェックポイント === */}
      <VersionTabBar versions={versions} sectionKey="checkpoints" selectedCombinationId={selectedCombinationId} active={avps.checkpoints || 0} onChange={onSectionTabChange} />
<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 28, position: "relative", ...(hasVersions && cpChanges.changed.has("checkpoints") ? { boxShadow: "0 0 0 2px " + cpChanges.color } : {}) }} {...(onChat ? hoverShow : {})}>
{onChat && <ChatBtn onClick={() => onChat("5つのチェックポイント全体の改善方法を教えてください")} abs />}
<div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16 }}>AB3C 5つのチェックポイント</div>  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {(cpData || []).map((cpItem, i) => (
      <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", lineHeight: 1.6, position: "relative" }} {...(onChat ? hoverShow : {})}>
        <Badge
          status={cpItem.status}
          onClick={onChat ? () => onChat(`チェックポイント「${cpItem.label}」の改善方法を教えてください。現在の評価: ${cpItem.comment}`) : null}
          title={onChat ? `「${cpItem.label}」の改善方法をチャットで相談` : null}
        />
        <div style={{ flex: 1, fontSize: 16, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}><b>{cpItem.label}</b><br /><span style={{ color: C.ink, fontSize: 16 }}>{cpItem.comment}</span></div>
        {onChat && <ChatBtn onClick={() => onChat(`チェックポイント「${cpItem.label}」の改善方法を教えてください。現在の評価: ${cpItem.comment}`)} abs />}
      </div>
    ))}
  </div>
  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`, textAlign: "right" }}>
    {(() => {
      const score = (cpData || []).reduce((acc, cpi) => acc + (cpi.status === "ok" ? 2 : cpi.status === "warn" ? 1 : 0), 0);
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
function AnalysisChatPanel({ isPro, analysisResult, onReanalyze, onSendTopic, onConfirmStrategy, siteId, isViewingOldVersion, isTextMode, initialUserInput }) {
  // siteId があれば siteId ベースの新キー、なければ分析結果ハッシュベース（後方互換）
  const chatKey = siteId
    ? `ab3c_analysis_chat_${siteId}`
    : `ab3c_chat_${analysisResult ? JSON.stringify(analysisResult).slice(0, 50) : 'default'}`;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  // 初期ロード完了を追跡: 初回 save 効果が空配列で LS を上書きするのを防ぐ
  const loadKeyRef = useRef(null);
  // 直前の chatKey を保持。siteId が後から設定された等で chatKey が変わった場合、
  // 旧キーから messages を引き継いで「反映ボタン押下でチャットが消える」事象を防ぐ。
  const prevChatKeyRef = useRef(null);

  // ロード + 初期メッセージ生成（chatKey が変わったら再実行）
  useEffect(() => {
    loadKeyRef.current = null; // ロード進行中マーク
    let restored = false;
    try {
      let saved = localStorage.getItem(chatKey);
      // siteId 未設定の状態（新規分析直後）でチャット→反映を行うと、
      // analysisResult ハッシュベースの chatKey が変わって messages が welcome 一行に
      // リセットされる事象が発生していた。前回 chatKey から救済して、その後の save effect で
      // 自然と新キーへ永続化されるようにする。
      if (!saved && prevChatKeyRef.current && prevChatKeyRef.current !== chatKey) {
        const migrated = localStorage.getItem(prevChatKeyRef.current);
        if (migrated) {
          saved = migrated;
          try { localStorage.setItem(chatKey, migrated); } catch (e) {}
        }
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          restored = true;
        }
      }
    } catch (e) {}
    if (!restored) {
      const welcomeContent = isTextMode
        ? "入力していただいた文章から読み取れる範囲で分析しています。文章量が少ないと精度が上がりにくいため、**ぜひこの会話で情報を追加してください**。たとえば次のような内容を教えていただけると、分析がぐっと深まります。\n\n・お客様の具体的な属性（年齢層・業種・地域・困りごと）\n・競合との違いや、お客様から選ばれている理由\n・事業の特徴・実績・歴史・こだわり\n・スタッフ体制・サービス提供の流れ\n\nまた、**新しい戦略の源や、競合に真似されにくい強みの源** は経営者ご自身の価値観や原体験から生まれることが多いです。事業の原点や譲れない想いがあれば、ぜひお聞かせください — 戦略の核を一緒に見つけます。\n\n会話が進んだら、画面下の「← この会話内容を分析に反映する」ボタンで分析結果に反映できます。\n\n各項目について質問したい時は、項目タイトル横の [[CHAT_ICON]] アイコンをクリックすると、その項目についての質問を送れます。"
        : "この分析結果はウェブサイトから読み取れる範囲の情報で作っています。足りない情報や認識違いがあれば、ぜひこの会話で教えてください。一緒に磨いていきましょう。\n\n特に **新しい戦略の源や、競合に真似されにくい強みの源** は、経営者ご自身の価値観や原体験から生まれることが多いものです。事業の原点や譲れない想いなど、ご興味があれば気軽にお話しください — お聞きしながら戦略の核を一緒に見つけます。\n\n各項目について質問したい時は、項目タイトル横の [[CHAT_ICON]] アイコンをクリックすると、その項目についての質問を送れます。";
      const initial = [];
      // テキスト分析で構造化入力（5項目+タイトル）がある場合、ユーザーが何を入力したか
      // 一目で分かるよう、チャットの一番上に user role メッセージとして表示する。
      if (isTextMode && initialUserInput) {
        const formattedInput = formatStructuredInputForChat(initialUserInput);
        if (formattedInput) {
          initial.push({ role: "user", content: formattedInput });
        }
      }
      initial.push({ role: "assistant", content: welcomeContent });
      setMessages(initial);
    }
    prevChatKeyRef.current = chatKey;
  }, [chatKey]);

  useEffect(() => {
    // block: "nearest" でチャット内コンテナだけスクロール。
    // 既定の block: "start" だとページ全体が下にスクロールしてしまい、
    // 戦略策定タブを開いた時に「Benefitが画面上端に来る」位置までずれていた。
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useEffect(() => {
    // ロード直後の最初の save 効果は LS を空配列で上書きしてしまう恐れがあるため、
    // chatKey ごとに 1 回スキップ（ロードによる setMessages が次レンダーで反映されるまで待つ）
    if (loadKeyRef.current !== chatKey) {
      loadKeyRef.current = chatKey;
      return;
    }
    try { localStorage.setItem(chatKey, JSON.stringify(messages)); } catch (e) {}
    // siteId ベースの新キーなら、親（page.js）に通知して DB 同期を起動
    if (siteId) {
      try { window.dispatchEvent(new CustomEvent("ab3c-analysis-chat-changed", { detail: { siteId } })); } catch (e) {}
    }
  }, [messages, chatKey, siteId]);

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
        body: JSON.stringify({ messages, analysisResult, reanalyze: true, siteId }),
      });
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      if (data && data.reanalyzed && data.result) {
        const summary = data.chatSummary || messages.filter(m => m.role === "user").slice(-1).map(m => m.content.slice(0, 20)).join("、");
        onReanalyze(data.result, summary);
        setMessages(prev => [...prev, { role: "assistant", content: "✓ 会話内容を反映して分析を更新しました！" }]);
      } else {
        // 失敗詳細をメッセージに表示（API エラー or HTTPステータス or 無応答）
        const httpInfo = !res.ok ? `（HTTP ${res.status}）` : "";
        const errMsg = (data && data.error) ? data.error : "再分析データの取得に失敗しました。もう一度お試しください。";
        console.error("再分析失敗:", { status: res.status, ok: res.ok, data });
        setMessages(prev => [...prev, { role: "assistant", content: `${errMsg}${httpInfo}` }]);
      }
    } catch (e) {
      console.error("再分析エラー:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "通信エラーが発生しました。回線をご確認の上もう一度お試しください。" }]);
    } finally { setLoading(false); }
  };

  if (!isPro) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.phase1Bg }}>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 16, lineHeight: 1.8, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: C.ink }}>戦略策定チャットを利用するにはログインが必要です</div>
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
        {/* 古い世代を表示中の場合は再分析・確定ボタンを非表示 */}
        {isViewingOldVersion && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#fff8e1", border: "1px solid #f0a020", borderRadius: 6, fontSize: 13, color: "#7a4f00", lineHeight: 1.6 }}>
            🕒 過去の世代を表示中です。再分析・戦略確定するには、各セクションのタブで最新世代に戻してください。
          </div>
        )}
        {/* 3. この会話内容を分析に反映する（ティール：戦略策定フェーズ色） */}
        {!isViewingOldVersion && messages.length >= 3 && (
          <button onClick={reanalyze} disabled={loading}
            style={{ width: "100%", marginTop: 10, background: loading ? C.muted : C.phase1, border: "none", borderRadius: 6, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, padding: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            {loading ? "← 再分析中..." : "← この会話内容を分析に反映する"}
          </button>
        )}
        {/* 4. 戦略を確定 — 文言と矢印で「次の場所(②)」を明示し、色は墨色で統一 */}
        {!isViewingOldVersion && onConfirmStrategy && (
          <button onClick={onConfirmStrategy}
            style={{ width: "100%", marginTop: 12, background: C.phase2, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            戦略を確定して ② 戦略アクションへ →
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
    // block: "nearest" でチャット内コンテナだけスクロール（ページ全体スクロールを防止）
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const initialized = useRef(false);

  // メッセージ保存（初期化完了後のみ、準備中は保存しない）
  useEffect(() => {
    if (initialized.current && messages.length > 0 && !messages[0]?.content?.includes("準備中")) {
      try { localStorage.setItem(`ab3c_thread_${threadSiteId || "default"}_${threadId}`, JSON.stringify(messages)); } catch (e) {}
      // 親（page.js）に通知して DB 同期を起動
      try { window.dispatchEvent(new CustomEvent("ab3c-thread-changed", { detail: { siteId: threadSiteId, threadId } })); } catch (e) {}
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
  // 新規事業向けの構造化入力。テキスト分析タブで5フィールドに分けて入力してもらう。
  const [businessPlan, setBusinessPlan] = useState({ title: "", origin: "", problem: "", value: "", customer: "", revenue: "" });
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
  // 提案書エクスポート（PPTX / PDF）の進捗状態。生成中は両ボタンを無効化する。
  const [exporting, setExporting] = useState(null); // null | "pptx" | "pdf"
  const [showPricing, setShowPricing] = useState(false);
const [showWelcome, setShowWelcome] = useState(false);
const [showUpdates, setShowUpdates] = useState(false);
const [hasUnseenUpdate, setHasUnseenUpdate] = useState(false);
// サイト上限超過モーダル（プラン切替後に「残すサイトを選択」）
// サイト上限超過モーダルは layout.js の SiteCapGuard が全ページ共通で扱うため、ここでは管理しない
const [isPro, setIsPro] = useState(false);
const [chatTickets, setChatTickets] = useState(0);
const [trialChats, setTrialChats] = useState(0);
// 選択中プラン（ヘッダーのプラン切り替えと連動）
const [activePlans, setActivePlans] = useState([]);
const [activePlanId, setActivePlanId] = useState(null);
  const [improveResult, setImproveResult] = useState(null);
  // パターンID→そのパターン向け改善レポートのキャッシュ。
  // selectedCombinationId が切り替わったとき、ここを参照して即時表示するか、
  // 未生成なら /api/improve を呼んで生成する。
  const [improveResultsByCombination, setImproveResultsByCombination] = useState({});
  const [improveSwitchLoading, setImproveSwitchLoading] = useState(false);
  const [visualMock, setVisualMock] = useState(null);
  // パターンID→そのパターン向けビジュアルモックのキャッシュ（改善レポートと同じ仕組み）
  const [visualMocksByCombination, setVisualMocksByCombination] = useState({});
  const [visualLoading, setVisualLoading] = useState(false);
  const [refineSelection, setRefineSelection] = useState({ needs: [], wants: [], profile: [] });
  const [refining, setRefining] = useState(false);
  const [refineToast, setRefineToast] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [selectedCombinationId, setSelectedCombinationId] = useState(null);
const [currentInput, setCurrentInput] = useState("");
const [overlayMessage, setOverlayMessage] = useState(null);
const [changedPaths, setChangedPaths] = useState(new Map());
// 分析結果の世代履歴（最大5世代・新しい順）。各要素 { id, result, created_at, source, confirmed }
const [analysisVersions, setAnalysisVersions] = useState([]);
// 確定履歴の「未確定エントリ」以外を一時閲覧する直前のライブ状態のバックアップ。
//   - 用途: 戦略策定中（再分析後など、未確定で作業中）に過去の確定スナップショットを
//     一時的に覗いた後、「確定中」エントリを押した時にライブ状態を復元するため。
//   - 含む: currentResult / analysisVersions / activeVersionPerSection /
//     selectedCombinationId / historyTitle / chatSummaries / chatMessages
//   - クリア条件: 再分析・新規分析・戦略確定・サイト切替で next live state が確定したとき
const [liveStateBackup, setLiveStateBackup] = useState(null);
// 各セクションがどの世代を表示しているか（key=セクションキー, value=versionsの index、0=最新）
const [activeVersionPerSection, setActiveVersionPerSection] = useState({});
// いずれかのセクションで「最新以外」を見ている場合 true（再分析・確定ボタンを非表示にするため）
// セクションのタブが1個以下（世代間で変化していない）の場合は、avps に値が残っていても
// UI上タブが非表示なので「最新表示中」扱いとする。combinations 切替時の選択 combo も
// 加味するため selectedCombinationId を渡す。
const isViewingOldVersion = Object.entries(activeVersionPerSection).some(function (entry) {
  return isViewingOldForSection(analysisVersions, entry[0], entry[1] || 0, selectedCombinationId);
});
// 世代タブのクリック: 該当セクションの表示世代を切り替え
const handleSectionTabChange = function (sectionKey, versionIndex) {
  setActiveVersionPerSection(function (prev) { return Object.assign({}, prev, ({ [sectionKey]: versionIndex })); });
};
// 新しい世代を先頭に追加（max 5）
const addAnalysisVersion = function (newResult, source) {
  setAnalysisVersions(function (prev) {
    if (!newResult) return prev;
    var head = prev[0]?.result;
    if (head && JSON.stringify(head) === JSON.stringify(newResult)) return prev;
    var newVersion = { id: Date.now(), result: newResult, created_at: new Date().toISOString(), source: source || "reanalyze", confirmed: false };
    return [newVersion].concat(prev).slice(0, 5);
  });
  setActiveVersionPerSection({}); // 新世代追加時は全セクションを最新に戻す
};
// 初回分析または完全置換用
const setVersionsFromInitial = function (result) {
  if (!result) { setAnalysisVersions([]); setActiveVersionPerSection({}); return; }
  setAnalysisVersions([{ id: Date.now(), result: result, created_at: new Date().toISOString(), source: "initial", confirmed: false }]);
  setActiveVersionPerSection({});
};
// DB から復元した versions 配列をそのまま反映
const setVersionsFromDB = function (versionsArray) {
  if (!Array.isArray(versionsArray) || versionsArray.length === 0) { setAnalysisVersions([]); setActiveVersionPerSection({}); return; }
  setAnalysisVersions(versionsArray);
  setActiveVersionPerSection({});
};
const [chatWidth, setChatWidth] = useState(500);
const [chatMinimized, setChatMinimized] = useState(false);
const chatResizing = useRef(false);
// パターン切替時の改善レポート/ビジュアル生成のレース対策（権さん指摘・2026-05-15）。
//   問題: パターンを素早く切替えると、in-flight な複数 fetch が並列で走り、
//        後から到着したレスポンスが現在表示中のパターンに合わない結果で上書きしてしまう。
//   対策: generateForCombination 呼び出しごとに gen-id を発行し、setImproveResult/setVisualMock
//        の直前で「自分が最新か」をチェック。同時に AbortController で旧 fetch をキャンセル
//        して API コストも削減する。
const latestImproveGenIdRef = useRef(0);
const improveAbortControllerRef = useRef(null);
const [confirmHistory, setConfirmHistory] = useState([]);
// クリックされた確定履歴エントリのID。サイドバーの選択中マーカー表示や
// チャット履歴の復元判定に使う。新規分析・再分析時にリセット。
const [activeConfirmId, setActiveConfirmId] = useState(null);
const [improveLoading, setImproveLoading] = useState(false);
const [siteId, setSiteId] = useState(null);
// ⓪新規戦略診断クリック時に「前のサイト」を記憶しておき、①戦略策定タブから戻れるようにする
const [previousSiteId, setPreviousSiteId] = useState(null);
const [previousSiteUrl, setPreviousSiteUrl] = useState(null);
const [previousSiteConfirmed, setPreviousSiteConfirmed] = useState(false);
// ⓪を押す前のサイトデータをキャッシュ（①/②へ戻る時にDB再取得を回避）
const [previousSiteCache, setPreviousSiteCache] = useState(null);
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

  // currentResult が変わったら、選択中の組み合わせパターンを更新。
  // - confirmed_combination_id があればそれを優先（確定履歴を開いたとき、確定したパターンが選ばれる）
  // - なければ recommended_combination_id（AIのおすすめ）
  // - それも無ければ先頭ID
  // 既存の選択IDが新しいresultに存在しない場合（再分析でcombinationsが変わった場合等）も上記の順でフォールバック。
  useEffect(() => {
    if (!currentResult?.combinations || !Array.isArray(currentResult.combinations) || currentResult.combinations.length === 0) {
      setSelectedCombinationId(null);
      return;
    }
    const validIds = currentResult.combinations.map(c => c.id);
    setSelectedCombinationId(prev => {
      if (prev && validIds.includes(prev)) return prev;
      return currentResult.confirmed_combination_id || currentResult.recommended_combination_id || validIds[0];
    });
  }, [currentResult]);

  // 指定パターン用の analysisResult を組み立てて /api/improve（必要なら /api/improve/visual も）を
  // 呼び、結果をキャッシュ＆表示。
  // - needImprove=true なら改善レポートを生成（既にキャッシュにあれば呼び出し側でスキップ）
  // - needVisual=true ならビジュアルモックも生成（改善レポートが必要・成功している場合のみ）
  async function generateForCombination(combinationId, needImprove, needVisual) {
    if (!currentResult?.combinations) return;
    const combo = currentResult.combinations.find(c => c?.id === combinationId);
    if (!combo) return;
    const allStrengths = Array.isArray(currentResult.company_core?.all_strengths) ? currentResult.company_core.all_strengths : [];
    const usedIdx = Array.isArray(combo.strengths_used) ? combo.strengths_used : [];
    const usedStrengths = usedIdx.length > 0
      ? usedIdx.map(i => allStrengths[i]).filter(Boolean)
      : allStrengths;
    const comboResult = {
      ...currentResult,
      benefit: combo.benefit || {},
      advantage: combo.advantage || {},
      three_c: {
        customer: combo.customer || {},
        competitor: combo.competitor || { direct: [], indirect: [] },
        company: {
          strength: usedStrengths,
          structure: currentResult.company_core?.structure || "",
          passion: currentResult.company_core?.passion || "",
        },
      },
      strategy_message: combo.strategy_message || {},
      checkpoints: Array.isArray(combo.checkpoints) ? combo.checkpoints : [],
    };

    // パターン切替レース対策（権さん指摘・2026-05-15）:
    //   - 旧 in-flight fetch を abort（API コスト削減）
    //   - この呼び出し固有の gen-id を発行 → setImproveResult/setVisualMock の前に
    //     最新と一致するかチェック。一致しないなら表示更新せず、キャッシュ書き込みだけ行う。
    if (improveAbortControllerRef.current) {
      try { improveAbortControllerRef.current.abort(); } catch (e) {}
    }
    const controller = new AbortController();
    improveAbortControllerRef.current = controller;
    const myGenId = ++latestImproveGenIdRef.current;
    const isLatest = () => myGenId === latestImproveGenIdRef.current;

    // Step 1: 改善レポート（テキスト）
    let improveData = improveResultsByCombination[combinationId] || null;
    if (needImprove) {
      setImproveSwitchLoading(true);
      setImproveResult(null);
      // 初回生成と同じローディングオーバーレイを出す（ピル切替時に何も起きていないように見えるのを防ぐ）
      setOverlayMessage("ウェブサイト改善レポート生成中...");
      try {
        const res = await fetch("/api/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisResult: comboResult, url: currentInput }),
          signal: controller.signal,
        });
        try { improveData = await res.json(); } catch (e) { improveData = { error: `HTTP ${res.status} 応答が解釈できませんでした` }; }
        // キャッシュは「どの combinationId 用の結果か」が明確なので常に保存しておく（次回切替時の即時表示用）
        if (res.ok && !improveData.error) {
          setImproveResultsByCombination(prev => ({ ...prev, [combinationId]: improveData }));
        }
        // 表示更新は「自分が最新のリクエストか」を確認してから（他パターンに切替済みなら破棄）
        if (!isLatest()) {
          // この generateForCombination は古い呼び出し。後続の処理（ビジュアル生成・オーバーレイ消去）も
          // しないで終了する。新しい呼び出しがそれらを担当する。
          return;
        }
        if (res.ok && !improveData.error) {
          setImproveResult(improveData);
        } else {
          setImproveResult({ error: improveData.error || `改善レポートの生成に失敗しました（HTTP ${res.status}）` });
          setOverlayMessage(null);
          return; // 改善レポート失敗時はビジュアルも生成しない
        }
      } catch (e) {
        // AbortError は意図的なキャンセル（パターン切替）なので静かに無視
        if (e?.name === "AbortError") return;
        if (!isLatest()) return;
        setImproveResult({ error: "改善レポート生成中に通信エラーが発生しました。" });
        setOverlayMessage(null);
        return;
      } finally {
        if (isLatest()) setImproveSwitchLoading(false);
      }
    }

    // Step 2: ビジュアルモック（改善レポートが揃っている場合のみ）
    // visualData は外側スコープで宣言（後段の DB 永続化処理から参照するため）
    let visualData = visualMocksByCombination[combinationId] || null;
    if (needVisual && improveData && !improveData.error) {
      setVisualLoading(true);
      setVisualMock(null);
      setOverlayMessage("改善ビジュアル生成中...");
      try {
        const res = await fetch("/api/improve/visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisResult: comboResult, improveResult: improveData, url: currentInput }),
          signal: controller.signal,
        });
        try { visualData = await res.json(); } catch (e) { visualData = { error: `HTTP ${res.status}` }; }
        // キャッシュは常に保存
        if (res.ok && !visualData.error) {
          setVisualMocksByCombination(prev => ({ ...prev, [combinationId]: visualData }));
        }
        // 表示更新は最新リクエストか確認してから
        if (!isLatest()) return;
        if (res.ok && !visualData.error) {
          setVisualMock(visualData);
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        // ビジュアル失敗は致命的ではないので静かに無視（改善レポートは表示済み）
      } finally {
        if (isLatest()) setVisualLoading(false);
      }
    }

    // 自分が古ければオーバーレイは新しい呼び出しに任せる
    if (!isLatest()) return;
    // 全て完了したらオーバーレイを消す
    setOverlayMessage(null);

    // パターン切替で生成した改善レポート/ビジュアルモックを DB に永続化する。
    // 過去はメモリのみで、確定タイミングや次回訪問時に消えていた（権さん指摘）。
    // siteId が確定している（既存サイトを開いている）場合のみ実行。
    // fire-and-forget（背景で書き込み、UI は止めない）。
    // 全パターン分のキャッシュ（improve_results_by_combination 等）も同時に保存して、
    // 次回ページ訪問時に再生成不要にする（権さん指摘 — パターン切替で毎回生成は遅すぎる）。
    try {
      if (siteId) {
        const persistBody = { id: siteId };
        if (improveData && !improveData.error) persistBody.improve_result = improveData;
        if (visualData && !visualData.error) persistBody.visual_mock = visualData;
        // 今回生成完了したパターンを by_combination キャッシュに上書き登録
        const nextImproveByCombo = { ...improveResultsByCombination };
        if (improveData && !improveData.error) nextImproveByCombo[combinationId] = improveData;
        const nextVisualByCombo = { ...visualMocksByCombination };
        if (visualData && !visualData.error) nextVisualByCombo[combinationId] = visualData;
        if (Object.keys(nextImproveByCombo).length > 0) persistBody.improve_results_by_combination = nextImproveByCombo;
        if (Object.keys(nextVisualByCombo).length > 0) persistBody.visual_mocks_by_combination = nextVisualByCombo;
        if (Object.keys(persistBody).length > 1) {
          fetch("/api/sites", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(persistBody),
          }).catch(function() {});
        }
      }
    } catch (e) {}
  }

  // パターン切替の共通ハンドラ。AB3Cセクションと改善レポートセクションのスイッチャーが
  // 両方このハンドラを使うことで「state は1つ・UIは2箇所」の同期動作を実現する。
  // 改善レポート・ビジュアルモックの両方がパターン別にキャッシュされ、未生成なら順次生成する。
  function handleCombinationSwitch(id) {
    setSelectedCombinationId(id);
    // 表示中タイトルも選択中パターンの戦略メッセージに同期（確定前の見え方が分かりやすく、
    // そのまま確定すれば履歴にもこのタイトルが残る）。
    var nextCombo = currentResult?.combinations?.find(function(c) { return c?.id === id; });
    if (nextCombo?.strategy_message?.message) {
      setHistoryTitle(nextCombo.strategy_message.message);
    }
    if (!currentInput?.startsWith("http")) return;
    if (!currentResult?.combinations) return;
    const cachedImprove = improveResultsByCombination[id];
    const cachedVisual = visualMocksByCombination[id];
    // キャッシュにあれば即時表示（パターンに対応するビジュアルが無い場合は visualMock を null にしておく）
    if (cachedImprove) setImproveResult(cachedImprove);
    setVisualMock(cachedVisual || null);
    // 初回分析中（improveLoading）と衝突しない場合のみ追加生成
    const needImprove = !cachedImprove;
    const needVisual = !cachedVisual;
    if ((needImprove || needVisual) && !improveLoading) {
      generateForCombination(id, needImprove, needVisual);
    }
  }

  // 分析結果・改善レポート・ビジュアルが変わったらlocalStorage/sessionStorageに自動保存
  // sessionStorage はページ内遷移後や決済画面からの戻りでの復元用
  useEffect(function() {
    if (currentResult && currentInput) {
      try {
        var existing = {};
        try { existing = JSON.parse(localStorage.getItem("ab3c_analysis_" + currentInput) || "{}"); } catch (e) {}
        var savedAt = analyzedAt || existing.timestamp || Date.now();
        // improveByCombo / visualByCombo: パターン別キャッシュ。空オブジェクトの場合は既存値を保持。
        var improveByComboToSave = (improveResultsByCombination && Object.keys(improveResultsByCombination).length > 0)
          ? improveResultsByCombination
          : (existing.improveByCombo || null);
        var visualByComboToSave = (visualMocksByCombination && Object.keys(visualMocksByCombination).length > 0)
          ? visualMocksByCombination
          : (existing.visualByCombo || null);
        var toSave = { result: currentResult, improve: improveResult || existing.improve || null, improveByCombo: improveByComboToSave, visual: visualMock || existing.visual || null, visualByCombo: visualByComboToSave, timestamp: savedAt };
        localStorage.setItem("ab3c_analysis_" + currentInput, JSON.stringify(toSave));
        sessionStorage.setItem("ab3c_last_analysis", JSON.stringify({
          input: currentInput,
          siteId: siteId || null,
          result: currentResult,
          improveResult: improveResult || null,
          improveByCombo: improveByComboToSave,
          visualMock: visualMock || null,
          visualByCombo: visualByComboToSave,
          timestamp: savedAt,
        }));
      } catch (e) {}
    }
  }, [currentResult, improveResult, improveResultsByCombination, visualMock, visualMocksByCombination, currentInput, analyzedAt]);

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
      setVersionsFromInitial(data.result); // sessionStorage 由来は版数情報を持たないので v1 として扱う（DB から取得し直すまでの暫定）
      setCurrentInput(data.input);
      setAnalyzedAt(data.timestamp);
      if (data.input.startsWith("http")) { setUrl(data.input); setTab("url"); }
      else { setInput(data.input); setTab("text"); }
      if (data.improveResult) setImproveResult(data.improveResult);
      if (data.improveByCombo && typeof data.improveByCombo === "object") setImproveResultsByCombination(data.improveByCombo);
      if (data.visualMock) setVisualMock(data.visualMock);
      if (data.visualByCombo && typeof data.visualByCombo === "object") setVisualMocksByCombination(data.visualByCombo);
      if (data.result?.strategy_message?.message) setHistoryTitle(data.result.strategy_message.message);
      // sessionStorage 復元の場合、DB 由来の siteId・strategy_confirmed・confirmations を
      // 別途 /api/sites から取得して state を補完する。
      // これがないと「URL params 無しでセッション復元したケース」で確定履歴サイドバーが
      // 空のままになり、確定済みなのに未確定 UI のように見える（権さん指摘）。
      const inputForLookup = data.input;
      const savedSiteId = data.siteId;
      if (savedSiteId || (inputForLookup && inputForLookup.startsWith("http"))) {
        const norm = u => (u || "").replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
        fetch("/api/sites").then(r => r.json()).then(d => {
          const allSites = d.sites || [];
          let match = savedSiteId ? allSites.find(s => String(s.id) === String(savedSiteId)) : null;
          if (!match && inputForLookup) {
            const nInput = norm(inputForLookup);
            match = allSites.find(s => norm(s.site_url) === nInput);
          }
          if (!match) return;
          setSiteId(match.id);
          if (match.strategy_confirmed) setStrategyConfirmed(true);
          // 全パターンキャッシュ復元（reload 後のパターン切替を即時表示）
          if (match.improve_results_by_combination && typeof match.improve_results_by_combination === "object") {
            setImproveResultsByCombination(match.improve_results_by_combination);
          }
          if (match.visual_mocks_by_combination && typeof match.visual_mocks_by_combination === "object") {
            setVisualMocksByCombination(match.visual_mocks_by_combination);
          }
          if (Array.isArray(match.confirmations) && match.confirmations.length > 0) {
            try { localStorage.setItem("ab3c_confirmations_" + match.id, JSON.stringify(match.confirmations)); } catch (e) {}
            setConfirmHistory(match.confirmations);
          }
        }).catch(() => {});
      }
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
    // 日常の壁打ち（ChatGPT/Claude 代替の万能チャット）
    { id: "general", label: "AI秘書", icon: "💼", preset: true },
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
  // 既存ユーザー向けマイグレーション: 保存済み threads に "general" がなければ先頭に追加
  const ensureGeneralTheme = (loadedThreads) => {
    if (!Array.isArray(loadedThreads) || loadedThreads.length === 0) return loadedThreads;
    if (loadedThreads.some(t => t && t.id === "general")) return loadedThreads;
    return [{ id: "general", label: "AI秘書", icon: "💼", preset: true }, ...loadedThreads];
  };

  // スレッド初期化（戦略確定時）
  useEffect(() => {
    if (strategyConfirmed && threads.length === 0) {
      const storageKey = `ab3c_threads_${siteId || "default"}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setThreads(ensureGeneralTheme(JSON.parse(saved)));
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
    // 過去は label と description の2段プロンプトだったが、
    // 「OKを押してもまたウィンドウが出る」と戸惑う声があったので
    // 1つのプロンプトに統合。入力したテキストがチャット名 = AI への
    // 相談トピックになる仕様にする。
    const label = prompt("このチャットで相談したい内容を入力してください\n（例: TOPページのSEOを改善したい）");
    if (!label?.trim()) return;
    const trimmed = label.trim();
    const newChat = { id: `${themeId}_${Date.now()}`, label: trimmed, description: trimmed };
    setThemeChats(prev => ({ ...prev, [themeId]: [...(prev[themeId] || []), newChat] }));
    setActiveChatId(newChat.id);
  };

  // サブチャットを削除（壊れたチャット救済用）
  const deleteSubChat = (themeId, chatId) => {
    if (!confirm("このチャットを削除しますか？\n（このチャットでの会話履歴も消えます）")) return;
    setThemeChats(prev => ({ ...prev, [themeId]: (prev[themeId] || []).filter(c => c.id !== chatId) }));
    if (activeChatId === chatId) setActiveChatId(null);
    // localStorage のチャット履歴もクリア
    try {
      const key = `ab3c_thread_${siteId || "default"}_${chatId}`;
      localStorage.removeItem(key);
    } catch (e) {}
  };

  // スレッド永続化（LS）
  useEffect(() => {
    if (threads.length > 0) {
      const storageKey = `ab3c_threads_${siteId || "default"}`;
      try { localStorage.setItem(storageKey, JSON.stringify(threads)); } catch (e) {}
    }
  }, [threads]);

  // 戦略アクションフェーズの DB 同期（debounce 1.5s）
  // threads/themeChats/actions/各threadのmessagesをまとめて PUT
  const actionDataPutTimerRef = useRef(null);
  const queueActionDataPut = () => {
    if (!siteId) return;
    if (actionDataPutTimerRef.current) clearTimeout(actionDataPutTimerRef.current);
    actionDataPutTimerRef.current = setTimeout(() => {
      // themeChats を辿って各 chatId のメッセージを LS から収集
      const tm = {};
      try {
        Object.values(themeChats || {}).forEach((chats) => {
          if (Array.isArray(chats)) chats.forEach((c) => {
            try {
              const saved = localStorage.getItem("ab3c_thread_" + siteId + "_" + c.id);
              if (saved) tm[c.id] = JSON.parse(saved);
            } catch (e) {}
          });
        });
      } catch (e) {}
      fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: siteId,
          threads,
          theme_chats: themeChats,
          thread_messages: tm,
          actions,
        }),
      }).catch(() => {});
    }, 1500);
  };

  // threads / themeChats / actions のいずれかが変わったら DB 同期をキュー
  useEffect(() => {
    if (!strategyConfirmed || !siteId) return;
    queueActionDataPut();
  }, [threads, themeChats, actions]);

  // ThreadChat からのメッセージ更新通知でも DB 同期
  useEffect(() => {
    if (!siteId) return;
    const onThreadChanged = (e) => {
      if (e?.detail?.siteId && e.detail.siteId !== siteId) return;
      queueActionDataPut();
    };
    window.addEventListener("ab3c-thread-changed", onThreadChanged);
    return () => window.removeEventListener("ab3c-thread-changed", onThreadChanged);
  }, [siteId, threads, themeChats, actions]);

  // 戦略策定チャットの DB 同期（debounce 1.5s）
  const analysisChatPutTimerRef = useRef(null);
  useEffect(() => {
    if (!siteId) return;
    const onAnalysisChatChanged = (e) => {
      if (e?.detail?.siteId && e.detail.siteId !== siteId) return;
      if (analysisChatPutTimerRef.current) clearTimeout(analysisChatPutTimerRef.current);
      analysisChatPutTimerRef.current = setTimeout(() => {
        try {
          const saved = localStorage.getItem("ab3c_analysis_chat_" + siteId);
          const msgs = saved ? JSON.parse(saved) : [];
          if (Array.isArray(msgs)) {
            fetch("/api/sites", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: siteId, analysis_chat: msgs }),
            }).catch(() => {});
          }
        } catch (e) {}
      }, 1500);
    };
    window.addEventListener("ab3c-analysis-chat-changed", onAnalysisChatChanged);
    return () => window.removeEventListener("ab3c-analysis-chat-changed", onAnalysisChatChanged);
  }, [siteId]);

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
      const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        input: inputText,
        result: resultData,
        improveResult: improveResult || null,
        visualMock: visualMock || null,
        // 全パターン分のキャッシュも一緒に保存。シェア先でタブ切替できるようにする。
        improveResultsByCombination: improveResultsByCombination && Object.keys(improveResultsByCombination).length > 0 ? improveResultsByCombination : null,
        visualMocksByCombination: visualMocksByCombination && Object.keys(visualMocksByCombination).length > 0 ? visualMocksByCombination : null,
      }) });
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

  // 提案書エクスポート: PPTX / PDF
  // 「表示中のパターン」の結果（currentResult）と、それに対応する改善レポートを使ってスライドを構築する。
  // 印刷ボタンと同じ「現在表示中のパターンを書き出す」挙動を踏襲。
  const exportProposal = async (format) => {
    if (!currentResult || exporting) return;
    setExporting(format);
    try {
      // 3パターン構成（combinations）の場合は、選択中パターンの shadow result を生成して使う。
      // 通常構成（旧データ）の場合は currentResult をそのまま使う。
      let resultForExport = currentResult;
      const hasCombinations = !!(currentResult?.combinations && Array.isArray(currentResult.combinations) && currentResult.combinations.length > 0);
      if (hasCombinations) {
        const currentCombo = currentResult.combinations.find(c => c && c.id === selectedCombinationId) || currentResult.combinations[0];
        const shadow = buildShadowResultFromCombo(currentCombo, currentResult.company_core);
        if (shadow) resultForExport = shadow;
      }

      // 現在表示中のパターンに対応する改善レポート・ビジュアルモックを取得
      // （パターン切替時は per-combo cache を優先）
      const comboImprove = (selectedCombinationId && improveResultsByCombination && improveResultsByCombination[selectedCombinationId]) || null;
      const useImprove = comboImprove || improveResult || null;
      const comboVisual = (selectedCombinationId && visualMocksByCombination && visualMocksByCombination[selectedCombinationId]) || null;
      const useVisualMock = comboVisual || visualMock || null;

      // 差出人欄は「戦略指南 AI」のみで統一（権さん指示 2026-05-16）。
      const issuerName = "戦略指南 AI";

      const slides = buildSlides({
        result: resultForExport,
        input: currentInput,
        improveResult: useImprove,
        visualMock: useVisualMock,
        analyzedAt,
        historyTitle,
        issuer: issuerName,
      });

      if (format === "pptx") {
        const { exportPptx } = await import("./lib/exporters/pptx-exporter");
        await exportPptx({ slides, input: currentInput, historyTitle });
      } else if (format === "pdf") {
        const { exportPdf } = await import("./lib/exporters/pdf-exporter");
        await exportPdf({ slides, input: currentInput, historyTitle });
      }
    } catch (e) {
      console.error("エクスポート失敗:", e);
      alert("提案書の書き出しに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setExporting(null);
    }
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
        // 型不一致バグ修正: URL から取れる sid は文字列、DB の s.id は数値（SERIAL）。
        // === で比較すると常に false になり、URL fallback に頼ることになる。
        // 確定済みサイトを管理ページから「分析を開く」で開いた時に strategy_confirmed が
        // 復元されないバグの根本原因はこれ（URL末尾スラッシュ等の差で fallback も失敗するケース）。
        var site = sid ? sites.find(function(s) { return String(s.id) === String(sid); }) : null;
        if (!site && urlParam) {
          // URL 末尾スラッシュ・https/http・大文字小文字の差を正規化して照合する。
          // 直接 URL で開いた時に DB と string-equal で一致せず、確定履歴やフラグが
          // 復元されないバグの修正（権さん指摘）。API 側 (POST /api/sites) と同じ正規化を使う。
          var normalizeUrl = function(u) { return u ? String(u).replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase() : ""; };
          var nUrlParam = normalizeUrl(urlParam);
          site = sites.find(function(s) { return normalizeUrl(s.site_url) === nUrlParam; });
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
          // 戦略アクションフェーズのデータ復元（DB→state＋LS）
          // DB が空で LS にデータあり → 自動マイグレーション push
          try {
            const dbThreads = Array.isArray(site.threads) ? site.threads : null;
            const dbThemeChats = (site.theme_chats && typeof site.theme_chats === "object") ? site.theme_chats : null;
            const dbThreadMessages = (site.thread_messages && typeof site.thread_messages === "object") ? site.thread_messages : null;
            const dbActions = Array.isArray(site.actions) ? site.actions : null;
            const hasAnyDbActionData = (dbThreads && dbThreads.length > 0) || (dbThemeChats && Object.keys(dbThemeChats).length > 0) || (dbThreadMessages && Object.keys(dbThreadMessages).length > 0) || (dbActions && dbActions.length > 0);
            if (hasAnyDbActionData) {
              if (dbThreads) {
                const migratedThreads = ensureGeneralTheme(dbThreads);
                setThreads(migratedThreads);
                try { localStorage.setItem("ab3c_threads_" + site.id, JSON.stringify(migratedThreads)); } catch (e) {}
              }
              if (dbThemeChats) {
                setThemeChats(dbThemeChats);
                try { localStorage.setItem("ab3c_theme_chats_" + site.id, JSON.stringify(dbThemeChats)); } catch (e) {}
              }
              if (dbActions) {
                setActions(dbActions);
                try { localStorage.setItem("ab3c_actions_" + site.id, JSON.stringify(dbActions)); } catch (e) {}
              }
              if (dbThreadMessages) {
                Object.entries(dbThreadMessages).forEach(([chatId, msgs]) => {
                  try { localStorage.setItem("ab3c_thread_" + site.id + "_" + chatId, JSON.stringify(msgs)); } catch (e) {}
                });
              }
            } else {
              // DB が空 → LS にデータがあればマイグレーション push
              const lsThreads = (() => { try { const v = localStorage.getItem("ab3c_threads_" + site.id); return v ? JSON.parse(v) : null; } catch (e) { return null; } })();
              const lsThemeChats = (() => { try { const v = localStorage.getItem("ab3c_theme_chats_" + site.id); return v ? JSON.parse(v) : null; } catch (e) { return null; } })();
              const lsActions = (() => { try { const v = localStorage.getItem("ab3c_actions_" + site.id); return v ? JSON.parse(v) : null; } catch (e) { return null; } })();
              // thread_messages: スレッドIDが分からないので themeChats から導出
              const lsThreadMessages = {};
              if (lsThemeChats && typeof lsThemeChats === "object") {
                Object.values(lsThemeChats).forEach((chats) => {
                  if (Array.isArray(chats)) chats.forEach((c) => {
                    try {
                      const v = localStorage.getItem("ab3c_thread_" + site.id + "_" + c.id);
                      if (v) lsThreadMessages[c.id] = JSON.parse(v);
                    } catch (e) {}
                  });
                });
              }
              const hasAnyLs = (lsThreads && lsThreads.length > 0) || (lsThemeChats && Object.keys(lsThemeChats).length > 0) || Object.keys(lsThreadMessages).length > 0 || (lsActions && lsActions.length > 0);
              if (hasAnyLs) {
                fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: site.id, threads: lsThreads || [], theme_chats: lsThemeChats || {}, thread_messages: lsThreadMessages, actions: lsActions || [] }) }).catch(function() {});
              }
            }
            // 戦略策定タブの進行中チャットの復元（action data とは独立に処理）
            const dbAnalysisChat = Array.isArray(site.analysis_chat) ? site.analysis_chat : null;
            if (dbAnalysisChat && dbAnalysisChat.length > 0) {
              try { localStorage.setItem("ab3c_analysis_chat_" + site.id, JSON.stringify(dbAnalysisChat)); } catch (e) {}
            } else {
              // DB が空 → LS の siteId ベース or 旧ハッシュベースのチャットを DB へマイグレーション
              try {
                const lsNewKey = "ab3c_analysis_chat_" + site.id;
                let lsMsgs = null;
                const lsNewVal = localStorage.getItem(lsNewKey);
                if (lsNewVal) lsMsgs = JSON.parse(lsNewVal);
                if (!lsMsgs && site.latest_analysis) {
                  // 旧キー（分析結果ハッシュベース）からの救済
                  const oldKey = "ab3c_chat_" + JSON.stringify(site.latest_analysis).slice(0, 50);
                  const oldVal = localStorage.getItem(oldKey);
                  if (oldVal) {
                    lsMsgs = JSON.parse(oldVal);
                    // 新キーにもコピーしておく
                    try { localStorage.setItem(lsNewKey, JSON.stringify(lsMsgs)); } catch (e) {}
                  }
                }
                if (Array.isArray(lsMsgs) && lsMsgs.length > 0) {
                  fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: site.id, analysis_chat: lsMsgs }) }).catch(function() {});
                }
              } catch (e) {}
            }
          } catch (e) {}
          if (site.latest_analysis) {
            setResult(site.latest_analysis);
            setCurrentResult(site.latest_analysis);
            setHistoryTitle(site.latest_analysis.strategy_message?.message || "");
            // 世代履歴の復元（DBから or 同期取得した versions、無ければ初回として暫定登録）
            if (Array.isArray(site.analysis_versions) && site.analysis_versions.length > 0) {
              setVersionsFromDB(site.analysis_versions);
            } else {
              setVersionsFromInitial(site.latest_analysis);
            }
            if (site.improve_result) setImproveResult(site.improve_result);
            if (site.visual_mock) setVisualMock(site.visual_mock);
            // 全パターン分のキャッシュ復元（reload 後のパターン切替を即時表示できるように）
            if (site.improve_results_by_combination && typeof site.improve_results_by_combination === "object") {
              setImproveResultsByCombination(site.improve_results_by_combination);
            }
            if (site.visual_mocks_by_combination && typeof site.visual_mocks_by_combination === "object") {
              setVisualMocksByCombination(site.visual_mocks_by_combination);
            }
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
                setVersionsFromInitial(parsed.result);
                setHistoryTitle(parsed.result.strategy_message?.message || "");
                if (parsed.improve) setImproveResult(parsed.improve);
                if (parsed.improveByCombo && typeof parsed.improveByCombo === "object") setImproveResultsByCombination(parsed.improveByCombo);
                if (parsed.visual) setVisualMock(parsed.visual);
                if (parsed.visualByCombo && typeof parsed.visualByCombo === "object") setVisualMocksByCombination(parsed.visualByCombo);
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
              if (parsed2.result) { setResult(parsed2.result); setCurrentResult(parsed2.result); setVersionsFromInitial(parsed2.result); setHistoryTitle(parsed2.result.strategy_message?.message || ""); }
              if (parsed2.improve) setImproveResult(parsed2.improve);
              if (parsed2.improveByCombo && typeof parsed2.improveByCombo === "object") setImproveResultsByCombination(parsed2.improveByCombo);
              if (parsed2.visual) setVisualMock(parsed2.visual);
              if (parsed2.visualByCombo && typeof parsed2.visualByCombo === "object") setVisualMocksByCombination(parsed2.visualByCombo);
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

  // 更新履歴の未読チェック: 最新エントリのIDがlocalStorageの既読IDと異なれば未読扱い
  // - hasUnseenUpdate: ヘッダーのバッジ（赤丸）表示用
  // - showUpdates: 自動でオーバーレイ表示するかどうか（同じIDを既読なら再表示しない）
  useEffect(() => {
    if (!latestUpdateId) return;
    try {
      const seen = localStorage.getItem("ab3c_last_seen_update_id");
      if (seen !== latestUpdateId) {
        setHasUnseenUpdate(true);
        // ウェルカム表示中はかぶらないよう少し遅延
        const t = setTimeout(() => setShowUpdates(true), 600);
        return () => clearTimeout(t);
      }
    } catch (e) {}
  }, []);

  const dismissUpdates = () => {
    setShowUpdates(false);
    setHasUnseenUpdate(false);
    try {
      if (latestUpdateId) localStorage.setItem("ab3c_last_seen_update_id", latestUpdateId);
      // ヘッダーの赤丸バッジを即時消すためイベント発火
      window.dispatchEvent(new Event("ab3c-updates-seen"));
    } catch (e) {}
  };

  // サイト上限超過チェックは layout.js の SiteCapGuard が全ページ共通で扱う

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

  // 「戻る先」サイトを in-place で復元（ページリロードなし）
  // ⓪ → ① / ② 遷移時にフルリロードを避けることで、②タブが一瞬グレーアウトする問題を解消
  // previousSiteCache（⓪押下時にメモリ保存したスナップショット）があれば DB 再取得せずに即時復元
  const restorePreviousSite = async (targetPhase) => {
    if (!previousSiteId) return;
    // 1. キャッシュ即時復元（同一セッション内の⓪→①/②往復で発火）
    if (previousSiteCache && previousSiteCache.id === previousSiteId) {
      const c = previousSiteCache;
      setSiteId(c.id);
      if (c.result) {
        setResult(c.result);
        setCurrentResult(c.result);
        setHistoryTitle(c.result.strategy_message?.message || "");
        // 世代履歴: キャッシュに含まれていればそれを使い、無ければ initial として再構成
        if (Array.isArray(c.versions) && c.versions.length > 0) setVersionsFromDB(c.versions);
        else setVersionsFromInitial(c.result);
      }
      if (c.improve) setImproveResult(c.improve);
      if (c.visual) setVisualMock(c.visual);
      if (c.analyzedAt) setAnalyzedAt(c.analyzedAt);
      if (c.url) { setCurrentInput(c.url); setUrl(c.url); setTab("url"); }
      if (c.confirmed) setStrategyConfirmed(true);
      if (Array.isArray(c.confirmations)) setConfirmHistory(c.confirmations);
      if (Array.isArray(c.threads)) setThreads(ensureGeneralTheme(c.threads));
      if (c.themeChats && typeof c.themeChats === "object") setThemeChats(c.themeChats);
      if (Array.isArray(c.actions)) setActions(c.actions);
      const urlParams = [`site_id=${c.id}`];
      if (c.url) urlParams.push(`url=${encodeURIComponent(c.url)}`);
      window.history.replaceState(null, "", `/?${urlParams.join("&")}`);
      setViewOverride(targetPhase);
      window.scrollTo(0, 0);
      return;
    }
    // 2. キャッシュなし or 別セッション: DB から取得（後方互換）
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      const site = (data.sites || []).find(s => String(s.id) === String(previousSiteId));
      if (!site) {
        const params = [`site_id=${previousSiteId}`];
        if (previousSiteUrl) params.push(`url=${encodeURIComponent(previousSiteUrl)}`);
        if (targetPhase === "action") params.push("phase=action");
        window.location.href = `/?${params.join("&")}`;
        return;
      }
      setSiteId(site.id);
      if (site.latest_analysis) {
        setResult(site.latest_analysis);
        setCurrentResult(site.latest_analysis);
        setHistoryTitle(site.latest_analysis.strategy_message?.message || "");
        if (Array.isArray(site.analysis_versions) && site.analysis_versions.length > 0) {
          setVersionsFromDB(site.analysis_versions);
        } else {
          setVersionsFromInitial(site.latest_analysis);
        }
      }
      if (site.improve_result) setImproveResult(site.improve_result);
      if (site.visual_mock) setVisualMock(site.visual_mock);
      if (site.improve_results_by_combination && typeof site.improve_results_by_combination === "object") {
        setImproveResultsByCombination(site.improve_results_by_combination);
      }
      if (site.visual_mocks_by_combination && typeof site.visual_mocks_by_combination === "object") {
        setVisualMocksByCombination(site.visual_mocks_by_combination);
      }
      if (site.analyzed_at) setAnalyzedAt(new Date(site.analyzed_at).getTime());
      if (site.site_url) { setCurrentInput(site.site_url); setUrl(site.site_url); setTab("url"); }
      if (site.strategy_confirmed) setStrategyConfirmed(true);
      try {
        const lsConfKey = "ab3c_confirmations_" + site.id;
        const dbConfs = Array.isArray(site.confirmations) ? site.confirmations : null;
        if (dbConfs && dbConfs.length > 0) {
          localStorage.setItem(lsConfKey, JSON.stringify(dbConfs));
          setConfirmHistory(dbConfs);
        } else {
          const lsData = localStorage.getItem(lsConfKey);
          if (lsData) {
            try {
              const lsParsed = JSON.parse(lsData);
              if (Array.isArray(lsParsed)) setConfirmHistory(lsParsed);
            } catch (e) {}
          }
        }
      } catch (e) {}
      const urlParams = [`site_id=${site.id}`];
      if (site.site_url) urlParams.push(`url=${encodeURIComponent(site.site_url)}`);
      window.history.replaceState(null, "", `/?${urlParams.join("&")}`);
      setViewOverride(targetPhase);
      window.scrollTo(0, 0);
    } catch (e) {
      const params = [`site_id=${previousSiteId}`];
      if (previousSiteUrl) params.push(`url=${encodeURIComponent(previousSiteUrl)}`);
      if (targetPhase === "action") params.push("phase=action");
      window.location.href = `/?${params.join("&")}`;
    }
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
        // チャットメッセージは siteId ベースの新キー優先、旧ハッシュベースキーをフォールバック
        var chatMsgs = [];
        try {
          if (targetSiteId) {
            var newCm = localStorage.getItem("ab3c_analysis_chat_" + targetSiteId);
            if (newCm) chatMsgs = JSON.parse(newCm);
          }
          if (chatMsgs.length === 0) {
            var oldChatKey = "ab3c_chat_" + (currentResult ? JSON.stringify(currentResult).slice(0, 50) : "default");
            var oldCm = localStorage.getItem(oldChatKey);
            if (oldCm) chatMsgs = JSON.parse(oldCm);
          }
        } catch (e) {}
        // 確定時に選択中パターンのデータを top-level にシム（保存後にこの確定履歴を開いたとき、
        // その時に選んでいたパターンの AB3C・改善レポートが復元されるように）。
        var snapshotResult = currentResult;
        var confirmedStrategyMessageText = currentResult?.strategy_message?.message || "";
        var selectedCombo = currentResult?.combinations?.find(function(c) { return c?.id === selectedCombinationId; });
        if (selectedCombo && Array.isArray(currentResult?.combinations)) {
          var allStrengthsArr = Array.isArray(currentResult.company_core?.all_strengths) ? currentResult.company_core.all_strengths : [];
          var usedIdxArr = Array.isArray(selectedCombo.strengths_used) ? selectedCombo.strengths_used : [];
          var usedStrengthsArr = usedIdxArr.length > 0
            ? usedIdxArr.map(function(i) { return allStrengthsArr[i]; }).filter(Boolean)
            : allStrengthsArr;
          snapshotResult = Object.assign({}, currentResult, {
            benefit: selectedCombo.benefit || currentResult.benefit,
            advantage: selectedCombo.advantage || currentResult.advantage,
            three_c: {
              customer: selectedCombo.customer || currentResult.three_c?.customer || {},
              competitor: selectedCombo.competitor || currentResult.three_c?.competitor || { direct: [], indirect: [] },
              company: {
                strength: usedStrengthsArr,
                structure: currentResult.company_core?.structure || currentResult.three_c?.company?.structure || "",
                passion: currentResult.company_core?.passion || currentResult.three_c?.company?.passion || "",
              },
            },
            strategy_message: selectedCombo.strategy_message || currentResult.strategy_message,
            checkpoints: Array.isArray(selectedCombo.checkpoints) ? selectedCombo.checkpoints : (currentResult.checkpoints || []),
            confirmed_combination_id: selectedCombinationId,
          });
          confirmedStrategyMessageText = selectedCombo.strategy_message?.message || confirmedStrategyMessageText;
        }
        var snapshot = {
          id: Date.now(),
          date: new Date().toLocaleString("ja-JP"),
          result: snapshotResult,
          chatMessages: chatMsgs,
          chatSummaries: chatSummaries,
          strategyMessage: confirmedStrategyMessageText,
          url: siteUrl || currentInput || "",
        };
        var chKey2 = "ab3c_confirmations_" + (targetSiteId || "default");
        // DB を真実の源として既存 confirmations を取得（LS だけに頼ると別ブラウザ・キャッシュクリア後に
        // DB が空配列で上書きされて過去履歴が消失する事故が起きる）。
        // DB 取得失敗時のみ LS にフォールバック。
        var existing2 = [];
        var dbFetchFailed = false;
        try {
          const dbRes = await fetch("/api/sites");
          const dbData = await dbRes.json();
          const dbSite = (dbData.sites || []).find(function(s) { return String(s.id) === String(targetSiteId); });
          if (dbSite && Array.isArray(dbSite.confirmations)) {
            existing2 = dbSite.confirmations.slice();
          }
        } catch (e) { dbFetchFailed = true; }
        if (dbFetchFailed) {
          try { var e2 = localStorage.getItem(chKey2); if (e2) existing2 = JSON.parse(e2); } catch (e) {}
        }
        existing2.push(snapshot);
        // DB に確定状態 + confirmations 配列を保存（チャット履歴もスナップショット内に同梱）
        // レスポンスステータスを必ず検証する。HTTP エラー（401/403/500 等）でも fetch は throw しないため、
        // 検証なしで進めると「ローカル UI は確定済み・DB は未確定」のズレが発生する（過去にこれで履歴消失バグ発生）。
        // 確定時の改善レポート・ビジュアルモックも一緒に保存する。
        // パターン切替後に generateForCombination 経由で state にあるが DB 反映が
        // race condition で漏れるケースがあるため、確定タイミングでも明示的に永続化する（保険）。
        // latest_analysis は currentResult ではなく snapshotResult を使う。
        // snapshotResult には confirmed_combination_id が含まれており、ページ再ロード時の
        // useEffect [currentResult] がこれを参照して確定パターン (P2 等) を選択できる。
        // currentResult を使うと confirmed_combination_id が無く、recommended の P1 が
        // 復元されてしまう（権さん指摘）。
        const confirmBody = { id: targetSiteId, latest_analysis: snapshotResult, strategy_confirmed: true, confirmations: existing2 };
        if (improveResult && !improveResult.error) confirmBody.improve_result = improveResult;
        if (visualMock && !visualMock.error) confirmBody.visual_mock = visualMock;
        const resp = await fetch("/api/sites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(confirmBody) });
        if (!resp.ok) {
          let errMsg = "保存に失敗しました（HTTP " + resp.status + "）。";
          try { const errBody = await resp.json(); if (errBody?.error) errMsg = errBody.error; } catch (e) {}
          alert(errMsg + "\n再度お試しいただくか、ページを再読み込みしてください。");
          return;
        }
        // レスポンス本文から「実際に DB に確定状態が反映されたか」を検証する。
        // 200 OK でも WHERE 句で 0 件マッチ（例: targetSiteId が他ユーザー所有・既に削除済み）の場合、
        // site が null/undefined で返ってきて UI だけ確定済みになる silent bug を防ぐ。
        try {
          const respJson = await resp.json();
          const savedSite = respJson?.site;
          if (!savedSite) {
            alert("保存に失敗しました（サーバーから対象サイトのデータが返ってきませんでした）。\nサイトIDが正しいか、サイトが削除されていないか確認してください。\n対象ID: " + targetSiteId);
            return;
          }
          if (savedSite.strategy_confirmed !== true) {
            alert("保存に失敗しました（DB に確定フラグが反映されませんでした）。\nもう一度お試しください。\n返却された strategy_confirmed: " + JSON.stringify(savedSite.strategy_confirmed));
            return;
          }
        } catch (e) {
          // 本文パースに失敗しても 200 は返ったので、警告だけ出して続行（保守的）
          console.warn("確定後のレスポンス本文パース失敗:", e);
        }
        setStrategyConfirmed(true);
        setLiveStateBackup(null); // 戦略確定でライブ状態がスナップショット化されたためバックアップ不要
        // 確定後はライブ状態(currentResult)を確定スナップショット(snapshotResult)に揃える。
        // これがないと currentResult (確定前の元データ) と confirmHistory[last].result (snapshotResult)
        // が一致せず、編集中エントリが「変更あり」と誤判定して表示されてしまうバグになる（権さん指摘・2026-05-15）。
        // snapshotResult には confirmed_combination_id と、選択中パターンで flatten された three_c が含まれる。
        setCurrentResult(snapshotResult);
        setResult(snapshotResult);
        // 世代タブの最新世代を確定済みマークに + result も snapshot に統一
        setAnalysisVersions(function (prev) {
          if (!Array.isArray(prev) || prev.length === 0) return prev;
          var copy = prev.slice();
          copy[0] = Object.assign({}, copy[0], { confirmed: true, result: snapshotResult });
          return copy;
        });
        // 確定直後は戦略アクションタブへ遷移（"→" の遷移意図を保持）
        setViewOverride("action");
        window.scrollTo(0, 0);
        // LS にも保存（DBのキャッシュとして）
        try {
          localStorage.setItem(chKey2, JSON.stringify(existing2));
          setConfirmHistory(existing2);
        } catch (e) {}
      } catch (e) {
        // ネットワーク断・JSONパースエラー等
        alert("保存に失敗しました。ネットワーク接続を確認して再度お試しください。\n\n" + (e?.message || ""));
      }
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
      addAnalysisVersion(merged, "refine"); // 絞り込み再分析を新世代として追加
      // 絞り込み再分析の結果を DB に保存（リロードで消えないように）
      if (siteId) {
        try {
          await fetch("/api/sites", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: siteId, latest_analysis: merged, analyzed_at: Date.now(), version_source: "refine" }),
          });
        } catch (e) { console.error("refine DB save error:", e); }
      }
    } catch (e) {
      alert("再分析に失敗しました: " + (e?.message || e));
    } finally {
      setRefining(false);
      setOverlayMessage(null);
    }
  };

  // 履歴閲覧モードを抜けて、現在のライブ状態（DB の latest_analysis）に戻す。
  // activeConfirmId が立っている = 過去のスナップショットを閲覧中なので、
  // currentResult が古い snap になっている → DB から最新を読み直して同期する。
  const exitHistoryView = async () => {
    setActiveConfirmId(null);
    if (!siteId) return;
    try {
      const res = await fetch("/api/sites");
      const d = await res.json();
      const norm = u => (u || "").replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
      const live = (d.sites || []).find(s => String(s.id) === String(siteId));
      if (!live) return;
      if (live.latest_analysis) {
        setCurrentResult(live.latest_analysis);
        setResult(live.latest_analysis);
        setHistoryTitle(live.latest_analysis.strategy_message?.message || "");
        // 確定パターン（confirmed_combination_id）も連動
        if (live.latest_analysis.confirmed_combination_id) {
          setSelectedCombinationId(live.latest_analysis.confirmed_combination_id);
        }
      }
      // 確定状態は DB 値を反映
      if (live.strategy_confirmed) setStrategyConfirmed(true);
      else setStrategyConfirmed(false);
    } catch (e) {
      // 失敗時は activeConfirmId だけ解除して警告
      console.error("exitHistoryView failed:", e);
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
        const resp = await fetch("/api/sites", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: siteId, strategy_confirmed: false }),
        });
        if (!resp.ok) {
          let errMsg = "解除に失敗しました（HTTP " + resp.status + "）。";
          try { const errBody = await resp.json(); if (errBody?.error) errMsg = errBody.error; } catch (e) {}
          alert(errMsg + "\n再度お試しいただくか、ページを再読み込みしてください。");
          return;
        }
      }
      setStrategyConfirmed(false);
      setViewOverride("analysis"); // フェーズを①に戻す
      window.scrollTo(0, 0);
    } catch (e) {
      alert("解除に失敗しました。ネットワーク接続を確認して再度お試しください。\n\n" + (e?.message || ""));
    }
  };

 const notify = (text) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("戦略指南 AI 分析完了", { body: text.slice(0, 60), icon: "https://ab3c.jp/img/common/logo.svg" });
  };

  const analyze = async () => {
    // ログインチェックはAPI側で実施（sessionの読み込みタイミング問題を回避）
    // テキスト分析時は構造化入力（businessPlan）を結合した文字列を使う。
    // 後方互換として、businessPlan が全空で input に直接テキストが入っている場合は input を使う。
    const composedTextInput = (tab === "text") ? (buildBusinessPlanText(businessPlan) || input.trim()) : "";
    if (tab === "text" && !composedTextInput) { setError("事業情報を1つ以上の項目に入力してください。"); return; }
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
// 同じURLの再分析: 戦略策定タブのチャット履歴をクリア（localStorage + DB 両方）
// 戦略アクションタブのスレッド・アクション・戦略確定履歴は確定戦略に紐づくため残す
if (prefoundSite) {
  try { localStorage.removeItem("ab3c_analysis_chat_" + prefoundSite.id); } catch (e) {}
  fetch("/api/sites", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: prefoundSite.id, analysis_chat: [] }),
  }).catch(() => {});
}
setError(""); setResult(null); setSelectedHistory(null); setLoading(true); setChatSummaries([]); setImproveResult(null); setImproveResultsByCombination({}); setVisualMock(null); setVisualMocksByCombination({}); setActiveConfirmId(null);
// 新URLが既存サイトと一致しない場合に siteId が誤って残らないよう初期化（URL一致時は直後に再設定される）
setSiteId(null); setCurrentResult(null); setCurrentInput(""); setStrategyConfirmed(false); setActiveThemeId(null); setActiveChatId(null); setThreads([]);
// 新規分析時は世代履歴もリセット（後で初回バージョンとして登録）
setVersionsFromInitial(null);
setLiveStateBackup(null); // 新規分析でライブ状態が完全リセットされるため破棄
// 注: localStorage "ab3c_history" は意図的に削除しない（履歴安全性のため）
    setOverlayMessage("AB3C分析中...");
    try {
      // URL分析時: 既存サイトがあれば自動紐付け（上で取得済みの prefoundSite を再利用）
      var analyzeSiteId = null;
      if (tab === "url" && url.trim() && prefoundSite) {
        analyzeSiteId = prefoundSite.id;
        setSiteId(prefoundSite.id);
      }
      const body = tab === "url" ? { url } : { input: composedTextInput };
      // 既存サイトの再分析時は siteId を渡す → 完了メールのリンクを当該分析結果ページに直接飛ばすため
      if (analyzeSiteId) body.siteId = analyzeSiteId;
      // テキスト入力モードのみ「目指す事業規模」を渡す（URLモードでは TOP の手軽さを優先するため非表示）
      if (tab === "text" && businessPlan.targetRevenue) {
        body.targetRevenue = businessPlan.targetRevenue;
      }
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); setOverlayMessage(null); return; }
      setResult(data);
setHistoryTitle(data?.strategy_message?.message || "");
const savedText = tab === "url" ? url : composedTextInput;
setCurrentResult(data);
setVersionsFromInitial(data); // 初回分析を v1 として登録
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
    try { improveData = await improveRes.json(); } catch (e) { improveData = { error: `HTTP ${improveRes.status} 応答が解釈できませんでした` }; }
    if (improveRes.ok && !improveData.error) {
      setImproveResult(improveData);
      // 初回生成分は recommended パターン向けキャッシュに保存（top-levelシムが recommended を反映しているため）
      const recommendedId = data?.recommended_combination_id;
      if (recommendedId) {
        setImproveResultsByCombination(prev => ({ ...prev, [recommendedId]: improveData }));
      }
    } else {
      console.error("改善レポート生成エラー:", { status: improveRes.status, error: improveData.error, debug: improveData.debug });
      setImproveResult({ error: improveData.error || `改善レポートの生成に失敗しました（HTTP ${improveRes.status}）。再分析ボタンで再生成できます。` });
      setVisualLoading(false); // 改善レポート失敗時はビジュアルも走らないのでクリア
    }
  } catch (e) {
    console.error("改善レポート自動生成エラー:", e);
    const msg = "改善レポートの取得中に通信エラーが発生しました。しばらく待ってからお試しください。";
    improveData = { error: msg };
    setImproveResult({ error: msg });
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
        // 初回生成分は recommended パターン向けキャッシュへ保存（改善レポートと同じ流れ）
        const recommendedId = data?.recommended_combination_id;
        if (recommendedId) {
          setVisualMocksByCombination(prev => ({ ...prev, [recommendedId]: visualData }));
        }
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
    // 注: テキスト分析のサイト作成は URL if-block の外で行う（このブロック全体が
    // tab === "url" 条件下にあるため、ここで else if してもテキスト分析時には動かない）
    // 既存サイト または 新規サイト作成成功時に全データ保存
    if (targetSid) {
      // 初回分析の改善レポート/ビジュアルは推奨パターン分のみ生成されているので、
      // by_combination キャッシュにも recommended_combination_id をキーで登録しておく。
      // これで再ロード時に推奨パターンを表示すれば即時キャッシュヒット。
      const recommendedId = data?.recommended_combination_id || data?.combinations?.[0]?.id;
      const initImproveByCombo = (improveData && !improveData.error && recommendedId)
        ? { [recommendedId]: improveData }
        : null;
      const initVisualByCombo = (visualData && !visualData.error && recommendedId)
        ? { [recommendedId]: visualData }
        : null;
      await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetSid,
          latest_analysis: data,
          improve_result: improveData && !improveData.error ? improveData : null,
          visual_mock: visualData && !visualData.error ? visualData : null,
          improve_results_by_combination: initImproveByCombo,
          visual_mocks_by_combination: initVisualByCombo,
          analyzed_at: Date.now(),
        }),
      });
    }
    // 戦略診断チケットの場合、分析回数を1消費（再分析も含めて毎回）
    // URL分析: 全3レポート（AB3C+改善+ビジュアル）成功時のみ消費、失敗時は消費しない
    if (allReportsSucceeded) {
      try {
        await fetch("/api/analyses/consume", { method: "POST" });
      } catch (e) { console.error("診断回数消費エラー:", e); }
    }
  } catch (e) { console.error("DB保存エラー:", e); }
}

// テキスト分析のサイト作成と分析回数消費。
// URL分析と違い改善レポート/ビジュアルを生成しないため、URL if-block の外で処理する。
// （以前は URL if-block の中に else-if で書いていたが、外側の if (tab === "url") に
// 阻まれて永久に実行されない死コードになっていた事故を修正）
if (tab === "text" && data && !data.error && !analyzeSiteId) {
  try {
    // サイト名の優先順:
    //   1. ユーザーが入力した事業名・タイトル（businessPlan.title）
    //   2. 戦略メッセージの先頭40字
    //   3. 結合された入力テキストの先頭40字
    //   4. "テキスト分析"
    const titleFromBp = (businessPlan?.title || "").trim();
    const textSn = titleFromBp || ((data?.strategy_message?.message || savedText || "").trim().slice(0, 40)) || "テキスト分析";
    const crText = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_name: textSn, site_url: null }),
    });
    const cdText = await crText.json();
    let textSid = null;
    if (cdText.existingSite) textSid = cdText.existingSite.id;
    else if (cdText.site) textSid = cdText.site.id;
    if (textSid) {
      setSiteId(textSid);
      // 分析結果を DB に保存
      await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: textSid, latest_analysis: data, analyzed_at: Date.now() }),
      });
      // 戦略診断チケットの場合は分析回数を消費（URL分析と整合）
      try {
        await fetch("/api/analyses/consume", { method: "POST" });
      } catch (e) { console.error("診断回数消費エラー:", e); }
    } else if (cdText.error) {
      console.error("テキスト分析サイト作成エラー:", cdText.error);
    }
  } catch (e) { console.error("テキスト分析サイト作成処理エラー:", e); }
}

saveHistory(savedText, data, data?.strategy_message?.message || "", improveData, visualData && !visualData.error ? visualData : null);
notify(savedText);
    } catch (e) { setError("通信エラーが発生しました。もう一度お試しください。"); setLoading(false); setOverlayMessage(null); }
  };

const reset = () => { setResult(null); setSelectedHistory(null); setInput(""); setBusinessPlan({ title: "", origin: "", problem: "", value: "", customer: "", revenue: "" }); setUrl(""); setError(""); setChatSummaries([]); setImproveResult(null); setImproveResultsByCombination({}); setVisualMock(null); setVisualMocksByCombination({}); setCurrentResult(null); setCurrentInput(""); setStrategyConfirmed(false); setActiveThemeId(null); setActiveChatId(null); setThreads([]); setVersionsFromInitial(null); setActiveConfirmId(null); };
  const editAndReanalyze = (text) => {
    // 過去のテキストに構造化マーカー（【ラベル】）が含まれていれば businessPlan に復元、
    // 無ければ非構造テキストとして input に入れる（後方互換）。
    const { parsed, foundAny } = parseBusinessPlanText(text || "");
    if (foundAny) {
      setBusinessPlan(parsed);
      setInput("");
    } else {
      setBusinessPlan({ title: "", origin: "", problem: "", value: "", customer: "", revenue: "" });
      setInput(text || "");
    }
    setTab("text");
    setResult(null);
    setSelectedHistory(null);
  };
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
            <div style={{ width: 36, height: 36, border: "3px solid #e5e5e0", borderTop: "3px solid #2a2a26", borderRadius: "50%", flexShrink: 0, animation: "spin 1s linear infinite" }} />
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
      <UpdateHistoryModal open={showUpdates} onClose={dismissUpdates} highlightLatest={hasUnseenUpdate} />
      {/* SiteCapResolveModal は layout.js の SiteCapGuard で全ページ共通表示 */}

      <Header
        onShowPricing={() => setShowPricing(true)}
        currentSiteUrl={url?.startsWith("http") ? url : (currentInput?.startsWith("http") ? currentInput : null)}
        currentSiteId={siteId}
        phase={phase}
        strategyConfirmed={strategyConfirmed}
        canAccessBansou={!isDiagnosisActive && (isPro || chatTickets > 0 || trialChats > 0)}
        previousSiteId={previousSiteId}
        previousSiteUrl={previousSiteUrl}
        previousSiteConfirmed={previousSiteConfirmed}
        onNewAnalysis={() => {
          // 「戻る先」として現在のサイトIDと確定状態を保存（①②タブから復帰できるように）
          // 同時に表示中の全データもキャッシュしておき、戻り遷移時に DB 再取得なしで即表示
          if (siteId) {
            setPreviousSiteId(siteId);
            setPreviousSiteConfirmed(strategyConfirmed === true);
            const urlSnapshot = currentInput?.startsWith("http") ? currentInput : (url?.startsWith("http") ? url : null);
            if (urlSnapshot) setPreviousSiteUrl(urlSnapshot);
            setPreviousSiteCache({
              id: siteId,
              url: urlSnapshot,
              confirmed: strategyConfirmed === true,
              result: currentResult,
              versions: analysisVersions, // 世代履歴も一緒にキャッシュ
              improve: improveResult,
              visual: visualMock,
              analyzedAt,
              confirmations: confirmHistory,
              threads,
              themeChats,
              actions,
            });
          }
          reset(); setSiteId(null); sessionStorage.removeItem("ab3c_last_analysis"); setViewOverride(null); window.history.replaceState(null, "", "/"); window.scrollTo(0, 0);
        }}
        onSwitchToAnalysis={async () => {
          // 現在のサイトの分析結果があればそれを表示、なければ「戻る先」を in-place で復元
          if (currentResult) {
            setViewOverride("analysis");
            window.scrollTo(0, 0);
          } else if (previousSiteId) {
            await restorePreviousSite("analysis");
          }
        }}
        onSwitchToAction={async () => {
          // 現在のサイトが確定済みならその場で切替、未確定でも「戻る先」が確定済みなら in-place 復元
          if (strategyConfirmed) {
            setViewOverride("action");
            window.scrollTo(0, 0);
          } else if (previousSiteId && previousSiteConfirmed) {
            await restorePreviousSite("action");
          }
        }}
        onConfirmStrategy={currentResult && !strategyConfirmed && !isDiagnosisActive && (isPro || chatTickets > 0 || trialChats > 0) ? confirmStrategy : null}
      />


      <div style={{ display: "grid", gridTemplateColumns: phase === "input" ? "1fr" : (sidebarOpen ? (chatMinimized ? "240px 1fr" : `240px 1fr ${chatWidth}px`) : (chatMinimized ? "1fr" : `1fr ${chatWidth}px`)), flex: 1, position: "relative" }}>
        {/* サイドバー（input フェーズでは非表示 — 戦略確定履歴は分析後にしか意味がない） */}
        {sidebarOpen && phase !== "input" && (
  <div id="sidebar" style={{ boxShadow: `inset -1px 0 0 ${C.border}`, background: "#faf8f4", display: "flex", flexDirection: "column", color: "#2a2a26", height: "calc(100vh - " + headerHeight + "px)", position: "sticky", top: headerHeight, overflow: "visible" }}>
            {/* カラム見出し + 開閉ボタン */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 400, color: "#2a2a26" }}>
                {phase === "action" ? "施策一覧" : "戦略確定履歴"}
              </div>
              <button onClick={function() { setSidebarOpen(false); }} style={{ background: "transparent", border: "none", color: "#2a2a26", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>◀ 閉じる</button>
            </div>

            {/* フェーズ別サイドバーコンテンツ */}
            {phase === "action" ? (
              <>
                {/* 施策ナビ */}
                <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
                  {threads.map(t => (
                    <div key={t.id}>
                      <div onClick={() => selectTheme(t.id)}
                        style={{
                          padding: "8px 14px",
                          paddingRight: activeThemeId === t.id ? "15px" : "14px",
                          marginRight: activeThemeId === t.id ? "-1px" : "0",
                          cursor: "pointer", fontSize: 18, color: "#2a2a26",
                          background: activeThemeId === t.id ? C.bg : "transparent",
                          display: "flex", alignItems: "center", gap: 8,
                          borderLeft: activeThemeId === t.id ? "3px solid #2a2a26" : "3px solid transparent",
                          position: "relative",
                          zIndex: activeThemeId === t.id ? 2 : 1,
                          fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif",
                        }}>
                        <span style={{ fontSize: 18 }}>{t.icon}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                      </div>
                      {/* サブチャット一覧（施策展開時） */}
                      {activeThemeId === t.id && themeChats[t.id] && (
                        <div>
                          {themeChats[t.id].map(chat => {
                            const isChatActive = activeChatId === chat.id;
                            return (
                              <div key={chat.id}
                                onMouseEnter={e => { const x = e.currentTarget.querySelector(".sub-chat-delete"); if (x) x.style.opacity = "1"; }}
                                onMouseLeave={e => { const x = e.currentTarget.querySelector(".sub-chat-delete"); if (x) x.style.opacity = "0"; }}
                                onClick={() => setActiveChatId(chat.id)}
                                style={{
                                  padding: "6px 10px 6px 34px",  // left=34 (24 indent + 10 標準padding) で施策よりインデント
                                  cursor: "pointer", fontSize: 16,
                                  color: isChatActive ? "#2a2a26" : "#888",
                                  // 選択中はメイン領域グレーで境界線をタブのように貫通させる
                                  background: isChatActive ? C.bg : "transparent",
                                  display: "flex", alignItems: "center", gap: 5,
                                  fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif",
                                  position: "relative",
                                  zIndex: isChatActive ? 2 : 1,
                                }}>
                                {isChatActive && <span style={{ fontSize: 8, color: "#2a2a26" }}>●</span>}
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.label}</span>
                                <button
                                  className="sub-chat-delete"
                                  onClick={e => { e.stopPropagation(); deleteSubChat(t.id, chat.id); }}
                                  title="このチャットを削除"
                                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#888", fontSize: 16, padding: "0 4px", opacity: 0, transition: "opacity 0.15s", flexShrink: 0 }}
                                >×</button>
                              </div>
                            );
                          })}
                          <div onClick={() => addSubChat(t.id)}
                            style={{ padding: "6px 10px 6px 34px", cursor: "pointer", fontSize: 16, color: "#888", fontFamily: "system-ui, sans-serif" }}>
                            + チャット追加
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* 施策追加 */}
                <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <button onClick={() => { const label = prompt("施策名を入力してください"); if (label?.trim()) { const newThread = { id: `custom_${Date.now()}`, label: label.trim(), icon: "💬", preset: false }; setThreads(prev => [...prev, newThread]); selectTheme(newThread.id); } }}
                    style={{ width: "100%", background: "#2a2a26", border: "none", borderRadius: 999, color: "#fff", cursor: "pointer", fontSize: 16, padding: "10px" }}>+ 施策を追加</button>
                </div>
              </>
            ) : (
              <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto" }}>
                {confirmHistory.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 14, color: "#888", textAlign: "center", lineHeight: 1.6 }}>
                    戦略を確定すると<br/>ここに履歴が残ります
                  </div>
                ) : (
                  // 「現在の戦略」= confirmHistory の最終エントリ（最新確定）。
                  // strategy_confirmed=true の時のみ「現在の」マーカーを表示する
                  // （未確定状態だとすべてが「過去の履歴」扱い）。
                  (function() {
                    var liveConfirmedSnapId = strategyConfirmed && confirmHistory.length > 0
                      ? confirmHistory[confirmHistory.length - 1].id
                      : null;

                    // ✏️ 編集中エントリの判定:
                    //   - 未確定の検討中バージョン（最後の確定スナップショットと異なる）が存在する場合に表示
                    //   - liveStateBackup があれば「過去履歴を覗いている最中」、その backup result を比較対象に
                    //   - なければ currentResult が live なので、それを最後の確定と比較
                    //   - 編集中エントリの strategy_message は live のものを表示
                    var lastConfirm = confirmHistory[confirmHistory.length - 1];
                    var liveResultForCompare = liveStateBackup ? liveStateBackup.result : currentResult;
                    var liveStrategyMessageForLabel = liveStateBackup ? liveStateBackup.historyTitle : historyTitle;
                    var hasUnconfirmedWork = false;
                    try {
                      hasUnconfirmedWork = !!(lastConfirm && liveResultForCompare &&
                        JSON.stringify(liveResultForCompare) !== JSON.stringify(lastConfirm.result));
                    } catch (e) { hasUnconfirmedWork = false; }
                    // ✏️ 編集中エントリが「アクティブ」= ライブ状態を表示中（過去履歴閲覧していない）。
                    // activeConfirmId が null の場合、現在表示中はライブ状態と判定。
                    var isEditingEntryActive = hasUnconfirmedWork && activeConfirmId == null;

                    var editingEntry = hasUnconfirmedWork ? (
                      <div key="editing"
                        onClick={function() {
                          // バックアップがあれば復元（=過去履歴を覗いていた状態から戻る）。
                          // バックアップがない場合は既にライブ状態が表示中なので activeConfirmId だけクリア。
                          if (liveStateBackup) {
                            setCurrentResult(liveStateBackup.result);
                            setResult(liveStateBackup.result);
                            setAnalysisVersions(Array.isArray(liveStateBackup.versions) ? liveStateBackup.versions : []);
                            setActiveVersionPerSection(liveStateBackup.activeVersionPerSection || {});
                            if (liveStateBackup.selectedCombinationId) setSelectedCombinationId(liveStateBackup.selectedCombinationId);
                            setHistoryTitle(liveStateBackup.historyTitle || "");
                            if (Array.isArray(liveStateBackup.chatSummaries)) setChatSummaries(liveStateBackup.chatSummaries);
                            if (liveStateBackup.currentInput != null) setCurrentInput(liveStateBackup.currentInput);
                            if (liveStateBackup.url != null) setUrl(liveStateBackup.url);
                            if (liveStateBackup.tab != null) setTab(liveStateBackup.tab);
                            // チャット履歴も復元
                            try {
                              if (siteId && Array.isArray(liveStateBackup.chatMessages)) {
                                localStorage.setItem("ab3c_analysis_chat_" + siteId, JSON.stringify(liveStateBackup.chatMessages));
                                window.dispatchEvent(new CustomEvent("ab3c-analysis-chat-changed", { detail: { siteId } }));
                              }
                            } catch (e) {}
                            setLiveStateBackup(null);
                          }
                          setActiveConfirmId(null);
                          setChangedPaths(new Map());
                        }}
                        style={{
                          padding: "10px 14px",
                          paddingRight: isEditingEntryActive ? "15px" : "14px",
                          marginRight: isEditingEntryActive ? "-1px" : "0",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          cursor: "pointer",
                          background: isEditingEntryActive ? C.bg : "#fff8e1",  // ライブ表示中は灰、それ以外は薄ベージュ
                          // 左ボーダーは 3px だと薄ベージュ背景に埋もれて視認しづらいので 6px に倍増（権さん指摘）
                          borderLeft: isEditingEntryActive ? "6px solid #d97706" : "6px solid #f59e0b",
                          position: "relative",
                          zIndex: isEditingEntryActive ? 2 : 1,
                        }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>✏️ 編集中</span>
                          <span style={{ display: "inline-block", background: "#d97706", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "1px 7px", borderRadius: 999 }}>
                            未確定
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: "#2a2a26", lineHeight: 1.4, fontWeight: isEditingEntryActive ? 700 : 400 }}>
                          {(liveStrategyMessageForLabel || "").slice(0, 50)}
                        </div>
                      </div>
                    ) : null;

                    var confirmEntries = confirmHistory.slice().reverse().map(function(ch, i) {
                    // ID で判定（同じタイトルの複数エントリでも別々に選択フィードバックできるよう）
                    var isActive = activeConfirmId === ch.id;
                    var isLive = ch.id === liveConfirmedSnapId;
                    return (
                      <div key={ch.id} onClick={function() {
                        // 過去履歴（確定スナップショット）を初めて開く時、現在のライブ状態をバックアップする。
                        // ライブ状態 = 未確定の検討中バージョン or 最後の確定そのまま。どちらにせよ
                        // サイドバー上部の「✏️ 編集中」エントリ経由で戻れるよう保存しておく。
                        // 既にバックアップがあれば上書きしない（過去履歴 A→B→編集中 でも最初のライブに戻れる）。
                        if (!liveStateBackup) {
                          var savedChatMessages = null;
                          try {
                            if (siteId) {
                              var lsChat = localStorage.getItem("ab3c_analysis_chat_" + siteId);
                              savedChatMessages = lsChat ? JSON.parse(lsChat) : null;
                            }
                          } catch (e) {}
                          setLiveStateBackup({
                            result: currentResult,
                            versions: analysisVersions,
                            activeVersionPerSection: activeVersionPerSection,
                            selectedCombinationId: selectedCombinationId,
                            historyTitle: historyTitle,
                            chatSummaries: chatSummaries,
                            chatMessages: savedChatMessages,
                            currentInput: currentInput,
                            url: url,
                            tab: tab,
                          });
                        }

                        setActiveConfirmId(ch.id);
                        setCurrentResult(ch.result);
                        setResult(ch.result);
                        setVersionsFromInitial(ch.result); // 確定履歴閲覧時は単一世代として扱う
                        setHistoryTitle(ch.strategyMessage || "");
                        // 確定時に選んでいたパターン（confirmed_combination_id）を明示的に復元する。
                        // これを呼ばないと、別パターン閲覧中に履歴クリックしても useEffect が
                        // 「prev が valid なら維持」ロジックでパターン切替が発生せず、
                        // P2を確定したのにP1が表示される、というバグが起きる。
                        if (ch.result?.confirmed_combination_id) {
                          setSelectedCombinationId(ch.result.confirmed_combination_id);
                        }
                        // 注意: ここで setStrategyConfirmed(true) を呼ばない。
                        // strategyConfirmed は DB の strategy_confirmed を反映する状態であり、
                        // 履歴クリックで「ローカル UI だけ確定中に見せる」と DB と不整合になる
                        // （ダッシュボードは未確定、分析画面は確定中、という権さん指摘の混乱が起きる）。
                        // 履歴は「過去のスナップショットを閲覧する」読み取り専用機能。
                        // この履歴の戦略を再確定したい場合は表示後に「戦略を確定する」ボタンを押せばよい。
                        if (ch.chatSummaries) setChatSummaries(ch.chatSummaries);
                        if (ch.url) { setCurrentInput(ch.url); setUrl(ch.url); setTab("url"); }
                        // 確定時のチャット履歴も復元（同じパターンを別タイミングで確定した場合に
                        // それぞれの議論の経緯が見られるよう）。siteId ベースのキーへ書き戻し、
                        // AnalysisChatPanel が再ロードする。
                        try {
                          if (siteId && Array.isArray(ch.chatMessages)) {
                            localStorage.setItem("ab3c_analysis_chat_" + siteId, JSON.stringify(ch.chatMessages));
                            // AnalysisChatPanel に変更を通知（同コンポーネントは siteId ベースキーを監視）
                            window.dispatchEvent(new CustomEvent("ab3c-analysis-chat-changed", { detail: { siteId } }));
                          }
                        } catch (e) {}
                        setChangedPaths(new Map());
                      }}
                        style={{
                          padding: "10px 14px",
                          paddingRight: isActive ? "15px" : "14px",  // 選択中は +1px してメイン領域へ視覚的に繋ぐ
                          marginRight: isActive ? "-1px" : "0",       // サイドバー右枠線を覆って「タブ」感を出す
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          cursor: "pointer",
                          background: isActive ? C.bg : "transparent",  // メイン領域と同じグレーで選択中を明示
                          // 編集中エントリと同じ 6px に揃える（権さん指摘）。確定済みは黒。
                          borderLeft: isActive ? "6px solid #2a2a26" : "6px solid transparent",
                          position: "relative",
                          zIndex: isActive ? 2 : 1,
                        }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>#{confirmHistory.length - i} · {ch.date}</span>
                          {isLive && (
                            <span style={{ display: "inline-block", background: C.B, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "1px 7px", borderRadius: 999 }}>
                              確定中
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: "#2a2a26", lineHeight: 1.4, fontWeight: isLive ? 700 : 400 }}>{(ch.strategyMessage || "").slice(0, 50)}</div>
                        {ch.chatSummaries && ch.chatSummaries.length > 0 && (
                          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>💬 {ch.chatSummaries.length}件反映</div>
                        )}
                      </div>
                    );
                    });
                    // ✏️ 編集中エントリは常に最上部に。confirmEntries は新しい順で並ぶ。
                    return [editingEntry].concat(confirmEntries);
                  })()
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
          <div style={{ padding: sidebarOpen ? "32px 24px 80px" : "32px 24px 80px 56px", maxWidth: 900, flex: 1, margin: "0 auto", width: "100%" }}>
          {!currentResult && !loading && (
<div style={{ marginBottom: 28 }}>
  {/* キャッチコピー（TOPの主役メッセージ）— 伴走支援者向けに振り切る。
      AB3Cカラー（B=赤・C=黒・A=青）を「クライアント」「戦略」「URL」に当てて、
      フレームワーク色の意味性を視覚的に伝える。 */}
  <div style={{ textAlign: "center", padding: "64px 16px 32px" }}>
    <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 38, fontWeight: 700, color: C.ink, lineHeight: 1.4, margin: 0, letterSpacing: "0.02em" }}>
      <span style={{ color: C.C }}>クライアント</span>の<span style={{ color: C.B }}>戦略</span>、<span style={{ color: C.A }}>URL</span>で即出力。
    </h1>
    <div style={{ fontSize: 18, color: C.ink, marginTop: 18, lineHeight: 1.8, maxWidth: 720, marginLeft: "auto", marginRight: "auto", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
      Web制作者・コンサルタント・伴走支援者のための、<b>AB3C専用AI</b>。<br />
      クライアントの「<b style={{ color: C.B }}>選ばれる理由</b>」を即座に言語化し、提案書としてそのまま使えます。
    </div>
    <div style={{ fontSize: 14, color: C.muted, marginTop: 14, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
      経営者ご本人でお試しの方は、ヘッダー右上の <b>👤 経営者ご本人向け</b> から（準備中）。
    </div>
  </div>
  {/* タブ（コンテンツに応じた幅で左寄せ。右側は余白でタブ感を出す） */}
  <div style={{ display: "flex", gap: 10, marginBottom: -1, position: "relative", zIndex: 1, alignItems: "stretch" }}>
    <button
      onClick={() => { setTab("url"); setError(""); }}
      style={{
        background: tab === "url" ? C.surface : "#d0d0d0",
        border: `1px solid ${C.border}`,
        borderTop: `4px solid ${tab === "url" ? C.ink : "#c4c4c0"}`,
        borderBottom: tab === "url" ? "none" : `1px solid ${C.border}`,
        borderRadius: "6px 6px 0 0",
        padding: "18px 32px 16px 18px",
        cursor: "pointer",
        textAlign: "left",
        flex: "0 0 auto"
      }}
    >
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 2 }}>URLで分析</div>
      <div style={{ fontSize: 16, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>WebサイトのURLを貼るだけ</div>
    </button>
    <button
      onClick={() => { setTab("text"); setError(""); }}
      style={{
        background: tab === "text" ? C.surface : "#d0d0d0",
        border: `1px solid ${C.border}`,
        borderTop: `4px solid ${tab === "text" ? C.ink : "#c4c4c0"}`,
        borderBottom: tab === "text" ? "none" : `1px solid ${C.border}`,
        borderRadius: "6px 6px 0 0",
        padding: "18px 32px 16px 18px",
        cursor: "pointer",
        textAlign: "left",
        flex: "0 0 auto"
      }}
    >
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 2 }}>テキストで入力</div>
      <div style={{ fontSize: 16, color: C.muted, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>新規事業・構想中の方向け</div>
    </button>
  </div>

 {/* 入力エリア（タブと一体感を保ちつつ、入力欄の上下にゆとりを持たせる） */}
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0 0 8px 8px", padding: "22px 22px 26px", boxShadow: `2px 2px 0 ${C.border}` }}>
    {/* AB3C カラー（赤B・黒C・青A）の3層ストライプボタン。
        TOPの主役アクションとして AB3C の3層構造を視覚化＋色付けで存在感を出す。 */}
    {(() => {
      const ab3cBtn = (
        <button onClick={analyze} disabled={loading}
          style={{
            border: "none", borderRadius: 4, padding: 0, overflow: "hidden", background: "transparent",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
            transition: "transform 0.12s, box-shadow 0.12s",
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)"; }}
        >
          <div style={{ background: C.B, height: 6 }} />
          <div style={{
            background: loading ? C.muted : C.ink,
            color: "#fff",
            padding: "10px 28px",
            fontFamily: "'Space Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}>
            {loading ? "分析中…" : "▶ 分析する"}
          </div>
          <div style={{ background: C.A, height: 6 }} />
        </button>
      );
      return tab === "text" ? (
        <>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 14, lineHeight: 1.7 }}>
            新規事業・構想中の事業を分析される方は、以下の観点ごとに分けて入力すると、AI が事業の本質をより深く理解した上で AB3C を生成します。<b>1項目でも、複数項目でもOK</b>です。分かっている範囲・仮説でかまいません。
          </div>
          {/* 事業名・タイトル: サイト管理一覧や結果画面でこの分析を識別するための短い名前 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
              事業名・タイトル <span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>（短く識別しやすい名前）</span>
            </label>
            <input
              type="text"
              value={businessPlan.title || ""}
              onChange={function(e) {
                var v = e.target.value;
                setBusinessPlan(function(prev) { return Object.assign({}, prev, { title: v }); });
              }}
              onKeyDown={function(e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) analyze(); }}
              placeholder="例：ナマエカード、高齢者向けスマホ訪問サポート、地元無農薬野菜の定期便"
              style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.6, padding: "8px 12px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {/* 目指す事業規模（5年後の目安・任意）。市場規模の十分性評価で AI が参照する。
              URLモードでは追加入力を作らない方針（手軽さ重視）。テキスト入力モードの方は
              新規事業・構想中の方が中心なので、目標規模だけは聞いておく価値がある。 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
              目指す事業規模 <span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>（5年後の目安・任意。市場規模の十分性評価に使われます）</span>
            </label>
            <select
              value={businessPlan.targetRevenue || ""}
              onChange={function(e) {
                var v = e.target.value;
                setBusinessPlan(function(prev) { return Object.assign({}, prev, { targetRevenue: v }); });
              }}
              style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.6, padding: "8px 12px", outline: "none", boxSizing: "border-box" }}
            >
              <option value="">選択しない（汎用ライン ¥10億 で評価）</option>
              <option value="〜1,000万円">〜1,000万円</option>
              <option value="〜3,000万円">〜3,000万円</option>
              <option value="〜1億円">〜1億円</option>
              <option value="〜5億円">〜5億円</option>
              <option value="〜10億円">〜10億円</option>
              <option value="10億円以上">10億円以上</option>
              <option value="未定">未定</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {BUSINESS_PLAN_FIELDS.map(function(f) {
              return (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
                    {f.label}
                  </label>
                  <textarea
                    value={businessPlan[f.key] || ""}
                    onChange={function(e) {
                      var v = e.target.value;
                      setBusinessPlan(function(prev) { return Object.assign({}, prev, { [f.key]: v }); });
                    }}
                    onKeyDown={function(e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) analyze(); }}
                    placeholder={f.placeholder}
                    style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.7, padding: "8px 12px", resize: "vertical", minHeight: 60, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}>{ab3cBtn}</div>
        </>
      ) : (
        // URLモードはGoogle検索バー風に：input と「分析する」ボタンを横並びで1行に
        <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) analyze(); }}
            placeholder="例：https://www.example.co.jp"
            style={{ flex: 1, minWidth: 0, background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", fontSize: 16, lineHeight: 1.8, padding: "10px 14px", outline: "none", boxSizing: "border-box" }} />
          {ab3cBtn}
        </div>
      );
    })()}
{error && (
  <div style={{ background: "#fdf0ef", borderLeft: `3px solid ${C.red}`, padding: "10px 14px", fontSize: 16, color: C.red, marginTop: 12 }}>
    <div style={{ whiteSpace: "pre-line" }}>{error}</div>
    <div style={{ marginTop: 8, fontSize: 16, color: C.muted, lineHeight: 1.7 }}>
      AIを利用したシステムのため、まれに動作がおかしくなることがあります。その場合は5分ほどして再度分析してみてください。それでも回復しない場合は、<a href="https://status.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: C.A }}>Claudeのシステムの稼働状況</a>を確認してください。
    </div>
  </div>
)}
  </div>

  {/* AB3Cフレームワーク考案者プロフィール（信頼の核）
      「権成俊が作ったツール」という事実が、AIで誰でも作れるツールとの最大の差別化。
      入力エリア直下に配置して、初訪問者が「このサービスは誰のもの？」をすぐ理解できるようにする。 */}
  <div style={{ marginTop: 56 }}>
    <CreatorProfileBlock />
  </div>

  {/* 制作者・コンサルタント向けのユースケース展示
      「あなたのクライアント獲得・単価UPの武器」というメッセージを、3要点＋単価試算＋3モデルで構造化。 */}
  <ProUseCaseBlock />

  {/* 使い方動画（YouTube）— TOPページ最下部に配置。分析未開始（!currentResult && !loading）時のみ表示。
      iframe 埋め込みは hover 時に YouTube プレーヤーのタイトル帯（暗いグラデーション）が出てしまうため、
      サムネイル＋リンク方式に切替。クリックで YouTube を新規タブで開く（よりクリーンで読み込みも軽い）。
      入力タブと視覚的に分離するため上余白は広めに取る（権さん指示）。 */}
  <div style={{ marginTop: 80, marginBottom: 32 }}>
    <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 26, fontWeight: 700, color: C.ink, textAlign: "center", marginBottom: 10, letterSpacing: "0.02em" }}>
      戦略指南 AI の使い方
    </h2>
    <div style={{ fontSize: 16, color: C.muted, textAlign: "center", marginBottom: 20, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
      分析から戦略確定、アクション施策までの流れを動画でご覧いただけます
    </div>
    <a
      href="https://www.youtube.com/watch?v=zAeZ-lJxvYM"
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "block", position: "relative", maxWidth: 800, margin: "0 auto", textDecoration: "none", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", background: "#000", transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}
    >
      {/* サムネイル: maxresdefault は無い場合があるので onError で hqdefault にフォールバック */}
      <img
        src="https://i.ytimg.com/vi/zAeZ-lJxvYM/maxresdefault.jpg"
        alt="戦略指南 AI の使い方 動画サムネイル"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = "https://i.ytimg.com/vi/zAeZ-lJxvYM/hqdefault.jpg"; }}
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: "16 / 9", objectFit: "cover" }}
      />
      {/* 中央の YouTube 風 再生ボタン */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 88, height: 60, borderRadius: 12, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
      >
        <div style={{ width: 0, height: 0, borderTop: "14px solid transparent", borderBottom: "14px solid transparent", borderLeft: "22px solid #fff", marginLeft: 4 }} />
      </div>
    </a>
    <div style={{ textAlign: "center", marginTop: 16 }}>
      <a
        href="https://www.youtube.com/watch?v=zAeZ-lJxvYM"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2a2a26", color: "#fff", padding: "10px 22px", borderRadius: 999, fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: "0.04em" }}
      >
        ▶ YouTube で動画を見る
      </a>
    </div>
  </div>
</div>
          )}
{/* TOPページのリンクカード4種と「戦略指南 AI 使い方」セクションは削除済み。
    Google風のシンプル構成（キャッチコピー＋入力欄）に変更。
    AB3C分析とは → /about、2つの使い方・分析結果の活用方法 → /howto に集約。
    各ページへのナビは Header メニューから可能。
    （2026-05-14 から最下部に使い方紹介の YouTube リンク（サムネイル＋ボタン）を追加） */}
{loading && <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 16 }}>AIがAB3Cを分析中です…</div>}
          {currentResult && phase !== "action" && (
            <div>
              {/* 履歴閲覧中バナーは削除済み: サイドバーの「確定中」ピルとタブ選択で
                  「現在どこを見ているか」「どれが確定中か」が視覚的に明確になったため、
                  説明バナーは冗長と判断（権さん指示）。
                  「履歴で再確定する」ボタンは薄い赤として下に並ぶ。 */}
             <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
  {currentInput && !currentInput.startsWith("http") && (
    <button onClick={() => editAndReanalyze(currentInput)} style={{ background: "#2a2a26", border: "none", borderRadius: 999, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px" }}>
      ✏️ このテキストを修正して再分析
    </button>
  )}
  {(() => {
    // 改善レポート/ビジュアルモック生成中は state が未完了なので、シェアや印刷を押されると
    // AB3C分析だけが共有/出力されてしまう（権さん指摘）。生成中はボタンを無効化する。
    const isGenerating = improveLoading || improveSwitchLoading || visualLoading;
    const genTip = "ウェブサイト改善レポートを生成中です。完了までお待ちください。";
    const shareDisabled = sharing || isGenerating;
    return (
      <>
        <button
          onClick={() => shareResult(currentInput || "", currentResult)}
          disabled={shareDisabled}
          title={isGenerating ? genTip : undefined}
          style={{ background: shareDisabled ? "#cccccc" : "#2a2a26", border: "none", borderRadius: 999, color: "#fff", cursor: shareDisabled ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px", opacity: shareDisabled ? 0.7 : 1 }}>
          {sharing ? "作成中…" : isGenerating ? "🔗 生成完了までお待ちください" : "🔗 シェアＵＲＬを発行"}
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
          disabled={isGenerating}
          style={{ background: isGenerating ? "#cccccc" : "#2a2a26", border: "none", borderRadius: 999, color: "#fff", cursor: isGenerating ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px", opacity: isGenerating ? 0.7 : 1 }}
          title={isGenerating ? genTip : "現在表示中のパターン（タブ切替で選んでいるパターン）の内容を印刷・PDF保存します。他のパターンを保存したい場合は、そのパターンに切り替えてから押してください。"}
        >
          {isGenerating ? "🖨️ 生成完了までお待ちください" : "🖨️ 表示中のパターンを印刷・ＰＤＦ"}
        </button>
        {/* 提案書エクスポート: 表示中のパターンを PowerPoint / PDF（16:9 提案書フォーマット）に書き出す。
            印刷ボタンとは別軸。印刷=ブラウザの簡易PDF保存、ここ=表紙・目次・章扉を含む提案書テンプレート。 */}
        <button
          onClick={() => exportProposal("pptx")}
          disabled={isGenerating || !!exporting}
          title={isGenerating ? genTip : "表紙・目次・章扉付きの提案書フォーマットで PowerPoint ファイル（.pptx）を書き出します。PowerPoint・Keynote・Google Slides で開けます。"}
          style={{ background: (isGenerating || !!exporting) ? "#cccccc" : "#2a2a26", border: "none", borderRadius: 999, color: "#fff", cursor: (isGenerating || !!exporting) ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px", opacity: (isGenerating || !!exporting) ? 0.7 : 1 }}
        >
          {isGenerating ? "📊 生成完了までお待ちください" : exporting === "pptx" ? "📊 書き出し中…" : "📊 提案書（PowerPoint）"}
        </button>
        <button
          onClick={() => exportProposal("pdf")}
          disabled={isGenerating || !!exporting}
          title={isGenerating ? genTip : "表紙・目次・章扉付きの提案書フォーマットで PDF ファイルを書き出します。16:9 の提案書スタイルです。"}
          style={{ background: (isGenerating || !!exporting) ? "#cccccc" : "#2a2a26", border: "none", borderRadius: 999, color: "#fff", cursor: (isGenerating || !!exporting) ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px", opacity: (isGenerating || !!exporting) ? 0.7 : 1 }}
        >
          {isGenerating ? "📄 生成完了までお待ちください" : exporting === "pdf" ? "📄 書き出し中…（数秒かかります）" : "📄 提案書（PDF）"}
        </button>
      </>
    );
  })()}
  {(() => {
    const canConfirm = !isDiagnosisActive && (isPro || chatTickets > 0 || trialChats > 0);
    // 古い世代を見ている時は確定ボタンを非表示にする
    if (isViewingOldVersion) return null;
    // 履歴閲覧モード: 過去のスナップショットを表示中。「確定済み」表示は混乱の元なので
    // 「この履歴で再確定」ボタンに切替、解除ボタンは隠す（live でないので解除対象外）。
    // 「現在の戦略」（confirmHistory の最終 = 最新確定）を選択中の場合は live 状態と等価なので
    // 履歴閲覧モードとは扱わない。古いスナップショットを開いている時だけ「閲覧モード」として扱う。
    const liveConfirmedSnapId = strategyConfirmed && confirmHistory.length > 0
      ? confirmHistory[confirmHistory.length - 1].id
      : null;
    const isViewingHistory = activeConfirmId != null && activeConfirmId !== liveConfirmedSnapId;
    const confirmDisabled = !canConfirm || (strategyConfirmed && !isViewingHistory);
    const confirmLabel = isViewingHistory
      ? "この履歴の戦略で再確定する →"
      : strategyConfirmed ? "✅ 戦略確定済み" : "戦略を確定して ② へ →";
    const confirmTitle = isDiagnosisActive
      ? "戦略診断チケットでは戦略確定はご利用いただけません"
      : !canConfirm ? "戦略指南サブスクで戦略確定・戦略アクションが利用可"
      : isViewingHistory ? "この履歴のスナップショットで再確定します（履歴に新エントリが追加されます）"
      : strategyConfirmed ? "戦略確定済み"
      : "戦略を確定して戦略アクションへ進む";
    return (
      <>
        <button
          onClick={confirmDisabled ? null : confirmStrategy}
          disabled={confirmDisabled}
          title={confirmTitle}
          style={{
            // 履歴閲覧中の「再確定」ボタンは「薄い赤」: 押すと濃い赤（=確定中）になる予感を視覚化
            // （権さん指示: 確定中ピル/解除ボタンの赤と統一）
            background: !canConfirm ? "#cccccc"
              : isViewingHistory ? "#ffe5e5"
              : (strategyConfirmed && !isViewingHistory) ? "#888"
              : "#2a2a26",
            border: isViewingHistory ? `1px solid ${C.B}` : "none",
            borderRadius: 999,
            color: isViewingHistory ? C.B : "#fff",
            cursor: confirmDisabled ? "not-allowed" : "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
            opacity: !canConfirm ? 0.7 : 1,
          }}
        >
          {confirmLabel}
        </button>
        {strategyConfirmed && !isViewingHistory && (
          <button
            onClick={unconfirmStrategy}
            title="戦略の確定を解除して策定フェーズに戻ります（確定履歴は保持）"
            style={{
              background: C.B, border: "none", borderRadius: 999,
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

{(currentInput || chatSummaries.length > 0) && (() => {
  // テキスト分析の場合、currentInput から【タイトル】を抽出してきれいに表示する。
  // タイトルがあればそれを大きく、その下に本文の冒頭を控えめに表示。
  // タイトルが無い場合は従来通り本文の冒頭100文字を表示。
  const isUrl = currentInput?.startsWith("http");
  const parsedTitle = isUrl ? { title: "", rest: currentInput || "" } : extractBusinessPlanTitle(currentInput || "");
  const sectionLabel = isUrl ? "分析URL" : (parsedTitle.title ? "事業名" : "分析テキスト");
  return (
  <div style={{ background: "#e8e8e8", border: `1px solid ${C.border}`, borderRadius: 4, padding: "14px 16px", marginBottom: 16 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>{sectionLabel}</div>
    <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.6 }}>
      {isUrl ? (
        <a href={currentInput} target="_blank" rel="noopener noreferrer" style={{ color: C.A }}>{currentInput}</a>
      ) : parsedTitle.title ? (
        <>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>{parsedTitle.title}</div>
          {parsedTitle.rest && (
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
              {parsedTitle.rest.slice(0, 80)}{parsedTitle.rest.length > 80 ? "…" : ""}
            </div>
          )}
        </>
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
  );
})()}
              {/* 全体タイトル編集欄は廃止：戦略メッセージは各パターンに紐づくため、選択中Pカード内に表示する */}
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
  <div style={{ borderTop: "6px solid #2a2a26", borderBottom: "1px solid #2a2a26", padding: "18px 8px 16px", marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: "0.18em", color: "#2a2a26", marginBottom: 6 }}>AB3C STRATEGY ANALYSIS REPORT</div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 30, fontWeight: 700, color: "#2a2a26", letterSpacing: "0.02em" }}>AB3C戦略分析レポート</div>
      </div>
      {analyzedAt && (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#888", textAlign: "right" }}>
          分析日時<br />
          <span style={{ fontSize: 14, color: "#2a2a26" }}>{new Date(analyzedAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      )}
    </div>
  </div>
  {/* 古い世代を見ている時の案内バー */}
  {isViewingOldVersion && (
    <div style={{ background: "#fff8e1", border: "2px solid #f0a020", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: C.ink, lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>
      <b>🕒 過去の世代を表示中です。</b> 再分析・戦略確定するには、各セクションのタブで<b>v{analysisVersions.length}（最新）</b>に戻してください。
    </div>
  )}
  {(() => {
    const needsLen = currentResult.benefit?.needs?.length ?? 0;
    const wantsLen = currentResult.benefit?.wants?.length ?? 0;
    const profileLen = currentResult.three_c?.customer?.profile?.length ?? 0;
    const isPending = !strategyConfirmed && !isViewingOldVersion && (
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
  <ResultView d={currentResult} versions={analysisVersions} activeVersionPerSection={activeVersionPerSection} onSectionTabChange={handleSectionTabChange} onChat={(topic) => chatSendTopicRef.current?.(topic)} changedPaths={changedPaths} refineSelection={refineSelection} selectedCombinationId={selectedCombinationId} onSelectCombination={handleCombinationSwitch} onRefineToggle={(strategyConfirmed || isViewingOldVersion) ? null : (key, i) => {
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
  {/* 改善レポートの見出し＋パターン切替（combinations がある場合は常に表示。ローディング中も切替できるよう外出し） */}
  {currentInput?.startsWith("http") && Array.isArray(currentResult?.combinations) && currentResult.combinations.length > 0 && (
    <div style={{ marginTop: 48 }}>
      <div style={{ borderTop: "6px solid #2a2a26", borderBottom: "1px solid #2a2a26", padding: "18px 8px 16px", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: "0.18em", color: "#2a2a26", marginBottom: 6 }}>WEBSITE IMPROVEMENT REPORT</div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 30, fontWeight: 700, color: "#2a2a26", letterSpacing: "0.02em" }}>ウェブサイト改善レポート</div>
      </div>
      <CombinationTabBar
        combinations={currentResult.combinations}
        selectedId={selectedCombinationId}
        recommendedId={currentResult.recommended_combination_id}
        onSelect={handleCombinationSwitch}
      />
    </div>
  )}
  {currentInput?.startsWith("http") && (improveLoading || improveSwitchLoading) && !improveResult && (
    <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 16, borderTop: `3px solid ${C.ink}`, marginTop: 40 }}>
      {improveSwitchLoading ? "このパターン用の改善レポートを生成中です…" : "ウェブサイト改善レポートを生成中です…"}
    </div>
  )}
  {currentInput?.startsWith("http") && improveResult?.error && (
    <div style={{ marginTop: 40, padding: "20px 24px", background: "#fff8e1", border: "2px solid #f0a020", borderRadius: 6, fontSize: 15, color: C.ink, lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>⚠ ウェブサイト改善レポートの生成に失敗しました</div>
      <div style={{ marginBottom: 12 }}>{improveResult.error}</div>
      <button
        onClick={async () => {
          if (!currentInput?.startsWith("http") || !currentResult) return;
          setImproveLoading(true);
          setImproveResult(null);
          setOverlayMessage("ウェブサイト改善レポート生成中...");
          try {
            const r = await fetch("/api/improve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysisResult: currentResult, url: currentInput }) });
            let d = null; try { d = await r.json(); } catch (e) { d = { error: `HTTP ${r.status}` }; }
            if (r.ok && !d.error) setImproveResult(d);
            else setImproveResult({ error: d.error || `改善レポートの生成に失敗しました（HTTP ${r.status}）` });
          } catch (e) {
            setImproveResult({ error: "通信エラーが発生しました。" });
          } finally {
            setImproveLoading(false);
            setOverlayMessage(null);
          }
        }}
        style={{ background: C.A, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "8px 16px" }}
      >
        🔄 改善レポートを再生成
      </button>
    </div>
  )}
  {currentInput?.startsWith("http") && improveResult && !improveResult.error && (
    <div id="improve-area" style={{ marginTop: Array.isArray(currentResult?.combinations) && currentResult.combinations.length > 0 ? 16 : 48 }}>
      {/* combinations が無い旧データの場合のみ、ここで見出しを表示。新データは上で表示済み */}
      {!(Array.isArray(currentResult?.combinations) && currentResult.combinations.length > 0) && (
        <div style={{ borderTop: "6px solid #2a2a26", borderBottom: "1px solid #2a2a26", padding: "18px 8px 16px", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: "0.18em", color: "#2a2a26", marginBottom: 6 }}>WEBSITE IMPROVEMENT REPORT</div>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 30, fontWeight: 700, color: "#2a2a26", letterSpacing: "0.02em" }}>ウェブサイト改善レポート</div>
        </div>
      )}
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


{/* 戦略策定チャットは右カラムに配置 */}

{/* 伴走フェーズのコンテンツは分析結果ブロックの外に移動済み */}
            </div>
          )}
{/* 伴走フェーズ（分析結果ブロックの外） */}
{phase === "action" && currentResult && (
  <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 180px)" }}>
    {/* 戦略メッセージ — 戦略策定タブのPカードと同じデザインに統一 */}
    <div style={{ padding: "20px 24px", flexShrink: 0 }}>
      {(() => {
        const confirmedCombo = currentResult?.combinations?.find(function(c) { return c?.id === selectedCombinationId; });
        const sm = confirmedCombo?.strategy_message || currentResult?.strategy_message || {};
        const pColor = confirmedCombo ? patternColor(confirmedCombo.id) : "#2a2a26";
        const SANS = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
        return (
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ background: pColor, height: 10 }} />
            <div style={{ padding: "16px 22px" }}>
              {confirmedCombo && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ background: pColor, color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "4px 14px", borderRadius: 999, letterSpacing: "0.05em" }}>
                    P{confirmedCombo.id}
                  </span>
                  <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
                    {trimRouteSuffix(confirmedCombo.label)}
                  </span>
                </div>
              )}
              {sm?.message && (
                <div style={{ marginTop: confirmedCombo ? 14 : 0, paddingTop: confirmedCombo ? 14 : 0, borderTop: confirmedCombo ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "inline-block", background: "#2a2a26", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: 999, marginBottom: 12 }}>戦略メッセージ</div>
                  <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: C.ink, lineHeight: 1.5 }}>
                    {sm.message}
                  </div>
                  {(sm.benefit_part || sm.advantage_part) && (
                    <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.8, color: "#555", fontFamily: SANS }}>
                      {sm.benefit_part && (<div><b style={{ color: C.B }}>Benefit：</b>{sm.benefit_part}</div>)}
                      {sm.advantage_part && (<div><b style={{ color: C.A }}>Advantage：</b>{sm.advantage_part}</div>)}
                    </div>
                  )}
                </div>
              )}
              {strategyConfirmed && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button
                    onClick={unconfirmStrategy}
                    title="戦略の確定を解除して策定フェーズに戻ります（確定履歴は保持）"
                    style={{
                      background: C.B, border: "none", borderRadius: 999,
                      color: "#fff", cursor: "pointer",
                      fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "10px 20px",
                      flexShrink: 0, whiteSpace: "nowrap",
                    }}
                  >
                    ↺ 戦略を解除
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
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
          </div>{/* end inner padding wrapper */}
        </div>{/* end main content column */}

        {/* 右カラム最小化時の復元ボタン */}
        {phase !== "input" && chatMinimized && (
          <button
            onClick={function() { setChatMinimized(false); try { localStorage.removeItem("ab3c_chat_minimized"); } catch (e) {} }}
            style={{ position: "fixed", right: 0, top: headerHeight + 10, zIndex: 200, background: phase === "action" ? C.phase2 : C.phase1, border: "none", borderRadius: "6px 0 0 6px", padding: "12px 10px", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 400, boxShadow: "-2px 2px 8px rgba(0,0,0,0.2)", writingMode: "vertical-rl", letterSpacing: "0.15em" }}
            title={phase === "action" ? "アクションリストを開く" : "戦略策定チャットを開く"}
          >
            ◀ {phase === "action" ? "アクション" : "チャット"}を開く
          </button>
        )}

        {/* 右カラム: チャットパネル（リサイズ可能） */}
        {phase !== "input" && !chatMinimized && (
            <div id="chat-column" style={{ position: "relative", borderLeft: `1px solid ${C.border}`, background: "#faf8f4", display: "flex", flexDirection: "column", height: "calc(100vh - " + headerHeight + "px)", position: "sticky", top: headerHeight, zIndex: 100 }}>
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
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: "#2a2a26", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {phase === "action" ? `アクションリスト${actions.length > 0 ? `（${actions.length}）` : ""}` : "戦略策定チャット"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>
                  {phase !== "action" && chatSummaries.length > 0 ? `（${chatSummaries.length}回反映済み）` : ""}
                </span>
                <button
                  onClick={function() { setChatMinimized(true); try { localStorage.setItem("ab3c_chat_minimized", "1"); } catch (e) {} }}
                  style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 3, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "3px 10px", lineHeight: 1, fontFamily: "system-ui, sans-serif", flexShrink: 0 }}
                  title={phase === "action" ? "アクションリストを閉じる" : "戦略策定チャットを閉じる"}
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
                (isPro || chatTickets > 0 || trialChats > 0) ? (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  <AnalysisChatPanel
                    /* 確定履歴クリック時にチャットも切り替えるため、activeConfirmId を含めて key を変える。
                       これで AnalysisChatPanel が再マウントされ、復元された localStorage を読み直す。 */
                    key={"chat-panel-" + (siteId || "default") + "-" + (activeConfirmId || "current")}
                    isPro={isPro || chatTickets > 0 || trialChats > 0}
                    analysisResult={currentResult}
                    siteId={siteId}
                    isViewingOldVersion={isViewingOldVersion}
                    /* テキスト分析時は専用のウェルカム文に切り替え、情報追加を促す */
                    isTextMode={!(currentInput || "").startsWith("http")}
                    /* 構造化入力（5項目+タイトル）をチャット冒頭の user メッセージとして表示するため、
                       初回マウント時の currentInput を渡す */
                    initialUserInput={currentInput}
                    onSendTopic={chatSendTopicRef}
                    onReanalyze={function(newResult, summary) {
                      // 戦略パターン（combinations）が存在する場合、reanalyze の結果は
                      // 「現在選択中のパターン」を refine したものとみなし、選択中 combo の
                      // benefit / advantage / customer / competitor / strategy_message /
                      // checkpoints を新しい top-level の値で上書きする。これがないと
                      // shadowResult が古い combo データを表示し続けて、反映結果が
                      // 画面に出てこない。
                      if (Array.isArray(newResult?.combinations) && newResult.combinations.length > 0 && selectedCombinationId) {
                        newResult = Object.assign({}, newResult, {
                          combinations: newResult.combinations.map(function(combo) {
                            if (!combo || combo.id !== selectedCombinationId) return combo;
                            return Object.assign({}, combo, {
                              benefit: newResult.benefit || combo.benefit,
                              advantage: newResult.advantage || combo.advantage,
                              customer: newResult.three_c?.customer || combo.customer,
                              competitor: newResult.three_c?.competitor || combo.competitor,
                              strategy_message: newResult.strategy_message || combo.strategy_message,
                              checkpoints: Array.isArray(newResult.checkpoints) && newResult.checkpoints.length > 0 ? newResult.checkpoints : combo.checkpoints,
                            });
                          }),
                        });

                        // 強みの根拠評価をルートの three_c.company.strength_evaluations から
                        // company_core.all_strengths_evaluations へ伝播する。
                        // shadowResult は companyCore.all_strengths_evaluations を strengths_used でマップして
                        // UI に渡すため、ここを更新しないと「チャットで根拠を提示しても赤い吹き出しが消えない」
                        // バグになる（権さん指摘・2026-05-15）。
                        var newEvals = newResult.three_c?.company?.strength_evaluations;
                        var newStrengths = newResult.three_c?.company?.strength;
                        var targetCombo = newResult.combinations.find(function(c) { return c?.id === selectedCombinationId; });
                        var usedIdx = Array.isArray(targetCombo?.strengths_used) ? targetCombo.strengths_used : [];
                        if (Array.isArray(newEvals) && newEvals.length > 0 && usedIdx.length > 0 && newResult.company_core) {
                          var origAllStrengths = Array.isArray(newResult.company_core.all_strengths) ? newResult.company_core.all_strengths.slice() : [];
                          var origAllEvals = Array.isArray(newResult.company_core.all_strengths_evaluations) ? newResult.company_core.all_strengths_evaluations.slice() : [];
                          usedIdx.forEach(function(absIdx, relIdx) {
                            if (newEvals[relIdx]) origAllEvals[absIdx] = newEvals[relIdx];
                            if (Array.isArray(newStrengths) && newStrengths[relIdx]) origAllStrengths[absIdx] = newStrengths[relIdx];
                          });
                          newResult = Object.assign({}, newResult, {
                            company_core: Object.assign({}, newResult.company_core, {
                              all_strengths: origAllStrengths,
                              all_strengths_evaluations: origAllEvals,
                            }),
                          });
                        }
                      }
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
                      setAnalyzedAt(Date.now());
                      setHistoryTitle(newResult?.strategy_message?.message || "");
                      setSelectedHistory(null);
                      addAnalysisVersion(newResult, "reanalyze"); // チャット再分析を新世代として追加
                      setLiveStateBackup(null); // 再分析でライブ状態が更新されたのでバックアップは破棄
                      if (summary) setChatSummaries(function(prev) { return [].concat(prev, [summary]); });
                      saveHistory(currentInput || "", newResult, newResult?.strategy_message?.message || "");
                      // チャット会話内容を反映した再分析結果を DB に保存（リロードで消えないように）
                      if (siteId) {
                        fetch("/api/sites", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: siteId, latest_analysis: newResult, analyzed_at: Date.now(), version_source: "reanalyze" }),
                        }).catch(function() {});
                      }
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onConfirmStrategy={!strategyConfirmed && !isDiagnosisActive && (isPro || chatTickets > 0 || trialChats > 0) ? confirmStrategy : null}
                  />
                </div>
                ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", overflow: "auto" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                  <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 12, lineHeight: 1.6 }}>
                    AIチャットで戦略を磨きませんか？
                  </div>
                  <div style={{ fontSize: 15, color: C.ink, marginBottom: 24, lineHeight: 1.7 }}>
                    <b>戦略指南サブスク</b>（戦略診断・策定・アクション）なら、<br/>
                    AIと対話しながら戦略を何度でも練り直せます。<br/>
                    確定した戦略から具体的なアクション計画も<br/>
                    自動で生成できます。
                  </div>
                  <a href="/pricing" style={{ display: "inline-block", background: C.A, color: "#fff", fontSize: 16, fontWeight: 700, padding: "12px 24px", borderRadius: 4, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>
                    戦略指南サブスクを見る →
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
      <Footer />
    </div>
  );
}
