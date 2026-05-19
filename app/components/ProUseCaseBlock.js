"use client";

// 伴走支援者（Web制作者・コンサルタント）向けのユースケース展示
// 「あなたのクライアント獲得・単価UPの武器になる」というメッセージ
//
// 思想：戦略指南サブスク15サイト（¥330,000/月）の価値を、
// 「1社あたり ¥22,000/月で戦略コンサル相当の品質を提供できる」と翻訳して見せる。

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14",
  ink: "#1a1a14", muted: "#78716c",
  surface: "#ffffff", border: "#ddd8cc",
  bg: "#f8f7f3", highlight: "#fef3c7",
  proAccent: "#1a6fd4",
};

const HEADING_FONT = "'Noto Serif JP', serif";
const BODY_FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

export default function ProUseCaseBlock() {
  return (
    <section
      aria-label="制作者・コンサルタントの活用例"
      style={{
        background: "#fff",
        border: `2px solid ${C.proAccent}`,
        borderRadius: 10,
        padding: "0",
        margin: "32px 0",
        overflow: "hidden",
      }}
    >
      {/* ヘッダー */}
      <div style={{ background: C.proAccent, padding: "16px 28px" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.12em",
            marginBottom: 4,
            fontFamily: BODY_FONT,
          }}
        >
          FOR PROFESSIONALS — 制作者・コンサルタントの方へ
        </div>
        <div
          style={{
            fontFamily: HEADING_FONT,
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.4,
          }}
        >
          あなたのクライアント提案の質と単価を、AB3Cが押し上げます
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {/* 価値訴求の3要点 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 22 }}>
          {[
            {
              icon: "🎯",
              title: "提案の入口に",
              desc: "クライアントの URL を入れるだけで、AB3C 戦略レポートが完成。曖昧な「なんとなく良いサイト」から、戦略根拠のある提案へ。",
            },
            {
              icon: "📑",
              title: "提案書がそのまま完成",
              desc: "AB3C分析を PowerPoint / PDF の提案書フォーマットで書き出し。表紙＝戦略メッセージ、4章構成。クライアントへの納品物として即使えます。",
            },
            {
              icon: "🤝",
              title: "受注前と受注後、両方で",
              desc: "受注前は「戦略診断」として提案ツールに。受注後はサブスクで毎月戦略を磨きながら、ウェブ改善・採用・補助金まで一気通貫で支援。",
            },
          ].map(function (item, i) {
            return (
              <div
                key={i}
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6, lineHeight: 1.5 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, fontFamily: BODY_FONT }}>{item.desc}</div>
              </div>
            );
          })}
        </div>

        {/* 単価試算 */}
        <div
          style={{
            background: C.highlight,
            borderRadius: 8,
            padding: "18px 22px",
            marginBottom: 22,
            fontFamily: BODY_FONT,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
            💰 試算：戦略指南サブスク 15サイトプラン
          </div>
          <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.85 }}>
            月額 <b>¥330,000</b>（年額契約で2ヶ月分無料）÷ <b>15社</b> = <b>1社あたり ¥22,000 / 月</b>。
            このコストで、戦略コンサル相当の AB3C 分析・改善レポート・10テーマの施策チャット・AI秘書まで使えます。
            <br />
            これをクライアントへ「戦略診断＋月次伴走」として <b>月額3〜10万円</b> で提供すれば、純利益として上乗せできます。
          </div>
        </div>

        {/* 3ビジネスモデル */}
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 10, fontFamily: BODY_FONT }}>
          3つの代表的な活用パターン
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              title: "戦略診断・提案型",
              price: "3〜5万円 / 件",
              desc: "Web制作の受注前に AB3C 戦略診断レポートを提案書として活用。競合との違いを言語化した提案で、受注率と単価を高める。",
            },
            {
              title: "月次サポート型",
              price: "月20〜30万円",
              desc: "毎月戦略を更新し、AI チャットでクライアントの経営相談に対応。制作後の運用フェーズを継続契約化。",
            },
            {
              title: "複数クライアント管理型",
              price: "月100〜300万円",
              desc: "複数の中小企業クライアントをまとめて管理。戦略指南サブスクの15サイトプランで15社を同時にサポート。",
            },
          ].map(function (model, i) {
            return (
              <div
                key={i}
                style={{ background: "#f8f8f8", border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: BODY_FONT }}>{model.title}</div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.proAccent,
                      background: "#e8f0fe",
                      padding: "3px 10px",
                      borderRadius: 4,
                      fontFamily: "'Space Mono', monospace",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {model.price}
                  </div>
                </div>
                <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.75, fontFamily: BODY_FONT }}>{model.desc}</div>
              </div>
            );
          })}
        </div>

        {/* 関連ガイド */}
        <div style={{ marginTop: 22, fontSize: 14, color: C.muted, fontFamily: BODY_FONT, lineHeight: 1.7 }}>
          より詳しい使い方は <a href="/howto#for-professionals" style={{ color: C.A, textDecoration: "underline", fontWeight: 600 }}>使い方ガイドの「Web制作者・コンサルタント向け」</a> をご覧ください。
        </div>
      </div>
    </section>
  );
}
