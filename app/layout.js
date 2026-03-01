export const metadata = {
  title: "AB3C Analyzer｜「選ばれる理由」を見つけるフレームワーク",
  description: "事業概要を入力するだけで、AB3C分析（Advantage・Benefit・3C）をAIが自動分析します。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#f5f2eb" }}>
        {children}
      </body>
    </html>
  );
}
