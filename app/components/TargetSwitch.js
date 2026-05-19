"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

// サイトのターゲットモード切替（伴走支援者向け ⇔ 経営者ご本人向け）
// 「制作者・コンサルタント等の支援者」と「事業者ご本人」では響くメッセージが違うため
// ヘッダー上段にトグルを設置して系統を切り替えられるようにする。
//
// 現状（Phase 1）: 経営者向け（/for-owners）は「準備中」表示で軽量ページに遷移
// 将来（Phase 2）: 経営者向けの本格的な LP を別途整備

const C = {
  ink: "#1a1a14",
  muted: "#78716c",
  border: "#ddd8cc",
  // 伴走支援者向け = 青（プロ向けの落ち着いたアクセント）
  proAccent: "#1a6fd4",
  // 経営者向け = 茶（温かみ・経営の重み）
  ownerAccent: "#8b5e3c",
};

const NAV_FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

// パスから「現在地はどちらの系統か」を判定
// /for-owners 以下 → 経営者向け、それ以外（共通ページ含む） → 伴走支援者向け
function detectMode(pathname) {
  if (!pathname) return "pro";
  if (pathname === "/for-owners" || pathname.startsWith("/for-owners/")) return "owner";
  return "pro";
}

export default function TargetSwitch() {
  const pathname = usePathname();
  const mode = detectMode(pathname);
  const [showOwnerNote, setShowOwnerNote] = useState(false);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        gap: 0,
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        overflow: "hidden",
        background: "#fff",
        fontFamily: NAV_FONT,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
      aria-label="ターゲット切替"
    >
      {/* 伴走支援者向け（現在のメイン） */}
      <Link
        href="/"
        style={{
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          color: mode === "pro" ? "#fff" : C.ink,
          background: mode === "pro" ? C.proAccent : "transparent",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          transition: "background 0.12s",
        }}
        title="Web制作者・コンサルタント・伴走支援者の方向け（現在のメインビュー）"
      >
        <span aria-hidden style={{ fontSize: 14 }}>👥</span>
        制作者・コンサル向け
      </Link>

      {/* 仕切り線 */}
      <span style={{ width: 1, background: C.border }} aria-hidden />

      {/* 経営者ご本人向け（準備中・/for-owners は軽量プレビュー） */}
      <Link
        href="/for-owners"
        onMouseEnter={() => setShowOwnerNote(true)}
        onMouseLeave={() => setShowOwnerNote(false)}
        style={{
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          color: mode === "owner" ? "#fff" : C.muted,
          background: mode === "owner" ? C.ownerAccent : "transparent",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          position: "relative",
          transition: "background 0.12s",
        }}
        title="経営者ご本人向け（準備中）"
      >
        <span aria-hidden style={{ fontSize: 14 }}>👤</span>
        経営者ご本人向け
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: mode === "owner" ? "rgba(255,255,255,0.25)" : "#fef3c7",
            color: mode === "owner" ? "#fff" : "#92400e",
            padding: "1px 6px",
            borderRadius: 3,
            letterSpacing: "0.04em",
          }}
        >
          準備中
        </span>
        {showOwnerNote && mode !== "owner" && (
          <span
            role="tooltip"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: C.ink,
              color: "#fff",
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              zIndex: 300,
              fontWeight: 500,
            }}
          >
            経営者ご本人向けの専用ページは準備中です
          </span>
        )}
      </Link>
    </div>
  );
}
