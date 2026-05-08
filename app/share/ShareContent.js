"use client";
import { useState, useMemo } from "react";
import ShadowMock from "../components/ShadowMock";
import Footer from "../components/Footer";
const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#8a8478", highlight: "#f0ebe0",
};

// パターンラベル末尾の「ルート」を除去（ボタンが2行に折り返すのを防ぐため）。
function trimRouteSuffix(label) {
  if (!label || typeof label !== "string") return label;
  return label.replace(/[\s　]*ルート$/, "");
}

// パターン別の固有色（メインUI と同じ・AB3Cの赤青黒、フェーズ色を避けて選定）。
// P1の緑は phase1 ティールと紛らわしかったため、ローズに変更。
const PATTERN_COLORS = ["#be185d", "#6b21a8", "#78350f"]; // ローズ・紫・茶
function patternColor(id) {
  if (!id) return "#444";
  return PATTERN_COLORS[(Number(id) - 1) % PATTERN_COLORS.length] || "#444";
}

// パターン別の AB3C データを top-level に展開して、既存のレンダリングをそのまま使えるようにする。
// （メイン側 page.js の buildShadowResultFromCombo と同じロジック）
function buildShadowResultFromCombo(combo, companyCore) {
  if (!combo) return null;
  const allStrengths = Array.isArray(companyCore?.all_strengths) ? companyCore.all_strengths : [];
  const usedIdx = Array.isArray(combo.strengths_used) ? combo.strengths_used : [];
  const usedStrengths = usedIdx.length > 0
    ? usedIdx.map(i => allStrengths[i]).filter(Boolean)
    : allStrengths;
  return {
    benefit: combo.benefit || {},
    advantage: combo.advantage || {},
    three_c: {
      customer: combo.customer || {},
      competitor: combo.competitor || { direct: [], indirect: [] },
      company: {
        strength: usedStrengths,
        structure: companyCore?.structure || "",
        passion: companyCore?.passion || "",
      },
    },
    strategy_message: combo.strategy_message || {},
    checkpoints: Array.isArray(combo.checkpoints) ? combo.checkpoints : [],
  };
}

// シェアページ用のパターン切替バー（メイン UI のピル型スイッチャーと同じ見た目）
function CombinationSwitcher({ combinations, selectedId, recommendedId, onSelect }) {
  if (!Array.isArray(combinations) || combinations.length === 0) return null;
  const sansFont = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
  const selectedCombo = combinations.find(c => c?.id === selectedId);
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, color: "#444", marginBottom: 10, fontFamily: sansFont, fontWeight: 700 }}>
          戦略パターンを切り替え
          <span style={{ fontWeight: 400, color: "#777", marginLeft: 8, fontSize: 13 }}>
            （AIが3案提案。ボタンで表示を切替）
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {combinations.map(combo => {
            const isSelected = combo.id === selectedId;
            const isRecommended = combo.id === recommendedId;
            const myColor = patternColor(combo.id);
            return (
              <button
                key={combo.id}
                onClick={() => onSelect && onSelect(combo.id)}
                style={{
                  background: isSelected ? myColor : "#ffffff",
                  color: isSelected ? "#fff" : C.ink,
                  border: isSelected ? `2px solid ${myColor}` : `2px solid #c8c8c4`,
                  borderLeft: isSelected ? `2px solid ${myColor}` : `6px solid ${myColor}`,
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: sansFont,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  lineHeight: 1.2,
                }}
              >
                <span style={{
                  background: isSelected ? "#fff" : myColor,
                  color: isSelected ? myColor : "#fff",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 999,
                  letterSpacing: "0.05em",
                }}>P{combo.id}</span>
                <span>{trimRouteSuffix(combo.label)}</span>
                {isRecommended && (
                  <span style={{
                    background: isSelected ? "rgba(255,255,255,0.22)" : "#fef3c7",
                    color: isSelected ? "#fff" : "#854d0e",
                    fontSize: 11,
                    padding: "3px 9px",
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
      {selectedCombo && (
        <div style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <div style={{ background: patternColor(selectedCombo.id), height: 10 }} />
          <div style={{ padding: "16px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#888", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                現在表示中
              </span>
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
              <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
                {trimRouteSuffix(selectedCombo.label)}
              </span>
            </div>
            <div style={{ fontSize: 14, color: "#555", marginTop: 8, lineHeight: 1.7, fontFamily: sansFont }}>
              このパターンに合わせた AB3C 分析（ターゲット・競合・自社強み・市場規模）と改善レポートが下に表示されています。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function ShareContent({ input, result, improveResult, visualMock, improveResultsByCombination, visualMocksByCombination, error, expiredAt }) {
  // 組み合わせパターンが含まれる新スキーマ対応。タブ切替で表示を変える。
  const hasCombinations = !!(result?.combinations && Array.isArray(result.combinations) && result.combinations.length > 0);
  const recommendedId = result?.recommended_combination_id;
  const [selectedCombinationId, setSelectedCombinationId] = useState(
    hasCombinations ? (recommendedId || result.combinations[0]?.id) : null
  );

  // 選択中パターンの AB3C データを top-level に展開した shadowResult を使う。
  // 旧データ（combinations 無し）は result そのまま。
  const d = useMemo(() => {
    if (!hasCombinations) return result;
    const combo = result.combinations.find(c => c?.id === selectedCombinationId) || result.combinations[0];
    return buildShadowResultFromCombo(combo, result.company_core);
  }, [hasCombinations, result, selectedCombinationId]);

  // 改善レポート・ビジュアルモックも選択中パターンのものに切り替え。
  // キャッシュにあればそれを、無ければ既定（recommended）の improveResult / visualMock にフォールバック。
  const displayedImprove = useMemo(() => {
    if (!hasCombinations || !improveResultsByCombination) return improveResult;
    return improveResultsByCombination[selectedCombinationId] || improveResult;
  }, [hasCombinations, improveResultsByCombination, improveResult, selectedCombinationId]);

  const displayedVisual = useMemo(() => {
    if (!hasCombinations || !visualMocksByCombination) return visualMock;
    return visualMocksByCombination[selectedCombinationId] || visualMock;
  }, [hasCombinations, visualMocksByCombination, visualMock, selectedCombinationId]);

  const g2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 };
  const g3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };

  return (
    <>
    <main style={{ background: C.bg, minHeight: "100vh", padding: "40px 20px 100px" }}>
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
          <a href="https://senryaku.ai" style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 2 }}>
            ← 分析ツールへ
          </a>
        </div>

        {error && (
          <div style={{ background: "#fdf0ef", borderLeft: `3px solid ${C.red}`, padding: "20px 24px", color: C.ink, borderRadius: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.red, marginBottom: 8 }}>{expiredAt ? "🕒 閲覧期限が切れています" : "⚠️ 表示できません"}</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: expiredAt ? 12 : 0 }}>{error}</div>
            {expiredAt && (
              <>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
                  期限日: {new Date(expiredAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.8 }}>
                  新しく分析を実行してシェアURLを発行するか、戦略指南プランで履歴保存された結果をダッシュボードから呼び出してください。
                </div>
                <a href="https://senryaku.ai" style={{ display: "inline-block", marginTop: 12, background: "#1a6fd4", color: "#fff", textDecoration: "none", padding: "10px 20px", borderRadius: 4, fontSize: 14, fontWeight: 700 }}>
                  新しく分析する →
                </a>
              </>
            )}
          </div>
        )}

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
            {/* AB3C戦略分析レポート 大見出し（看板らしさを保つ：太い墨色上罫線＋細い下罫線＋大きな見出し） */}
            <div style={{ borderTop: "6px solid #2a2a26", borderBottom: "1px solid #2a2a26", padding: "18px 8px 16px", marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: "0.18em", color: "#2a2a26", marginBottom: 6 }}>AB3C STRATEGY ANALYSIS REPORT</div>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 30, fontWeight: 700, color: "#2a2a26", letterSpacing: "0.02em" }}>AB3C戦略分析レポート</div>
            </div>
            {hasCombinations && (
              <CombinationSwitcher
                combinations={result.combinations}
                selectedId={selectedCombinationId}
                recommendedId={recommendedId}
                onSelect={setSelectedCombinationId}
              />
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
              {/* AB3Cスコア（メインUIと同じ ok=2点 / warn=1点 / ng=0点 の合計）*/}
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, textAlign: "right" }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>
                  AB3Cスコア：{(d.checkpoints || []).reduce(function(acc, cpi) { return acc + (cpi.status === "ok" ? 2 : cpi.status === "warn" ? 1 : 0); }, 0)} / 10
                </span>
              </div>
            </div>
          </div>
        )}
{displayedImprove && (
  <div style={{ marginTop: 32 }}>
    {/* ウェブサイト改善レポート 大見出し（メインUIと同じ黒帯） */}
    <div style={{ background: C.ink, borderRadius: 6, padding: "24px 28px", marginBottom: 28 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>WEBSITE IMPROVEMENT REPORT</div>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>ウェブサイト改善レポート</div>
    </div>
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "28px 32px" }}>
      {/* 改善後のファーストビュー・イメージ（メインUIと同じ位置：3項目セクションより上） */}
      {displayedVisual && (
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
          <div className="visual-mock-frame">
            <div style={{ border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", background: "#fff" }}>
              <ShadowMock html={displayedVisual.visual_mock_html} style={{ display: "block", width: "100%" }} />
            </div>
            {displayedVisual.caption && (
              <div className="visual-mock-caption" style={{ marginTop: 12, padding: "14px 18px", background: C.highlight, borderLeft: `4px solid ${C.A}`, fontSize: 15, color: C.ink, lineHeight: 1.7 }}>
                <b style={{ color: C.A }}>💡 このビジュアルの意図：</b>{displayedVisual.caption}
              </div>
            )}
          </div>
        </div>
      )}
      {/* 5つのチェックポイントは上の AB3C セクションで既に表示されているためここには配置しない */}
      {[
        { key: "contents", label: "📝 追加すべきコンテンツ", color: C.A },
        { key: "design", label: "🎨 改善すべきデザイン・ビジュアル", color: C.B },
        { key: "structure", label: "🏗️ サイト構造の改善", color: C.C },
      ].map(section => (
        <div key={section.key} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: section.color, marginBottom: 14, borderLeft: `3px solid ${section.color}`, paddingLeft: 12 }}>{section.label}</div>
          {displayedImprove[section.key]?.map((item, i) => (
            <div key={i} style={{ background: C.highlight, borderRadius: 6, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{i + 1}. {item.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 6 }}><b>理由：</b>{item.reason}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}><b>実装例：</b>{item.example}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    </main>
    <Footer />
    </>
  );
}
