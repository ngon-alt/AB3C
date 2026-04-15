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
  /* 全要素リセット */
  * {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    float: none !important;
    flex: unset !important;
    grid-template-columns: none !important;
    overflow: visible !important;
    visibility: hidden;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    box-sizing: border-box !important;
  }

  /* 印刷対象を表示 */
  #result-area, #result-area * { visibility: visible; }

  /* result-areaのレイアウト */
  #result-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    padding: 10mm 15mm !important;
  }

  /* 改善レポート */
  #improve-area {
    padding-top: 10mm !important;
    margin-top: 5mm !important;
    border-top: 3px solid #1a1a14;
    page-break-before: always;
  }

  /* セクション間の余白 */
  #result-area > div { margin-bottom: 8mm !important; page-break-inside: avoid; }
  #improve-area > div { margin-bottom: 6mm !important; }

  /* 不要な要素を完全非表示 */
  #sidebar, button, nav, header { display: none !important; }
}
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
