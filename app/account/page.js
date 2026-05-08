"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

const C = {
  bg: "#f5f2eb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#1a1a14", muted: "#78716c",
  A: "#1a6fd4", B: "#FF0000",
  phase1: "#2a2a26", phase1Bg: "#faf8f4",
  phase2: "#2a2a26",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
const SERIF = "'Noto Serif JP', serif";

function formatDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  } catch (e) { return "—"; }
}

function planTypeLabel(t) {
  if (t === "support") return "戦略指南プラン";
  if (t === "analysis") return "戦略診断チケット";
  return t || "—";
}

function purposeLabel(p) {
  if (p === "self") return "自社・自分のビジネス分析";
  if (p === "agency") return "代理店・コンサル業務での活用";
  return "—";
}

export default function AccountPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [purposeUpdating, setPurposeUpdating] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch("/api/account");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "情報の取得に失敗しました");
        } else {
          setData(json);
        }
      } catch (e) {
        setError("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [session, sessionStatus]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        alert(json.error || "カスタマーポータルにアクセスできませんでした。");
        setPortalLoading(false);
        return;
      }
      window.location.href = json.url;
    } catch (e) {
      alert("通信エラーが発生しました。");
      setPortalLoading(false);
    }
  };

  const updatePurpose = async (newPurpose) => {
    setPurposeUpdating(true);
    try {
      await fetch("/api/user/purpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: newPurpose }),
      });
      setData(prev => prev ? { ...prev, user: { ...prev.user, purpose: newPurpose } } : prev);
    } catch (e) {
      alert("更新に失敗しました。");
    } finally {
      setPurposeUpdating(false);
    }
  };

  // 認証前
  if (sessionStatus === "loading" || loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
        <Header />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 20px", textAlign: "center", color: C.muted }}>
          読み込み中…
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
        <Header />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 18, color: C.ink, marginBottom: 24 }}>マイアカウントを表示するには<br/>Googleアカウントでログインしてください。</div>
          <Link href="/" style={{ display: "inline-block", padding: "10px 22px", background: C.A, color: "#fff", borderRadius: 4, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>ホームに戻る</Link>
        </div>
      </div>
    );
  }

  const u = data?.user;
  const plans = data?.plans || [];
  const supportPlans = plans.filter(p => p.plan_type === "support");
  const analysisPlans = plans.filter(p => p.plan_type === "analysis");
  // 診断チケットは合算
  const analysisTotalLimit = analysisPlans.reduce((s, p) => s + parseInt(p.site_limit || 0), 0);
  const analysisTotalUsed = analysisPlans.reduce((s, p) => s + parseInt(p.analyses_used || 0), 0);
  const analysisRemaining = Math.max(0, analysisTotalLimit - analysisTotalUsed);
  const earliestAnalysisExpiry = analysisPlans.map(p => p.expires_at).filter(Boolean).sort()[0] || null;
  // 指南プラン契約サイト合計
  const supportTotalLimit = supportPlans.reduce((s, p) => s + parseInt(p.site_limit || 0), 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <Header />
      <main style={{ padding: "40px 20px 100px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.ink, margin: 0 }}>マイアカウント</h1>
            </div>
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.7 }}>
              ご契約状況・利用状況の確認、お支払い履歴・領収書のダウンロードができます。
            </div>
          </div>

          {error && (
            <div style={{ background: "#fff3cd", border: "1px solid #f0a020", borderRadius: 6, padding: "12px 16px", marginBottom: 24, fontSize: 14, color: C.ink }}>
              {error}
            </div>
          )}

          {/* === セクション1: アカウント情報 === */}
          <Section title="アカウント情報" icon="👤">
            <Field label="メールアドレス">{u?.email || session.user.email}</Field>
            <Field label="お名前">{u?.name || session.user.name || "—"}</Field>
            <Field label="登録日">{formatDate(u?.created_at)}</Field>
            <Field label="ご利用目的">
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span>{purposeLabel(u?.purpose)}</span>
                {!purposeUpdating && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {u?.purpose !== "self" && (
                      <button onClick={() => updatePurpose("self")} style={btnSmall(C.A)}>自社利用に変更</button>
                    )}
                    {u?.purpose !== "agency" && (
                      <button onClick={() => updatePurpose("agency")} style={btnSmall(C.phase2)}>代理店利用に変更</button>
                    )}
                  </div>
                )}
                {purposeUpdating && <span style={{ fontSize: 12, color: C.muted }}>更新中...</span>}
              </div>
            </Field>
          </Section>

          {/* === セクション2: 現在のプラン === */}
          <Section title="現在のプラン" icon="📦">
            {data?.isPro && supportPlans.length === 0 && analysisPlans.length === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: "1px solid " + C.border, borderRadius: 6 }}>
                <span style={{ background: C.B, color: "#fff", fontSize: 14, padding: "3px 10px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>無制限</span>
                <span style={{ fontSize: 15, color: C.ink }}>運営からの招待による無制限アカウントです</span>
              </div>
            )}
            {supportPlans.map(p => (
              <div key={p.id} style={{ padding: "16px 18px", background: "#fff", border: "1px solid " + C.border, borderRadius: 6, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ background: C.B, color: "#fff", fontSize: 14, padding: "3px 10px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>指南{p.site_limit}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{planTypeLabel(p.plan_type)}（{p.site_limit}サイト・{p.interval === "year" ? "年額" : "月額"}）</span>
                </div>
                <div style={{ fontSize: 14, color: C.muted }}>次回更新日: <span style={{ color: C.ink, fontWeight: 700 }}>{formatDate(p.expires_at)}</span></div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>契約日: {formatDate(p.purchased_at)}</div>
              </div>
            ))}
            {analysisPlans.length > 0 && (
              <div style={{ padding: "16px 18px", background: "#fff", border: "1px solid " + C.border, borderRadius: 6, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ background: C.A, color: "#fff", fontSize: 14, padding: "3px 10px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>診断 {analysisRemaining}/{analysisTotalLimit}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>戦略診断チケット（残 {analysisRemaining} 枚）</span>
                </div>
                <div style={{ fontSize: 14, color: C.muted }}>有効期限: <span style={{ color: C.ink, fontWeight: 700 }}>{formatDate(earliestAnalysisExpiry)}</span></div>
              </div>
            )}
            {!data?.isPro && supportPlans.length === 0 && analysisPlans.length === 0 && (
              <div style={{ padding: "16px 18px", background: "#fff", border: "1px solid " + C.border, borderRadius: 6, color: C.muted, fontSize: 15 }}>
                現在ご契約中のプランはありません。無料トライアル（1回）のみご利用いただけます。
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/pricing" style={{ display: "inline-block", padding: "8px 18px", background: C.phase1, color: "#fff", borderRadius: 4, textDecoration: "none", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>プラン変更・追加 →</Link>
            </div>
          </Section>

          {/* === セクション3: ご利用状況 === */}
          <Section title="ご利用状況" icon="📊">
            <StatRow label="登録サイト数" value={`${data?.siteCount ?? 0} サイト`} sub={data?.isPro ? "無制限" : supportTotalLimit > 0 ? `（契約上限: ${supportTotalLimit} サイト）` : "（戦略指南プランで上限を増やせます）"} />
            <StatRow label="今月のチャット残回数" value={`${data?.chatTickets ?? 0} 回`} sub={supportTotalLimit > 0 ? `（毎月 ${supportTotalLimit * 100} 回まで補充）` : "戦略指南プラン契約者向け"} />
            {data?.monthly?.isSupport && (
              <StatRow label="今月のサイト登録残数" value={`${data.monthly.remaining} / ${data.monthly.limit} サイト`} sub="次回ご契約更新日にリセットされます" />
            )}
            {data?.trialChats > 0 && (
              <StatRow label="無料トライアルチャット" value={`${data.trialChats} 回`} sub="お試し利用分" />
            )}
          </Section>

          {/* === セクション4: 支払い履歴・領収書 === */}
          <Section title="お支払い履歴・領収書" icon="💳">
            {data?.hasStripeCustomer ? (
              <>
                <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.7, marginBottom: 14 }}>
                  決済履歴の確認、領収書（PDF）のダウンロード、クレジットカード情報の更新、サブスクリプションの解約・プラン変更ができます。
                </div>
                <button onClick={openPortal} disabled={portalLoading} style={{
                  background: portalLoading ? C.muted : C.A, border: "none", borderRadius: 4,
                  color: "#fff", cursor: portalLoading ? "not-allowed" : "pointer",
                  fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, padding: "12px 24px",
                }}>
                  {portalLoading ? "Stripeへリダイレクト中..." : "🔗 お支払い管理画面を開く"}
                </button>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>※ 安全な Stripe ホスト型ページ（buy.stripe.com / billing.stripe.com）に遷移します</div>
              </>
            ) : (
              <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>
                ご決済履歴がありません。プランをご契約いただくと、こちらから領収書のダウンロードや決済履歴の確認ができます。
              </div>
            )}
          </Section>

          <div style={{ marginTop: 32, fontSize: 13, color: C.muted, lineHeight: 1.7, textAlign: "center" }}>
            アカウント削除・データ削除のご要望は <a href="/contact" style={{ color: C.A }}>お問い合わせ</a> よりご連絡ください。
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.ink, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
        {title}
      </h2>
      <div style={{ background: C.bg, padding: "16px 18px", borderRadius: 8, border: "1px solid " + C.border }}>
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) 1fr", gap: 12, padding: "8px 0", borderBottom: "1px dashed " + C.border, alignItems: "start" }}>
      <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function StatRow({ label, value, sub }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "10px 0", borderBottom: "1px dashed " + C.border, alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 14, color: C.muted }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: "'Space Mono', monospace" }}>{value}</div>
    </div>
  );
}

function btnSmall(bg) {
  return {
    background: bg, border: "none", borderRadius: 3, color: "#fff",
    cursor: "pointer", fontSize: 11, padding: "4px 10px",
    fontFamily: FONT, fontWeight: 700,
  };
}
