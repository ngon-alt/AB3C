"use client";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const C = {
  bg: "#f5f2eb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#1a1a14", muted: "#78716c", highlight: "#fef3c7",
  A: "#1a6fd4", B: "#FF0000", red: "#c0392b",
};

// プラン購入用の CTA ボタン。明確に「押せる」見た目と、ホバーで浮き上がる
// インタラクションでユーザーに契約申し込みのトリガーであることを伝える。
function CheckoutButton({ label, onClick, bg }) {
  const base = bg || "#1a6fd4";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: base,
        border: "none",
        borderRadius: 8,
        color: "#fff",
        cursor: "pointer",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif",
        fontSize: 15,
        fontWeight: 700,
        padding: "14px 18px",
        marginTop: 12,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.22)";
        e.currentTarget.style.filter = "brightness(1.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
        e.currentTarget.style.filter = "none";
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "translateY(0) scale(0.98)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
    >
      {label}
    </button>
  );
}

export default function PricingPage() {
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showGrowth, setShowGrowth] = useState(false);

  const analysisPrices = {
    1: "price_1TMoucCYHZ66REnUcvtOwA19",
    10: "price_1TMov9CYHZ66REnUE9yV6bwO",
    100: "price_1TMovUCYHZ66REnUdqdw3Jcc",
  };
  const supportPricesMonthly = {
    1: "price_1TMQJECYHZ66REnUvdtin0z3",
    5: "price_1TMQJVCYHZ66REnUYOy5mlL4",
    15: "price_1TMQJjCYHZ66REnUmEgb5GGN",
    30: "price_1TMQJzCYHZ66REnUtmQuGBR0",
    60: "price_1TMQKGCYHZ66REnUAg6NOSOK",
    120: "price_1TMQKYCYHZ66REnUSM8rKr2n",
  };
  const supportPricesAnnual = {
    1: "price_1TMQKvCYHZ66REnUomf2PJMh",
    5: "price_1TMQLDCYHZ66REnU2w53yUAE",
    15: "price_1TMQLYCYHZ66REnU9T2AlDh6",
    30: "price_1TMQLtCYHZ66REnUpqPhuI24",
    60: "price_1TMQMJCYHZ66REnU6KiAhHSz",
    120: "price_1TMQMZCYHZ66REnULJsbJQy7",
  };

  const analysisPlanDetails = [
    { sites: 1, annual: 22000 },
    { sites: 10, annual: 110000 },
    { sites: 100, annual: 770000 },
  ];
  const supportPlanDetails = [
    { sites: 1, monthly: 66000, annual: 660000 },
    { sites: 5, monthly: 165000, annual: 1650000 },
    { sites: 15, monthly: 330000, annual: 3300000 },
    { sites: 30, monthly: 495000, annual: 4950000 },
    { sites: 60, monthly: 792000, annual: 7920000 },
    { sites: 120, monthly: 1320000, annual: 13200000 },
  ];

  // ログインユーザーの現在の契約プランタイプ（逆プラン購入時の確認用）
  const [activePlans, setActivePlans] = useState([]);
  useEffect(() => {
    fetch('/api/check-pro')
      .then(r => r.json())
      .then(d => setActivePlans(Array.isArray(d.activePlans) ? d.activePlans : []))
      .catch(() => {});
  }, []);

  // priceId から plan type を判定
  const resolvePlanType = (priceId) => {
    if (Object.values(analysisPrices).includes(priceId)) return 'analysis';
    if (Object.values(supportPricesMonthly).includes(priceId)) return 'support';
    if (Object.values(supportPricesAnnual).includes(priceId)) return 'support';
    return null;
  };

  const planKindLabel = (t) => t === 'support' ? '戦略指南プラン' : t === 'analysis' ? '戦略診断チケット' : '';

  const handleCheckout = async (priceId) => {
    const buyingType = resolvePlanType(priceId);
    // 既に何らかの契約がある場合、現在の契約内容と購入後の挙動を明示して確認
    if (buyingType && activePlans.length > 0) {
      const existing = activePlans.map(p => p.planLabel).join('・');
      const buyingLabel = planKindLabel(buyingType);
      let note = '';
      if (buyingType === 'analysis') {
        const hasAnalysis = activePlans.some(p => p.planType === 'analysis');
        if (hasAnalysis) note = '※既存の戦略診断チケットの残り回数と購入分が合算されます。';
      } else {
        const hasSupport = activePlans.some(p => p.planType === 'support');
        if (hasSupport) note = '※既存の戦略指南プランは新しいご契約に差し替わり、自動キャンセルされます。サイト数が減る場合は古いサイトから自動的に削除されます。';
      }
      const ok = confirm(
        `現在のご契約: ${existing}\n\n` +
        `追加で${buyingLabel}をご契約されますか？\n\n` +
        (note ? note + '\n\n' : '') +
        `ご契約後は、ヘッダーのプラン切り替えメニューで利用するプランを切り替えられます。`
      );
      if (!ok) return;
    }
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });
      const data = await res.json();
      if (data.error) { alert('Error: ' + data.error); return; }
      if (data.url) { window.location.href = data.url; }
      else { alert('決済URLの取得に失敗しました'); }
    } catch (error) {
      alert('エラーが発生しました: ' + error.message);
    }
  };

  const perSite = (total, sites) => Math.round(total / sites);
  const campaign = (price) => Math.round(price / 2);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 24 }}>料金とプラン</div>

        {/* キャンペーンバナー */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8, padding: '20px', marginBottom: 24, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>先行ユーザー価格キャンペーン</div>
          <div style={{ fontSize: 14, marginBottom: 12 }}>4月30日まで または 100名到達まで</div>
          <div style={{ fontSize: 24, fontWeight: 700, background: '#fff', color: '#667eea', display: 'inline-block', padding: '8px 24px', borderRadius: 4 }}>全プラン 50%OFF</div>
          <div style={{ fontSize: 12, marginTop: 12, opacity: 0.95, lineHeight: 1.7 }}>
            ※50%OFFは初回の契約期間のみ適用されます<br/>
            ※更新時は通常価格（定価）となります<br/>
            ※サービス内容の大幅変更時は価格改定の可能性あり
          </div>
        </div>


        {/* 機能比較表 */}
        <div style={{ marginBottom: 24, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "sans-serif" }}>
            <thead>
              <tr style={{ background: C.ink, color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>機能</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>無料お試し</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>戦略診断チケット</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>戦略指南プラン<br/>（戦略診断・策定・アクション）</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "AB3C分析レポート", free: "○（1回限り）", analysis: "○", growth: "○" },
                { feature: "ウェブサイト改善レポート", free: "○（1回限り）", analysis: "○", growth: "○" },
                { feature: "サイト登録可能数", free: "1サイト", analysis: "契約サイト数まで", growth: "契約サイト数まで" },
                { feature: "AIチャットで戦略を磨く", free: "✕", analysis: "✕", growth: "○（月100回/サイト）" },
                { feature: "戦略確定・履歴保存", free: "✕", analysis: "✕", growth: "○" },
                { feature: "SEO対策チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "SNS運用チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "Web広告チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "Googleマップチャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "チラシ・DMチャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "プレスリリースチャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "ウェブサイト改善チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "採用コンテンツ企画チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "補助金申請チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "営業資料・提案書チャット", free: "✕", analysis: "✕", growth: "○" },
                { feature: "シェアURL発行", free: "○", analysis: "○", growth: "○" },
                { feature: "印刷・PDF保存", free: "○", analysis: "○", growth: "○" },
                { feature: "契約期間", free: "—", analysis: "購入後1年間", growth: "月額 or 年額" },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.highlight : C.surface, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", color: "#000" }}>{row.feature}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#000" }}>{row.free}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#000" }}>{row.analysis}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#000", fontWeight: 700 }}>{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* プラン詳細: 縦積みレイアウト（タブなし） */}

        {/* ── 戦略診断チケット セクション ── */}
        <section style={{ background: "#e3f2fd", borderRadius: 8, padding: "24px", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            戦略診断チケット <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>（有効期限1年）</span>
          </div>
          <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
            現在のWebサイトから戦略と改善点をレポートする機能です。
            AB3C分析＋ウェブサイト改善レポートを書き出して、PDF・印刷・シェアURLで持ち帰れます。<br/><br/>
            <strong style={{ color: C.ink }}>📅 有効期限：購入から1年間</strong><br/>
            購入したサイト数分の診断を1年以内に使い切ってください。期限を過ぎた未使用分は失効します。<br/><br/>
            <strong style={{ color: C.red }}>⚠️ 診断結果は履歴保存されません</strong><br/>
            ブラウザを閉じると結果は消えるため、必ず<strong>PDF保存・シェアURL発行・印刷</strong>のいずれかで持ち帰ってください。<br/><br/>
            <span style={{ color: C.muted, fontWeight: 600 }}>※AIチャットや戦略アクション機能、診断結果の履歴保存は戦略指南プランで利用可能です</span>
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
          {analysisPlanDetails.map((plan, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>{plan.sites}サイトプラン</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>¥{perSite(campaign(plan.annual), plan.sites).toLocaleString()}/サイト</div>
              </div>
              <div style={{ fontSize: 14, color: C.muted, textDecoration: "line-through", marginBottom: 4 }}>通常価格 ¥{plan.annual.toLocaleString()}/年</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>50%OFF</span>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.ink }}>
                  ¥{campaign(plan.annual).toLocaleString()}
                  <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/年（税込）</span>
                  <div style={{ fontSize: 11, color: C.red, fontWeight: 600, marginTop: 2 }}>※初回決済分のみの価格です</div>
                </div>
              </div>
              <CheckoutButton label={`この${plan.sites}サイトプランにする →`} onClick={() => handleCheckout(analysisPrices[plan.sites])} bg={C.A} />
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff", borderRadius: 6, fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
            ※ 全て税込価格です。<br/>
            <strong style={{ color: C.red }}>※ 50%OFF価格は4月30日までに決済された初回分のみに適用されます。更新時は通常価格（定価）となります。</strong><br/>
            ※ 戦略診断チケットは購入から1年以内に使い切ってください。期限を過ぎた未使用分は失効します。<br/>
            ※ 戦略診断チケットは履歴保存されません。診断結果はPDF・シェアURL・印刷で必ず持ち帰ってください。<br/>
            ※ 100サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
          </div>
        </section>

        {/* ── 戦略指南プラン セクション ── */}
        <section style={{ background: "#fce4ec", borderRadius: 8, padding: "24px", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            戦略指南プラン <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>（戦略診断・策定・アクション・月額/年額）</span>
          </div>
          <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
            <strong>戦略診断・策定・アクション</strong>の3段階すべてを継続的に支援する戦略指南プランです。
            経営者さんが直接使う場合もこちらをお勧めします。<br/><br/>
            <span style={{ color: C.A, fontWeight: 600 }}>✓ 戦略診断・チャットで戦略を磨く・戦略アクション実行支援</span><br/>
            <span style={{ color: C.A, fontWeight: 600 }}>✓ AIチャット相談が使えます（1サイトあたり月100回）</span><br/>
            <span style={{ color: C.A, fontWeight: 600 }}>✓ 年額契約＝月額×10（2ヶ月分無料）</span>
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
          {supportPlanDetails.map((plan, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>{plan.sites}サイトプラン</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>¥{perSite(campaign(plan.annual) / 12, plan.sites).toLocaleString()}/サイト/月（年額時）</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>月額契約</div>
                  <div style={{ fontSize: 13, color: C.muted, textDecoration: "line-through", marginBottom: 2 }}>¥{plan.monthly.toLocaleString()}/月</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ background: '#667eea', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3 }}>50%OFF</span>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                    ¥{campaign(plan.monthly).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/月</span>
                    <div style={{ fontSize: 10, color: C.red, fontWeight: 600, marginTop: 2 }}>※初回決済分のみ</div>
                  </div>
                  <CheckoutButton label="月額で始める →" onClick={() => handleCheckout(supportPricesMonthly[plan.sites])} bg={C.ink} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>年額契約</div>
                  <div style={{ fontSize: 13, color: C.muted, textDecoration: "line-through", marginBottom: 2 }}>¥{plan.annual.toLocaleString()}/年</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ background: '#667eea', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3 }}>50%OFF</span>
                    <span style={{ fontSize: 12, color: '#1a6fd4', fontWeight: 600 }}>+2ヶ月無料</span>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                    ¥{campaign(plan.annual).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/年</span>
                    <div style={{ fontSize: 10, color: C.red, fontWeight: 600, marginTop: 2 }}>※初回決済分のみ</div>
                  </div>
                  <CheckoutButton label="年額で始める →" onClick={() => handleCheckout(supportPricesAnnual[plan.sites])} bg={C.A} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff", borderRadius: 6, fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
            ※ 全て税込価格です。<br/>
            <strong style={{ color: C.red }}>※ 50%OFF価格は4月30日までに決済された初回分のみに適用されます。更新時は通常価格（定価）となります。</strong><br/>
            ※ 戦略指南プランの年額契約は月額×10（2ヶ月分無料）です。<br/>
            ※ チャット上限：1サイトあたり月100回<br/>
            ※ 120サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
