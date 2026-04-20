import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 使用する文字だけを含む Noto Serif JP サブセットを Google Fonts から取得
async function loadJpSerifFont() {
  const text = "戦略指南選ばれる理由を言語化する策定";
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error("Noto Serif JP font URL not found in CSS");
  const fontData = await fetch(match[1]).then((r) => r.arrayBuffer());
  return fontData;
}

export default async function Image() {
  let jpSerifFont = null;
  try {
    jpSerifFont = await loadJpSerifFont();
  } catch (e) {
    console.error("JP serif font load failed:", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        {/* メインタイトル: 戦略指南 は明朝、AI はモノスペース */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontWeight: 900,
            color: "#1a1a14",
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ fontSize: 200, lineHeight: 1, fontFamily: "NotoSerifJP, serif" }}>戦略指南</span>
          <span style={{ fontSize: 160, lineHeight: 1, fontFamily: "monospace", marginLeft: 12 }}>AI</span>
        </div>

        {/* サブタイトル: on AB3C（A=青, B=赤, 3C=黒） */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 72,
            fontFamily: "monospace",
            letterSpacing: "0.05em",
            marginTop: 24,
            fontWeight: 700,
          }}
        >
          <span style={{ color: "#555" }}>on </span>
          <span style={{ color: "#1a6fd4" }}>A</span>
          <span style={{ color: "#FF0000" }}>B</span>
          <span style={{ color: "#1a1a14" }}>3C</span>
        </div>

        {/* アンダーライン（中央360px） */}
        <div style={{ display: "flex", marginTop: 40, marginBottom: 40 }}>
          <div style={{ width: 360, height: 4, background: "#1a1a14" }} />
        </div>

        {/* キャッチコピー（明朝） */}
        <div
          style={{
            fontSize: 40,
            color: "#1a1a14",
            fontWeight: 400,
            letterSpacing: "0.05em",
            fontFamily: "NotoSerifJP, serif",
          }}
        >
          選ばれる理由を言語化する 戦略策定AI
        </div>
      </div>
    ),
    {
      ...size,
      fonts: jpSerifFont
        ? [{
            name: "NotoSerifJP",
            data: jpSerifFont,
            weight: 900,
            style: "normal",
          }]
        : undefined,
    }
  );
}
