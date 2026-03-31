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
    padding: 20px;
  }
  #improve-area {
    position: relative;
    width: 100%;
    padding: 20px;
    margin-top: 40px;
    border-top: 3px solid #1a1a14;
    page-break-before: always;
  }
```

5. **画面の右上にある「Commit changes...」ボタンをクリック**

6. **コミットメッセージ欄に以下を入力**
```
   印刷機能の改善: 改善レポートを新ページに分ける設定を追加
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
