'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from "react";
import { latestUpdateId } from "../data/updates";

const C = {
  bg: "#ebebeb",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
  A: "#1a6fd4",
  B: "#FF0000",
  // フェーズ色は廃止し「墨色」で統一。タブの番号①②と矢印で進行方向を表現する
  phase1: "#2a2a26",
  phase2: "#2a2a26",
};

const NAV_FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

const ACTIVE_PLAN_STORAGE_KEY = "ab3c_active_plan_id";

export default function Header({ onShowPricing, currentSiteUrl, currentSiteId, previousSiteId, previousSiteUrl, previousSiteConfirmed, phase, strategyConfirmed, onConfirmStrategy, canAccessBansou: canAccessBansouProp, onNewAnalysis, onSwitchToAnalysis, onSwitchToAction }) {
  const { data: session, status: sessionStatus } = useSession();
  // TOPページではキャッチコピーがあるためヘッダーサブタイトルは非表示にする（重複解消）
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  // sessionStorage キャッシュから初期化（ページ遷移後の「無料→指南15」のチラつき防止）
  const readPlanCache = () => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem("ab3c_check_pro");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  };
  const cached = typeof window !== "undefined" ? readPlanCache() : null;
  const [isPro, setIsPro] = useState(cached?.isPro || false);
  const [chatTickets, setChatTickets] = useState(cached?.chatTickets || 0);
  const [activePlans, setActivePlans] = useState(Array.isArray(cached?.activePlans) ? cached.activePlans : []); // check-pro が返す全 active プラン
  const [planLoaded, setPlanLoaded] = useState(!!cached); // プラン情報読込完了フラグ
  const [activePlanId, setActivePlanId] = useState(null); // localStorage で選択中のプラン ID
  const [currentPath, setCurrentPath] = useState("/");
  const [sites, setSites] = useState([]);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [hasUnseenUpdate, setHasUnseenUpdate] = useState(false);

  // ユーザー名ドロップダウンから Stripe Portal を開く
  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const d = await r.json();
      if (!r.ok || !d.url) {
        alert(d.error || "お支払い管理画面にアクセスできませんでした。");
        setPortalLoading(false);
        return;
      }
      window.location.href = d.url;
    } catch (e) {
      alert("通信エラーが発生しました。");
      setPortalLoading(false);
    }
  };

  // 更新履歴の未読チェック（ヘッダーは全ページで描画されるため、ここで判定）
  useEffect(() => {
    if (!latestUpdateId) return;
    const recheck = () => {
      try {
        const seen = localStorage.getItem("ab3c_last_seen_update_id");
        setHasUnseenUpdate(seen !== latestUpdateId);
      } catch (e) {}
    };
    recheck();
    // モーダルや /updates ページ訪問で既読化された時にバッジを即時消す
    window.addEventListener("ab3c-updates-seen", recheck);
    return () => window.removeEventListener("ab3c-updates-seen", recheck);
  }, []);

  useEffect(() => {
    setCurrentPath(window.location.pathname + window.location.search);
    // 選択中プラン ID を localStorage から読み取り
    try {
      const stored = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
      if (stored) setActivePlanId(stored);
    } catch (e) {}
    if (session?.user?.email) {
      fetch("/api/check-pro")
        .then((r) => r.json())
        .then((d) => {
          const isProV = !!d.isPro;
          const chatTicketsV = d.chatTickets || 0;
          const activePlansV = Array.isArray(d.activePlans) ? d.activePlans : [];
          setIsPro(isProV);
          setChatTickets(chatTicketsV);
          setActivePlans(activePlansV);
          setPlanLoaded(true);
          // sessionStorage にキャッシュ（次のページ遷移で同期復元される）
          try {
            sessionStorage.setItem("ab3c_check_pro", JSON.stringify({
              isPro: isProV, chatTickets: chatTicketsV, activePlans: activePlansV,
            }));
          } catch (e) {}
        })
        .catch(() => { setIsPro(false); setChatTickets(0); setPlanLoaded(true); });
      fetch("/api/sites")
        .then((r) => r.json())
        .then((d) => setSites(d.sites || []))
        .catch(() => {});
    }
  }, [session]);

  // 選択中プラン: localStorage の ID と activePlans を突き合わせ。無効なら先頭にフォールバック
  const currentPlan = (activePlans.length > 0)
    ? (activePlans.find(p => p.id === activePlanId) || activePlans[0])
    : null;
  const planLabel = currentPlan?.planLabel || null;
  const planType = currentPlan?.planType || null;
  const nextRenewalAt = currentPlan?.expiresAt || null;
  const hasMultiplePlans = activePlans.length >= 2;

  const handleSelectPlan = (planId) => {
    setActivePlanId(planId);
    try { localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, planId); } catch (e) {}
    setShowPlanDropdown(false);
    // 他コンポーネントに通知して再描画させる
    try { window.dispatchEvent(new Event("ab3c-plan-changed")); } catch (e) {}
  };

  const canAccessBansou = canAccessBansouProp !== undefined ? canAccessBansouProp : (isPro || chatTickets > 0);
  // 戦略アクションタブのツールチップ: PRO/有料→戦略確定後に利用可、それ以外→戦略指南プランで利用可
  const showBansouTip = !canAccessBansou || (canAccessBansou && phase !== "action");
  const bansouTooltip = !session ? "ログインが必要です" : !canAccessBansou ? "戦略指南プランで利用可" : "戦略確定後に利用可";

  const isActive = (key) => {
    if (key === "analysis") return currentPath === "/" && (!currentPath.includes("phase=action"));
    if (key === "action") return currentPath.includes("phase=action") || phase === "action";
    if (key === "dashboard") return currentPath.startsWith("/dashboard");
    return false;
  };

  return (
    <div id="app-header" style={{ background: "#ffffff", position: "sticky", top: 0, zIndex: 200 }}>
      {/* 上段: ロゴ + サブナビ + ユーザー情報 */}
      <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 900, lineHeight: 1 }}>
            <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: "clamp(20px, 4vw, 36px)", color: C.ink }}>戦略指南 AI</span>
            <span style={{ fontFamily: NAV_FONT, fontSize: "clamp(14px, 2.5vw, 20px)", color: C.muted, marginLeft: 10, fontWeight: 600, letterSpacing: "0.05em" }}>
              on <span style={{ color: C.A }}>A</span><span style={{ color: C.B }}>B</span><span style={{ color: C.ink }}>3C</span>
            </span>
          </div>
          {!isHomePage && (
            <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: C.ink, letterSpacing: "0.05em", marginTop: 2 }}>
              選ばれる理由を言語化する 戦略策定AI
            </div>
          )}
        </a>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {sessionStatus === "loading" ? (
            // 認証状態確定前: 高さを確保して空白で表示。一瞬だけログインボタンが表示される現象を防ぐ
            <div aria-hidden style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 36, visibility: "hidden" }}>
              <span style={{ fontSize: 16 }}>　</span>
            </div>
          ) : session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
                <button
                  onClick={() => setShowUserDropdown(v => !v)}
                  style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: C.ink, fontFamily: NAV_FONT, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 4 }}
                  title="マイアカウントメニューを開く"
                >
                  {session.user?.name}
                  <span style={{ fontSize: 10 }}>▼</span>
                </button>
                {showUserDropdown && (
                  <div
                    onMouseLeave={() => setShowUserDropdown(false)}
                    style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 500, minWidth: 220, overflow: "hidden" }}
                  >
                    <Link href="/account" onClick={() => setShowUserDropdown(false)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", textDecoration: "none", color: C.ink, fontSize: 14, borderBottom: `1px solid ${C.border}`, background: "#fff" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                      onMouseLeaveCapture={e => e.currentTarget.style.background = "#fff"}
                    >
                      <span>📋</span><span>マイアカウント</span>
                    </Link>
                    <button onClick={() => { setShowUserDropdown(false); openStripePortal(); }} disabled={portalLoading}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", textAlign: "left", background: "#fff", border: "none", borderBottom: `1px solid ${C.border}`, cursor: portalLoading ? "not-allowed" : "pointer", color: C.ink, fontSize: 14, fontFamily: NAV_FONT }}
                      onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.background = "#f5f5f0"; }}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      <span>💳</span><span>{portalLoading ? "読み込み中..." : "支払い履歴・領収書"}</span>
                    </button>
                    <button onClick={() => { try { sessionStorage.removeItem("ab3c_check_pro"); } catch (e) {} setShowUserDropdown(false); signOut(); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", textAlign: "left", background: "#fff", border: "none", cursor: "pointer", color: C.ink, fontSize: 14, fontFamily: NAV_FONT }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      <span>🚪</span><span>ログアウト</span>
                    </button>
                  </div>
                )}
                {planLoaded && planLabel && !hasMultiplePlans && (
                  <span style={{ background: planLabel.startsWith("指南") ? C.B : C.A, color: "#fff", fontSize: 14, padding: "2px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>{planLabel}</span>
                )}
                {planLoaded && planLabel && hasMultiplePlans && (
                  <span style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                      title="プランを切り替える"
                      style={{ background: planLabel.startsWith("指南") ? C.B : C.A, color: "#fff", fontSize: 14, padding: "2px 8px 2px 10px", borderRadius: 3, fontFamily: "'Space Mono', monospace", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      {planLabel}<span style={{ fontSize: 10 }}>▼</span>
                    </button>
                    {showPlanDropdown && (
                      <div
                        onMouseLeave={() => setShowPlanDropdown(false)}
                        style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 400, minWidth: 220, overflow: "hidden" }}
                      >
                        <div style={{ padding: "8px 12px", fontSize: 11, color: C.muted, fontFamily: NAV_FONT, borderBottom: `1px solid ${C.border}`, background: "#fafaf7" }}>
                          利用するプランを選択
                        </div>
                        {activePlans.map(p => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPlan(p.id)}
                            style={{ padding: "10px 14px", cursor: "pointer", fontFamily: NAV_FONT, fontSize: 14, color: C.ink, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: p.id === currentPlan?.id ? "#e8f7f5" : "transparent" }}
                            onMouseEnter={e => { if (p.id !== currentPlan?.id) e.currentTarget.style.background = "#f5f5f0"; }}
                            onMouseLeave={e => { if (p.id !== currentPlan?.id) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ background: p.planLabel.startsWith("指南") ? C.B : C.A, color: "#fff", fontSize: 12, padding: "2px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>{p.planLabel}</span>
                            {p.id === currentPlan?.id && <span style={{ fontSize: 12, color: C.phase1, fontWeight: 700 }}>✓ 選択中</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                )}
                {planLoaded && isPro && !planLabel && <span style={{ background: C.B, color: "#fff", fontSize: 14, padding: "2px 8px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>無制限</span>}
                {planLoaded && !planLabel && !isPro && <span style={{ background: "#fff", color: C.ink, fontSize: 14, padding: "2px 8px", borderRadius: 3, border: `1px solid ${C.border}`, fontFamily: "'Space Mono', monospace" }}>無料</span>}
                {planLoaded && nextRenewalAt && (
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: NAV_FONT }}>
                    {planType === "support" ? "次回更新" : "有効期限"}: {new Date(nextRenewalAt).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" })}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <button onClick={() => signIn("google")} style={{ display: "flex", alignItems: "center", gap: 0, border: "none", borderRadius: 4, cursor: "pointer", padding: 0, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.25)", fontFamily: "Roboto, Arial, sans-serif" }}>
              <div style={{ background: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
                  <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.6 10.6l7.9-6z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.7 2.2-7.6 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.9 6C6.5 42.5 14.6 48 24 48z"/>
                </svg>
              </div>
              <div style={{ background: "#DB4437", padding: "8px 14px", color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                Googleでログイン
              </div>
            </button>
          )}
          {/* サブナビ — Next.js Link でクライアント遷移し、認証状態の再フェッチを避ける */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/howto"
              style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 4 }}>🔰</span>初めての方へ
            </Link>
            <Link href="/about"
              style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 4 }}>📖</span>AB3C分析とは
            </Link>
            <Link href="/pricing"
              style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 4 }}>💰</span>料金とプラン
            </Link>
            <Link
              href="/updates"
              title="更新履歴・お知らせ"
              style={{
                position: "relative",
                fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap",
              }}
            >
              <span style={{ marginRight: 4 }}>📢</span>更新履歴
              {hasUnseenUpdate && (
                <span
                  aria-label="新着あり"
                  style={{
                    position: "absolute", top: -4, right: -8,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#c0392b", border: "2px solid #fff",
                  }}
                />
              )}
            </Link>
            <Link href="/faq"
              style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 4 }}>❓</span>よくある質問
            </Link>
            <Link href="/contact"
              style={{ fontSize: 16, color: C.ink, fontFamily: NAV_FONT, textDecoration: "underline", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 4 }}>✉️</span>お問い合わせ
            </Link>
          </div>
        </div>
      </div>
      {/* 下段: メインナビ（ピル型ステッパー） */}
      <nav style={{ padding: "12px 24px 14px", display: "flex", alignItems: "center", gap: 6, background: "#fff", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        {/* ⓪ 新規戦略診断 — 「入口」のニュートラルなスレート色（Benefit赤/Advantage青/teal/orangeと衝突しない） */}
        {(() => {
          const active = phase === "input";
          const PHASE0 = "#64748b"; // slate-500 系: 中立で「まだ選択前」を表現
          return (
            <button onClick={() => { if (onNewAnalysis) onNewAnalysis(); else window.location.href = "/"; }}
              title="URL or テキスト入力から新規に戦略診断を実行します（戦略診断チケットはこのステップのみが対象です）"
              style={{
                padding: "8px 16px", fontSize: 14, fontFamily: NAV_FONT, whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.03em",
                background: active ? PHASE0 : "#e2e8f0",
                color: active ? "#fff" : "#475569",
                border: active ? `2px solid ${PHASE0}` : `2px solid transparent`,
                borderRadius: 999,
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
              }}>
              <span style={{ background: active ? "rgba(255,255,255,0.25)" : "#94a3b8", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>0</span>
              新規戦略診断
            </button>
          );
        })()}
        <span style={{ color: "#bbb", fontSize: 14, padding: "0 2px" }}>→</span>

        {/* ① 戦略策定 — 現在のサイト or 「前のサイト」(previousSiteId) があれば常に enabled */}
        {(() => {
          const active = phase === "analysis";
          // 現在分析中 or 現在のサイトIDあり or ⓪を押す前のサイトIDあり
          const enabled = phase !== "input" || !!currentSiteId || !!previousSiteId;
          return (
            <span style={{ position: "relative", display: "inline-flex" }}
              onMouseEnter={e => { if (!enabled) { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "block"; } }}
              onMouseLeave={e => { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "none"; }}>
              <button onClick={() => {
                if (!enabled) return;
                if (onSwitchToAnalysis) { onSwitchToAnalysis(); }
                else {
                  // フォールバック: 直接URL遷移（currentSiteId → previousSiteId の順で拾う）
                  const sid = currentSiteId || previousSiteId;
                  const surl = currentSiteUrl || previousSiteUrl;
                  const params = [];
                  if (sid) params.push(`site_id=${sid}`);
                  if (surl) params.push(`url=${encodeURIComponent(surl)}`);
                  window.location.href = params.length > 0 ? `/?${params.join("&")}` : "/";
                }
              }}
                style={{
                  padding: "8px 16px", fontSize: 14, fontFamily: NAV_FONT, whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.03em",
                  background: active ? C.phase1 : enabled ? "#e5e5e0" : "#f0f0ec",
                  color: active ? "#fff" : enabled ? C.phase1 : "#999",
                  border: active ? `2px solid ${C.phase1}` : `2px solid transparent`,
                  borderRadius: 999,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  cursor: enabled ? "pointer" : "not-allowed",
                }}>
                <span style={{ background: active ? "rgba(255,255,255,0.25)" : enabled ? C.phase1 : "#bbb", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>1</span>
                戦略策定
              </button>
              {!enabled && (
                <div className="nav-tip" style={{ display: "none", position: "absolute", top: "100%", left: 0, marginTop: 4, background: C.ink, color: "#fff", fontSize: 12, padding: "8px 12px", borderRadius: 4, whiteSpace: "nowrap", zIndex: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", fontFamily: NAV_FONT }}>
                  まず新規戦略診断を実行してください
                </div>
              )}
            </span>
          );
        })()}
        <span style={{ color: "#bbb", fontSize: 14, padding: "0 2px" }}>→</span>

        {/* ② 戦略アクション — 現在確定済み or 「前のサイト」が確定済みなら enabled */}
        {(() => {
          const active = phase === "action";
          const enabled = strategyConfirmed || (!!previousSiteId && !!previousSiteConfirmed);
          return (
            <span style={{ position: "relative", display: "inline-flex" }}
              onMouseEnter={e => { if (!active) { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "block"; } }}
              onMouseLeave={e => { const tip = e.currentTarget.querySelector(".nav-tip"); if (tip) tip.style.display = "none"; }}>
              <button onClick={() => {
                if (!enabled) return;
                if (onSwitchToAction) { onSwitchToAction(); }
                else {
                  // フォールバック: 直接URL遷移（currentSiteId → previousSiteId の順で拾う）
                  const sid = currentSiteId || previousSiteId;
                  const surl = currentSiteUrl || previousSiteUrl;
                  const params = ["phase=action"];
                  if (sid) params.push(`site_id=${sid}`);
                  if (surl) params.push(`url=${encodeURIComponent(surl)}`);
                  window.location.href = `/?${params.join("&")}`;
                }
              }}
                className={enabled && !active ? "next-step-pulse" : undefined}
                style={{
                  padding: "8px 16px", fontSize: 14, fontFamily: NAV_FONT, whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.03em",
                  background: active ? C.phase2 : enabled ? "#e5e5e0" : "#f0f0ec",
                  color: active ? "#fff" : enabled ? C.phase2 : "#999",
                  border: active ? `2px solid ${C.phase2}` : `2px solid transparent`,
                  borderRadius: 999,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  cursor: enabled ? "pointer" : "not-allowed",
                }}>
                <span style={{ background: active ? "rgba(255,255,255,0.25)" : enabled ? C.phase2 : "#bbb", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>2</span>
                戦略アクション
              </button>
              {!active && (
                <div className="nav-tip" style={{ display: "none", position: "absolute", top: "100%", left: 0, marginTop: 4, background: C.ink, color: "#fff", fontSize: 12, padding: "8px 12px", borderRadius: 4, whiteSpace: "nowrap", zIndex: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", fontFamily: NAV_FONT }}>
                  {bansouTooltip}
                </div>
              )}
            </span>
          );
        })()}

        {/* 区切り */}
        <div style={{ width: 1, height: 24, background: C.border, margin: "0 10px" }} />

        {/* サイト管理ボタン */}
        <a href="/dashboard"
          style={{
            padding: "8px 16px", fontSize: 14, fontFamily: NAV_FONT, textDecoration: "none", whiteSpace: "nowrap", fontWeight: 600,
            color: "#fff", display: "inline-flex", alignItems: "center", gap: 6,
            background: C.ink, border: "2px solid transparent", borderRadius: 999,
          }}>
          📋 サイト管理
        </a>

        {/* サイト切替プルダウン */}
        {session && sites.length > 0 && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowSiteDropdown(!showSiteDropdown)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#fff", border: `2px solid ${C.ink}`, borderRadius: 999, cursor: "pointer", fontFamily: NAV_FONT, fontSize: 14, color: C.ink, fontWeight: 600 }}>
              {currentSiteUrl ? currentSiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "サイトを選択"}
              <span style={{ fontSize: 12, color: C.ink }}>▼</span>
            </button>
            {showSiteDropdown && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 400, minWidth: 280, maxHeight: 300, overflowY: "auto" }}
                onMouseLeave={() => setShowSiteDropdown(false)}>
                {sites.map(site => (
                  <a key={site.id} href={`/?site_id=${site.id}${site.site_url ? `&url=${encodeURIComponent(site.site_url)}` : ""}`}
                    style={{ display: "block", padding: "10px 14px", fontSize: 13, color: C.ink, textDecoration: "none", borderBottom: `1px solid ${C.border}`, fontFamily: NAV_FONT, lineHeight: 1.5 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{site.site_name}</div>
                    {site.site_url && <div style={{ fontSize: 11, color: C.A }}>{site.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</div>}
                  </a>
                ))}
                <a href="/dashboard" style={{ display: "block", padding: "10px 14px", fontSize: 13, color: C.A, textDecoration: "none", fontFamily: NAV_FONT, borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  ＋ サイトを登録
                </a>
                <a href="/dashboard" style={{ display: "block", padding: "10px 14px", fontSize: 13, color: C.muted, textDecoration: "none", fontFamily: NAV_FONT, textAlign: "center", fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f0"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  サイト管理画面を開く →
                </a>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
