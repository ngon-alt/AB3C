"use client";

import { useState, useEffect } from "react";

const C = {
  bg: "#fafaf9",
  surface: "#ffffff",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
  highlight: "#fef3c7",
  A: "#1a6fd4",
  B: "#FF0000",
  red: "#c0392b",
};

export default function PricingModal({ onClose }) {
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showGrowth, setShowGrowth] = useState(false);

  // === Stripe Price IDs（正規価格で登録・TODO: Stripe作成後に差し替え） ===
  const analysisPrices = {
    1:   "price_1TMoucCYHZ66REnUcvtOwA19",
    10:  "price_1TMov9CYHZ66REnUE9yV6bwO",
    100: "price_1TMovUCYHZ66REnUdqdw3Jcc",
  };

  const supportPricesMonthly = {
    1:   "price_1TMQJECYHZ66REnUvdtin0z3",
    5:   "price_1TMQJVCYHZ66REnUYOy5mlL4",
    15:  "price_1TMQJjCYHZ66REnUmEgb5GGN",
    30:  "price_1TMQJzCYHZ66REnUtmQuGBR0",
    60:  "price_1TMQKGCYHZ66REnUAg6NOSOK",
    120: "price_1TMQKYCYHZ66REnUSM8rKr2n",
  };

  const supportPricesAnnual = {
    1:   "price_1TMQKvCYHZ66REnUomf2PJMh",
    5:   "price_1TMQLDCYHZ66REnU2w53yUAE",
    15:  "price_1TMQLYCYHZ66REnU9T2AlDh6",
    30:  "price_1TMQLtCYHZ66REnUpqPhuI24",
    60:  "price_1TMQMJCYHZ66REnU6KiAhHSz",
    120: "price_1TMQMZCYHZ66REnULJsbJQy7",
  };

  // === 料金データ（正規価格） ===
  const analysisPlanDetails = [
    { sites: 1,   annual: 22000 },
    { sites: 10,  annual: 110000 },
    { sites: 100, annual: 770000 },
  ];

  const supportPlanDetails = [
    { sites: 1,   monthly: 66000,    annual: 660000 },
    { sites: 5,   monthly: 165000,   annual: 1650000 },
    { sites: 15,  monthly: 330000,   annual: 3300000 },
    { sites: 30,  monthly: 495000,   annual: 4950000 },
    { sites: 60,  monthly: 792000,   annual: 7920000 },
    { sites: 120, monthly: 1320000,  annual: 13200000 },
  ];

  // ログインユーザーの契約プラン（逆プラン購入時の確認用）
  const [activePlans, setActivePlans] = useState([]);
  useEffect(() => {
    fetch('/api/check-pro')
      .then(r => r.json())
      .then(d => setActivePlans(Array.isArray(d.activePlans) ? d.activePlans : []))
      .catch(() => {});
  }, []);

  const resolvePlanType = (priceId) => {
    if (Object.values(analysisPrices).includes(priceId)) return 'analysis';
    if (Object.values(supportPricesMonthly).includes(priceId)) return 'support';
    if (Object.values(supportPricesAnnual).includes(priceId)) return 'support';
    return null;
  };
  const planKindLabel = (t) => t === 'support' ? '戦略指南プラン' : t === 'analysis' ? '戦略診断チケット' : '';

  const handleCheckout = async (priceId) => {
    if (priceId.startsWith("price_ANALYSIS_") || priceId.startsWith("price_SUPPORT_")) {
      alert("このプランは準備中です。まもなくご利用いただけます。");
      return;
    }
    // 逆プラン保有時の確認
    const buyingType = resolvePlanType(priceId);
    if (buyingType) {
      const oppositePlans = activePlans.filter(p => p.planType && p.planType !== buyingType);
      if (oppositePlans.length > 0) {
        const ok = confirm(
          `すでに${planKindLabel(oppositePlans[0].planType)}をご契約中です。\n` +
          `追加で${planKindLabel(buyingType)}をご契約されますか？\n\n` +
          `ご契約後は、ヘッダーのプラン切り替えメニューで利用するプランを切り替えられます。`
        );
        if (!ok) return;
      }
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
      console.error('Checkout error:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  const perSite = (total, sites) => Math.round(total / sites);
  const campaign = (price) => Math.round(price / 2);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, padding: "32px", maxWidth: 900, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", fontFamily: "sans-serif" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, marginBottom: 24 }}>プランと料金</div>

        {/* キャンペーンバナー */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 8, padding: '20px', marginBottom: 24, textAlign: 'center', color: '#fff'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            先行ユーザー価格キャンペーン
          </div>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            4月30日まで または 100名到達まで
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, background: '#fff', color: '#667eea',
            display: 'inline-block', padding: '8px 24px', borderRadius: 4
          }}>
            全プラン 50%OFF
          </div>
          <div style={{ fontSize: 12, marginTop: 12, opacity: 0.95, lineHeight: 1.7 }}>
            ※50%OFFは初回の契約期間のみ適用されます<br/>
            ※更新時は通常価格（定価）となります<br/>
            ※サービス内容の大幅変更時は価格改定の可能性あり
          </div>
        </div>

        {/* フリープラン */}
        <div style={{ background: C.highlight, border: "none", borderRadius: 8, padding: "20px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>無料お試し（1回限り）</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
            1アカウント1回限り有効<br/>
            ・AB3C分析レポート<br/>
            ・ウェブサイト改善レポート<br/>
            ・AIチャット相談（1回）
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", lineHeight: 1.7 }}>
            まず試してみたい方向け。<br/>
            <span style={{ color: C.ink, fontStyle: "normal", fontWeight: 600 }}>AB3C分析レポート＋ウェブサイト改善レポートの両方を、クレジットカード不要で無料体験できます。</span>
          </div>
        </div>

        {/* 機能比較表 */}
        <div style={{ marginBottom: 24, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "sans-serif" }}>
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
                { feature: "サイト登録可能数", free: "1サイト", analysis: "契約サイト数まで", growth: "1サイト枠あたり月3サイトまで入れ替え可" },
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

        {/* タブ切り替え */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <button
              onClick={() => { setShowAnalysis(true); setShowGrowth(false); }}
              style={{
                flex: 1, background: showAnalysis ? "#bbdefb" : "#e3f2fd",
                color: showAnalysis ? C.ink : C.muted, border: "none",
                borderRadius: "6px 6px 0 0", padding: "12px 16px", cursor: "pointer",
                fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, transition: "all 0.2s"
              }}
            >
              戦略診断チケット（有効期限1年）
            </button>
            <button
              onClick={() => { setShowAnalysis(false); setShowGrowth(true); }}
              style={{
                flex: 1, background: showGrowth ? "#f8bbd0" : "#fce4ec",
                color: showGrowth ? C.ink : C.muted, border: "none",
                borderRadius: "6px 6px 0 0", padding: "12px 16px", cursor: "pointer",
                fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, transition: "all 0.2s"
              }}
            >
              戦略指南プラン（戦略診断・策定・アクション・月額/年額）
            </button>
          </div>

          <div style={{
            background: showAnalysis ? "#bbdefb" : "#f8bbd0",
            border: "none", borderRadius: "0 0 6px 6px", padding: "20px"
          }}>
            {/* ===== 戦略診断チケット ===== */}
            {showAnalysis && (
              <div>
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
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>
                        {plan.sites}サイトプラン
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                        ¥{perSite(campaign(plan.annual), plan.sites).toLocaleString()}/サイト
                      </div>
                    </div>
                    {/* 正規価格（取り消し線） */}
                    <div style={{ fontSize: 14, color: C.muted, textDecoration: "line-through", marginBottom: 4 }}>
                      通常価格 ¥{plan.annual.toLocaleString()}/年
                    </div>
                    {/* キャンペーン価格 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>50%OFF</span>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.ink }}>
                        ¥{campaign(plan.annual).toLocaleString()}
                        <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/年（税込）</span>
                        <div style={{ fontSize: 11, color: C.red, fontWeight: 600, marginTop: 2 }}>※初回決済分のみの価格です</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckout(analysisPrices[plan.sites])}
                      style={{
                        width: "100%", marginTop: 12, background: C.ink, border: "none", borderRadius: 4,
                        color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace",
                        fontSize: 14, fontWeight: 700, padding: "12px 8px"
                      }}
                    >
                      このプランにする
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ===== 戦略指南プラン（戦略診断・策定・アクション） ===== */}
            {showGrowth && (
              <div>
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
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>
                        {plan.sites}サイトプラン
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                        ¥{perSite(campaign(plan.annual) / 12, plan.sites).toLocaleString()}/サイト/月（年額時）
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {/* 月額 */}
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>月額契約</div>
                        <div style={{ fontSize: 13, color: C.muted, textDecoration: "line-through", marginBottom: 2 }}>
                          ¥{plan.monthly.toLocaleString()}/月
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ background: '#667eea', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3 }}>50%OFF</span>
                        </div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                          ¥{campaign(plan.monthly).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/月</span>
                          <div style={{ fontSize: 10, color: C.red, fontWeight: 600, marginTop: 2 }}>※初回決済分のみ</div>
                        </div>
                        <button
                          onClick={() => handleCheckout(supportPricesMonthly[plan.sites])}
                          style={{
                            width: "100%", background: C.ink, border: "none", borderRadius: 4,
                            color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace",
                            fontSize: 14, fontWeight: 700, padding: "12px 8px"
                          }}
                        >
                          月額で始める
                        </button>
                      </div>
                      {/* 年額 */}
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>年額契約</div>
                        <div style={{ fontSize: 13, color: C.muted, textDecoration: "line-through", marginBottom: 2 }}>
                          ¥{plan.annual.toLocaleString()}/年
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ background: '#667eea', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3 }}>50%OFF</span>
                          <span style={{ fontSize: 12, color: '#1a6fd4', fontWeight: 600 }}>+2ヶ月無料</span>
                        </div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                          ¥{campaign(plan.annual).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/年</span>
                          <div style={{ fontSize: 10, color: C.red, fontWeight: 600, marginTop: 2 }}>※初回決済分のみ</div>
                        </div>
                        <button
                          onClick={() => handleCheckout(supportPricesAnnual[plan.sites])}
                          style={{
                            width: "100%", background: C.A, border: "none", borderRadius: 4,
                            color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace",
                            fontSize: 14, fontWeight: 700, padding: "12px 8px"
                          }}
                        >
                          年額でお得に
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 注釈（タブごとに切り替え） */}
            <div style={{ marginTop: 20, padding: "16px 20px", background: C.highlight, borderRadius: 6, fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
              ※ 全て税込価格です。<br/>
              <strong style={{ color: C.red }}>※ 50%OFF価格は4月30日までに決済された初回分のみに適用されます。更新時は通常価格（定価）となります。</strong><br/>
              {showAnalysis && (
                <>
                  ※ 戦略診断チケットは購入から1年以内に使い切ってください。期限を過ぎた未使用分は失効します。<br/>
                  ※ 戦略診断チケットは履歴保存されません。診断結果はPDF・シェアURL・印刷で必ず持ち帰ってください。<br/>
                  ※ 100サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
                </>
              )}
              {showGrowth && (
                <>
                  ※ 戦略指南プランの年額契約は月額×10（2ヶ月分無料）です。<br/>
                  ※ チャット上限：1サイトあたり月100回<br/>
                  ※ 120サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
                </>
              )}
            </div>
          </div>
        </div>

        {/* Web制作者・コンサルタント向けセクション */}
        <div style={{ marginTop: 32, border: `2px solid ${C.A}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: C.A, padding: "16px 24px" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>
              FOR PROFESSIONALS
            </div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 }}>
              Web制作者・コンサルタントの方へ
            </div>
          </div>

          <div style={{ padding: "24px", background: "#fff" }}>
            <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.9, marginBottom: 24, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
              戦略指南 AIは、<strong>あなたのサービス単価を引き上げるツール</strong>です。<br />
              従来、同等の戦略分析レポートを手作業で作成すると<strong>月300〜500万円</strong>のコンサルティング費用が必要でした。<br />
              このツールを活用することで、クライアントに<strong>月20〜30万円</strong>で高品質な戦略支援を提供できます。
            </div>

            <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.A, marginBottom: 16, letterSpacing: "0.1em" }}>BUSINESS MODEL</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { step: "01", text: "クライアントのWebサイトをAB3C分析（月1〜複数サイト）" },
                  { step: "02", text: "分析レポート・改善提案をそのまま提案書として納品" },
                  { step: "03", text: "AIチャットを活用してクライアントの戦略相談に毎月伴走" },
                  { step: "04", text: "月20〜30万円の戦略支援サービスとして継続契約" },
                ].map((item) => (
                  <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#fff", background: C.A, borderRadius: 3, padding: "2px 8px", flexShrink: 0, marginTop: 2 }}>
                      {item.step}
                    </div>
                    <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "#fff8f8", border: `1px solid #ffcccc`, borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: C.B, marginBottom: 8, letterSpacing: "0.08em" }}>YOUR COST</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: C.ink }}>¥22,000<span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>/年〜</span></div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>戦略診断チケット 1サイト<br />（先行ユーザー50%OFF価格）</div>
              </div>
              <div style={{ background: "#f0fff4", border: `1px solid #86efac`, borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 8, letterSpacing: "0.08em" }}>CLIENT FEE</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: C.ink }}>¥200,000<span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>/月〜</span></div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>クライアントへの<br />戦略支援サービス料</div>
              </div>
            </div>

            <div style={{ background: "#fffbeb", border: `1px solid #fcd34d`, borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 10, letterSpacing: "0.08em" }}>CLIENT VALUE</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.8 }}>
                クライアント（中小企業）にとっても、月20〜30万円の投資で<strong>年間数百万円以上の売上・利益インパクト</strong>が期待できる、費用対効果の高い経営支援です。
                従来のコンサルティングでは同水準の分析に<strong>月300〜500万円</strong>が必要でした。
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 12, letterSpacing: "0.08em" }}>こんな方に向いています</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Web制作の提案前にクライアントの戦略を整理・言語化したい",
                  "制作後の運用支援まで継続契約にして収益を安定させたい",
                  "コンサルティングメニューを新たに作りたい税理士・中小企業診断士",
                  "クライアントへの提案単価を上げたいフリーランサー",
                ].map((text, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.ink, lineHeight: 1.7 }}>
                    <span style={{ color: C.A, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <a href="/howto#for-professionals" style={{ display: "block", background: C.A, borderRadius: 4, color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "14px 20px", textDecoration: "none", textAlign: "center" }}>
              活用ガイド・提案モデルを詳しく見る →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
