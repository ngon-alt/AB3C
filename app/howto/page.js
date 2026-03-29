"use client";
const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#3a3a2e", highlight: "#f0ebe0",
};

export default function HowtoPage() {
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
              初めての方へ
            </div>
          </div>
          <a href="https://analyzer.ab3c.jp" style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 2 }}>
            ← 分析ツールへ
          </a>
        </div>

        {/* 入力方法 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            🔰 入力方法
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>🌐 URLで分析（既存事業向け）</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>すでにウェブサイトがある場合はURLを入力するだけで分析できます。サイトの内容を自動で読み取り、AB3C分析を行います。</p>
              <div style={{ marginTop: 14, background: C.highlight, borderRadius: 6, padding: "12px 14px", fontSize: 13, color: C.muted }}>
                <b>手順：</b><br />
                1. 「URLで分析」タブを選択<br />
                2. 分析したいウェブサイトのURLを貼り付け<br />
                3. 「分析する」ボタンを押す
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>✏️ テキストで入力（新規事業向け）</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>これから起業する、新規事業を立ち上げる場合はテキストで事業概要を入力します。</p>
              <div style={{ marginTop: 14, background: C.highlight, borderRadius: 6, padding: "12px 14px", fontSize: 13, color: C.muted }}>
                <b>手順：</b><br />
                1. 「テキストで入力」タブを選択<br />
                2. 事業概要を自由に記述<br />
                3. 「分析する」ボタンを押す
              </div>
            </div>
          </div>
        </div>

        {/* レポートの見方 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            📊 レポートの見方
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "B — Benefit", color: C.B, desc: "お客様が求める価値。ニーズ（欠乏感）とウォンツ（具体的欲求）の両面から分析します。" },
              { label: "A — Advantage", color: C.A, desc: "競合との好ましい違い。なぜ選ばれるのか、なぜ真似されにくいのかを示します。" },
              { label: "3C — Customer · Competitor · Company", color: C.C, desc: "お客様・競合・自社の3つの視点で事業を構造化します。市場規模も含めて分析します。" },
              { label: "戦略メッセージ", color: C.ink, desc: "BenefitとAdvantageを合わせた「選ばれる理由」の一言表現。ウェブサイトや提案書の核心になります。" },
              { label: "5つのチェックポイント", color: C.ink, desc: "AB3Cが成立しているかを5つの観点で評価します。○△✕で現状の課題が一目でわかります。" },
            ].map((item, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${item.color}`, borderRadius: 4, padding: "14px 18px", display: "flex", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: C.muted }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 活用方法 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            💡 チャット・改善レポートの活用方法
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>💬 Q&Aチャット機能</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>分析結果についてAIに質問できます。「このターゲットは本当に合っているか」「アドバンテージをもっと具体的にしたい」など、分析を深掘りするのに活用してください。</p>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>🔧 ウェブサイト改善レポート</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>URL分析後に生成できる追加レポートです。追加すべきコンテンツ・改善すべきデザイン・サイト構造の改善点を各5項目ずつ提案します。</p>
            </div>
          </div>
          <div style={{ marginTop: 16, background: C.highlight, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 10 }}>📊 Google NotebookLMとの連携</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>「シェアURLを発行」ボタンで発行したURLをGoogle NotebookLMに読み込ませると、分析結果をもとにスライド資料が自動生成されます。提案書や社内共有資料の作成に活用できます。</p>
          </div>
        </div>

        {/* 機能比較表 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            📋 プラン別機能比較
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "sans-serif" }}>
              <thead>
                <tr style={{ background: C.ink, color: "#fff" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>機能</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>⓪フリー<br /><span style={{ fontSize: 11, fontWeight: 400 }}>¥0</span></th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>①ベーシック<br /><span style={{ fontSize: 11, fontWeight: 400 }}>¥3,300</span></th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>②スタンダード<br /><span style={{ fontSize: 11, fontWeight: 400 }}>¥9,900</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "AB3C分析レポート", free: "○（1回）", basic: "○", standard: "○" },
                  { feature: "シェアURL発行", free: "○", basic: "○", standard: "○" },
                  { feature: "印刷・PDF保存", free: "○", basic: "○", standard: "○" },
                  { feature: "ウェブサイト改善アドバイス", free: "✕", basic: "✕", standard: "○" },
                  { feature: "AIチャット相談", free: "✕", basic: "✕", standard: "○（30回）" },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.highlight : C.surface, borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "12px 16px", color: C.ink, fontWeight: 600 }}>{row.feature}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.muted }}>{row.free}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.muted }}>{row.basic}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: row.standard === "✕" ? "#c0392b" : C.A, fontWeight: row.standard !== "✕" ? 700 : 400 }}>{row.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>
            ※ ③コンサルタント相談・④プロプランについては<a href="https://www.digi-kaku.or.jp/" target="_blank" rel="noopener noreferrer" style={{ color: C.A }}>デジタル経営革新協会</a>までお問い合わせください。
          </div>
        </div>
         <div style={{ background: C.ink, borderRadius: 8, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>さっそく分析してみましょう</div>
          <a href="https://analyzer.ab3c.jp" style={{ display: "inline-block", background: C.A, borderRadius: 4, color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "12px 28px", textDecoration: "none" }}>
            ▶ 分析ツールへ
          </a>
        </div>

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
