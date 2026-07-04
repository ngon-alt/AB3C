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

  const planKindLabel = (t) => t === 'support' ? '戦略指南サブスク' : t === 'analysis' ? '戦略診断チケット' : '';

  const handleCheckout = async (priceId) => {
    const buyingType = resolvePlanType(priceId);
    // 既に何らかの契約がある場合、現在の契約内容と購入後の挙動を明示して確認
    if (buyingType && activePlans.length > 0) {
      const existing = activePlans.map(p => p.planLabel).join('・');
      const buyingLabel = planKindLabel(buyingType);
      const hasSupport = activePlans.some(p => p.planType === 'support');
      const hasAnalysis = activePlans.some(p => p.planType === 'analysis');
      const lines = [
        `現在のご契約: ${existing}`,
        '',
        `追加で${buyingLabel}をご契約されますか？`,
      ];
      if (buyingType === 'analysis') {
        if (hasAnalysis) {
          lines.push('', '※既存の戦略診断チケットの残り回数と今回の購入分は合算されます。');
        }
        if (hasSupport) {
          lines.push('', '※戦略指南サブスクは引き続きご利用いただけます。ご契約後は、ヘッダーのプラン切り替えメニューで戦略指南サブスクと戦略診断チケットを切り替えながらご利用いただけます。');
        }
      } else {
        // 支援プラン（指南）購入
        if (hasSupport) {
          lines.push('', '※既存の戦略指南サブスクは新しいご契約に差し替わり、自動キャンセルされます。サイト数が減る場合は古いサイトから自動的に削除されます。');
        }
        if (hasAnalysis) {
          lines.push('', '※戦略診断チケットは引き続きご利用いただけます。ご契約後は、ヘッダーのプラン切り替えメニューで新しい戦略指南サブスクと戦略診断チケットを切り替えながらご利用いただけます。');
        }
      }
      const ok = confirm(lines.join('\n'));
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

  // 機能比較表のデータ
  // 無料お試し: 戦略指南サブスクのフル機能を24時間限定で利用可能
  const featureRows = [
    {
      feature: "AB3C分析レポート",
      description: "あなたのビジネスが「選ばれる理由」をベネフィット（B）・アドバンテージ（A）・3C（顧客／競合／自社）の戦略フレームワークで可視化。",
      free: "○（24時間）", analysis: "○", growth: "○",
    },
    {
      feature: "ウェブサイト改善レポート",
      description: "URL分析時、現在のサイトをAB3C分析と照らし合わせて、コンテンツ・デザイン・構造の改善優先事項を提示。",
      free: "○（24時間）", analysis: "○", growth: "○",
    },
    {
      feature: "シェアURL・PDF・印刷",
      description: "分析結果を共有用URL発行・PDF保存・印刷出力で社内共有や提案資料として持ち帰り可能。",
      free: "○（24時間）", analysis: "○", growth: "○",
    },
    {
      feature: "戦略策定チャット（戦略を磨く）",
      description: "AB3C分析結果をAIと対話しながら反復的に磨き上げ。深掘り質問→再分析で戦略の精度を高めます。",
      free: "○（24時間）", analysis: "✕", growth: "○（月100回/サイト）",
    },
    {
      feature: "戦略確定・履歴保存",
      description: "確定した戦略と全チャット履歴をデータベースに保存。後日いつでも続きから利用可能。",
      free: "○（24時間）", analysis: "✕", growth: "○",
    },
    {
      feature: "AI秘書",
      description: "あなたの事業戦略を熟知した万能AIアシスタント。文章作成・アイデア出し・経営判断の壁打ちなど日々の業務相談に。ChatGPT・Claudeの代わりに一本化してご利用いただけます。",
      free: "○（24時間）", analysis: "✕", growth: "○",
    },
    {
      feature: "アクション施策チャット（10テーマ）",
      description: "戦略を踏まえた施策をテーマ別チャットで検討。SEO対策／SNS運用／Web広告／Googleマップ／チラシ・DM／プレスリリース／ウェブサイト改善／採用コンテンツ企画／補助金申請／営業資料・提案書。",
      free: "○（24時間）", analysis: "✕", growth: "○",
    },
    {
      feature: "サイト登録可能数",
      description: "管理できるサイト（事業）の数。一度登録したサイトは継続的に分析・管理でき、不要になれば削除して枠を空けられます。",
      free: "1サイト", analysis: "契約サイト数まで", growth: "契約サイト数まで",
    },
    {
      feature: "契約期間",
      description: "ご利用いただける期間。診断チケットは1年内に使い切り、戦略指南サブスクは月額または年額の継続契約。",
      free: "24時間", analysis: "購入後1年間", growth: "月額 / 年額",
    },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>

        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 8 }}>料金とプラン</div>
        <div style={{ fontSize: 15, color: C.muted, marginBottom: 32, lineHeight: 1.7 }}>
          ご利用シーンに合わせて、2つのプランからお選びいただけます。
        </div>

        {/* === セクション1: 2プランの概要 === */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          {/* 戦略診断チケット 概要カード */}
          <div style={{ background: "#e3f2fd", borderRadius: 10, padding: 24, border: `2px solid ${C.A}`, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
              戦略診断チケット
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>ワンショット利用 / 有効期限1年</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: C.A, marginBottom: 14, lineHeight: 1.2 }}>
              <span style={{ fontSize: 26 }}>¥22,000</span>
              <span style={{ fontSize: 16, fontWeight: 400, color: C.ink, marginLeft: 4 }}>〜（¥7,700〜/サイト・税込）</span>
            </div>
            <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, flex: 1 }}>
              URLから1発でAB3C分析＋ウェブサイト改善レポートを生成し、<strong>PDF・印刷・シェアURL</strong>で持ち帰るプラン。
              <br /><br />
              <span style={{ color: C.muted, fontSize: 13 }}>
                見込み客への新規提案や、「まず1回試したい」方向け。AIチャット・履歴保存は付きません。
              </span>
            </div>
            <a href="#analysis-prices" style={{ display: "block", marginTop: 16, padding: "12px", background: C.A, color: "#fff", textAlign: "center", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              料金プランを見る ↓
            </a>
          </div>

          {/* 戦略指南サブスク 概要カード */}
          <div style={{ background: "#fce4ec", borderRadius: 10, padding: 24, border: `2px solid ${C.B}`, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
              戦略指南サブスク
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>継続支援 / 月額または年額</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: C.B, marginBottom: 14, lineHeight: 1.2 }}>
              <span style={{ fontSize: 26 }}>¥66,000</span>
              <span style={{ fontSize: 16, fontWeight: 400, color: C.ink, marginLeft: 4 }}>〜/月（¥9,167〜/月/サイト・税込）</span>
            </div>
            <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, flex: 1 }}>
              <strong>戦略診断 → 戦略策定 → アクション実行</strong>の3段階を継続的に支援。AIチャットで戦略を磨き、10テーマで施策を検討、AI秘書が日常業務も伴走。
              <br /><br />
              <span style={{ color: C.muted, fontSize: 13 }}>
                経営者さんが直接使う方や、継続的な戦略運用が必要な代理店向け。
              </span>
            </div>
            <a href="#support-prices" style={{ display: "block", marginTop: 16, padding: "12px", background: C.B, color: "#fff", textAlign: "center", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              料金プランを見る ↓
            </a>
          </div>
        </div>

        {/* === セクション2: 機能比較表 === */}
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 16 }}>機能比較</div>
        <div style={{ marginBottom: 40, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
            <thead>
              <tr style={{ background: C.ink, color: "#fff" }}>
                <th style={{ padding: "16px 12px", textAlign: "left", width: "44%", verticalAlign: "top" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>機能</div>
                </th>
                <th style={{ padding: "16px 8px", textAlign: "center", verticalAlign: "top", width: "14%", background: "#555555" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>無料お試し</div>
                  <div style={{ fontSize: 11, color: "#ddd" }}>24時間限定 ¥0</div>
                </th>
                <th style={{ padding: "16px 8px", textAlign: "center", verticalAlign: "top", width: "20%", background: "#0a4a8a" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>戦略診断チケット</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#cce4ff" }}>¥22,000〜（¥7,700〜/サイト）</div>
                </th>
                <th style={{ padding: "16px 8px", textAlign: "center", verticalAlign: "top", width: "22%", background: "#7a0c1e" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>戦略指南サブスク</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#ffcccc" }}>¥66,000〜/月（¥9,167〜/月/サイト）</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#faf8f3" : "#fff", borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px", color: "#000", verticalAlign: "top" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{row.feature}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{row.description}</div>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#000", fontSize: 13, verticalAlign: "middle" }}>{row.free}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#000", fontSize: 13, verticalAlign: "middle" }}>{row.analysis}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#000", fontSize: 13, fontWeight: 700, verticalAlign: "middle" }}>{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無料お試しについての注釈 */}
          <div style={{
            marginTop: 12,
            padding: "12px 16px",
            background: "#fffbe8",
            border: `1px solid #f0d97a`,
            borderRadius: 6,
            fontSize: 13,
            color: C.ink,
            lineHeight: 1.7,
          }}>
            <strong>🎁 無料お試しについて</strong>: 分析開始から<strong>24時間</strong>、戦略指南サブスクのすべての機能をテストいただけます。お試しいただけるのは<strong>お一人さま1回のみ</strong>です。
          </div>
        </div>

        {/* === セクション3: 料金詳細と購入ボタン === */}
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>

        {/* ── 戦略診断チケット セクション ── */}
        <section id="analysis-prices" style={{ background: "#e3f2fd", borderRadius: 8, padding: "24px", marginBottom: 28, scrollMarginTop: 80 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            戦略診断チケット <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>（有効期限1年）</span>
          </div>
          <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
            見込み客への新規提案にお使いいただくプランです。
            AB3C分析＋ウェブサイト改善レポートを書き出して、PDF・印刷・シェアURLで持ち帰ることができます。<br/><br/>
            <strong style={{ color: C.ink }}>📅 有効期限：購入から1年間</strong><br/>
            購入したサイト数分の診断を1年以内に使い切ってください。期限を過ぎた未使用分は失効します。<br/><br/>
            <strong style={{ color: C.red }}>⚠️ 診断結果は履歴保存されません</strong><br/>
            ブラウザを閉じると結果は消えるため、必ず<strong>PDF保存・シェアURL発行・印刷</strong>のいずれかで持ち帰ってください。<br/><br/>
            <span style={{ color: C.muted, fontWeight: 600 }}>※AIチャットや戦略アクション機能、診断結果の履歴保存は戦略指南サブスクで利用可能です</span>
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
          {analysisPlanDetails.map((plan, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>{plan.sites}サイトプラン</div>
                <div style={{ fontSize: 14, color: C.muted, fontFamily: "'Space Mono', monospace" }}>¥{perSite(plan.annual, plan.sites).toLocaleString()}/サイト</div>
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                ¥{plan.annual.toLocaleString()}
                <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>（税込・有効期限1年）</span>
              </div>
              <CheckoutButton label={`この${plan.sites}サイトプランにする →`} onClick={() => handleCheckout(analysisPrices[plan.sites])} bg={C.A} />
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff", borderRadius: 6, fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
            ※ 全て税込価格です。<br/>
            ※ 戦略診断チケットは購入から1年以内に使い切ってください。期限を過ぎた未使用分は失効します。<br/>
            ※ 戦略診断チケットは履歴保存されません。診断結果はPDF・シェアURL・印刷で必ず持ち帰ってください。<br/>
            ※ 100サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
          </div>
        </section>

        {/* ── 戦略指南サブスク セクション ── */}
        <section id="support-prices" style={{ background: "#fce4ec", borderRadius: 8, padding: "24px", marginBottom: 28, scrollMarginTop: 80 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            戦略指南サブスク <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>（戦略診断・策定・アクション・月額/年額）</span>
          </div>
          <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
            <strong>戦略診断・策定・アクション</strong>の3段階すべてを継続的に支援する戦略指南サブスクです。
            経営者さんが直接使う場合もこちらをお勧めします。<br/><br/>
            <span style={{ color: C.A, fontWeight: 600 }}>✓ 戦略診断・チャットで戦略を磨く・戦略アクション実行支援</span><br/>
            <span style={{ color: C.A, fontWeight: 600 }}>✓ AIチャット相談が使えます（1サイトあたり月100回）</span><br/>
            <span style={{ color: C.A, fontWeight: 600 }}>✓ 年額契約＝月額×10（2ヶ月分無料）</span>
          </div>

          {/* デジ革会員特典の告知 */}
          <div style={{ background: "#fff", border: `2px solid ${C.A}`, borderRadius: 8, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🎟️</div>
            <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}>
              <strong style={{ color: C.A, fontSize: 15 }}>デジ革（一般社団法人デジタル経営革新協会）会員特典</strong><br/>
              戦略指南サブスクを<strong>月額契約 ¥10,000オフ ／ 年額契約 ¥100,000オフ</strong>でご利用いただけます。
              会員向けに別途お知らせしているプロモーションコードを、チェックアウト画面でご入力ください。
            </div>
          </div>

          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>料金一覧</div>
          {supportPlanDetails.map((plan, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: C.ink }}>{plan.sites}サイトプラン</div>
                <div style={{ fontSize: 14, color: C.muted, fontFamily: "'Space Mono', monospace" }}>¥{perSite(plan.annual / 12, plan.sites).toLocaleString()}/サイト/月（年額時）</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>月額契約</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                    ¥{plan.monthly.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/月</span>
                  </div>
                  <CheckoutButton label="月額で始める →" onClick={() => handleCheckout(supportPricesMonthly[plan.sites])} bg={C.ink} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.muted }}>年額契約</span>
                    <span style={{ fontSize: 12, color: '#1a6fd4', fontWeight: 700 }}>2ヶ月分が無料に！</span>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                    ¥{plan.annual.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/年</span>
                  </div>
                  <CheckoutButton label="年額で始める →" onClick={() => handleCheckout(supportPricesAnnual[plan.sites])} bg={C.A} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff", borderRadius: 6, fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
            ※ 全て税込価格です。<br/>
            ※ 戦略指南サブスクの年額契約は月額×10（2ヶ月分無料）です。<br/>
            ※ チャット上限：1サイトあたり月100回<br/>
            ※ 120サイトを超えるプランをご希望の場合は<a href="/contact" style={{ color: C.A, textDecoration: "underline" }}>お問い合わせ</a>ください。
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
