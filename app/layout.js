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
      </head>
      <body className={`${notoSerifJP.variable} ${spaceMono.variable} ${ebGaramond.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
