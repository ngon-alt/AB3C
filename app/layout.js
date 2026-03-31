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
  title: "AB3C アナライザー", 
  description: "「選ばれる理由」を見つけるフレームワーク" 
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
       <style>{`
          @media print {
            body * { visibility: hidden; }
           #result-area, #result-area * { visibility: visible; }
#improve-area, #improve-area * { visibility: visible; }
#result-area { position: relative; width: 100%; }
#improve-area { position: relative; width: 100%; margin-top: 40px; padding-top: 40px; border-top: 3px solid #1a1a14; }
#result-area > div { page-break-inside: avoid; }
            #sidebar { display: none !important; }
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
