"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

// 経営者ご本人向けの専用ページ（Phase 1: 準備中の軽量プレビュー）
//
// 現状：経営者層には AB3C のリテラシーが高く、また権成俊氏への信頼貯金が
// まだ十分でないため、サービスを「自分で使い切る」ことが難しい。
// Phase 1 では「来てくれた方を取りこぼさないが、無理に売り込まない」スタンスで、
// 専門家（コンサル・制作者）と一緒に使うことを推奨する。
//
// Phase 2 では、本（AI時代の戦略）・dmia-site の連載コラムが充実してきたら、
// このページを本格的な「経営者ご本人向け LP」として再構築する。

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14",
  ink: "#1a1a14", muted: "#78716c",
  surface: "#ffffff", border: "#ddd8cc",
  bg: "#f5f2eb", highlight: "#fef3c7",
  ownerAccent: "#8b5e3c",
};

const HEADING_FONT = "'Noto Serif JP', serif";
const BODY_FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

export default function ForOwnersPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <main style={{ padding: "48px 20px 100px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {/* ヒーロー */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                display: "inline-block",
                background: C.ownerAccent,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                padding: "4px 14px",
                borderRadius: 3,
                marginBottom: 18,
                fontFamily: BODY_FONT,
              }}
            >
              FOR OWNERS — 経営者ご本人向け
            </div>
            <h1
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 34,
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1.4,
                margin: 0,
                letterSpacing: "0.02em",
              }}
            >
              経営者ご本人向けの専用ページは、現在準備中です。
            </h1>
            <div
              style={{
                fontSize: 17,
                color: C.ink,
                marginTop: 18,
                lineHeight: 1.8,
                fontFamily: BODY_FONT,
              }}
            >
              戦略指南 AI は、本来「<b>経営者ご自身が自分の事業の選ばれる理由を言語化する</b>」ためのツールです。
              ですが、AB3C を使いこなすには一定の戦略リテラシーが必要で、初めての方には難しい場合があります。
            </div>
          </div>

          {/* 推奨：専門家と一緒に使う */}
          <section
            style={{
              background: C.surface,
              border: `2px solid ${C.ownerAccent}`,
              borderRadius: 10,
              padding: "28px 32px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.ownerAccent,
                letterSpacing: "0.12em",
                marginBottom: 10,
                fontFamily: BODY_FONT,
              }}
            >
              ★ 当面のおすすめ
            </div>
            <h2
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 24,
                fontWeight: 700,
                color: C.ink,
                margin: 0,
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              専門家（コンサル・Web制作者）と一緒にお使いください
            </h2>
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.85, fontFamily: BODY_FONT }}>
              戦略指南 AI を経営者ご本人がフルに活用するには、AB3C フレームワーク・市場規模の評価・競合分析などの基礎理解が必要です。
              当面は、<b>すでに信頼されている Web 制作者・コンサルタント・経営伴走者</b> と一緒にお使いいただくことを推奨しています。
              <br />
              <br />
              専門家にとっても「戦略を磨きながらクライアントの事業を支援する」ためのツールとして使えるため、
              一緒に戦略を組み立てる時間が、そのまま事業の意思決定の時間になります。
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="/"
                style={{
                  display: "inline-block",
                  background: C.ownerAccent,
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  fontFamily: BODY_FONT,
                }}
              >
                制作者・コンサル向けの紹介ページを見る →
              </a>
            </div>
          </section>

          {/* AB3C を理解する導線 */}
          <section
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "24px 28px",
              marginBottom: 28,
            }}
          >
            <h2
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 22,
                fontWeight: 700,
                color: C.ink,
                margin: 0,
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              📚 まず AB3C の考え方に触れたい方へ
            </h2>
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.85, fontFamily: BODY_FONT, marginBottom: 14 }}>
              AB3C フレームワーク考案者・<b>権 成俊</b> の著書・コラムから入ると、ツールを使う前の土台ができます。
            </div>
            <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.9, fontFamily: BODY_FONT, paddingLeft: 22, margin: 0 }}>
              <li>
                著書：<b>『なぜあなたのウェブには戦略がないのか』</b>（2017）
              </li>
              <li>
                <a href="https://digi-kaku.or.jp/" target="_blank" rel="noopener noreferrer" style={{ color: C.A, textDecoration: "underline" }}>
                  デジタル経営革新協会（dmia）
                </a>
                の AB3C・経営哲学コラム
              </li>
              <li>
                <a href="https://webconsultant.jp/" target="_blank" rel="noopener noreferrer" style={{ color: C.A, textDecoration: "underline" }}>
                  ブログ「ウェブコンサルタント」
                </a>（20年以上の連載）
              </li>
              <li>
                <a href="/about" style={{ color: C.A, textDecoration: "underline" }}>
                  AB3C分析とは（本サイト内）
                </a>
              </li>
            </ul>
          </section>

          {/* 試してみたい方への控えめな案内 */}
          <section
            style={{
              background: C.highlight,
              borderRadius: 10,
              padding: "20px 24px",
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.85, fontFamily: BODY_FONT }}>
              <b>💡 それでもご自身で試してみたい方へ</b>
              <br />
              <br />
              戦略指南 AI には、わからないことを何でも相談できる <b>AI秘書</b> 機能があります。AB3C の言葉づかいや、分析結果の読み解きについてもサポートします。
              24時間限定のフル機能無料お試しもあるので、まずは小さく試してみてください。
              <br />
              <br />
              <a href="/" style={{ color: C.A, textDecoration: "underline", fontWeight: 600 }}>
                → 24時間フル機能無料お試しを始める
              </a>
              {" "}|{" "}
              <a href="/pricing" style={{ color: C.A, textDecoration: "underline", fontWeight: 600 }}>
                料金プランを見る
              </a>
            </div>
          </section>

          {/* 今後のお知らせ */}
          <section style={{ textAlign: "center", color: C.muted, fontSize: 14, lineHeight: 1.8, fontFamily: BODY_FONT, marginTop: 32 }}>
            経営者ご本人向けの本格的な専用ページは、今後のアップデートで充実させていきます。<br />
            権成俊が「AI時代の経営戦略」をテーマに連載・書籍を執筆中です。続報をお待ちください。
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
