import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 使用する文字だけを含む Noto Serif JP サブセットを Google Fonts から取得
// 失敗時は null を返す（例外を投げずに画像生成を続行できるように）
async function loadJpSerifFont() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const text = "戦略指南選ばれる理由を言語化する策定略AI";
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&text=${encodeURIComponent(text)}`;
    const css = await fetch(cssUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" },
    }).then((r) => r.text());
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) { clearTimeout(timeoutId); return null; }
    const fontData = await fetch(match[1], { signal: controller.signal }).then((r) => r.arrayBuffer());
    clearTimeout(timeoutId);
    return fontData;
  } catch (e) {
    console.error("JP serif font load failed:", e?.message || e);
    return null;
  }
}

// 日本語サンセリフ（Noto Sans JP）をフォールバックとして読み込む
async function loadJpSansFont() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const text = "戦略指南選ばれる理由を言語化する策定略AI";
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
    const css = await fetch(cssUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" },
    }).then((r) => r.text());
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) { clearTimeout(timeoutId); return null; }
    const fontData = await fetch(match[1], { signal: controller.signal }).then((r) => r.arrayBuffer());
    clearTimeout(timeoutId);
    return fontData;
  } catch (e) {
    console.error("JP sans font load failed:", e?.message || e);
    return null;
  }
}

// 英字のみのフォールバック画像（日本語フォントが全て失敗したとき）
function renderFallbackImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 180, fontWeight: 900, letterSpacing: "-0.02em", fontFamily: "monospace" }}>
          <span style={{ color: "#1a6fd4" }}>A</span>
          <span style={{ color: "#FF0000" }}>B</span>
          <span style={{ color: "#1a1a14" }}>3C</span>
          <span style={{ fontSize: 100, marginLeft: 20, color: "#1a1a14" }}>AI</span>
        </div>
        <div style={{ fontSize: 56, color: "#555", marginTop: 24, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}>
          SENRYAKU.AI
        </div>
        <div style={{ fontSize: 32, color: "#888", marginTop: 40, fontFamily: "monospace" }}>
          Strategy Framework AI
        </div>
      </div>
    ),
    { ...size }
  );
}

export default async function Image() {
  try {
    // 明朝とサンセリフを並列取得。明朝が取れなければサンセリフでもOK
    const [jpSerif, jpSans] = await Promise.all([loadJpSerifFont(), loadJpSansFont()]);
    const titleFont = jpSerif ? "NotoSerifJP" : "NotoSansJP";
    const bodyFont = jpSerif ? "NotoSerifJP" : "NotoSansJP";

    const fonts = [];
    if (jpSerif) fonts.push({ name: "NotoSerifJP", data: jpSerif, weight: 900, style: "normal" });
    if (jpSans) fonts.push({ name: "NotoSansJP", data: jpSans, weight: 700, style: "normal" });

    // 日本語フォントが1つも取れなかった場合、英字のみの画像を返す
    if (fonts.length === 0) {
      return renderFallbackImage();
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
          {/* メインタイトル */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontWeight: 900,
              color: "#1a1a14",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ fontSize: 200, lineHeight: 1, fontFamily: titleFont }}>戦略指南</span>
            <span style={{ fontSize: 160, lineHeight: 1, fontFamily: "monospace", marginLeft: 12 }}>AI</span>
          </div>

          {/* サブタイトル: on AB3C */}
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

          {/* アンダーライン */}
          <div style={{ display: "flex", marginTop: 40, marginBottom: 40 }}>
            <div style={{ width: 360, height: 4, background: "#1a1a14" }} />
          </div>

          {/* キャッチコピー */}
          <div
            style={{
              fontSize: 40,
              color: "#1a1a14",
              fontWeight: jpSerif ? 400 : 700,
              letterSpacing: "0.05em",
              fontFamily: bodyFont,
            }}
          >
            選ばれる理由を言語化する 戦略策定AI
          </div>
        </div>
      ),
      {
        ...size,
        fonts,
      }
    );
  } catch (e) {
    // どんなエラーが起きても必ず画像を返す（0バイトレスポンスを回避）
    console.error("OGP画像生成エラー:", e?.message || e);
    return renderFallbackImage();
  }
}
