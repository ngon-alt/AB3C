import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "戦略指南 AI — 選ばれる理由を言語化する戦略策定AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Noto Sans JP を Google Fonts から取得（CSS サブセット経由）
// 失敗時は null を返し、英字のみのフォールバック画像を使う
async function loadJpFont(family, weight, text) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}&display=swap`;
    const cssRes = await fetch(cssUrl, {
      signal: controller.signal,
      headers: {
        // woff2 ではなく ttf を返させるために古いブラウザを偽装
        "User-Agent":
          "Mozilla/5.0 (Windows NT 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.0.0 Safari/537.36",
      },
    });
    if (!cssRes.ok) { clearTimeout(timeoutId); return null; }
    const css = await cssRes.text();
    // src:url(...) から最初のフォントURLを抽出
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype|woff2?)['"]?\)/);
    const fontUrl = match ? match[1] : (css.match(/src:\s*url\(([^)]+)\)/)?.[1] ?? null);
    if (!fontUrl) { clearTimeout(timeoutId); return null; }
    const fontRes = await fetch(fontUrl, { signal: controller.signal });
    if (!fontRes.ok) { clearTimeout(timeoutId); return null; }
    const fontData = await fontRes.arrayBuffer();
    clearTimeout(timeoutId);
    return fontData && fontData.byteLength > 0 ? fontData : null;
  } catch (e) {
    console.error(`Font load failed (${family} ${weight}):`, e?.message || e);
    return null;
  }
}

// 英字のみの整ったフォールバック画像（日本語フォントが取れないときに使用）
function renderEnglishFallback() {
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
        {/* タイトル: AB3C AI を中央寄せ */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontWeight: 900,
            letterSpacing: "-0.03em",
          }}
        >
          <span style={{ fontSize: 240, color: "#1a6fd4", lineHeight: 1 }}>A</span>
          <span style={{ fontSize: 240, color: "#FF0000", lineHeight: 1 }}>B</span>
          <span style={{ fontSize: 240, color: "#1a1a14", lineHeight: 1 }}>3C</span>
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "#1a1a14",
            letterSpacing: "0.02em",
            marginTop: 12,
          }}
        >
          AI
        </div>

        {/* アンダーライン */}
        <div style={{ width: 420, height: 5, background: "#1a1a14", marginTop: 36, marginBottom: 36 }} />

        {/* URL とキャッチ */}
        <div style={{ fontSize: 48, color: "#1a1a14", fontWeight: 700, letterSpacing: "0.04em" }}>
          senryaku.ai
        </div>
        <div style={{ fontSize: 28, color: "#555", marginTop: 12, fontWeight: 500, letterSpacing: "0.08em" }}>
          Strategy Framework AI
        </div>
      </div>
    ),
    { ...size }
  );
}

export default async function Image() {
  try {
    // 「戦略指南 AI」と「選ばれる理由を言語化する戦略策定AI」の漢字・かな
    const titleText = "戦略指南";
    const captionText = "選ばれる理由を言語化する戦略策定AI";

    // タイトルは明朝(Noto Serif JP 900)、キャプションはサンセリフ(Noto Sans JP 400)
    // さらに明朝が取れないときのフォールバック用に Noto Sans JP 900 も並列取得
    const [titleSerif, titleSansBackup, bodySans] = await Promise.all([
      loadJpFont("Noto Serif JP", "900", titleText),
      loadJpFont("Noto Sans JP", "900", titleText),
      loadJpFont("Noto Sans JP", "400", captionText),
    ]);

    // 日本語フォントが1つも取れなければ英字フォールバック
    if (!titleSerif && !titleSansBackup && !bodySans) {
      return renderEnglishFallback();
    }

    const fonts = [];
    // タイトルフォント: 明朝が取れたら NotoSerifJP、ダメなら NotoSansJP 900 を同じ name で登録
    const titleFontName = titleSerif ? "NotoSerifJP" : "NotoSansJP900";
    if (titleSerif) fonts.push({ name: "NotoSerifJP", data: titleSerif, weight: 900, style: "normal" });
    else if (titleSansBackup) fonts.push({ name: "NotoSansJP900", data: titleSansBackup, weight: 900, style: "normal" });
    if (bodySans) fonts.push({ name: "NotoSansJP", data: bodySans, weight: 400, style: "normal" });

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
          {/* メインタイトル: 戦略指南 + AI */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              color: "#1a1a14",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ fontSize: 180, lineHeight: 1, fontFamily: titleFontName, fontWeight: 900 }}>戦略指南</span>
            <span style={{ fontSize: 140, lineHeight: 1, fontWeight: 900, marginLeft: 20 }}>AI</span>
          </div>

          {/* サブタイトル: on AB3C — on は小さめ、AB3C は大きめ、全て中央揃え */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 28,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ color: "#555", fontSize: 40, lineHeight: 1, marginRight: 18, fontWeight: 500 }}>on</span>
            <span style={{ color: "#1a6fd4", fontSize: 64, lineHeight: 1 }}>A</span>
            <span style={{ color: "#FF0000", fontSize: 64, lineHeight: 1 }}>B</span>
            <span style={{ color: "#1a1a14", fontSize: 64, lineHeight: 1 }}>3C</span>
          </div>

          {/* アンダーライン */}
          <div style={{ width: 360, height: 4, background: "#1a1a14", marginTop: 36, marginBottom: 36 }} />

          {/* キャッチコピー */}
          <div
            style={{
              fontSize: 48,
              color: "#1a1a14",
              fontFamily: bodySans ? "NotoSansJP" : undefined,
              fontWeight: 400,
              letterSpacing: "0.05em",
            }}
          >
            選ばれる理由を言語化する 戦略策定AI
          </div>
        </div>
      ),
      { ...size, fonts }
    );
  } catch (e) {
    console.error("OGP画像生成エラー:", e?.message || e);
    return renderEnglishFallback();
  }
}
