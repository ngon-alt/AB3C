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
          <a href="https://senryaku.ai" style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 2 }}>
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
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700 }}>①分析プラン<br /><span style={{ fontSize: 11, fontWeight: 400 }}>¥22,000〜/月</span></th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, background: "#1a5cb0" }}>②伴走プラン<br /><span style={{ fontSize: 11, fontWeight: 400 }}>¥44,000〜/月</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "AB3C分析レポート", free: "○（1回）", basic: "○", standard: "○" },
                  { feature: "シェアURL発行", free: "○", basic: "○", standard: "○" },
                  { feature: "印刷・PDF保存", free: "○", basic: "○", standard: "○" },
                  { feature: "ウェブサイト改善アドバイス", free: "✕", basic: "○", standard: "○" },
                  { feature: "AIチャット相談", free: "✕", basic: "✕", standard: "○" },
                  { feature: "複数サイト管理", free: "✕", basic: "○（5〜100サイト）", standard: "○（5〜100サイト）" },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.highlight : C.surface, borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "12px 16px", color: C.ink, fontWeight: 600 }}>{row.feature}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: C.muted }}>{row.free}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: row.basic === "✕" ? "#c0392b" : C.A, fontWeight: row.basic !== "✕" ? 700 : 400 }}>{row.basic}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: row.standard === "✕" ? "#c0392b" : C.A, fontWeight: row.standard !== "✕" ? 700 : 400 }}>{row.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>
            ※ 現在、先行ユーザー価格キャンペーン中（全プラン50%OFF）。表示価格はキャンペーン価格です。<br />
            ※ 100サイト以上のプランは<a href="/contact" style={{ color: C.A }}>お問い合わせ</a>ください。
          </div>
        </div>

        {/* Web制作者・コンサルタント向け活用ガイド */}
        <div id="for-professionals" style={{ marginBottom: 40, border: `2px solid ${C.A}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: C.A, padding: "16px 24px" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.12em", marginBottom: 4 }}>FOR PROFESSIONALS</div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
              Web制作者・コンサルタントの活用ガイド
            </div>
          </div>

          <div style={{ padding: "28px 24px", background: "#fff" }}>

            {/* 背景・根拠 */}
            <div style={{ background: "#f8f4ff", border: "1px solid #c4b5fd", borderRadius: 8, padding: "20px 24px", marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 10, letterSpacing: "0.1em" }}>BACKGROUND</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.9 }}>
                戦略大臣の開発元であるゴンウェブイノベーションズは、20年以上にわたりAB3C分析を活用した戦略コンサルティングを提供してきました。<br /><br />
                同等の分析を<strong>手作業で行う場合、月300〜500万円</strong>のコンサルティング費用が必要でした。<br />
                戦略大臣はその知見をAIに凝縮したツールです。あなたはこれを使って、<strong>月20〜30万円</strong>という中小企業が現実的に払える価格で、同等水準の価値を提供できます。
              </div>
            </div>

            {/* 提案モデル */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 16, letterSpacing: "0.08em" }}>📐 提案モデル例</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  {
                    title: "スポット提案型（分析プラン活用）",
                    price: "提案単価：3〜5万円/件",
                    desc: "Web制作の受注前にAB3C分析レポートを提案書として活用。競合との違いを言語化した提案で受注率を高め、制作単価も上げる。",
                    color: "#dbeafe",
                    border: "#93c5fd",
                  },
                  {
                    title: "月次伴走型（伴走プラン活用）",
                    price: "月額：20〜30万円/クライアント",
                    desc: "毎月AB3C分析で戦略を更新し、AIチャットでクライアントの経営相談に対応。制作後の運用フェーズを継続契約化できる。",
                    color: "#dcfce7",
                    border: "#86efac",
                  },
                  {
                    title: "複数クライアント管理型（5〜10サイトプラン）",
                    price: "月額：100〜300万円（3〜10社×月30万）",
                    desc: "複数の中小企業クライアントをまとめて管理。5サイトプラン（月11万円）で5社から月30万円ずつ受ければ月商150万円。",
                    color: "#fef9c3",
                    border: "#fcd34d",
                  },
                ].map((model, i) => (
                  <div key={i} style={{ background: model.color, border: `1px solid ${model.border}`, borderRadius: 8, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 14, fontWeight: 700, color: C.ink }}>{model.title}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.A, background: "#fff", padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap" }}>{model.price}</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.8 }}>{model.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* クライアントへの説明文 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 12, letterSpacing: "0.08em" }}>💬 クライアントへの説明例</div>
              <div style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", fontSize: 14, color: C.ink, lineHeight: 2, fontFamily: "'Noto Serif JP', serif", fontStyle: "italic" }}>
                「月20〜30万円の投資で、御社の『選ばれる理由』を毎月言語化・更新し続けます。Webサイト・営業資料・採用ページ、すべての発信に一貫した戦略軸が生まれます。従来、同水準の分析コンサルティングには月300〜500万円が必要でした。それをAIの力で実現しています。」
              </div>
            </div>

            {/* クライアント側ROI */}
            <div style={{ background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#c2410c", marginBottom: 10, letterSpacing: "0.08em" }}>CLIENT ROI</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.9 }}>
                戦略の明確化による効果として、クライアントの売上・利益は<strong>年間最低数百万円以上の改善</strong>が期待できます。<br />
                月20〜30万円（年240〜360万円）の支出に対して、数百万〜数千万円のリターン。<br />
                これがクライアントにとっての<strong>現実的な費用対効果</strong>です。
              </div>
            </div>

            <a href="https://senryaku.ai" style={{ display: "block", background: C.A, borderRadius: 4, color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "14px 20px", textDecoration: "none", textAlign: "center" }}>
              ▶ さっそく無料でお試しする
            </a>
          </div>
        </div>

        <div style={{ background: C.ink, borderRadius: 8, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>さっそく分析してみましょう</div>
          <a href="https://senryaku.ai" style={{ display: "inline-block", background: C.A, borderRadius: 4, color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "12px 28px", textDecoration: "none" }}>
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
