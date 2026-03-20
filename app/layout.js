import { Providers } from "./providers";
import { Noto_Serif_JP, Space_Mono, Black_Han_Sans } from "next/font/google";

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

const blackHanSans = Black_Han_Sans({ 
  subsets: ["latin"], 
  weight: ["400"],
  variable: "--font-black-han-sans"
});

export const metadata = { 
  title: "AB3C アナライザー", 
  description: "「選ばれる理由」を見つけるフレームワーク" 
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={`${notoSerifJP.variable} ${spaceMono.variable} ${blackHanSans.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
