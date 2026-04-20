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
          padding: 60,
        }}
      >
        {/* メインタイトル: 戦略指南 AI を最大サイズで（戦略指南は明朝） */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontWeight: 900,
            color: "#1a1a14",
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ fontSize: 200, lineHeight: 1, fontFamily: "'Noto Serif JP', serif" }}>戦略指南</span>
          <span style={{ fontSize: 160, lineHeight: 1, fontFamily: "monospace", marginLeft: 12 }}>AI</span>
        </div>

        {/* サブタイトル: on AB3C framework（ABはカラー） */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 56,
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
          <span style={{ color: "#555" }}> framework</span>
        </div>

        {/* アンダーライン（中央に1/3幅） */}
        <div style={{ display: "flex", marginTop: 40, marginBottom: 40 }}>
          <div style={{ width: 360, height: 4, background: "#1a1a14" }} />
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: 40,
            color: "#1a1a14",
            fontWeight: 400,
            letterSpacing: "0.05em",
            fontFamily: "'Noto Serif JP', serif",
          }}
        >
          選ばれる理由を言語化する 戦略策定AI
        </div>
      </div>
    ),
    size
  );
}
