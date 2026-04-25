'use client';

import { useEffect } from "react";
import updates from "../data/updates";

const C = {
  ink: "#1a1a14",
  muted: "#78716c",
  border: "#e5e5e0",
  surface: "#ffffff",
  bg: "#ebebeb",
  accent: "#0d9488",
  accentBg: "#a7e9e0",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

export default function UpdateHistoryModal({ open, onClose, highlightLatest = false }) {
  // ESC キーで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 10, maxWidth: 640, width: "100%",
          maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 12px 48px rgba(0,0,0,0.3)", fontFamily: FONT,
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
          background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📢</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: "'Noto Serif JP', serif" }}>
                更新履歴・お知らせ
              </div>
              {highlightLatest && (
                <div style={{ fontSize: 13, color: C.ink, marginTop: 2 }}>
                  新しいアップデートがあります
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 24, color: C.ink, padding: "4px 10px", lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* 本文（スクロール領域） */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {updates.length === 0 && (
            <div style={{ fontSize: 16, color: C.muted, textAlign: "center", padding: "40px 0" }}>
              更新履歴はまだありません
            </div>
          )}
          {updates.map((u, idx) => (
            <div
              key={u.id}
              style={{
                marginBottom: 24, paddingBottom: 24,
                borderBottom: idx < updates.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontSize: 13, color: "#fff", background: C.accent,
                  padding: "3px 10px", borderRadius: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                }}>
                  {u.date}
                </span>
                {idx === 0 && highlightLatest && (
                  <span style={{
                    fontSize: 12, color: "#fff", background: "#ea580c",
                    padding: "3px 8px", borderRadius: 12, fontWeight: 700,
                  }}>
                    NEW
                  </span>
                )}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, lineHeight: 1.5 }}>
                {u.title}
              </div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.7, marginBottom: u.details?.length ? 10 : 0 }}>
                {u.summary}
              </div>
              {u.details && u.details.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 22, color: C.ink, fontSize: 15, lineHeight: 1.7 }}>
                  {u.details.map((d, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* フッター */}
        <div style={{
          padding: "14px 28px", borderTop: `1px solid ${C.border}`,
          background: C.bg, display: "flex", justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              background: C.accent, color: "#fff", border: "none", borderRadius: 6,
              padding: "10px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
