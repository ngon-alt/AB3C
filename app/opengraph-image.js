import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 最小構成: 日本語フォント取得を完全に排除し、英字のみで描画
// （edge 環境での ImageResponse 動作を切り分けるための最小テスト）
export default function Image() {
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
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 220,
            fontWeight: 900,
            letterSpacing: "-0.03em",
          }}
        >
          <span style={{ color: "#1a6fd4" }}>A</span>
          <span style={{ color: "#FF0000" }}>B</span>
          <span style={{ color: "#1a1a14" }}>3C</span>
          <span style={{ fontSize: 140, marginLeft: 28, color: "#1a1a14" }}>AI</span>
        </div>
        <div
          style={{
            width: 420,
            height: 6,
            background: "#1a1a14",
            marginTop: 40,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            fontSize: 64,
            color: "#1a1a14",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          SENRYAKU.AI
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#555",
            marginTop: 16,
            fontWeight: 500,
            letterSpacing: "0.04em",
          }}
        >
          Strategy Framework AI
        </div>
      </div>
    ),
    { ...size }
  );
}
