import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          fontFamily: "serif",
          padding: 80,
        }}
      >
        {/* 上部: AB3C のカラフルロゴ風 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 48,
          }}
        >
          <span style={{ color: "#1a6fd4" }}>A</span>
          <span style={{ color: "#FF0000" }}>B</span>
          <span style={{ color: "#1a1a14" }}>3C</span>
        </div>

        {/* メインタイトル */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            fontWeight: 900,
            color: "#1a1a14",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 140, lineHeight: 1 }}>戦略指南</span>
          <span style={{ fontSize: 100, lineHeight: 1, fontFamily: "monospace" }}>AI</span>
        </div>

        {/* サブタイトル */}
        <div
          style={{
            fontSize: 28,
            color: "#555",
            fontFamily: "monospace",
            letterSpacing: "0.08em",
            marginBottom: 32,
          }}
        >
          on AB3C framework
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: 36,
            color: "#1a1a14",
            fontWeight: 400,
            borderTop: "2px solid #1a1a14",
            paddingTop: 24,
          }}
        >
          選ばれる理由を言語化する 戦略策定AI
        </div>
      </div>
    ),
    size
  );
}
