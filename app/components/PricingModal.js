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

  // Stripe Price IDs
  const analysisPrices = {
    monthly: {
      1: "price_1TJ9lcCYHZ66REnUFd8PP24z",
      5: "price_1TJ9pNCYHZ66REnUCl03OmDO",
      10: "price_1TJ9quCYHZ66REnUqJZIx23y",
      30: "price_1TJ9rcCYHZ66REnUmtEZkCnz",
      50: "price_1TJ9sQCYHZ66REnU4kQP9npL",
      100: "price_1TJ9t9CYHZ66REnUeA49IVDs"
    },
    annual: {
      1: "price_1TJ9ohCYHZ66REnUN2caOn5h",
      5: "price_1TJ9q7CYHZ66REnUYfCKElz8",
      10: "price_1TJ9rFCYHZ66REnUUhQVgOd0",
      30: "price_1TJ9s3CYHZ66REnUsfzwrunm",
      50: "price_1TJ9soCYHZ66REnUjwmC7fuu",
      100: "price_1TJ9uQCYHZ66REnUjLQ39eKG"
    }
  };

  const growthPrices = {
    monthly: {
      1: "price_1TJ9urCYHZ66REnUiLMhvaYr",
      5: "price_1TJ9vbCYHZ66REnUr4WTXEbW",
      10: "price_1TJ9wFCYHZ66REnUNVJYhJYY",
      30: "price_1TJ9wuCYHZ66REnUjeDnayHy",
      50: "price_1TJ9xXCYHZ66REnUmUTzdDYC",
      100: "price_1TJ9yECYHZ66REnU9fMw0D5g"
    },
    annual: {
      1: "price_1TJ9v7CYHZ66REnUKzAAIpZl",
      5: "price_1TJ9vrCYHZ66REnUYWlCUrOB",
      10: "price_1TJ9wUCYHZ66REnU1v2x2WPc",
      30: "price_1TJ9x9CYHZ66REnUgnZwL8ym",
      50: "price_1TJ9xtCYHZ66REnU2hqNs1M2",
      100: "price_1TJ9yVCYHZ66REnUZOaH5iFs"
    }
  };

  const analysisPlanDetails = [
    { sessions: 1, monthly: 22000, annual: 220000 },
    { sessions: 5, monthly: 110000, annual: 1100000 },
    { sessions: 10, monthly: 220000, annual: 2200000 },
    { sessions: 30, monthly: 594000, annual: 5940000 },
    { sessions: 50, monthly: 880000, annual: 8800000 },
    { sessions: 100, monthly: 1540000, annual: 15400000 }
  ];

  const growthPlanDetails = [
    { sessions: 1, monthly: 44000, annual: 440000 },
    { sessions: 5, monthly: 220000, annual: 2200000 },
    { sessions: 10, monthly: 440000, annual: 4400000 },
    { sessions: 30, monthly: 1188000, annual: 11880000 },
    { sessions: 50, monthly: 1760000, annual: 17600000 },
    { sessions: 100, monthly: 3080000, annual: 30800000 }
  ];

  const handleCheckout = async (priceId) => {
    const res = await fetch('/api/stripe/checkout', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ priceId }) 
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, padding: "32px", maxWidth: 900, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", fontFamily: "sans-serif" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>
        
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, marginBottom: 24 }}>プランと料金</div>

        {/* キャンペーンバナー */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: 8, 
          padding: '20px', 
          marginBottom: 24,
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            🚀 先行ユーザー価格キャンペーン
          </div>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            5月1日まで または 100名到達まで
          </div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            background: '#fff', 
            color: '#667eea', 
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: 4,
            marginBottom: 12
          }}>
            全プラン 50%OFF
          </div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 700, 
            background: 'rgba(255,255,255,0.2)', 
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 4,
            border: '2px dashed #fff',
            letterSpacing: '0.1em'
          }}>
            クーポンコード：SEMINAR2025APR
          </div>
          <div style={{ fontSize: 11, marginTop: 12, opacity: 0.9 }}>
            ※決済画面でクーポンコードを入力してください<br/>
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
          <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
            まず試してみたい方向け
          </div>
        </div>

        {/* 機能比較表 */}
        <div style={{ marginTop: 0, marginBottom: 24, overflowX: "auto" }}>
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
                { feature: "AIチャット相談", free: "✕", analysis: "✕", growth: "○" },
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
                flex: 1,
                background: showAnalysis ? C.ink : "#f0f0f0",
                color: showAnalysis ? "#fff" : C.muted,
                border: "none",
                borderRadius: "6px 6px 0 0",
                padding: "12px 16px",
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: 14,
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              分析プラン
            </button>
            <button
              onClick={() => { setShowAnalysis(false); setShowGrowth(true); }}
              style={{
                flex: 1,
                background: showGrowth ? C.ink : "#f0f0f0",
                color: showGrowth ? "#fff" : C.muted,
                border: "none",
                borderRadius: "6px 6px 0 0",
                padding: "12px 16px",
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: 14,
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              伴走プラン
            </button>
          </div>

          <div style={{ background: "#f9f9f9", border: `1px solid ${C.border}`, borderRadius: "0 0 6px 6px", padding: "20px" }}>
            {/* 分析プラン */}
            {showAnalysis && (
              <div>
                <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
                  現在のWebサイトから戦略と改善点をレポートする機能です。
                  主にスポット営業等に使う機能です。<br/><br/>
                  <span style={{ color: C.B, fontWeight: 600 }}>※AIチャット相談は使えません</span>
                </div>
                
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
                {analysisPlanDetails.map((plan, i) => (
                  <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                      月{plan.sessions}サイトプラン
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>月額契約</div>
                        <div style={{ fontSize: 14, color: '#667eea', marginBottom: 2 }}>先行ユーザー価格</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                          ¥{plan.monthly.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/月</span>
                        </div>
                        <div style={{ fontSize: 14, color: C.muted, marginBottom: 2 }}>通常 ¥{(plan.monthly * 2).toLocaleString()}</div>
                        <div style={{ height: 18, marginBottom: 8 }}></div>
                        <button
                          onClick={() => handleCheckout(analysisPrices.monthly[plan.sessions])}
                          style={{ 
                            width: "100%", 
                            background: C.ink, 
                            border: "none", 
                            borderRadius: 4, 
                            color: "#fff", 
                            cursor: "pointer", 
                            fontFamily: "'Space Mono', monospace", 
                            fontSize: 14, 
                            fontWeight: 700, 
                            padding: "12px 8px" 
                          }}
                        >
                          このプランにする
                        </button>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>年額契約</div>
                        <div style={{ fontSize: 14, color: '#667eea', marginBottom: 2 }}>先行ユーザー価格</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                          ¥{plan.annual.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/年</span>
                        </div>
                        <div style={{ fontSize: 14, color: C.muted, marginBottom: 2 }}>通常 ¥{(plan.annual * 2).toLocaleString()}</div>
                        <div style={{ fontSize: 14, color: '#1a6fd4', marginBottom: 8 }}>※2ヶ月分無料</div>
                        <button
                          onClick={() => handleCheckout(analysisPrices.annual[plan.sessions])}
                          style={{ 
                            width: "100%", 
                            background: C.A, 
                            border: "none", 
                            borderRadius: 4, 
                            color: "#fff", 
                            cursor: "pointer", 
                            fontFamily: "'Space Mono', monospace", 
                            fontSize: 14, 
                            fontWeight: 700, 
                            padding: "12px 8px" 
                          }}
                        >
                          このプランにする
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 伴走プラン */}
            {showGrowth && (
              <div>
                <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
                  伴走しながらサイトを改善していくためのプランです。
                  経営者さんが直接使う場合もこちらをお勧めします。<br/><br/>
                  <span style={{ color: C.A, fontWeight: 600 }}>✓ AIチャット相談が使えます</span>
                </div>
                
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
                {growthPlanDetails.map((plan, i) => (
                  <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                      月{plan.sessions}サイトプラン
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>月額契約</div>
                        <div style={{ fontSize: 14, color: '#667eea', marginBottom: 2 }}>先行ユーザー価格</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                          ¥{plan.monthly.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/月</span>
                        </div>
                        <div style={{ fontSize: 14, color: C.muted, marginBottom: 2 }}>通常 ¥{(plan.monthly * 2).toLocaleString()}</div>
                        <div style={{ height: 18, marginBottom: 8 }}></div>
                        <button
                          onClick={() => handleCheckout(growthPrices.monthly[plan.sessions])}
                          style={{ 
                            width: "100%", 
                            background: C.ink, 
                            border: "none", 
                            borderRadius: 4, 
                            color: "#fff", 
                            cursor: "pointer", 
                            fontFamily: "'Space Mono', monospace", 
                            fontSize: 14, 
                            fontWeight: 700, 
                            padding: "12px 8px" 
                          }}
                        >
                          このプランにする
                        </button>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>年額契約</div>
                        <div style={{ fontSize: 14, color: '#667eea', marginBottom: 2 }}>先行ユーザー価格</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                          ¥{plan.annual.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/年</span>
                        </div>
                        <div style={{ fontSize: 14, color: C.muted, marginBottom: 2 }}>通常 ¥{(plan.annual * 2).toLocaleString()}</div>
                        <div style={{ fontSize: 14, color: '#1a6fd4', marginBottom: 8 }}>※2ヶ月分無料</div>
                        <button
                          onClick={() => handleCheckout(growthPrices.annual[plan.sessions])}
                          style={{ 
                            width: "100%", 
                            background: C.A, 
                            border: "none", 
                            borderRadius: 4, 
                            color: "#fff", 
                            cursor: "pointer", 
                            fontFamily: "'Space Mono', monospace", 
                            fontSize: 14, 
                            fontWeight: 700, 
                            padding: "12px 8px" 
                          }}
                        >
                          このプランにする
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 注釈 */}
            <div style={{ marginTop: 20, padding: "16px 20px", background: C.highlight, borderRadius: 6, fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
              ※ 全て税込価格です。月額契約は毎月自動更新、年額契約は年1回の支払いです。<br/>
              ※ 100サイト以上のプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
