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
          background: "#1a1a14",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontWeight: 900,
            letterSpacing: "-0.03em",
          }}
        >
          <span style={{ fontSize: 360, color: "#5a9eea", lineHeight: 1 }}>A</span>
          <span style={{ fontSize: 360, color: "#FF4444", lineHeight: 1 }}>B</span>
          <span style={{ fontSize: 360, color: "#ffffff", lineHeight: 1 }}>3C</span>
        </div>
        <div style={{ fontSize: 80, color: "#fff", marginTop: 24, fontWeight: 700, letterSpacing: "0.08em" }}>
          STRATEGY AI · senryaku.ai
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
    // サブセットから Latin を除く: 「A」が NotoSansJP に含まれると「B3C」と
    // 別フォントで描画されて位置がズレるため、Latin はすべて Inter(Satori 内蔵)
    // にフォールバックさせる
    const captionText = "選ばれる理由を言語化する戦略策定";

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
            background: "#1a1a14",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
            position: "relative",
          }}
        >
          {/* 上部の AB3C カラーストライプ（B=赤・A=青のブランド要素） */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex" }}>
            <div style={{ flex: 1, height: 16, background: "#FF0000" }} />
            <div style={{ flex: 1, height: 16, background: "#1a6fd4" }} />
          </div>

          {/* メインタイトル: 戦略指南 AI（OGP の主役。SNS で小さく表示されても読める大きさ） */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ fontSize: 260, lineHeight: 1, fontFamily: titleFontName, fontWeight: 900 }}>戦略指南</span>
            <span style={{ fontSize: 200, lineHeight: 1, fontWeight: 900, marginLeft: 28, color: "#ffd966" }}>AI</span>
          </div>

          {/* キャッチコピー（短く） */}
          <div
            style={{
              fontSize: 56,
              color: "#e5e5e0",
              fontFamily: bodySans ? "NotoSansJP" : undefined,
              fontWeight: 400,
              letterSpacing: "0.06em",
              marginTop: 48,
            }}
          >
            選ばれる理由を、言語化する。
          </div>

          {/* URL（控えめだが識別用） */}
          <div
            style={{
              fontSize: 36,
              color: "#999",
              marginTop: 36,
              letterSpacing: "0.1em",
              fontWeight: 700,
            }}
          >
            senryaku.ai
          </div>

          {/* 下部の AB3C カラーストライプ */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex" }}>
            <div style={{ flex: 1, height: 16, background: "#1a6fd4" }} />
            <div style={{ flex: 1, height: 16, background: "#FF0000" }} />
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
