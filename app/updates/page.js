"use client";
import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import updates, { latestUpdateId } from "../data/updates";

const C = {
  bg: "#f5f2eb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#1a1a14", muted: "#78716c",
  phase1: "#2a2a26", phase1Bg: "#faf8f4",
  phase2: "#2a2a26",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

export default function UpdatesPage() {
  // ページを開いた時点で「最新更新を見た」とみなして既読IDを更新（赤丸バッジを消す）
  useEffect(() => {
    try {
      if (latestUpdateId) localStorage.setItem("ab3c_last_seen_update_id", latestUpdateId);
      window.dispatchEvent(new Event("ab3c-updates-seen"));
    } catch (e) {}
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <Header />
      <main style={{ padding: "40px 20px 100px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>📢</span>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink }}>
                更新履歴・お知らせ
              </div>
            </div>
            <div style={{ fontSize: 16, color: C.ink, marginTop: 8, lineHeight: 1.7 }}>
              戦略指南 AI のアップデート情報・お知らせをまとめています。
            </div>
          </div>

          {updates.length === 0 ? (
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: 40, textAlign: "center", color: C.muted, fontSize: 16 }}>
              更新履歴はまだありません
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {updates.map((u, idx) => (
                <article
                  key={u.id}
                  style={{
                    background: C.surface,
                    border: "1px solid " + C.border,
                    borderLeft: idx === 0 ? `4px solid ${C.phase2}` : `4px solid ${C.phase1}`,
                    borderRadius: 8,
                    padding: "20px 24px",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 13, color: "#fff", background: C.phase1,
                      padding: "3px 10px", borderRadius: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                    }}>
                      {u.date}
                    </span>
                    {idx === 0 && (
                      <span style={{
                        fontSize: 12, color: "#fff", background: C.phase2,
                        padding: "3px 8px", borderRadius: 12, fontWeight: 700,
                      }}>
                        最新
                      </span>
                    )}
                  </div>
                  <h2 style={{
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: 22, fontWeight: 700, color: C.ink,
                    margin: "0 0 10px 0", lineHeight: 1.5,
                  }}>
                    {u.title}
                  </h2>
                  <p style={{ fontSize: 17, color: C.ink, lineHeight: 1.8, margin: u.details?.length ? "0 0 12px 0" : 0 }}>
                    {u.summary}
                  </p>
                  {u.details && u.details.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 24, color: C.ink, fontSize: 16, lineHeight: 1.8 }}>
                      {u.details.map((d, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>{d}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <a href="/" style={{ fontSize: 16, color: C.phase1, textDecoration: "underline", fontFamily: FONT }}>
              ← トップに戻る
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
