"use client";
import { useState } from "react";
import Header from "../components/Header";

const C = {
  bg: "#f5f2eb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#1a1a14", muted: "#78716c", highlight: "#fef3c7",
  A: "#1a6fd4", B: "#FF0000", red: "#c0392b",
};

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

  const handleCheckout = async (priceId) => {
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

        {/* 無料お試し */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>無料お試し（1回限り）</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
            1アカウント1回限り有効<br/>
            ・AB3C分析レポート<br/>
            ・ウェブサイト改善レポート<br/>
            ・AIチャット相談（1回）
          </div>
          <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", lineHeight: 1.7 }}>
            まず試してみたい方向け。<br/>
            <span style={{ color: C.ink, fontStyle: "normal", fontWeight: 600 }}>AB3C分析レポート＋ウェブサイト改善レポートの両方を、クレジットカード不要で無料体験できます。</span>
          </div>
        </div>

        {/* 機能比較表 */}
        <div style={{ marginBottom: 24, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "sans-serif" }}>
            <thead>
              <tr style={{ background: C.ink, color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>機能</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>無料お試し</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>スポットプラン</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>サブスクプラン</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "AB3C分析レポート", free: "○（1回）", analysis: "○", growth: "○" },
                { feature: "ウェブサイト改善レポート", free: "○（1回）", analysis: "○", growth: "○" },
                { feature: "AIチャット相談", free: "○（1回）", analysis: "○（30回）", growth: "○（月100回/サイト）" },
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
                  <td style={{ padding: "10px 12px", color: "#000", fontWeight: 600 }}>{row.feature}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#000" }}>{row.free}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#000" }}>{row.analysis}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#000", fontWeight: 700 }}>{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* プラン詳細タブ */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={() => { setShowAnalysis(true); setShowGrowth(false); }}
              style={{ flex: 1, background: showAnalysis ? "#bbdefb" : "#e3f2fd", color: showAnalysis ? C.ink : C.muted, border: "none", borderRadius: "6px 6px 0 0", padding: "12px 16px", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>
              スポットプラン（年間ライセンス）
            </button>
            <button onClick={() => { setShowAnalysis(false); setShowGrowth(true); }}
              style={{ flex: 1, background: showGrowth ? "#f8bbd0" : "#fce4ec", color: showGrowth ? C.ink : C.muted, border: "none", borderRadius: "6px 6px 0 0", padding: "12px 16px", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>
              サブスクプラン（月額/年額）
            </button>
          </div>

          <div style={{ background: showAnalysis ? "#bbdefb" : "#f8bbd0", border: "none", borderRadius: "0 0 6px 6px", padding: "20px" }}>
            {showAnalysis && (
              <div>
                <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
                  現在のWebサイトから戦略と改善点をレポートする機能です。
                  主にスポット営業等に使う機能です。<br/>
                  <strong>年間ライセンス（有効期限1年）</strong>でのご提供です。<br/><br/>
                  <span style={{ color: C.A, fontWeight: 600 }}>※AIチャット相談が30回利用できます</span>
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
                    <button onClick={() => handleCheckout(analysisPrices[plan.sites])}
                      style={{ width: "100%", marginTop: 12, background: C.ink, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "12px 8px" }}>
                      このプランにする
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showGrowth && (
              <div>
                <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
                  伴走しながらサイトを改善していくためのプランです。
                  経営者さんが直接使う場合もこちらをお勧めします。<br/><br/>
                  <span style={{ color: C.A, fontWeight: 600 }}>✓ AIチャット相談が使えます（1サイトあたり月100回）</span><br/>
                  <span style={{ color: C.A, fontWeight: 600 }}>✓ 年額契約＝月額×10（2ヶ月分無料）</span>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
                {supportPlanDetails.map((plan, i) => (
                  <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>{plan.sites}サイトプラン</div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>¥{perSite(campaign(plan.monthly), plan.sites).toLocaleString()}/サイト/月</div>
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
                        <button onClick={() => handleCheckout(supportPricesMonthly[plan.sites])}
                          style={{ width: "100%", background: C.ink, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "12px 8px" }}>
                          月額で始める
                        </button>
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
                        <button onClick={() => handleCheckout(supportPricesAnnual[plan.sites])}
                          style={{ width: "100%", background: C.A, border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, padding: "12px 8px" }}>
                          年額で始める
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 注釈 */}
            <div style={{ marginTop: 20, padding: "16px 20px", background: C.highlight, borderRadius: 6, fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
              ※ 全て税込価格です。<br/>
              <strong style={{ color: C.red }}>※ 50%OFF価格は4月30日までに決済された初回分のみに適用されます。更新時は通常価格（定価）となります。</strong><br/>
              ※ スポットプランは年間ライセンス（有効期限1年）です。<br/>
              ※ サブスクプランの年額契約は月額×10（2ヶ月分無料）です。<br/>
              ※ チャット上限：1サイトあたり月100回<br/>
              {showAnalysis && <>※ 100サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。</>}
              {showGrowth && <>※ 120サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。</>}
            </div>
          </div>
        </div>

      </div>
      <footer style={{ textAlign: "center", padding: "20px 24px", borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 14, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 28 }} />
          <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>一般社団法人デジタル経営革新協会</span>
        </div>
        <div style={{ marginBottom: 8 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted, textDecoration: "underline" }}>ab3c.jp</a> · Powered by Claude AI</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <a href="/terms" style={{ color: C.muted, textDecoration: "none" }}>利用規約</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/privacy" style={{ color: C.muted, textDecoration: "none" }}>プライバシーポリシー</a>
          <span style={{ color: C.border }}>|</span>
          <a href="/legal" style={{ color: C.muted, textDecoration: "none" }}>特定商取引法</a>
        </div>
      </footer>
    </div>
  );
}
