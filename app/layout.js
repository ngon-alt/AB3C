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
  #result-area, #result-area *,
  #improve-area, #improve-area * { visibility: visible; }
  
#result-area {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  max-width: 210mm;
  padding: 15mm;
  box-sizing: border-box;
}
  
 #improve-area {
  position: relative;
  width: 100%;
  max-width: 210mm;
  padding: 15mm;
  margin-top: 10mm;
  border-top: 3px solid #1a1a14;
  page-break-before: always;
  box-sizing: border-box;
}
```

**ステップ6: 「Commit changes...」をクリック**

**ステップ7: コミットメッセージ**
```
印刷時の右側切れを修正（padding調整、box-sizing追加）
  
  /* グリッドを縦並びに */
  #result-area [style*="grid"],
  #improve-area [style*="grid"] {
    display: block !important;
  }
  
  /* 背景色を印刷で表示 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  /* 改ページ制御 */
  #result-area > div { page-break-inside: avoid; }
  #improve-area > div { page-break-inside: avoid; }
  
  /* 不要な要素を非表示 */
  #sidebar { display: none !important; }
  button { display: none !important; }
  nav { display: none !important; }
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
