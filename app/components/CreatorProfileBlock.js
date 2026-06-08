"use client";

// AB3Cフレームワーク考案者・権 成俊（ごん なるとし）のプロフィール展示
// 伴走支援者向け TOP の信頼の核となるブロック
//
// 思想：「権成俊が作ったツール」という事実こそが、
// AIで誰でも作れるツールとの最大の差別化。
// 経歴・実績・著書・フレームワーク考案を1枚で示す。

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14",
  ink: "#1a1a14", muted: "#78716c",
  surface: "#ffffff", border: "#ddd8cc",
  bg: "#f8f7f3", highlight: "#fef3c7",
};

const HEADING_FONT = "'Noto Serif JP', serif";
const BODY_FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

export default function CreatorProfileBlock() {
  return (
    <section
      aria-label="AB3Cフレームワーク考案者"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "28px 32px",
        margin: "24px 0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* ラベル — 黒で統一。AB3C カラーは Benefit/Advantage 専用のため装飾流用しない。
          フォントサイズは最低16px（CLAUDE.md フォントサイズルール厳守） */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: C.ink,
          marginBottom: 10,
          fontFamily: BODY_FONT,
        }}
      >
        AB3Cフレームワーク考案者
      </div>

      {/* 名前 + 肩書 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div
          style={{
            fontFamily: HEADING_FONT,
            fontSize: 28,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.3,
          }}
        >
          権 成俊
          <span style={{ fontSize: 16, color: C.muted, marginLeft: 10, fontWeight: 400 }}>（ごん なるとし）</span>
        </div>
      </div>

      <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.85, fontFamily: BODY_FONT, marginBottom: 18 }}>
        株式会社ゴンウェブイノベーションズ 代表取締役 / 一般社団法人デジタル経営革新協会 代表理事<br />
        ウェブ業界歴 <b>24年</b>。ソフトバンクにてEC事業開発・ディレクションに携わる。<b>2002年</b>、現在の（株）ゴンウェブイノベーションズ創業。中小企業の戦略コンサルティングを長年手がけ、その実務知見から
        <b>「AB3Cフレームワーク」</b>
        を考案。CSS Nite などの業界カンファレンスでの登壇、デジ革セミナーでの講演、ブログ・書籍を通じて、戦略思考をウェブ業界に発信。デジ革では<b>累計数百名のウェブコンサルタントを育成</b>。
      </div>

      {/* 実績バッジ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>
            考案フレームワーク
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.6 }}>
            <span style={{ color: C.A }}>A</span>
            <span style={{ color: C.B }}>B</span>
            <span style={{ color: C.ink }}>3C</span> 分析 / デジタルブルーオーシャン戦略
          </div>
        </div>

        <a
          href="https://www.amazon.co.jp/stores/author/B004391OAE"
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px", textDecoration: "none", display: "block" }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>
            著作・監修
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.6 }}>
            8冊（代表作：『なぜあなたのウェブには戦略がないのか』2017）<span style={{ fontSize: 14, color: C.A, fontWeight: 400 }}>↗</span>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Amazon 著者ページで全著作を見る
          </div>
        </a>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>
            登壇・講演
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.6 }}>
            全国の商工会・商工会議所 / CSS Nite / デジ革セミナー ほか
          </div>
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>
            業界歴
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.6 }}>
            ウェブ業界 24年
          </div>
        </div>
      </div>

      {/* 信頼の核となる一文 */}
      <div
        style={{
          background: C.highlight,
          borderRadius: 6,
          padding: "14px 18px",
          fontSize: 18,
          color: C.ink,
          lineHeight: 1.8,
          fontFamily: BODY_FONT,
        }}
      >
        戦略指南 AI は、汎用 AI に AB3C プロンプトを書かせたものではありません。<b>権成俊が 20 年以上磨いてきた戦略策定の実フロー</b>を、そのまま AI で再現したサービスです。
      </div>

      {/* 関連リンク */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 16, fontFamily: BODY_FONT }}>
        <a
          href="https://www.amazon.co.jp/stores/author/B004391OAE"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.ink, textDecoration: "underline" }}
        >
          ↗ Amazon 著者ページ
        </a>
        <a
          href="https://digi-kaku.or.jp/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.ink, textDecoration: "underline" }}
        >
          ↗ デジタル経営革新協会
        </a>
        <a
          href="https://webconsultant.jp/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.ink, textDecoration: "underline" }}
        >
          ↗ ブログ「ウェブコンサルタント」
        </a>
      </div>
    </section>
  );
}
