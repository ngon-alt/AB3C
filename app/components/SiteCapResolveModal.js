'use client';

import { useEffect, useState } from "react";

const C = {
  ink: "#1a1a14",
  muted: "#78716c",
  border: "#e5e5e0",
  surface: "#ffffff",
  bg: "#f5f2eb",
  red: "#c0392b",
  phase1: "#2a2a26",
  phase2: "#2a2a26",
  highlight: "#fef3c7",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

// プラン変更でサイト上限を超えた時に、ユーザーが残すサイトを選ぶモーダル
//
// props:
//   open: boolean
//   sites: 全サイトの配列 [{ id, site_name, site_url, ... }]
//   cap: 残せる上限（0 の場合は全削除確認モード）
//   currentCount: 現在のサイト数
//   reason: 'support' | 'analysis_only' | 'no_plan'
//   onResolved: () => void  // 解決完了時のコールバック
//   onDismiss: () => void   // 「後で」を押した時
export default function SiteCapResolveModal({ open, sites, cap, currentCount, reason, onResolved, onDismiss }) {
  // 初期状態: 新しい順に cap 件を選択
  const [keepIds, setKeepIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    // sites は server 側で created_at DESC 順
    const initial = (sites || []).slice(0, cap || 0).map(s => s.id);
    setKeepIds(initial);
    setError("");
  }, [open, sites, cap]);

  if (!open) return null;

  const isAllDeleteMode = !cap || cap === 0;
  const selectedCount = keepIds.length;
  const deleteCount = (sites?.length || 0) - selectedCount;
  const overSelected = selectedCount > (cap || 0);

  const toggleId = (id) => {
    setError("");
    setKeepIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      // 上限を超える選択は拒否
      if (cap && prev.length >= cap) {
        setError(`選択できるのは最大 ${cap} 件です。他の選択を解除してください。`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const submit = async () => {
    if (overSelected) {
      setError(`選択数（${selectedCount}）が上限（${cap}）を超えています。`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/sites/cap-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepIds: isAllDeleteMode ? [] : keepIds }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setSubmitting(false);
        return;
      }
      // 成功
      setSubmitting(false);
      if (onResolved) onResolved();
    } catch (e) {
      setError("通信エラーが発生しました。もう一度お試しください。");
      setSubmitting(false);
    }
  };

  const headerText = isAllDeleteMode
    ? "ご契約内容ではサイトを保持できません"
    : "プラン変更により、残すサイトを選択してください";

  const explainText = (() => {
    if (reason === "analysis_only") {
      return "戦略診断チケットは「ワンショット利用」のためサイト履歴を保持しません。これまで蓄積したサイトは削除されます。サイト履歴を残したい場合は戦略指南プランへの変更をご検討ください。";
    }
    if (reason === "no_plan") {
      return "現在ご契約中のプランがないため、サイトを保持できません。プランをご確認ください。";
    }
    return `現在 ${currentCount} 件登録されていますが、ご契約のプランでは ${cap} 件までサイトを保持できます。残すサイトを選んで「確定」を押してください。選ばれなかった ${deleteCount} 件は削除されます。`;
  })();

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        style={{
          background: C.surface, borderRadius: 10, maxWidth: 720, width: "100%",
          maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 12px 48px rgba(0,0,0,0.3)", fontFamily: FONT,
        }}
      >
        {/* ヘッダー */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}`, background: isAllDeleteMode ? "#fdf0ef" : C.highlight }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{isAllDeleteMode ? "⚠️" : "📋"}</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: "'Noto Serif JP', serif" }}>
              {headerText}
            </div>
          </div>
        </div>

        {/* 説明 */}
        <div style={{ padding: "16px 28px", fontSize: 16, color: C.ink, lineHeight: 1.7, background: C.bg }}>
          {explainText}
          <div style={{ marginTop: 10, fontSize: 14, color: C.muted }}>
            ※ 重要なサイトは事前に「シェアURL発行」「印刷・PDF保存」で持ち帰ってください。
          </div>
        </div>

        {/* サイト一覧 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 28px" }}>
          {!isAllDeleteMode && (
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>
              選択中: <span style={{ fontWeight: 700, color: overSelected ? C.red : C.phase1 }}>{selectedCount}</span> / {cap} 件
            </div>
          )}
          {(sites || []).map(s => {
            const checked = keepIds.includes(s.id);
            const disabled = isAllDeleteMode;
            return (
              <label
                key={s.id}
                onClick={() => { if (!disabled) toggleId(s.id); }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "10px 12px", marginBottom: 6,
                  border: `1px solid ${checked ? C.phase1 : C.border}`,
                  borderRadius: 6,
                  background: checked ? "#e8f7f5" : C.surface,
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {}}
                  style={{ marginTop: 4, width: 18, height: 18, cursor: disabled ? "default" : "pointer", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.site_name || "(無題のサイト)"}
                  </div>
                  {s.site_url && (
                    <div style={{ fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.site_url}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    {s.strategy_confirmed && <span style={{ color: C.phase1, marginRight: 8 }}>✓ 戦略確定済み</span>}
                    {s.analyzed_at && <span>分析日: {new Date(s.analyzed_at).toLocaleDateString("ja-JP")}</span>}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* エラー */}
        {error && (
          <div style={{ padding: "10px 28px", fontSize: 14, color: C.red, background: "#fdf0ef" }}>
            {error}
          </div>
        )}

        {/* フッター */}
        <div style={{
          padding: "14px 28px", borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 14, color: C.ink }}>
            {isAllDeleteMode
              ? `${currentCount} 件すべて削除されます`
              : `削除予定: ${deleteCount} 件`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onDismiss && (
              <button
                onClick={onDismiss}
                disabled={submitting}
                style={{
                  background: "transparent", color: C.muted, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "10px 18px", fontSize: 15, cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: FONT,
                }}
              >
                後で
              </button>
            )}
            <button
              onClick={submit}
              disabled={submitting || (cap > 0 && selectedCount === 0 && !isAllDeleteMode)}
              style={{
                background: isAllDeleteMode ? C.red : C.phase1,
                color: "#fff", border: "none", borderRadius: 6,
                padding: "10px 24px", fontSize: 15, fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
                fontFamily: FONT,
              }}
            >
              {submitting ? "処理中..." : isAllDeleteMode ? `すべて削除して続行` : `${deleteCount} 件削除して確定`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
