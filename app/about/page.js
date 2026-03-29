"use client";
const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#3a3a2e", highlight: "#f0ebe0",
};

export default function AboutPage() {
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
              AB3C分析とは
            </div>
          </div>
          <a href="https://analyzer.ab3c.jp" style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 2 }}>
            ← 分析ツールへ
          </a>
        </div>

        {/* AB3C分析とは */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            AB3C分析とは
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: C.muted, marginBottom: 16 }}>
            インターネットの登場により、消費者は無数の選択肢を手に入れました。企業が選ばれるためには、競合と比較されたうえで「こちらの方がいい」と思ってもらえる理由が必要です。
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: C.muted, marginBottom: 16 }}>
            AB3C分析は、その「選ばれる理由」を明らかにする事業戦略フレームワークです。経営者・商品開発者・営業・デザイナー、事業にかかわるすべての人が同じ戦略を理解するための<b>共通言語</b>として機能します。
          </p>
          <div style={{ background: C.ink, borderRadius: 8, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>分析はゴールではありません</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.75)" }}>戦略をクリアにし、関係者全員が同じ設計図を見られる「共通言語」をつくることがAB3C分析の役割です。共通言語が生まれてはじめて、ウェブサイトの制作、商品開発、事業計画の策定へと進むことができます。</p>
          </div>
        </div>

        {/* フレームワークの構造 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            フレームワークの構造
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `4px solid ${C.B}`, borderRadius: 6, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.B, marginBottom: 8 }}>B — Benefit</div>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>お客様が求める価値</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted, marginBottom: 12 }}>お客様がその商品・サービスを通じて得られる価値。ニーズ（欠乏感・まだ曖昧な欲求）とウォンツ（具体的に欲しいものが決まっている欲求）の両面から捉えます。</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "10px 12px", fontSize: 13, color: C.muted }}><b>ニーズ：</b>まだ曖昧な欠乏感。「友達とお酒を飲みたい」など</div>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "10px 12px", fontSize: 13, color: C.muted }}><b>ウォンツ：</b>具体的な欲求。「アサヒビールが飲みたい」など</div>
              </div>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `4px solid ${C.A}`, borderRadius: 6, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.A, marginBottom: 8 }}>A — Advantage</div>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>差別的優位点・好ましい違い</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>競合との「好ましい違い」。単なる違いではなく、お客様にとって好ましい違いであること、そして自社の強みに根差した真似されにくいものであることが重要です。</p>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `4px solid ${C.C}`, borderRadius: 6, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.C, marginBottom: 8 }}>3C</div>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Customer · Competitor · Company</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px", fontSize: 14, color: C.muted }}><b>Customer（お客様）：</b>誰にとってのオンリーワンか。ターゲットを絞り込み、切り捨てるお客様を明確にします。</div>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px", fontSize: 14, color: C.muted }}><b>Competitor（競合）：</b>直接競合だけでなく、ニーズに基づく異業種競合も含めて考えます。</div>
                <div style={{ background: C.highlight, borderRadius: 4, padding: "12px 14px", fontSize: 14, color: C.muted }}><b>Company（自社）：</b>技術・ノウハウなどの具体的強み、その強みを生む構造、経営者のパッションの3段階で考えます。</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5つのチェックポイント */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            AB3C 5つのチェックポイント
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { num: "1", label: "切り捨てができているか", desc: "お客様を絞り込むということは、見込み客の一部を切り捨てるということ。誰を切り捨てたかが明確か。" },
              { num: "2", label: "価値の本質は？", desc: "欲しいのはドリルではなく穴であり、さらに穴をあけたい理由がある。ニーズまで掘り下げたか。" },
              { num: "3", label: "異業種の競合は？", desc: "同業他社だけではなく、ニーズに基づく異業種との比較の可能性まで考えたか。" },
              { num: "4", label: "強みを作ることを考えたか？", desc: "いまある強みだけではアドバンテージを生み出せない。必要な強みを生み出すことから考えているか。" },
              { num: "5", label: "明らかな違いか？", desc: "アドバンテージは「明らかな違い」でなくてはならない。一言で言える、一目でわかるものか。" },
            ].map((item, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: C.A, flexShrink: 0, width: 28 }}>{item.num}.</div>
                <div>
                  <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: C.muted }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 誰が使うか */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            誰が使うか
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>👔 経営者の方</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>自社の事業概要を入力するだけで、戦略の現状が可視化されます。PDCAを繰り返しながら、自社の戦略を磨いていくツールとして活用できます。補助金申請書・事業計画書への活用にも最適です。</p>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>💼 コンサルタント・ウェブ制作者の方</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>クライアントのURLを入力するだけで「ウェブ上のアイデンティティ」が可視化されます。AB3Cという共通言語を使って経営者と合意形成を重ね、ウェブ改善・事業改善へと進みます。</p>
            </div>
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
