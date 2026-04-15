import { Providers } from "./providers";
import { Noto_Serif_JP, Space_Mono, EB_Garamond } from "next/font/google";

const notoSerifJP = Noto_Serif_JP({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-noto-serif-jp"
});

const spaceMono = Space_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-space-mono"
});

const ebGaramond = EB_Garamond({ 
  subsets: ["latin"], 
  weight: ["700"],
  variable: "--font-eb-garamond"
});

export const metadata = {
  title: "戦略大臣 — 選ばれる理由を言語化する戦略策定AI",
  description: "AB3Cフレームワークで「選ばれる理由」を明らかにする戦略策定AI。ウェブサイトのURLを入力するだけで、Benefit・Advantage・3C分析をAIが自動生成。中小企業の戦略コンサルティングをAIで民主化。",
  keywords: "AB3C分析, 戦略策定, AI, 選ばれる理由, 差別化, コンサルティング, 中小企業, ウェブ戦略",
  openGraph: {
    title: "戦略大臣 — 選ばれる理由を言語化する戦略策定AI",
    description: "AB3Cフレームワークで「選ばれる理由」を明らかにする戦略策定AI",
    url: "https://senryaku.ai",
    siteName: "戦略大臣",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "戦略大臣 — 選ばれる理由を言語化する戦略策定AI",
    description: "AB3Cフレームワークで「選ばれる理由」を明らかにする戦略策定AI",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
       <meta name="viewport" content="width=1280" />
       <style>{`
         @media print {
  /* すべて非表示にしてから印刷対象だけ表示 */
  body * { visibility: hidden; }
  #result-area, #result-area * { visibility: visible; }

  /* 親コンテナのレイアウトをリセット */
  body, body > *, body > * > *, body > * > * > * {
    display: block !important;
    position: static !important;
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    grid-template-columns: none !important;
  }

  #result-area {
    position: absolute !important;
    left: 0;
    top: 0;
    width: 100% !important;
    max-width: 210mm !important;
    padding: 10mm 15mm !important;
    box-sizing: border-box;
  }

  /* result-area内の全要素を幅いっぱいに */
  #result-area *,
  #improve-area * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  #improve-area {
    position: relative;
    width: 100% !important;
    padding-top: 10mm;
    margin-top: 5mm;
    border-top: 3px solid #1a1a14;
    page-break-before: always;
    box-sizing: border-box;
  }

  /* セクション間の余白 */
  #result-area > div {
    margin-bottom: 8mm !important;
    padding-top: 5mm !important;
    width: 100% !important;
  }

  #improve-area > div {
    margin-bottom: 6mm !important;
    padding-top: 3mm !important;
  }

  /* グリッドを縦並びに */
  #result-area [style*="grid"],
  #improve-area [style*="grid"] {
    display: block !important;
  }

  #result-area [style*="grid"] > div,
  #improve-area [style*="grid"] > div {
    margin-bottom: 4mm !important;
  }

  /* 背景色を印刷で表示 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* 改ページ制御 */
  #result-area > div { page-break-inside: avoid; }
  #improve-area > div { page-break-inside: auto; }
  #improve-area { page-break-inside: auto !important; }

  /* 不要な要素を非表示 */
  #sidebar { display: none !important; }
  button { display: none !important; }
  nav { display: none !important; }
  header { display: none !important; }
}
/* スマホでもPC表示を維持（最小幅で横スクロール） */
        `}</style>
      </head>
      <body className={`${notoSerifJP.variable} ${spaceMono.variable} ${ebGaramond.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
