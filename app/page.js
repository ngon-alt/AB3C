"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
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
          <Card color={C.A} title="アドバンテージ"><div style={{ fontSize: 15, fontWeight: 700, color: C.A, lineHeight: 1.6 }}>{d.advantage.what}</div></Card>
          <Card color={C.A} title="なぜ好ましいのか"><p style={{ fontSize: 14, lineHeight: 1.7, color: "#3a3a2e" }}>{d.advantage.why_good}</p></Card>
          <Card color={C.A} title="なぜ真似されにくいか"><p style={{ fontSize: 14, lineHeight: 1.7, color: "#3a3a2e" }}>{d.advantage.why_hard_to_copy}</p></Card>
        </div>
      </div>
      <Divider />
      <div style={{ marginBottom: 28 }}>
        <SectionLabel color={C.C} letter="3C" jp="3C分析" en="Customer · Competitor · Company" />
        <SubLabel color={C.C} text="Customer（お客様）" />
        <div style={{ ...g2, marginBottom: 14 }}>
          <Card color={C.C} title="ターゲット">
            <div style={{ fontSize: 15, fontWeight: 700, color: C.C, marginBottom: 12 }}>{d.three_c.customer.target}</div>
            <UL items={d.three_c.customer.profile} />
          </Card>
          <Card color={C.C} title="アプローチ段階 · 切り捨て">
            <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 12 }}><b>段階：</b>{d.three_c.customer.stage}</p>
            <p style={{ fontSize: 14, lineHeight: 1.65 }}><b>切り捨てたお客様：</b>{d.three_c.customer.cutoff}</p>
          </Card>
        </div>
        {d.three_c.customer.market && (
          <div style={{ marginBottom: 14 }}>
            <SubLabel color={C.C} text="市場規模" />
            <Card color={C.C} title="SAM · SOM · 成長率">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SAM（獲得可能市場）</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{d.three_c.customer.market.sam}</div>
                </div>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>SOM（実際に狙える市場）</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{d.three_c.customer.market.som}</div>
                </div>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.C, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>成長率・トレンド</div>
                  <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{d.three_c.customer.market.growth}</div>
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
              <p style={{ fontSize: 12, color: C.muted, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>構造：{d.three_c.company.structure}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>💡 {d.three_c.company.passion}</p>
