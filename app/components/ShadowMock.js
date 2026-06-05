"use client";
import { useEffect, useRef } from "react";

// AI 生成のビジュアルモック HTML をページに描画するコンポーネント。
//
// 2026-06-04 変更: Shadow DOM から iframe (srcDoc) ベースに切り替え。
//
// 理由:
//   Shadow DOM はスタイルを隔離してくれるが、position: fixed の要素は
//   ビューポート基準で描画される仕様のため、AI が生成した「右下に LINE
//   相談ボタンを fixed で配置」のような提案がメインページにブリードして
//   親 UI を埋め尽くす副作用が起きていた。
//
//   iframe は viewport が完全にコンテナ内に閉じるため、fixed 要素も
//   iframe 内に収まる。
//
// 実装の要点:
//   - sandbox="allow-same-origin" : スクリプト無効、ただし同一オリジン
//     扱いで contentDocument を読み取れる（高さ自動調整に必要）。AI 生成
//     HTML に意図しないスクリプトが入っても実行されない安全策。
//   - 高さ自動調整: load イベント後に scrollHeight を読み iframe.style.height
//     に反映。ResizeObserver で画像読み込み完了等の後続変化も追従。
//   - 名前は ShadowMock のままで互換維持（呼び出し側を触らない）。
//
// 互換性:
//   - props: { html, style } は ShadowMock 時代と同じ
//   - 親側のスタイル指定（width 等）はそのまま iframe に渡る
export default function ShadowMock({ html, style }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const ifr = iframeRef.current;
    if (!ifr) return;

    let ro = null;
    let cancelled = false;

    const updateHeight = () => {
      if (cancelled || !ifr.contentDocument) return;
      const docEl = ifr.contentDocument.documentElement;
      if (!docEl) return;
      // padding/margin 込みの「文書全体の高さ」
      const h = docEl.scrollHeight;
      if (h > 0) ifr.style.height = h + "px";
    };

    const handleLoad = () => {
      if (cancelled || !ifr.contentDocument) return;
      // 初期高さ
      updateHeight();
      // 画像ロード・スタイル適用後の変化に追従
      try {
        const docEl = ifr.contentDocument.documentElement;
        if (docEl && typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(() => updateHeight());
          ro.observe(docEl);
        }
      } catch (e) {
        // ResizeObserver 未対応環境では諦める（初期高さは入る）
      }
      // 念のため少し遅らせて再計測（画像の onload 後など）
      setTimeout(updateHeight, 300);
      setTimeout(updateHeight, 1000);
    };

    ifr.addEventListener("load", handleLoad);
    // srcDoc が変わったタイミングで load が再発火するので、これで OK

    return () => {
      cancelled = true;
      ifr.removeEventListener("load", handleLoad);
      if (ro) ro.disconnect();
    };
  }, [html]);

  // srcDoc に最低限の document を注入（body 直下に AI HTML を入れる）。
  // <html>/<body> タグが入っているか不明な AI 出力もあるため、まるごと
  // srcDoc に渡すだけで動くようブラウザの寛容パース任せにする。
  // 余白を切るため html,body の margin/padding を最小化。
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;}</style></head><body>${html || ""}</body></html>`;

  const mergedStyle = Object.assign(
    {
      display: "block",
      width: "100%",
      border: 0,
      // 初期高さ。load 後に scrollHeight で上書きされる。
      // 低すぎると最初の描画でスクロールが出てしまう/高すぎると空白が出るので 400 にしておく。
      height: 400,
    },
    style || {}
  );

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      style={mergedStyle}
      title="AI ビジュアルモック"
    />
  );
}
