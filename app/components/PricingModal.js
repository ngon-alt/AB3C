"use client";

import { useState } from "react";

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
    1:   "price_ANALYSIS_1_ANNUAL",
    10:  "price_ANALYSIS_10_ANNUAL",
    100: "price_ANALYSIS_100_ANNUAL",
  };

  const supportPricesMonthly = {
    1:   "price_SUPPORT_1_MONTHLY",
    5:   "price_SUPPORT_5_MONTHLY",
    15:  "price_SUPPORT_15_MONTHLY",
    30:  "price_SUPPORT_30_MONTHLY",
    60:  "price_SUPPORT_60_MONTHLY",
    120: "price_SUPPORT_120_MONTHLY",
  };

  const supportPricesAnnual = {
    1:   "price_SUPPORT_1_ANNUAL",
    5:   "price_SUPPORT_5_ANNUAL",
    15:  "price_SUPPORT_15_ANNUAL",
    30:  "price_SUPPORT_30_ANNUAL",
    60:  "price_SUPPORT_60_ANNUAL",
    120: "price_SUPPORT_120_ANNUAL",
  };

  // === 料金データ（正規価格） ===
  const analysisPlanDetails = [
    { sites: 1,   annual: 44000 },
    { sites: 10,  annual: 396000 },
    { sites: 100, annual: 1980000 },
  ];

  const supportPlanDetails = [
    { sites: 1,   monthly: 88000,    annual: 880000 },
    { sites: 5,   monthly: 392000,   annual: 3920000 },
    { sites: 15,  monthly: 784000,   annual: 7840000 },
    { sites: 30,  monthly: 1254000,  annual: 12540000 },
    { sites: 60,  monthly: 2006000,  annual: 20060000 },
    { sites: 120, monthly: 3210000,  annual: 32100000 },
  ];

  const handleCheckout = async (priceId) => {
    if (priceId.startsWith("price_ANALYSIS_") || priceId.startsWith("price_SUPPORT_")) {
      alert("このプランは準備中です。まもなくご利用いただけます。");
      return;
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
            5月1日まで または 100名到達まで
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, background: '#fff', color: '#667eea',
            display: 'inline-block', padding: '8px 24px', borderRadius: 4
          }}>
            全プラン 50%OFF
          </div>
          <div style={{ fontSize: 11, marginTop: 12, opacity: 0.9 }}>
            ※先行ユーザーは契約期間中、特別価格継続<br/>
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
            <span style={{ color: C.B }}>※AIチャット相談は使えません</span>
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
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>機能</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>無料お試し</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>分析プラン</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>伴走プラン</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "AB3C分析レポート", free: "○（1回）", analysis: "○", growth: "○" },
                { feature: "ウェブサイト改善レポート", free: "○（1回）", analysis: "○", growth: "○" },
                { feature: "シェアURL発行", free: "○", analysis: "○", growth: "○" },
                { feature: "印刷・PDF保存", free: "○", analysis: "○", growth: "○" },
                { feature: "AIチャット相談", free: "✕", analysis: "✕", growth: "○（月100回/サイト）" },
                { feature: "契約期間", free: "—", analysis: "年間ライセンス", growth: "月額 or 年額" },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.highlight : C.surface, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", color: C.ink, fontWeight: 600 }}>{row.feature}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: C.muted }}>{row.free}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: C.muted }}>{row.analysis}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: row.growth === "✕" ? C.red : C.A, fontWeight: row.growth !== "✕" ? 700 : 400 }}>{row.growth}</td>
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
              分析プラン（年間ライセンス）
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
              伴走プラン（月額/年額）
            </button>
          </div>

          <div style={{
            background: showAnalysis ? "#bbdefb" : "#f8bbd0",
            border: "none", borderRadius: "0 0 6px 6px", padding: "20px"
          }}>
            {/* ===== 分析プラン ===== */}
            {showAnalysis && (
              <div>
                <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
                  現在のWebサイトから戦略と改善点をレポートする機能です。
                  主にスポット営業等に使う機能です。<br/>
                  <strong>年間ライセンス（有効期限1年）</strong>でのご提供です。<br/><br/>
                  <span style={{ color: C.B, fontWeight: 600 }}>※AIチャット相談は使えません</span>
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

            {/* ===== 伴走プラン ===== */}
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
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>
                        {plan.sites}サイトプラン
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                        ¥{perSite(campaign(plan.monthly), plan.sites).toLocaleString()}/サイト/月
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

            {/* 注釈 */}
            <div style={{ marginTop: 20, padding: "16px 20px", background: C.highlight, borderRadius: 6, fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
              ※ 全て税込価格です。<br/>
              ※ 分析プランは年間ライセンス（有効期限1年）です。<br/>
              ※ 伴走プランの年額契約は月額×10（2ヶ月分無料）です。<br/>
              ※ チャット上限：1サイトあたり月100回<br/>
              ※ 120サイト以上のプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
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
            <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.9, marginBottom: 24, fontFamily: "'Noto Serif JP', serif" }}>
              戦略大臣は、<strong>あなたのサービス単価を引き上げるツール</strong>です。<br />
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
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>分析プラン 1サイト<br />（先行ユーザー50%OFF価格）</div>
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
