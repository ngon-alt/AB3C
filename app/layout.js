import { Providers } from "./providers";
import { Noto_Serif_JP, Space_Mono, EB_Garamond } from "next/font/google";
import "./print.css";

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

// metadataBase を本番ドメインに固定することで、OGP画像のURLが確実に
// https://senryaku.ai/opengraph-image に解決される（未設定だと Vercel の
// preview URL を参照してしまい Facebook / X が画像を取得できない）
export const metadata = {
  metadataBase: new URL("https://senryaku.ai"),
  title: "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI | AB3Cフレームワークで事業戦略・ウェブ戦略を一気通貫",
  description: "ウェブサイトのURLを入力するだけでAB3C分析を自動生成。Benefit・Advantage・3C（顧客・競合・自社）から『なぜ選ばれるのか』を言語化し、事業戦略・ウェブ戦略・採用・補助金申請まで一貫支援する中小企業向けAIツール。",
  keywords: "AB3C分析, 戦略策定, AI, 選ばれる理由, 差別化, コンサルティング, 中小企業, ウェブ戦略, 事業戦略, 採用戦略, 補助金申請",
  openGraph: {
    title: "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI | AB3Cフレームワークで事業戦略・ウェブ戦略を一気通貫",
    description: "ウェブサイトのURLを入力するだけでAB3C分析を自動生成。Benefit・Advantage・3C（顧客・競合・自社）から『なぜ選ばれるのか』を言語化し、事業戦略・ウェブ戦略・採用・補助金申請まで一貫支援する中小企業向けAIツール。",
    url: "https://senryaku.ai",
    siteName: "戦略指南 AI",
    type: "website",
    locale: "ja_JP",
    // app/opengraph-image.js の出力を明示的に指定（絶対URLで Facebook / X が確実に取得）
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI | AB3Cフレームワークで事業戦略・ウェブ戦略を一気通貫",
    description: "ウェブサイトのURLを入力するだけでAB3C分析を自動生成。Benefit・Advantage・3C（顧客・競合・自社）から『なぜ選ばれるのか』を言語化し、事業戦略・ウェブ戦略・採用・補助金申請まで一貫支援する中小企業向けAIツール。",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
       <meta name="viewport" content="width=1280" />
      </head>
      <body className={`${notoSerifJP.variable} ${spaceMono.variable} ${ebGaramond.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
