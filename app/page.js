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
  const [tab, setTab] = useState("text");
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (tab === "text" && !input.trim()) { setError("事業概要を入力してください。"); return; }
    if (tab === "url" && !url.trim()) { setError("URLを入力してください。"); return; }
    setError(""); setResult(null); setLoading(true);
    try {
      const body = tab === "url" ? { url } : { input };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const reset = () => { setResult(null); setInput(""); setUrl(""); setError(""); };

  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };

  const tabStyle = (t) => ({
    padding: "8px 20px", fontFamily: "'Space Mono', monospace", fontSize: 12,
    fontWeight: 700, letterSpacing: "0.06em", border: "none", cursor: "pointer",
    borderBottom: tab === t ? `2px solid ${C.ink}` : "2px solid transparent",
    background: "transparent", color: tab === t ? C.ink : C.muted,
  });

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
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 28, boxShadow: `2px 2px 0 ${C.border}` }}>
            <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", gap: 8 }}>
              <button style={tabStyle("text")} onClick={() => { setTab("text"); setError(""); }}>✏️ テキストで入力</button>
              <button style={tabStyle("url")} onClick={() => { setTab("url"); setError(""); }}>🌐 URLで分析</button>
            </div>
            <div style={{ padding: "26px 28px" }}>
              {tab === "text" ? (
                <>
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
                </>
              ) : (
                <>
                  <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 10 }}>
                    分析したいウェブサイトのURLを入力してください
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") analyze(); }}
                    placeholder="例：https://www.example.co.jp"
                    style={{ width: "100%", background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 2, color: C.ink, fontFamily: "'Noto Serif JP', serif", fontSize: 14, lineHeight: 1.8, padding: "14px 16px", outline: "none", boxSizing: "border-box" }}
                  />
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>※ サイトの内容を読み取りAB3C分析を行います。一部のサイトは読み取れない場合があります。</p>
                </>
              )}
              {error && (
                <div style={{ background: "#fdf0ef", borderLeft: `3px solid ${C.red}`, padding: "10px 14px", fontSize: 13, color: C.red, marginTop: 12 }}>{error}</div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
                <button onClick={analyze} disabled={loading}
                  style={{ background: loading ? C.muted : C.ink, border: "none", borderRadius: 2, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 28px" }}>
                  {loading ? "分析中…" : "▶ 分析する"}
                </button>
                <span style={{ fontSize: 12, color: C.muted }}>{tab === "text" ? "Ctrl + Enter でも実行できます" : "Enter でも実行できます"}</span>
              </div>
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 14 }}>AIがAB3Cを分析中です…</div>}

        {result && (() => { const d = result; return (
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
                  </Card>
                </div>
              </div>
            </div>
            <Divider />
            <div style={{ background: C.ink, borderRadius: 4, padding: "28px 32px", marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, color: "#fff", marginBottom: 12 }}>戦略メッセージ = Benefit + Advantage</div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.65, color: "#fff", marginBottom: 18 }}>{d.strategy_message.message}</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.75, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
                <b>Benefit：</b>{d.strategy_message.benefit_part}<br />
                <b>Advantage：</b>{d.strategy_message.advantage_part}
              </div>
            </div>
            <div style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px", marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>AB3C 5つのチェックポイント</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {d.checkpoints.map((cp, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.6 }}>
                    <Badge status={cp.status} />
                    <div><b>{cp.label}</b><br /><span style={{ color: C.muted, fontSize: 13 }}>{cp.comment}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 2, color: C.muted, cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.06em", padding: "10px 28px" }}>
                ← 別の事業を分析する
              </button>
            </div>
          </div>
        ); })()}

        <footer style={{ textAlign: "center", marginTop: 60, paddingTop: 20, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 11 }}>
          AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted }}>ab3c.jp</a> · Powered by Claude AI
        </footer>
      </div>
    </main>
  );
}
