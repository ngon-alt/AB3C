// Updated: 2026-04-20
const C = {
  surface: "#ffffff",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
};

export default function Footer() {
  return (
    <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "28px 20px", marginTop: "auto" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 26 }} />
          <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>一般社団法人デジタル経営革新協会</span>
        </div>
        <div style={{ marginBottom: 10, fontSize: 13 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · Powered by Claude AI</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
          <a href="/contact" style={{ color: C.muted, textDecoration: "underline" }}>お問い合わせ</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/contact?type=bug" style={{ color: C.muted, textDecoration: "underline" }}>🐛 バグ報告</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/terms" style={{ color: C.muted, textDecoration: "underline" }}>利用規約</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/privacy" style={{ color: C.muted, textDecoration: "underline" }}>プライバシーポリシー</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/legal" style={{ color: C.muted, textDecoration: "underline" }}>特定商取引法</a>
        </div>
      </div>
    </footer>
  );
}
