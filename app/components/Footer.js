const C = {
  surface: "#ffffff",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
};

export default function Footer() {
  return (
    <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "32px 20px", marginTop: "auto" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", fontSize: 16, color: C.muted, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 32 }} />
          <span style={{ fontSize: 16, color: C.ink }}>一般社団法人デジタル経営革新協会</span>
        </div>
        <div style={{ marginBottom: 8 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted }}>ab3c.jp</a> · Powered by Claude AI</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <a href="/terms" style={{ color: C.muted, textDecoration: "none" }}>利用規約</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/privacy" style={{ color: C.muted, textDecoration: "none" }}>プライバシーポリシー</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/legal" style={{ color: C.muted, textDecoration: "none" }}>特定商取引法</a>
        </div>
      </div>
    </footer>
  );
}
