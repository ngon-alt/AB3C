"use client";
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
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color, borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const UL = ({ items }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: 16, lineHeight: 1.75, padding: "5px 0 5px 16px", borderBottom: i < items.length - 1 ? `1px dashed ${C.border}` : "none", position: "relative", color: "#3a3a2e" }}>
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

export default function ShareContent({ input, result, improveResult, error }) {
  const d = result;
  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };

  return (
    <main style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Noto Serif JP', serif", padding: "40px 20px 100px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 20, marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
              <span style={{ color: "#1a6fd4" }}>A</span>
              <span style={{ color: "#FF0000" }}>B</span>
              <span style={{ color: "#1a1a14" }}>3C</span>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 5 }}>
              「選ばれる理由」を見つけるフレームワーク
            </div>
          </div>
          <a href="https://analyzer.ab3c.jp" style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 2 }}>
            ← 分析ツールへ
          </a>
        </div>

        {error && <div style={{ background: "#fdf0ef", borderLeft: `3px solid ${C.red}`, padding: "16px 20px", color: C.red }}>{error}</div>}

        {d && (
          <div>
           {input && (
  <div style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4, padding: "16px 20px", marginBottom: 28 }}>
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>分析対象</div>
   {input.startsWith("http") ? (
      <a href={input} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: C.A, wordBreak: "break-all" }}>{input}</a>
    ) : (
      <p style={{ fontSize: 14, lineHeight: 1.8, color: C.ink }}>{input}</p>
    )}
  </div>
)}
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
                  <p style={{ fontSize: 14, lineHeight: 1.65 }}><b>切り捨て：</b>{d.three_c.customer.cutoff}</p>
                </Card>
              </div>
              {d.three_c.customer.market && (
                <div style={{ marginBottom: 14 }}>
                  <SubLabel color={C.C} text="市場規模" />
                  <Card color={C.C} title="市場規模">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                      <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px" }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.C, marginBottom: 6 }}>SAM（獲得可能市場）</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{d.three_c.customer.market.sam}</div>
                      </div>
<div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px" }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.C, marginBottom: 6 }}>SOM（実際に狙える市場）</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{d.three_c.customer.market.som}</div>
                      </div>
                      <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px" }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.C, marginBottom: 6 }}>成長率・トレンド</div>
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
          </div>
        )}
{improveResult && (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "28px 32px", marginTop: 32 }}>
    <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 24, borderBottom: `2px solid ${C.border}`, paddingBottom: 16 }}>🔧 ウェブサイト改善レポート</div>
    {[
      { key: "contents", label: "📝 追加すべきコンテンツ", color: C.A },
      { key: "design", label: "🎨 改善すべきデザイン・ビジュアル", color: C.B },
      { key: "structure", label: "🏗️ サイト構造の改善", color: C.C },
    ].map(section => (
      <div key={section.key} style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: section.color, marginBottom: 14, borderLeft: `3px solid ${section.color}`, paddingLeft: 12 }}>{section.label}</div>
        {improveResult[section.key]?.map((item, i) => (
          <div key={i} style={{ background: C.highlight, borderRadius: 6, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{i + 1}. {item.title}</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 6 }}><b>理由：</b>{item.reason}</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}><b>実装例：</b>{item.example}</div>
          </div>
        ))}
      </div>
    ))}
  </div>
)}
        <footer style={{ textAlign: "center", marginTop: 60, paddingTop: 20, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 32 }} />
            <span style={{ fontSize: 12, color: C.ink }}>一般社団法人デジタル経営革新協会</span>
          </div>
          <div>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted }}>ab3c.jp</a> · Powered by Claude AI</div>
        </footer>
      </div>
    </main>
  );
}
