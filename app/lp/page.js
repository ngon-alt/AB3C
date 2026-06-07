"use client";
import { useSession, signIn } from "next-auth/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CreatorProfileBlock from "../components/CreatorProfileBlock";

// ============================================================
// 戦略指南AI — コンサルタント・Web制作会社向け LP
// URL: /lp
// CTA: 無料トライアル（1サイト無料診断）
// ============================================================

const C = {
  // AB3C フレームワーク専用カラー（Benefit・Advantage・3C 以外の用途に使わない）
  ab3cB: "#FF0000",   // Benefit = 赤
  ab3cA: "#1a6fd4",   // Advantage = 青
  // UI カラー
  ink: "#1a1a14",
  muted: "#78716c",
  bg: "#f5f2eb",
  surface: "#ffffff",
  border: "#ddd8cc",
  highlight: "#fef3c7",
  altBg: "#f0ebe0",
  accent: "#2a2a26",
};

const HEADING_FONT = "'Noto Serif JP', serif";
const BODY_FONT =
  "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

// ============================================================
// 共通コンポーネント
// ============================================================

function CtaButton({ label = "無料で1サイト診断してみる", size = "md" }) {
  const { data: session } = useSession();

  const handleClick = () => {
    if (session) {
      window.location.href = "/";
    } else {
      signIn("google", { callbackUrl: "/" });
    }
  };

  const fontSize = size === "lg" ? 20 : 18;
  const padding = size === "lg" ? "18px 44px" : "14px 28px";

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: C.accent,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding,
        fontSize,
        fontWeight: 700,
        fontFamily: BODY_FONT,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(0,0,0,0.26)",
        transition: "transform 0.15s, box-shadow 0.15s",
        letterSpacing: "0.01em",
        lineHeight: 1.5,
        display: "inline-block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.34)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.26)";
      }}
    >
      {label}
    </button>
  );
}

function SectionHeading({ children, center = false }) {
  return (
    <h2
      style={{
        fontFamily: HEADING_FONT,
        fontSize: 28,
        fontWeight: 700,
        color: C.ink,
        lineHeight: 1.5,
        margin: "0 0 16px",
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </h2>
  );
}

// ============================================================
// セクション 1: ヒーロー
// ============================================================
function HeroSection() {
  return (
    <section
      style={{
        background: C.accent,
        color: "#fff",
        padding: "80px 20px 72px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* ターゲットラベル */}
        <div
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#c8c2b8",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            padding: "6px 18px",
            borderRadius: 3,
            marginBottom: 24,
            fontFamily: BODY_FONT,
          }}
        >
          コンサルタント・Web制作会社向け
        </div>

        {/* メインコピー */}
        <h1
          style={{
            fontFamily: HEADING_FONT,
            fontSize: 38,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.5,
            margin: "0 0 24px",
            letterSpacing: "0.02em",
          }}
        >
          クライアントの「選ばれる理由」を、<br />
          30分で言語化する。
        </h1>

        {/* サブコピー */}
        <p
          style={{
            fontSize: 18,
            color: "#c0bab0",
            lineHeight: 1.9,
            margin: "0 0 40px",
            fontFamily: BODY_FONT,
          }}
        >
          AB3Cフレームワーク × AI で、戦略診断から実行計画まで一気通貫。<br />
          1サイト¥7,700から、複数クライアントを継続的に支援できます。
        </p>

        {/* CTA */}
        <CtaButton label="無料で1サイト診断してみる" size="lg" />
        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            color: "#787068",
            fontFamily: BODY_FONT,
          }}
        >
          Googleアカウントで即日スタート · クレジットカード不要
        </div>
      </div>
    </section>
  );
}

// ============================================================
// セクション 2: 課題提起
// ============================================================
function PainSection() {
  const pains = [
    {
      title: "手作業の分析は、半日かかる",
      desc:
        "競合調査・顧客ニーズ整理・差別化まとめ… 1クライアント分の戦略素材を作るだけで、まる半日が消える。クライアント数が増えるほど、工数だけが膨らんでいく。",
    },
    {
      title: "汎用AIに頼っても、一般論しか返ってこない",
      desc:
        "「差別化を教えて」と聞いても、どの会社にも当てはまる答えしか出てこない。それは提案書には使えない。フレームワークなき生成AIは、戦略を語れない。",
    },
    {
      title: "「選ばれる理由」の言語化で、クライアントが詰まる",
      desc:
        "「うちの強みは何ですか？」と聞いても、経営者はうまく答えられない。この問いを引き出す仕組みを持っていない支援者が多い。",
    },
    {
      title: "提案のたびに、資料を一から組み直す",
      desc:
        "分析から提案書まで毎回ゼロから組み立てている。同じ工数をかけ続けているのに、事業として拡張できない構造になっている。",
    },
  ];

  return (
    <section style={{ background: C.bg, padding: "72px 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionHeading center>こんな課題、感じていませんか？</SectionHeading>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 16,
          }}
        >
          {pains.map((p, i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.ink}`,
                borderRadius: 8,
                padding: "22px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.ink,
                  marginBottom: 10,
                  lineHeight: 1.5,
                  fontFamily: BODY_FONT,
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: C.muted,
                  lineHeight: 1.8,
                  fontFamily: BODY_FONT,
                }}
              >
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// セクション 3: 3ステップ
// ============================================================
function StepsSection() {
  const steps = [
    {
      num: "①",
      title: "URL入力 → AB3C診断",
      desc:
        "クライアントのサイトURLを入力するだけ。競合・顧客・自社の3C分析、ベネフィット・差別化要因の分析が自動生成されます。URLなしでテキスト入力にも対応。Webサイト改善レポートも同時出力。",
    },
    {
      num: "②",
      title: "AIチャットで戦略を磨く",
      desc:
        "診断結果をベースに、AIとの対話で戦略を深掘りします。弱い箇所を指摘し、「選ばれる理由」を言語化するまで一緒に考えます。戦略メッセージを確定したら、次のフェーズへ進みます。",
    },
    {
      num: "③",
      title: "テーマ別に施策を立案・管理",
      desc:
        "確定した戦略を軸に、集客・広告・採用コンテンツ・補助金申請・Webサイト改善など10テーマで施策を立案。アクションリストとして管理・記録できます。",
    },
  ];

  return (
    <section
      style={{
        background: C.altBg,
        padding: "72px 20px",
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <SectionHeading center>3ステップで、診断から実行まで</SectionHeading>
        </div>
        <p
          style={{
            fontSize: 18,
            color: C.muted,
            textAlign: "center",
            marginBottom: 48,
            fontFamily: BODY_FONT,
          }}
        >
          URLを入力するだけで、すべての分析がはじまります。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "26px 24px",
              }}
            >
              {/* ステップ番号 */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: C.accent,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 18,
                  fontFamily: BODY_FONT,
                  flexShrink: 0,
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.ink,
                  marginBottom: 12,
                  lineHeight: 1.4,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: C.ink,
                  lineHeight: 1.8,
                  fontFamily: BODY_FONT,
                }}
              >
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// セクション 4: 伴走支援者向けの特長
// ============================================================
function FeaturesSection() {
  const features = [
    {
      title: "複数サイトを一括管理",
      desc:
        "クライアントごとのサイトを登録・管理。戦略確定履歴・チャット履歴をサイト単位で蓄積し、継続的な伴走支援を実現します。",
    },
    {
      title: "提案書に使えるPPT / PDF出力",
      desc:
        "分析結果はPowerPoint形式・PDF形式でエクスポート可能。そのまま提案書に添付できる品質で出力されます。",
    },
    {
      title: "1サイト¥7,700から",
      desc:
        "100サイトチケットなら1サイトあたり¥7,700。採算の合う原価設計で、伴走支援サービスへの組み込みが可能です。",
    },
    {
      title: "AI秘書で価値観・原体験を深掘り",
      desc:
        "経営者が言語化できていない価値観・原体験を、AIとの対話で引き出します。「選ばれる理由」の核を見つけるプロセスをAIが支援します。",
    },
    {
      title: "AB3Cチェックポイント機能",
      desc:
        "分析結果の整合性を5項目で自動チェック。弱点の所在が一目でわかり、「どこを改善すべきか」の根拠を持って提案できます。",
    },
    {
      title: "「戦略」「採用」「補助金」まで一気通貫",
      desc:
        "診断で終わらず、採用コンテンツ企画・小規模事業者持続化補助金の計画書ベース作成まで、1ツールで対応できます。",
    },
  ];

  return (
    <section style={{ background: C.bg, padding: "72px 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionHeading center>伴走支援者向けの特長</SectionHeading>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "22px 22px",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.ink,
                  marginBottom: 10,
                  lineHeight: 1.4,
                  fontFamily: BODY_FONT,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: C.ink,
                  lineHeight: 1.8,
                  fontFamily: BODY_FONT,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// セクション 5: AB3Cとは
// ============================================================
function Ab3cSection() {
  return (
    <section
      style={{
        background: C.accent,
        padding: "72px 20px",
        borderTop: "1px solid #111108",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* 見出し */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: HEADING_FONT,
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.5,
              margin: "0 0 14px",
            }}
          >
            AB3Cフレームワークとは
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "#b8b2a8",
              lineHeight: 1.9,
              fontFamily: BODY_FONT,
              margin: 0,
            }}
          >
            ウェブ業界歴24年の権成俊が考案した、<br />
            「選ばれる理由」を明らかにするための事業戦略フレームワーク。
          </p>
        </div>

        {/* B・A・3C の図解 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 40,
          }}
        >
          {/* B — Benefit */}
          <div
            style={{
              background: "rgba(0,0,0,0.35)",
              border: `2px solid ${C.ab3cB}`,
              borderRadius: 10,
              padding: "22px 28px",
              textAlign: "center",
              minWidth: 180,
              flex: "1 1 180px",
              maxWidth: 260,
            }}
          >
            <div
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 40,
                fontWeight: 700,
                color: C.ab3cB,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              B
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
                fontFamily: BODY_FONT,
              }}
            >
              Benefit
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#b8b2a8",
                lineHeight: 1.7,
                fontFamily: BODY_FONT,
              }}
            >
              お客様が求める価値<br />（ニーズ → ウォンツ）
            </div>
          </div>

          {/* A — Advantage */}
          <div
            style={{
              background: "rgba(0,0,0,0.35)",
              border: `2px solid ${C.ab3cA}`,
              borderRadius: 10,
              padding: "22px 28px",
              textAlign: "center",
              minWidth: 180,
              flex: "1 1 180px",
              maxWidth: 260,
            }}
          >
            <div
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 40,
                fontWeight: 700,
                color: C.ab3cA,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              A
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
                fontFamily: BODY_FONT,
              }}
            >
              Advantage
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#b8b2a8",
                lineHeight: 1.7,
                fontFamily: BODY_FONT,
              }}
            >
              差別的優位点<br />（なぜ選ばれるのか）
            </div>
          </div>

          {/* 3C */}
          <div
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "2px solid #e0dbd0",
              borderRadius: 10,
              padding: "22px 28px",
              textAlign: "center",
              minWidth: 180,
              flex: "1 1 180px",
              maxWidth: 260,
            }}
          >
            <div
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 40,
                fontWeight: 700,
                color: "#e8e3d8",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              3C
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
                fontFamily: BODY_FONT,
              }}
            >
              Customer · Competitor · Company
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#b8b2a8",
                lineHeight: 1.7,
                fontFamily: BODY_FONT,
              }}
            >
              顧客 · 競合 · 自社<br />（分析の3軸）
            </div>
          </div>
        </div>

        {/* 解説 */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 8,
            padding: "24px 28px",
            fontSize: 18,
            color: "#c0bab0",
            lineHeight: 1.9,
            fontFamily: BODY_FONT,
            textAlign: "center",
          }}
        >
          「BenefitとAdvantageが整合している状態」こそ、戦略が成立している証拠です。<br />
          戦略指南AIは、この整合性をAIがチェックし、弱点と改善提案を提示します。
        </div>
      </div>
    </section>
  );
}

// ============================================================
// セクション 6: 料金
// ============================================================
function PricingSection() {
  return (
    <section style={{ background: C.bg, padding: "72px 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <SectionHeading center>料金プラン</SectionHeading>
        </div>
        <p
          style={{
            fontSize: 18,
            color: C.muted,
            textAlign: "center",
            marginBottom: 48,
            fontFamily: BODY_FONT,
          }}
        >
          まず1サイト、無料でお試しいただけます。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 20,
            marginBottom: 16,
          }}
        >
          {/* 戦略診断チケット */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "28px 28px",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.muted,
                letterSpacing: "0.08em",
                marginBottom: 8,
                fontFamily: BODY_FONT,
              }}
            >
              単発利用向け
            </div>
            <div
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 24,
                fontWeight: 700,
                color: C.ink,
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              戦略診断チケット
            </div>
            <div
              style={{
                fontSize: 18,
                color: C.ink,
                lineHeight: 1.8,
                marginBottom: 20,
                fontFamily: BODY_FONT,
              }}
            >
              URLを入力 → AB3C診断 + サイト改善レポートをワンショットで出力。PDF保存・シェアURLで提案書に組み込めます。
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16,
              }}
            >
              {[
                { label: "1サイト", price: "¥22,000", unit: "/ 年" },
                { label: "10サイト", price: "¥110,000", unit: "/ 年（1サイト ¥11,000）" },
                { label: "100サイト", price: "¥770,000", unit: "/ 年（1サイト ¥7,700）" },
              ].map((r, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "10px 0",
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      color: C.ink,
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: C.ink,
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {r.price}{" "}
                    <span style={{ fontSize: 16, fontWeight: 400, color: C.muted }}>
                      {r.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 16,
                color: C.muted,
                fontFamily: BODY_FONT,
                lineHeight: 1.6,
              }}
            >
              チャット機能なし。診断結果はPDF・シェアURLで持ち帰る前提。有効期限1年。
            </div>
          </div>

          {/* 戦略指南サブスク */}
          <div
            style={{
              background: C.accent,
              border: `2px solid ${C.accent}`,
              borderRadius: 10,
              padding: "28px 28px",
              color: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#908880",
                letterSpacing: "0.08em",
                marginBottom: 8,
                fontFamily: BODY_FONT,
              }}
            >
              継続支援向け
            </div>
            <div
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              戦略指南サブスク
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#c0bab0",
                lineHeight: 1.8,
                marginBottom: 20,
                fontFamily: BODY_FONT,
              }}
            >
              診断機能に加えて、AIチャットで戦略を磨く「策定」と、施策テーマ別に実行する「アクション」フェーズまで使えます。
            </div>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.15)",
                paddingTop: 16,
              }}
            >
              {[
                { label: "1サイト", price: "¥66,000", unit: "/ 月" },
                { label: "5サイト", price: "¥165,000", unit: "/ 月" },
                { label: "15サイト", price: "¥330,000", unit: "/ 月（正会員プラン）" },
              ].map((r, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "10px 0",
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "none",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      color: "#d0cac0",
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {r.price}{" "}
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 400,
                        color: "#908880",
                      }}
                    >
                      {r.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="/pricing"
              style={{
                display: "block",
                textAlign: "center",
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "#e8e3d8",
                borderRadius: 6,
                padding: "12px",
                marginTop: 18,
                fontSize: 18,
                textDecoration: "none",
                fontFamily: BODY_FONT,
                fontWeight: 600,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
              }
            >
              全プランの詳細を見る →
            </a>
          </div>
        </div>

        <p
          style={{
            fontSize: 16,
            color: C.muted,
            textAlign: "center",
            fontFamily: BODY_FONT,
            margin: 0,
          }}
        >
          すべて税込。キャンペーン価格を含む詳細は{" "}
          <a
            href="/pricing"
            style={{ color: C.ink, fontWeight: 600, textDecoration: "underline" }}
          >
            料金ページ
          </a>
          をご確認ください。
        </p>
      </div>
    </section>
  );
}

// ============================================================
// セクション 7: 制作者プロフィール
// ============================================================
function CreatorSection() {
  return (
    <section
      style={{
        background: C.altBg,
        padding: "72px 20px",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <SectionHeading center>なぜ「汎用AIとは違う」のか</SectionHeading>
          <p
            style={{
              fontSize: 18,
              color: C.muted,
              lineHeight: 1.85,
              fontFamily: BODY_FONT,
              margin: 0,
            }}
          >
            戦略指南AIは、汎用AIにAB3Cプロンプトを書かせたものではありません。<br />
            権成俊が24年間磨いてきた戦略策定の実フローをそのまま再現しています。
          </p>
        </div>
        <CreatorProfileBlock />
      </div>
    </section>
  );
}

// ============================================================
// セクション 8: 締め CTA
// ============================================================
function ClosingCtaSection() {
  return (
    <section
      style={{
        background: C.accent,
        color: "#fff",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: HEADING_FONT,
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 16,
            lineHeight: 1.55,
          }}
        >
          まず1サイト、無料で試してください。
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "#c0bab0",
            lineHeight: 1.9,
            marginBottom: 36,
            fontFamily: BODY_FONT,
          }}
        >
          Googleアカウントでログインするだけで、すぐに使えます。<br />
          クレジットカードの登録も不要です。
        </p>
        <CtaButton label="無料で1サイト診断してみる" size="lg" />
        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            color: "#787068",
            fontFamily: BODY_FONT,
          }}
        >
          ご不明点は{" "}
          <a
            href="/contact"
            style={{ color: "#a09890", textDecoration: "underline" }}
          >
            お問い合わせ
          </a>{" "}
          から
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ページ本体
// ============================================================
export default function LpPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: BODY_FONT }}>
      <Header />
      <main>
        <HeroSection />
        <PainSection />
        <StepsSection />
        <FeaturesSection />
        <Ab3cSection />
        <PricingSection />
        <CreatorSection />
        <ClosingCtaSection />
      </main>
      <Footer />
    </div>
  );
}
