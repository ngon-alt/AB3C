"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CreatorProfileBlock from "../components/CreatorProfileBlock";

// ============================================================
// 戦略指南AI — LP v3 カラフル多色版
// セクション背景: 白 ↔ ライトティール ↔ ネイビー ↔ ティール帯
// ============================================================

const C = {
  // AB3C専用色（変更不可）
  ab3cB: "#FF0000",
  ab3cA: "#1a6fd4",
  ink: "#1a1a14",

  // UI パレット
  muted: "#64748b",
  bg: "#ffffff",
  surface: "#ffffff",
  border: "#e2e8f0",
  highlight: "#fef3c7",

  // 多色セクション用
  tealLight: "#f0fdf9",       // ライトティール背景
  tealLightBorder: "#99f6e4", // ライトティール上のボーダー
  navy: "#0a2540",            // ネイビー背景
  teal: "#0d9488",            // ティール帯（CTA・アクション感）
};

const H = "'Noto Serif JP', serif";
const BF = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
const TW = 1000;
const WW = 1240;

// ============================================================
// 共通コンポーネント
// ============================================================

// variant="primary": ティール bg（白地・ネイビー地で使う）
// variant="light"  : 白 bg + ティール文字（ティール地で使う）
function CtaButton({ label = "無料で1サイト診断してみる", size = "md", variant = "primary" }) {
  const { data: session } = useSession();
  const go = () => session ? (window.location.href = "/") : signIn("google", { callbackUrl: "/" });
  const isPrimary = variant === "primary";
  return (
    <button type="button" onClick={go} style={{
      background: isPrimary ? C.teal : "#ffffff",
      color: isPrimary ? "#ffffff" : C.teal,
      border: isPrimary ? "none" : "2px solid #ffffff",
      borderRadius: 8,
      padding: size === "lg" ? "18px 48px" : "14px 30px",
      fontSize: size === "lg" ? 20 : 18,
      fontWeight: 700, fontFamily: BF, cursor: "pointer",
      boxShadow: isPrimary
        ? "0 4px 16px rgba(13,148,136,0.40)"
        : "0 4px 16px rgba(0,0,0,0.18)",
      transition: "transform 0.15s, box-shadow 0.15s",
      display: "inline-block", lineHeight: 1.5, letterSpacing: "0.01em",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = isPrimary ? "0 8px 28px rgba(13,148,136,0.55)" : "0 8px 24px rgba(0,0,0,0.28)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isPrimary ? "0 4px 16px rgba(13,148,136,0.40)" : "0 4px 16px rgba(0,0,0,0.18)"; }}
    >{label}</button>
  );
}

// ブラウザモック付きスクリーンショット
function Shot({ src, alt, caption, maxWidth }) {
  return (
    <figure style={{ margin: "32px 0", maxWidth: maxWidth || "100%" }}>
      <div style={{
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          background: "#dde4ec", padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4f4f","#f0b429","#29c640"].map((col, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: col }} />
            ))}
          </div>
          <div style={{
            flex: 1, background: "#fff", borderRadius: 5,
            padding: "3px 12px", fontSize: 13, color: C.muted,
            fontFamily: BF, border: `1px solid ${C.border}`, maxWidth: 300,
          }}>senryaku.ai</div>
        </div>
        <img src={src} alt={alt} style={{ width: "100%", display: "block" }} />
      </div>
      {caption && (
        <figcaption style={{ textAlign: "center", fontSize: 16, color: C.muted, marginTop: 10, fontFamily: BF, lineHeight: 1.6 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// 中間 CTA（ティール地）
function MidCta({ text = "まず無料で1サイト試してみる" }) {
  return (
    <div style={{ background: C.teal, padding: "48px 20px", textAlign: "center" }}>
      <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", margin: "0 0 18px", fontFamily: BF }}>
        読み進める前に、実際に触れてみてください。
      </p>
      <CtaButton label={text} size="lg" variant="light" />
      <div style={{ marginTop: 12, fontSize: 16, color: "rgba(255,255,255,0.60)", fontFamily: BF }}>
        Googleアカウントで即日スタート · クレジットカード不要
      </div>
    </div>
  );
}

// Eyebrow ラベル
function Eyebrow({ children, on = "white" }) {
  const colorMap = { white: C.muted, tealLight: "#0f766e", navy: "#64a0c0", teal: "rgba(255,255,255,0.65)" };
  return (
    <div style={{
      display: "inline-block", fontSize: 16, fontWeight: 700,
      letterSpacing: "0.12em", color: colorMap[on] || C.muted,
      fontFamily: BF, marginBottom: 14, textTransform: "uppercase",
    }}>{children}</div>
  );
}

// 大見出し
function H2({ children, on = "white", center = false }) {
  const colorMap = { white: C.ink, tealLight: C.ink, navy: "#ffffff", teal: "#ffffff" };
  return (
    <h2 style={{
      fontFamily: H, fontSize: 32, fontWeight: 700,
      color: colorMap[on] || C.ink, lineHeight: 1.55,
      margin: "0 0 24px", textAlign: center ? "center" : "left",
    }}>{children}</h2>
  );
}

// 本文
function P({ children, on = "white", style: extra = {} }) {
  const colorMap = { white: C.ink, tealLight: C.ink, navy: "rgba(255,255,255,0.78)", teal: "rgba(255,255,255,0.82)" };
  return (
    <p style={{
      fontSize: 18, color: colorMap[on] || C.ink,
      lineHeight: 2.0, margin: "0 0 20px", fontFamily: BF, ...extra,
    }}>{children}</p>
  );
}

// ハイライトボックス
function Callout({ children, on = "white" }) {
  if (on === "navy") return (
    <div style={{
      background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.4)",
      borderLeft: `4px solid ${C.teal}`, borderRadius: 8, padding: "20px 24px",
      fontSize: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.9, fontFamily: BF, margin: "28px 0",
    }}>{children}</div>
  );
  if (on === "teal") return (
    <div style={{
      background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.25)",
      borderLeft: "4px solid rgba(255,255,255,0.60)", borderRadius: 8, padding: "20px 24px",
      fontSize: 18, color: "rgba(255,255,255,0.85)", lineHeight: 1.9, fontFamily: BF, margin: "28px 0",
    }}>{children}</div>
  );
  return (
    <div style={{
      background: C.highlight, border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${C.ink}`, borderRadius: 8, padding: "20px 24px",
      fontSize: 18, color: C.ink, lineHeight: 1.9, fontFamily: BF, margin: "28px 0",
    }}>{children}</div>
  );
}

// ============================================================
// 1. ヒーロー（ネイビー・テキストのみ）
// ============================================================
function Hero() {
  return (
    <section style={{ background: C.navy, padding: "120px 20px 128px", textAlign: "center" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", background: "rgba(13,148,136,0.18)",
          border: "1px solid rgba(13,148,136,0.40)", color: "#5eead4",
          fontSize: 16, fontWeight: 700, letterSpacing: "0.12em",
          padding: "6px 18px", borderRadius: 3, marginBottom: 36, fontFamily: BF,
        }}>
          コンサルタント・Web制作会社向け
        </div>

        <h1 style={{
          fontFamily: H, fontSize: 58, fontWeight: 700, color: "#fff",
          lineHeight: 1.55, margin: "0 0 32px", letterSpacing: "0.02em",
        }}>
          「AIでマーケティングができる」<br /><span style={{ fontSize: 44, fontWeight: 400, letterSpacing: "0.08em" }}>は</span><br />本当ですか？
        </h1>

        <p style={{ fontSize: 24, color: "#fff", fontWeight: 700, lineHeight: 1.7, margin: "0 0 16px", fontFamily: BF }}>
          はい、できます。ただし、条件があります。
        </p>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.88)", lineHeight: 2.0, margin: "0 0 52px", fontFamily: BF }}>
          その条件を満たすために生まれたのが、戦略指南AIです。<br />
          マーケティングの「上流」にある戦略を、AIがサポートします。
        </p>

        <CtaButton label="無料で1サイト診断してみる" size="lg" />
        <div style={{ marginTop: 16, fontSize: 16, color: "rgba(255,255,255,0.40)", fontFamily: BF }}>
          Googleアカウントで即日スタート · クレジットカード不要
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 1b. ヒーロースクリーンショット（ネイビー→ホワイト境界）
// ============================================================
function HeroShot() {
  return (
    <section style={{ background: C.bg, padding: "0 20px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <Shot
          src="/howto/分析結果の概要.png"
          alt="戦略指南AI — AB3C分析結果"
          caption="戦略指南AIの分析結果画面。ベネフィット・アドバンテージ・3C分析が自動生成される。"
        />
      </div>
    </section>
  );
}

// ============================================================
// 2. AIとマーケティング（ホワイト）
// ============================================================
function AiMarketingQuestion() {
  const examples = [
    { label: "SNS投稿", desc: "「自社の強みをSNSで発信したい。毎日の投稿文を考えてほしい」" },
    { label: "SEOコンテンツ", desc: "「検索で上位表示されるページを作りたい。内容とキーワードを教えてほしい」" },
    { label: "サイト改善", desc: "「ウェブサイトのコンテンツやデザインをよくしたい。改善案を出してほしい」" },
    { label: "コピーライティング", desc: "「ターゲット客の心に刺さる文章を書いてほしい」" },
  ];

  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="white">AIとマーケティング</Eyebrow>
        <H2 on="white">多くの人が持っている疑問。<br />「AIってマーケティングに使えるの？」</H2>

        <P on="white">
          ChatGPTやGeminiが普及するなかで、こんなことを試みた人は多いはずです。
          SNSの投稿文を作らせる。SEOに強いコンテンツを書かせる。
          サイトのデザインや文章を改善させる。
          いずれも「それらしい答え」が出てきます。
        </P>
        <P on="white">
          なんとなく分かるし、実際に使えそうな気もする。でも、本当に正解なのか、
          これで成果が出るのかと問われると、自信を持って「はい」と言えない。
          そういう感覚、ありませんか。
        </P>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 12, margin: "32px 0",
        }}>
          {examples.map((ex, i) => (
            <div key={i} style={{
              background: C.tealLight, border: `1px solid ${C.tealLightBorder}`,
              borderRadius: 8, padding: "18px 20px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{
                display: "inline-block", background: C.teal, color: "#fff",
                fontSize: 16, fontWeight: 700, padding: "3px 12px",
                borderRadius: 3, fontFamily: BF, alignSelf: "flex-start",
              }}>{ex.label}</div>
              <div style={{ fontSize: 18, color: "#0f766e", lineHeight: 1.75, fontFamily: BF, fontStyle: "italic" }}>
                {ex.desc}
              </div>
            </div>
          ))}
        </div>

        <P on="white">
          こうした依頼は、確かに汎用AIで「こなす」ことができます。
          しかし実際にやってみると、少し経ってから気づくことがあります。
        </P>

        <Callout on="white">
          各施策は「もっともらしい」のに、全体を通して見ると<b>一本の線を引けない</b>。<br />
          SNSで伝えていること、SEOで書いていること、サイトで語っていること——<br />
          それぞれがバラバラに動いている、という感覚。
        </Callout>

        <P on="white">
          これが、汎用AIをマーケティングに使うときに起きる「部分最適」の問題です。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 3. 部分最適（ライトティール）
// ============================================================
function PartialOptimalSection() {
  return (
    <section style={{ background: C.tealLight, padding: "80px 20px", borderTop: `1px solid ${C.tealLightBorder}` }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ maxWidth: TW }}>
          <Eyebrow on="tealLight">なぜ部分最適になるのか</Eyebrow>
          <H2 on="tealLight">一問一答の構造が、<br />施策をバラバラにする。</H2>
          <P on="tealLight">
            汎用AIは「一問一答」の構造で動きます。
            SNSについて聞けばSNSの答えを出す。
            SEOについて聞けばSEOの答えを出す。
            それぞれの問いに対して、それぞれの「正解」を返します。
          </P>
          <P on="tealLight">
            問題は、その答えどうしが<b>互いを意識していない</b>ことです。
            「SNSでこう伝える」という答えと、「SEOでこう書く」という答えが、
            同じターゲットに向けた同じメッセージとして設計されていない。
            だから全体として一本の軸が通らないのです。
          </P>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "40px 0" }}>
          {/* 左: 汎用AI */}
          <div style={{
            background: "#f1f5f9", border: "1px solid #cbd5e1",
            borderRadius: 12, padding: "28px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", marginBottom: 20, fontFamily: BF, textAlign: "center" }}>
              汎用AI（一問一答）
            </div>
            {[
              { q: "Q. SNSに何を投稿すればいい？", a: "「ためになる情報を毎日コツコツと発信しましょう」" },
              { q: "Q. SEOキーワードは？", a: "「検索ボリュームの高いキーワードを中心に記事を」" },
              { q: "Q. ウェブサイトの改善点は？", a: "「動画コンテンツを増やすとエンゲージメントが上がります」" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{
                  background: "#fff", border: "1px solid #e2e8f0",
                  borderRadius: 6, padding: "10px 14px",
                  fontSize: 16, color: C.ink, fontFamily: BF, fontWeight: 600, lineHeight: 1.5,
                }}>{item.q}</div>
                <div style={{ padding: "6px 16px 0" }}>
                  <div style={{ fontSize: 16, color: C.muted, fontFamily: BF, fontStyle: "italic", lineHeight: 1.6 }}>
                    → {item.a}
                  </div>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 24, borderTop: `1px dashed ${C.border}`, paddingTop: 16,
              textAlign: "center", fontSize: 18, fontWeight: 700,
              color: "#b84040", fontFamily: BF, lineHeight: 1.7,
            }}>
              一つひとつは「正しそう」<br />でも全体としてつながっていない
            </div>
          </div>

          {/* 右: 戦略指南AI */}
          <div style={{ background: C.navy, borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 20px rgba(10,37,64,0.20)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(94,234,212,0.70)", marginBottom: 20, fontFamily: BF, textAlign: "center" }}>
              戦略指南AI（フレームワーク）
            </div>
            <div style={{
              background: "rgba(13,148,136,0.18)", border: "1px solid rgba(13,148,136,0.40)",
              borderRadius: 8, padding: "16px 18px", marginBottom: 10, textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: BF }}>AB3C分析（戦略の上流）</div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", fontFamily: BF, lineHeight: 1.7 }}>
                誰に・何を・なぜ選ばれるのか<br />を一気通貫で定義する
              </div>
            </div>
            <div style={{ textAlign: "center", color: "#5eead4", fontSize: 22, margin: "8px 0" }}>↓</div>
            <div style={{
              background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.30)",
              borderRadius: 8, padding: "12px 16px", marginBottom: 10, textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ccfbf1", fontFamily: BF }}>戦略メッセージが確定</div>
            </div>
            <div style={{ textAlign: "center", color: "#5eead4", fontSize: 22, margin: "8px 0" }}>↓</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["SNS投稿", "SEOコンテンツ", "サイト改善"].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(94,234,212,0.20)",
                  borderRadius: 6, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ color: "#5eead4", fontWeight: 700, fontSize: 18 }}>✓</span>
                  <span style={{ fontSize: 16, color: "#ccfbf1", fontFamily: BF }}>{item}（戦略軸で統一）</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 24, borderTop: "1px dashed rgba(94,234,212,0.25)", paddingTop: 16,
              textAlign: "center", fontSize: 18, fontWeight: 700,
              color: "#5eead4", fontFamily: BF, lineHeight: 1.7,
            }}>
              すべての施策が同じ軸でつながる<br />= 一気通貫
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 4. 数字（ティール帯）
// ============================================================
function StatsSection() {
  const stats = [
    { num: "30秒", label: "URL入力から分析完了まで" },
    { num: "10", label: "施策テーマ対応数" },
    { num: "¥7,700", label: "1サイトあたりの最低単価" },
    { num: "24年", label: "考案者のウェブ業界歴" },
  ];

  return (
    <section style={{ background: C.teal, padding: "64px 20px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "32px 20px",
              borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.20)" : "none",
            }}>
              <div style={{ fontFamily: H, fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 10 }}>
                {s.num}
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", fontFamily: BF, lineHeight: 1.6 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 5. マーケティングには「上流」がある（ホワイト）
// ============================================================
function UpstreamSection() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="white">問題の本質</Eyebrow>
        <H2 on="white">マーケティングには「上流」がある。<br />その上流こそが、戦略だ。</H2>

        <P on="white">
          SNS投稿もSEOも広告も、マーケティングの「下流」の活動です。
          下流は、上流が決まっていてはじめて意味を持ちます。
          上流とは何か。それは「戦略」です。
        </P>
        <P on="white">
          戦略とは、次の3つの問いへの答えです。
          これが決まっていない状態でSNSを投稿しても、「誰でもいいから集客する」ための投稿になります。
          SEOコンテンツを書いても、「誰に向けていいか分からない、万人にとっての素敵な文章」になります。
        </P>

        {/* 図: 戦略がマーケティングを束ねる */}
        <figure style={{ margin: "40px 0 0", textAlign: "center" }}>
          <img
            src="/report/%E6%88%A6%E7%95%A5%E3%81%8C%E3%83%9E%E3%83%BC%E3%82%B1%E3%83%86%E3%82%A3%E3%83%B3%E3%82%B0%E3%82%92%E6%9D%9F%E3%81%AD%E3%82%8B.png"
            alt="戦略があるから施策がつながる図"
            style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          />
        </figure>

        {/* 3ステップフロー */}
        <div style={{ margin: "40px 0 48px", display: "flex", alignItems: "stretch", gap: 0 }}>
          {[
            { num: "①", title: "戦略を確立する", desc: "誰に・何を・なぜ選ばれるのかを言語化する" },
            { num: "②", title: "戦略を軸に施策を設計", desc: "確立した戦略を前提として、各施策を設計・実行する" },
            { num: "③", title: "施策が累積して成果になる", desc: "施策間の一貫性が生まれ、ブランドが積み上がっていく" },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
              <div style={{
                flex: 1, background: i === 0 ? C.navy : i === 1 ? "#1e4a6e" : "#0d9488",
                borderRadius: i === 0 ? "12px 0 0 12px" : i === 2 ? "0 12px 12px 0" : 0,
                padding: "28px 24px",
                boxShadow: "0 4px 16px rgba(10,37,64,0.14)",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #ffffff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: BF, marginBottom: 12 }}>{i + 1}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8, fontFamily: BF, lineHeight: 1.4 }}>{step.title}</div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", fontFamily: BF, lineHeight: 1.7 }}>{step.desc}</div>
              </div>
              {i < 2 && (
                <div style={{ display: "flex", alignItems: "center", background: i === 0 ? "#1e4a6e" : "#0d7060", padding: "0 2px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.50)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ margin: "36px 0" }}>
          <div style={{
            background: C.navy, borderRadius: 12,
            padding: "28px 28px", marginBottom: 12,
            boxShadow: "0 4px 20px rgba(10,37,64,0.18)",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.10em", color: "rgba(94,234,212,0.60)", marginBottom: 16, fontFamily: BF }}>
              上流 — 戦略
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "ターゲット", sub: "誰のために、何の悩みを解決するのか", borderCol: "rgba(255,255,255,0.25)" },
                { label: "Benefit（ベネフィット）", sub: "お客様が得る価値は何か（ニーズ→ウォンツ）", color: C.ab3cB, borderCol: C.ab3cB },
                { label: "Advantage（アドバンテージ）", sub: "競合ではなく自社を選ぶ理由は何か", color: C.ab3cA, borderCol: C.ab3cA },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${item.borderCol}`,
                  borderRadius: 8, padding: "16px 16px",
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: item.color || "#fff", marginBottom: 6, fontFamily: BF, lineHeight: 1.4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", lineHeight: 1.7, fontFamily: BF }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", color: C.teal, fontSize: 28, margin: "4px 0" }}>↓</div>

          <div style={{
            background: C.teal, border: `2px solid ${C.teal}`,
            borderRadius: 12, padding: "24px 28px",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.10em", color: "rgba(255,255,255,0.70)", marginBottom: 16, fontFamily: BF }}>
              下流 — 施策（マーケティング活動）
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["SNS投稿", "SEOコンテンツ", "Web広告", "サイト改善", "採用コンテンツ", "補助金申請", "提案書"].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: 6, padding: "8px 16px",
                  fontSize: 16, color: "#fff", fontFamily: BF, fontWeight: 600,
                }}>{item}</div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 18, color: "rgba(255,255,255,0.90)", fontFamily: BF, lineHeight: 1.7 }}>
              → 上流が決まっていれば、どの施策も同じ軸で設計できる。
            </div>
          </div>
        </div>

        <P on="white">
          上流なき下流は、労力を消費しながら成果を出せません。
          どれだけ素晴らしいコンテンツを書いても、誰に届けたいのか・なぜ選ばれるのかが
          定義されていなければ、それは「投げっぱなし」の施策になります。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 6. 汎用AIの限界（ネイビー）
// ============================================================
function AiLimitSection() {
  return (
    <section style={{ background: C.navy, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="navy">汎用AIの限界</Eyebrow>
        <H2 on="navy">「では、ChatGPTで戦略を<br />立てればいいのでは？」</H2>

        <P on="navy">
          確かに、不可能ではありません。
          「ターゲットを教えてください」「強みは何ですか」「競合との違いは？」と
          一つひとつ質問することはできます。
        </P>
        <P on="navy">しかし実際に試してみると、壁にぶつかります。</P>

        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "28px 28px", margin: "28px 0",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 20, fontFamily: BF }}>
            汎用AIで戦略を立てようとすると、こうなる
          </div>
          {[
            { step: "1", q: "「うちのターゲット顧客を教えてください」", a: "「中小企業の経営者や、ウェブマーケティングに課題を持つ担当者が考えられます」", problem: "どの会社にも当てはまる。この会社固有の答えではない。" },
            { step: "2", q: "「うちの強みは何ですか？」", a: "「お客様のニーズに寄り添ったサービス、地域密着型のサポート、迅速な対応が挙げられます」", problem: "これも同様。競合も同じことを言っている。" },
            { step: "3", q: "「先ほどのターゲット向けの戦略メッセージを作ってください」", a: "「地域のお客様に選ばれる、信頼と実績のサービスを提供します」", problem: "ターゲット・強み・メッセージの整合性がとれていない。" },
          ].map((item, i, arr) => (
            <div key={i} style={{
              borderBottom: i < arr.length - 1 ? "1px dashed rgba(255,255,255,0.15)" : "none",
              paddingBottom: i < arr.length - 1 ? 20 : 0, marginBottom: i < arr.length - 1 ? 20 : 0,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: C.teal,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, flexShrink: 0, fontFamily: BF,
                }}>{item.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, color: "#fff", fontFamily: BF, fontWeight: 600, marginBottom: 6, lineHeight: 1.5 }}>{item.q}</div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", fontFamily: BF, fontStyle: "italic", marginBottom: 8, lineHeight: 1.6 }}>AI: {item.a}</div>
                  <div style={{ fontSize: 16, color: "#fca5a5", fontFamily: BF, lineHeight: 1.6, fontWeight: 600 }}>問題: {item.problem}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <P on="navy">
          戦略の本質は「整合性」にあります。
          ターゲット・ベネフィット・アドバンテージの3要素が一本の軸でつながっているかどうか。
          一つを変えれば他も見直す必要があり、その相互関係を常に意識しながら
          対話を続けることが求められます。
        </P>

        <Callout on="navy">
          汎用AIで戦略を正しく立てるには、<b>すでに戦略を知っている人間</b>が必要です。<br />
          戦略リテラシーのない状態で汎用AIを使っても、
          部分最適の答えを集めることしかできません。
        </Callout>
      </div>
    </section>
  );
}

// ============================================================
// 中間CTA（ティール）
// ============================================================
function MidCtaSection1() { return <MidCta />; }

// ============================================================
// 7. 戦略指南AIとは（ネイビー）
// ============================================================
function WhatIsSection() {
  return (
    <section style={{ background: C.navy, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="navy">解決策</Eyebrow>
        <H2 on="navy">戦略指南AIは、マーケティングの「上流」を<br />AIでサポートするツールです。</H2>

        <P on="navy">
          AB3Cフレームワーク（ベネフィット・アドバンテージ・3C分析）に沿って、
          クライアントの事業戦略の骨格を短時間・高精度で言語化します。
          URLを入力するだけで分析がはじまり、AIとの対話で戦略を磨き上げ、
          各施策への展開まで一気通貫でサポートします。
        </P>
        <P on="navy">
          汎用AIと根本的に異なるのは、戦略フレームワークがあらかじめ組み込まれていることです。
          「次に何を聞けばいいか」「どこが弱いか」「整合性がとれているか」——
          これらを戦略の文法に沿って自動的に判断します。
          20年以上のコンサルティング実務から磨き上げた、AB3Cフレームワークが土台です。
        </P>
      </div>

      <div style={{ maxWidth: WW, margin: "48px auto 0", padding: "0 20px" }}>
        <Shot
          src="/howto/senryaku0.png"
          alt="戦略指南AI ファーストビュー"
          caption="戦略指南AIのトップ画面。URLまたはテキストを入力して分析をスタートする。"
        />
      </div>
    </section>
  );
}

// ============================================================
// 8. AB3Cフレームワーク（ホワイト）
// ============================================================
function Ab3cSection() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="white">フレームワーク</Eyebrow>
        <H2 on="white">AB3C分析——<br />「選ばれる理由」を明らかにする戦略フレームワーク</H2>

        <P on="white">
          AB3Cはウェブ業界歴24年の権成俊が考案した、事業戦略を「可視化」するための思考フレームワークです。
          「なぜ自社は選ばれるのか」「どんな価値を届けるのか」「誰に届けるのか」を
          一枚の構造図に収めます。
        </P>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "36px 0" }}>
          <div style={{ display: "flex", gap: 0, alignItems: "stretch", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: C.ab3cB, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 72, padding: "0 8px", fontFamily: H, fontSize: 36, fontWeight: 700 }}>B</div>
            <div style={{ background: "#fff9f9", padding: "20px 24px", flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF }}>Benefit（ベネフィット）</div>
              <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.8, fontFamily: BF }}>
                お客様が求める価値。「ニーズ（課題解決）」と「ウォンツ（欲望・感情）」の両軸で定義します。ここが曖昧だと、どんな施策も刺さりません。
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: C.ab3cA, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 72, padding: "0 8px", fontFamily: H, fontSize: 36, fontWeight: 700 }}>A</div>
            <div style={{ background: "#f0f6ff", padding: "20px 24px", flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF }}>Advantage（アドバンテージ）</div>
              <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.8, fontFamily: BF }}>
                競合ではなく自社を選ぶ理由。「好ましい違い」と表現します。「最高品質」「丁寧な対応」のような主観では不十分。本人が確信を持って語れる、具体的な根拠が必要です。
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 72, padding: "0 4px", fontFamily: H, fontSize: 30, fontWeight: 700 }}>3C</div>
            <div style={{ background: "#f8f9fa", padding: "20px 24px", flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF }}>Customer · Competitor · Company</div>
              <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.8, fontFamily: BF }}>
                顧客・競合・自社の3視点。戦略はこの3Cを同時に見ることで整合性を持ちます。自社だけを見ていては、差別化は生まれません。
              </div>
            </div>
          </div>
        </div>

        {/* Advantage中心性の強調 */}
        <div style={{
          margin: "40px 0 36px",
          background: "#f0f6ff", borderLeft: `4px solid ${C.ab3cA}`,
          borderRadius: "0 10px 10px 0", padding: "28px 28px",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ab3cA, marginBottom: 12, fontFamily: BF }}>
            なぜ「Advantage」が中心なのか
          </div>
          <p style={{ fontSize: 18, color: C.ink, lineHeight: 2.0, margin: "0 0 14px", fontFamily: BF }}>
            伝統的な3C分析は「現状の環境を把握する」ことが目的です。
            しかしそれだけでは「では何をするか」という意思決定の軸が曖昧になりやすい。
          </p>
          <p style={{ fontSize: 18, color: C.ink, lineHeight: 2.0, margin: "0 0 14px", fontFamily: BF }}>
            ウェブ・AIの普及で競争環境が激化した今、顧客に選ばれるには
            「競合とどう違うのか（好ましい違い）」を明確に打ち出す必要があります。
            AB3CがAdvantageを独立軸として立てているのは、この問いを<b>強制的に立てさせる</b>ためです。
          </p>
          <p style={{ fontSize: 18, color: C.ink, lineHeight: 2.0, margin: 0, fontFamily: BF }}>
            「最高品質」「丁寧な対応」のような主観では不十分。
            本人が確信を持って語れる、具体的な根拠——独自経験・先駆者性・実績——が必要です。
            その言語化を促すのが、AB3CのAです。
          </p>
        </div>

        <Shot
          src="/howto/分析結果の概要.png"
          alt="AB3C分析結果の概要"
          caption="B（赤）・A（青）・3C（黒）の構造で分析結果が表示される。チェックポイントで整合性を自動評価。"
        />
      </div>
    </section>
  );
}

// ============================================================
// 8b. 戦略メッセージの役割（ネイビー）
// ============================================================
function StrategyMessageSection() {
  const destinations = [
    { label: "Webサイト", desc: "トップページのキャッチコピー・構成の指針" },
    { label: "広告クリエイティブ", desc: "バナー・動画の方向性と訴求軸" },
    { label: "採用ページ", desc: "ビジョン表現・「選ばれる職場」の言語化" },
    { label: "営業・提案書", desc: "冒頭メッセージ・提案の軸" },
    { label: "SNS・コンテンツ", desc: "発信テーマと一貫したトーンの基準" },
    { label: "社内共通言語", desc: "「自社は何者か」を全員が同じ言葉で語れる" },
  ];
  return (
    <section style={{ background: C.navy, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="navy">戦略メッセージの役割</Eyebrow>
        <H2 on="navy">Benefit + Advantage = 一文で表現する<br />「選ばれる理由」</H2>
        <P on="navy">
          AB3C分析の最終アウトプットが「戦略メッセージ」です。
          ベネフィットとアドバンテージを統合し、「誰のための、何が違うのか」を一文で示します。
        </P>
        <P on="navy">
          この一文が確立すると、社内外のすべての発信がここから派生します。
          デザイナー・クリエイター・営業担当者など、異なる職種が同じ方向を向くための
          「共通言語」として機能します。
        </P>

        {/* 中央の戦略メッセージ → 展開図 */}
        <div style={{ margin: "40px 0" }}>
          <div style={{
            background: "rgba(13,148,136,0.20)", border: "1px solid rgba(13,148,136,0.50)",
            borderRadius: 12, padding: "24px 28px", textAlign: "center", marginBottom: 12,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 8, fontFamily: BF }}>戦略メッセージ（例）</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: H, lineHeight: 1.6 }}>
              AIで戦略提案できる専門家に、資格で証明する
            </div>
            <div style={{ marginTop: 10, fontSize: 16, color: "rgba(255,255,255,0.82)", fontFamily: BF }}>
              <span style={{ color: C.ab3cB }}>Benefit</span>: 経営者から信頼される戦略提案力 ／{" "}
              <span style={{ color: C.ab3cA }}>Advantage</span>: AB3C×AI特化の唯一の資格体系
            </div>
          </div>

          <div style={{ textAlign: "center", color: "#5eead4", fontSize: 22, margin: "8px 0" }}>↓ この一文から、すべての発信が派生する</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {destinations.map((d, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8, padding: "18px 18px",
              }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: BF }}>{d.label}</div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", fontFamily: BF, lineHeight: 1.7 }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <Callout on="navy">
          全ての発信がこの一文を出発点とすることで、<b>「一気通貫」の経営コミュニケーション</b>が実現します。<br />
          施策ごとにトンマナが揺れない。競合が同じことを言っていない。それが戦略メッセージの力です。
        </Callout>
      </div>
    </section>
  );
}

// ============================================================
// 9. 出力がプロンプトになる（ライトティール）
// ============================================================
function OutputAsPromptSection() {
  const outputs = [
    { from: "戦略メッセージ", to: "→ Webトップページのキャッチコピーに" },
    { from: "ターゲット定義", to: "→ SNS投稿文の前提として使う" },
    { from: "ベネフィット整理", to: "→ 商品ページのコピーに反映" },
    { from: "アドバンテージ根拠", to: "→ 採用ページの「選ばれる理由」に" },
    { from: "Webサイト改善指示", to: "→ デザイナーへの改修指示書として" },
    { from: "施策アクション", to: "→ 担当者への業務指示書として" },
  ];

  return (
    <section style={{ background: C.tealLight, padding: "96px 20px 80px", borderTop: `1px solid ${C.tealLightBorder}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="tealLight">出力の使い方</Eyebrow>
        <H2 on="tealLight">戦略指南AIの出力が、<br />すべての生成AIへの「プロンプト」になる。</H2>

        <P on="tealLight">
          戦略指南AIが整理した戦略の情報——ターゲット定義、ベネフィット、アドバンテージ、
          戦略メッセージ——はそのまま「他のAIへの指示文」として使えます。
        </P>
        <P on="tealLight">
          テキスト以外の領域（デザイン生成・画像生成・動画制作など）では、
          専門ツールを使った方が品質が高まります。
          そのときに必要なのが「前提情報」としての戦略テキストです。
          戦略指南AIが出力した戦略メッセージやターゲット定義を
          Canva・Midjourney・その他の生成AIに渡すことで、
          ブレのないアウトプットが生まれます。
        </P>

        <div style={{ margin: "32px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{
            background: C.navy, borderRadius: 10, padding: "20px 22px", textAlign: "center",
            fontFamily: H, fontSize: 22, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 16px rgba(10,37,64,0.18)",
          }}>戦略指南AI の出力</div>
          <div style={{ textAlign: "center", color: C.teal, fontSize: 24 }}>↓</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {outputs.map((item, i) => (
              <div key={i} style={{
                background: "#fff", border: `1px solid ${C.tealLightBorder}`,
                borderRadius: 8, padding: "14px 18px",
                boxShadow: "0 2px 8px rgba(13,148,136,0.06)",
              }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: BF }}>{item.from}</div>
                <div style={{ fontSize: 16, color: "#0f766e", fontFamily: BF, lineHeight: 1.6 }}>{item.to}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 10. STEP ① 診断（ホワイト）
// ============================================================
function Step1Section() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ maxWidth: TW }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, fontFamily: BF, flexShrink: 0, boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }}>①</div>
            <Eyebrow on="white">STEP 1</Eyebrow>
          </div>
          <H2 on="white">URLを入力して、AB3C診断</H2>
          <P on="white">
            クライアントのサイトURLを入力するだけで分析がはじまります。
            競合調査・顧客ニーズ分析・自社分析を自動で行い、
            ベネフィット・アドバンテージ・3Cの構造で結果を生成します。
            URLがなくても、テキスト入力から分析することも可能です。
          </P>
          <P on="white">
            URL分析の場合は、AB3C分析と同時に<b>Webサイト改善レポート</b>も生成されます。
            現在のサイトがAB3C戦略と整合しているかを自動チェックし、
            コンテンツ・デザイン・構造ごとに改善優先事項を提示します。
          </P>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
          <Shot src="/howto/URL入力.png" alt="URL入力画面" caption="URLを貼り付けて「分析開始」を押すだけ。" />
          <Shot src="/howto/ウェブサイト改善レポート生成中.png" alt="サイト改善レポート生成中" caption="AB3C分析と並行してWebサイト改善レポートも自動生成。" />
        </div>

        <div style={{ maxWidth: TW, marginTop: 32 }}>
          <div style={{ background: C.tealLight, border: `1px solid ${C.tealLightBorder}`, borderRadius: 10, padding: "24px 26px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 14, fontFamily: BF }}>AB3Cチェックポイント機能</div>
            <P on="tealLight">
              分析結果には「チェックポイント」が自動付与されます。
              ベネフィットとアドバンテージの整合性、競合との差別化の明確さ、
              市場規模の妥当性など、5つの観点で弱点を可視化します。
            </P>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 10b. レポート詳細（ライトティール）
// ============================================================
const REPORT_ITEMS = [
  {
    src: "/report/report-1.png",
    alt: "ターゲット別戦略の切り替え",
    num: "01",
    title: "3つのターゲット別に戦略を立案",
    desc: "入力されたURLもしくはテキストから3つのターゲット別の戦略を立案します。ターゲットごとに詳細なレコードを切り替えて見ることができます。",
  },
  {
    src: "/report/report-2.png",
    alt: "AB3C戦略の概要",
    num: "02",
    title: "AB3Cフレームワークで戦略を可視化",
    desc: "Webマーケティングフレームワーク AB3C をベースとした戦略の概要が出力されます。ベネフィット・アドバンテージ・3C分析が整理された状態で確認できます。",
  },
  {
    src: "/report/report-3.png",
    alt: "ファーストビューの改善案ビジュアル",
    num: "03",
    title: "ファーストビューの改善案をビジュアル化",
    desc: "表示された戦略をベースに、その戦略に則ったウェブサイトの改善点を、ファーストビューを中心にビジュアルイメージとして提示します。",
  },
  {
    src: "/report/report-4.png",
    alt: "コンテンツ・デザイン・構造の改善提案",
    num: "04",
    title: "3領域に分けて改善提案を詳述",
    desc: "追加すべきコンテンツ、改善すべきビジュアルデザイン、サイト構造設計の3つに分けて、具体的な改善点を説明します。",
  },
];

function ReportDetailSection() {
  return (
    <section style={{ background: C.tealLight, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ maxWidth: TW, marginBottom: 56 }}>
          <Eyebrow on="tealLight">レポートの中身</Eyebrow>
          <H2 on="tealLight">何が、どのように出力されるか</H2>
          <P on="tealLight">
            分析レポートは単なる要約ではありません。ターゲット別の戦略立案から、
            ウェブサイトの具体的な改善提案まで、4つのブロックで構成されています。
          </P>
        </div>

        {/* 全体ショット：幅1/5で縦の長さを見せる */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 40, marginBottom: 72 }}>
          <div style={{ width: "20%", flexShrink: 0 }}>
            <div style={{
              borderRadius: 8, overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
              border: `1px solid ${C.border}`,
            }}>
              <img src="/report/report.png" alt="分析レポート全体" style={{ width: "100%", display: "block" }} />
            </div>
            <p style={{ textAlign: "center", fontSize: 16, color: "#0f766e", marginTop: 10, fontFamily: BF, lineHeight: 1.5 }}>
              レポート全体像
            </p>
          </div>
          <div style={{ flex: 1, paddingTop: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, fontFamily: BF, lineHeight: 1.6, marginBottom: 16 }}>
              1回の分析で、これだけの情報量が出力されます
            </div>
            <p style={{ fontSize: 18, color: "#374151", lineHeight: 2.0, fontFamily: BF, margin: "0 0 16px" }}>
              左の図がレポートの全体です。3つのターゲット別に戦略を立案し、それぞれにAB3C分析・改善提案・ファーストビューのビジュアル案が含まれます。
              コンサルタントがクライアントに提出できる水準の情報量を、AIが自動で生成します。
            </p>
            <p style={{ fontSize: 18, color: "#374151", lineHeight: 2.0, fontFamily: BF, margin: 0 }}>
              以下、レポートを構成する4つのブロックをご紹介します。
            </p>
          </div>
        </div>

        {/* 提案書ダウンロード */}
        <div style={{
          background: C.navy, borderRadius: 14,
          padding: "40px 44px", marginBottom: 72,
          display: "flex", alignItems: "center", gap: 40,
          boxShadow: "0 8px 32px rgba(10,37,64,0.22)",
        }}>
          {/* サムネイル画像 */}
          <div style={{ flexShrink: 0, width: 200 }}>
            <img
              src="/report/digi-kaku.or.jp_AI%E3%81%A7%E6%88%A6%E7%95%A5%E6%8F%90%E6%A1%88%E3%81%A7%E3%81%8D%E3%82%8B%E5%B0%82%E9%96%80%E5%AE%B6%E3%81%AB%E3%80%81%E8%B3%87%E6%A0%BC%E3%81%A7%E8%A8%BC%E6%98%8E%E3%81%99%E3%82%8B.png"
              alt="提案書サンプル"
              style={{ width: "100%", borderRadius: 8, display: "block", boxShadow: "0 4px 16px rgba(0,0,0,0.30)" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#ffffff", fontFamily: BF, marginBottom: 10, textTransform: "uppercase" }}>Sample PPT / PDF</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: BF, lineHeight: 1.5, marginBottom: 12 }}>
              分析結果をそのままPPT・PDFファイルでダウンロードできます。
            </div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", fontFamily: BF, lineHeight: 1.7 }}>
              戦略指南AIが出力した提案書のサンプルです。クライアントへの提案資料としてそのまま活用できます。
            </div>
          </div>
          <a
            href="/report/digi-kaku.or.jp_AI%E3%81%A7%E6%88%A6%E7%95%A5%E6%8F%90%E6%A1%88%E3%81%A7%E3%81%8D%E3%82%8B%E5%B0%82%E9%96%80%E5%AE%B6%E3%81%AB%E3%80%81%E8%B3%87%E6%A0%BC%E3%81%A7%E8%A8%BC%E6%98%8E%E3%81%99%E3%82%8B.pptx"
            download
            style={{
              flexShrink: 0, background: C.teal, color: "#fff",
              border: "none", borderRadius: 8, padding: "14px 28px",
              fontSize: 18, fontWeight: 700, fontFamily: BF, cursor: "pointer",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(13,148,136,0.40)", whiteSpace: "nowrap",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            ダウンロード
          </a>
        </div>

        {/* 4ブロック：交互レイアウト + スクロール可能な画像コンテナ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 72 }}>
          {REPORT_ITEMS.map((item, idx) => {
            const imgRight = idx % 2 === 1;
            return (
              <div key={item.num} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 48,
                alignItems: "center",
              }}>
                {/* 画像コンテナ（スクロール可能） */}
                <div style={{ order: imgRight ? 2 : 1 }}>
                  <div style={{
                    height: 600,
                    overflowY: "scroll",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                    scrollbarWidth: "thin",
                    scrollbarColor: `${C.teal} transparent`,
                  }}>
                    <img src={item.src} alt={item.alt} style={{ width: "100%", display: "block" }} />
                  </div>
                </div>

                {/* テキスト */}
                <div style={{ order: imgRight ? 1 : 2 }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13, fontWeight: 700,
                    color: C.teal, letterSpacing: "0.1em", marginBottom: 16,
                  }}>{item.num}</div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, color: C.ink,
                    marginBottom: 20, fontFamily: BF, lineHeight: 1.5,
                  }}>{item.title}</div>
                  <p style={{ fontSize: 18, color: "#374151", lineHeight: 2.0, margin: 0, fontFamily: BF }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ============================================================
// 11. STEP ② 策定（ネイビー）
// ============================================================
function Step2Section() {
  return (
    <section style={{ background: C.navy, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ maxWidth: TW }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, fontFamily: BF, flexShrink: 0, boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }}>②</div>
            <Eyebrow on="navy">STEP 2</Eyebrow>
          </div>
          <H2 on="navy">AIチャットで戦略を磨き、<br />戦略メッセージを確定する</H2>
          <P on="navy">
            診断結果をベースに、AIとの対話で戦略を深掘りします。
            分析結果のどの要素にカーソルを当てても、その場でAIへの質問を送れます。
            「この強みの根拠は何ですか？」「競合との違いをもっと明確にするには？」——
            弱点を指摘し、「選ばれる理由」を言語化するまで一緒に考えます。
          </P>
          <P on="navy">
            AI秘書機能では、経営者が言語化できていない<b>価値観・原体験・こだわり</b>を
            対話で引き出します。そういった問いを通じて、競合が真似できない固有のAdvantageを見つけます。
          </P>
          <P on="navy">
            納得できたら「戦略を確定する」ボタンを押して確定。
            確定した戦略はデータベースに保存され、次回以降も参照できます。
          </P>
        </div>
        <Shot
          src="/howto/strategy-confirm-step3.png"
          alt="AIチャット画面"
          caption="AIとの対話で戦略を深掘り。納得できたら「戦略を確定する」ボタンを押してデータベースに保存。"
          maxWidth="50%"
        />
      </div>
    </section>
  );
}

// ============================================================
// 12. STEP ③ アクション（ホワイト）
// ============================================================
function Step3Section() {
  const [openTheme, setOpenTheme] = useState(null);
  const themes = [
    { id: "marketing", label: "集客・広告", desc: "SEO対策・SNS運用・Web広告・Googleマップ・チラシ・プレスリリースの優先順位と具体施策を提案します。" },
    { id: "recruit", label: "採用コンテンツ企画", desc: "戦略から推論した採用ページのビジョン・強み・待遇案・キャリアプランを提案。Advantageが弱い場合は待遇面の差別化も提案します。" },
    { id: "website", label: "Webサイト改善", desc: "STEP①のWebサイト改善レポートをベースに、コンテンツ・デザイン・構造の改善優先事項を深掘りします。" },
    { id: "subsidy", label: "補助金申請", desc: "小規模事業者持続化補助金の計画書項目に沿って、戦略から推論した内容の概要を書き出します。" },
    { id: "copy", label: "コピーライティング", desc: "戦略メッセージをベースに、Webトップページ・バナー・DMなど各媒体向けのコピー案を生成します。" },
    { id: "sales", label: "営業資料・提案書", desc: "確定した戦略をもとに、クライアント向け提案書やセールストークの骨格を作成します。" },
    { id: "seo_content", label: "SEOコンテンツ企画", desc: "戦略のターゲットと検索意図を紐付け、優先キーワードとコンテンツ設計を提案します。" },
    { id: "sns", label: "SNS運用計画", desc: "どのSNSを使うか・どんな世界観で投稿するか・どんな頻度でどんな内容を発信するかを戦略に基づいて設計します。" },
    { id: "pricing", label: "価格・商品戦略", desc: "BenefitとAdvantageを反映した価格設計・商品ラインナップ・パッケージングの改善を提案します。" },
    { id: "general", label: "その他（自由相談）", desc: "上記テーマに限らず、確定した戦略を軸に経営全般の相談ができる汎用チャットです。" },
  ];

  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, fontFamily: BF, flexShrink: 0, boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }}>③</div>
          <Eyebrow on="white">STEP 3</Eyebrow>
        </div>
        <H2 on="white">施策テーマ別に実行計画を立て、<br />アクションとして記録・管理する</H2>
        <P on="white">
          確定した戦略を軸に、10のテーマでAIが初回アドバイスを自動生成します。
          テーマを選ぶと、AIが戦略情報を踏まえた具体的な施策提案から会話をはじめます。
          「何から手をつければいいかわからない」という状態を解消します。
        </P>
        <P on="white">
          会話を通じて合意した施策は「アクション」として登録。
          経営者が全体戦略を持ち、担当者に施策を振り分けるという
          伴走支援の理想的な流れが、このツール一本で完結します。
        </P>

        <Shot
          src="/howto/action-step3.png"
          alt="戦略アクション管理画面"
          caption="確定した戦略メッセージが常に上部に表示される。テーマ別チャットとアクションリストで施策を管理。"
        />

        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, fontFamily: BF }}>対応施策テーマ（10種類）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {themes.map((theme) => (
              <div key={theme.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setOpenTheme(openTheme === theme.id ? null : theme.id)}
                  style={{
                    width: "100%", padding: "16px 20px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: openTheme === theme.id ? C.tealLight : "#fff",
                    border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: BF }}>{theme.label}</span>
                  <span style={{ fontSize: 20, color: C.teal, transition: "transform 0.2s", transform: openTheme === theme.id ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>∨</span>
                </button>
                {openTheme === theme.id && (
                  <div style={{ padding: "14px 20px 18px", fontSize: 18, color: "#0f766e", lineHeight: 1.8, fontFamily: BF, background: C.tealLight, borderTop: `1px solid ${C.tealLightBorder}` }}>
                    {theme.desc}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 12.5 アクション出力サンプル（ネイビー）
// ============================================================
function AiH({ children }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a14", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", margin: "28px 0 10px", borderLeft: "4px solid #0d9488", paddingLeft: 14 }}>{children}</div>
  );
}
function AiP({ children }) {
  return <p style={{ fontSize: 18, color: "#334155", margin: "0 0 12px", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", lineHeight: 1.85 }}>{children}</p>;
}
function AiUL({ items }) {
  return (
    <ul style={{ margin: "8px 0 16px", paddingLeft: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, fontSize: 18, color: "#334155", marginBottom: 8, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", lineHeight: 1.7 }}>
          <span style={{ color: "#0d9488", fontWeight: 700, flexShrink: 0 }}>・</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
function AiNote({ children }) {
  return (
    <div style={{ background: "#f0fdf9", border: "1px solid #99f6e4", borderRadius: 8, padding: "14px 18px", fontSize: 16, color: "#0f766e", margin: "20px 0 4px", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif" }}>
      💡 {children}
    </div>
  );
}
function AiStep({ steps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px 0 24px" }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, fontFamily: "system-ui", flexShrink: 0 }}>
            {i + 1}
          </div>
          <div style={{ paddingTop: 6, fontSize: 18, color: "#334155", fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif", lineHeight: 1.75 }}>{step}</div>
        </div>
      ))}
    </div>
  );
}

function SeoSample() {
  return (
    <div>
      <AiP><b>前提整理：</b>メイン戦略のターゲットは「独立系コンサルタント・支援者」で、戦略メッセージは<b>「AIで戦略提案できる専門家に、資格で証明する」</b>です。このターゲットは情報感度が高く、課題を具体的なキーワードで検索します。以下4つの柱でSEO対策を提案します。</AiP>
      <AiH>1. ターゲットキーワード候補（検索意図別）</AiH>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "12px 0 24px" }}>
        {[
          { label: "課題認識・不安解消型", items: ["フリーランス ウェブコンサルタント 資格", "独立コンサルタント 提案力 上げる", "AI活用 コンサルタント 差別化", "中小企業 デジタル戦略 提案 フリーランス"] },
          { label: "解決策比較型", items: ["ウェブコンサルタント 資格 種類 比較", "ウェブ解析士 中小企業診断士 違い", "AI戦略 資格 おすすめ", "AB3C フレームワーク 資格"] },
          { label: "具体的行動型", items: ["AB3Cファシリテーター 取得 方法", "AI戦略アドバイザー 資格 申し込み", "ウェブコンサルタント 資格 取得 費用", "デジタル経営革新協会 会員"] },
        ].map((col, i) => (
          <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0d9488", marginBottom: 10, fontFamily: "system-ui" }}>{col.label}</div>
            {col.items.map((kw, j) => (
              <div key={j} style={{ fontSize: 16, color: "#334155", padding: "5px 0", borderBottom: j < col.items.length - 1 ? "1px solid #e2e8f0" : "none", fontFamily: "system-ui" }}>{kw}</div>
            ))}
          </div>
        ))}
      </div>
      <AiH>2. コンテンツ優先度 第1位</AiH>
      <div style={{ background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10, padding: "20px 24px", margin: "12px 0 20px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#ea580c", marginBottom: 10, fontFamily: "system-ui" }}>「ウェブ解析士・中小企業診断士との違いを解説｜AI×戦略特化の資格とは」</div>
        <AiP>ターゲットは資格選びで必ず比較検討します。競合資格と明確に比較し、「診断士はデジタル弱い・ウェブ解析士は戦略弱い」という差別化をロジカルに見せることで、比較検索からの流入と転換率の両方を高められます。Advantageの「なぜ良いか」をそのままコンテンツ化する発想です。</AiP>
      </div>
      <AiNote>このキーワード候補とコンテンツ計画は、戦略メッセージ「AIで戦略提案できる専門家に、資格で証明する」とターゲット像から逆算して生成されています。</AiNote>
    </div>
  );
}

function RecruitSample() {
  return (
    <div>
      <AiP><b>前提整理：</b>「採用コンテンツ」はメインターゲット（独立系コンサルタント・支援者）を会員・受講生として迎え入れるための募集コンテンツとして組み立てます。確定済みの戦略メッセージ<b>「AIで戦略提案できる専門家に、資格で証明する」</b>を軸に、以下5項目を提案します。</AiP>
      <AiH>1. ビジョン（ミッション文）の案</AiH>
      <div style={{ background: "#1a1a14", borderRadius: 10, padding: "20px 28px", margin: "12px 0 24px" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "system-ui", lineHeight: 1.75 }}>「AIを使いこなす時代に、中小企業経営者に選ばれる戦略家を一人でも多く増やす」</div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", marginTop: 10, fontFamily: "system-ui" }}>私たちは、ツールの習得ではなく"経営を設計し直す力"を独立系専門家に届けることを使命としています。</div>
      </div>
      <AiH>4. キャリアプランの案 ──「この会社でしか積めない経験」を事業戦略から逆算</AiH>
      <AiStep steps={[
        "STEP 1（参加直後）：AB3Cフレームワークで自分のサービスを構造化できるようになる",
        "STEP 2（資格取得後）：中小企業経営者へのAI活用戦略提案が、資格付きで提案できる",
        "STEP 3（コミュニティ活用後）：全国ネットワーク経由で案件紹介・協力の機会を得る",
      ]} />
      <AiH>5. 求める人物像の案</AiH>
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "20px 24px", margin: "12px 0 20px", borderLeft: "4px solid #1a6fd4" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a14", marginBottom: 14, fontFamily: "system-ui" }}>「中小企業の経営者と並走し、ツールの使い方ではなく、経営の答えを一緒に見つけたい人」</div>
        <AiUL items={["フリーランスまたは小規模法人でウェブ・マーケ・IT支援をしているが、戦略提案力に限界を感じている", "資格や実績でクライアントへの信頼性を高めたいと考えている", "AI時代に自分の価値をどう再定義するか、真剣に考えている"]} />
      </div>
      <AiNote>ビジョン・キャリアプラン・人物像はすべて、AB3C分析で確定した戦略から自動的に逆算されています。採用ページの骨格がこの一画面で揃います。</AiNote>
    </div>
  );
}

function ActionSampleSection() {
  const [activeTab, setActiveTab] = useState("seo");
  return (
    <section style={{ background: "#0a2540", padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ maxWidth: 1000, marginBottom: 52 }}>
          <Eyebrow on="navy">実際の出力サンプル</Eyebrow>
          <H2 on="navy">テーマを選ぶだけで、<br />戦略に基づく施策計画が即座に動き出す</H2>
          <P on="navy">AIはすでにあなたの会社のBenefit・Advantage・ターゲット顧客を把握しています。だから「集客を改善したい」と伝えるだけで、一般論ではなくあなたの戦略メッセージを起点にした具体的な施策提案が出てきます。以下は実際のデモ出力です。</P>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[{ id: "seo", label: "集客・SEO対策" }, { id: "recruit", label: "採用コンテンツ企画" }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "12px 28px", borderRadius: 32, border: `2px solid ${activeTab === tab.id ? "#0d9488" : "rgba(255,255,255,0.28)"}`, fontSize: 18, fontFamily: "system-ui", fontWeight: activeTab === tab.id ? 700 : 400, background: activeTab === tab.id ? "#0d9488" : "transparent", color: "#fff", cursor: "pointer", transition: "all 0.2s" }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "40px 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf9", borderRadius: 6, padding: "5px 14px", marginBottom: 28, fontSize: 16, color: "#0f766e", fontWeight: 700, fontFamily: "system-ui" }}>
            ▶ テーマ選択後の初回AI出力（サンプル：デジタル経営革新協会）
          </div>
          {activeTab === "seo" ? <SeoSample /> : <RecruitSample />}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 13. コンサル・制作会社向け（ティール帯）
// ============================================================
function AgencySection() {
  return (
    <section style={{ background: C.teal, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="teal">コンサルタント・Web制作会社の方へ</Eyebrow>
        <H2 on="teal">複数クライアントの戦略を継続管理する、<br />伴走支援の基盤として。</H2>
        <P on="teal">
          戦略指南AIを最も活かせるのは、複数のクライアントを継続的に支援する伴走支援のシーンです。
          初回訪問でURLを入力して分析を取得し、経営者と一緒に「選ばれる理由」を言語化し、
          戦略をベースに各施策の方針を組み立て、担当者にアクションを振り分けていく。
          そのサイクルをこのツール一本で管理できます。
        </P>
        <P on="teal">
          登録した各サイトの戦略確定履歴・チャット履歴・アクションリストはデータベースに保存されます。
          次回訪問時に前回の続きからすぐに入れるため、
          クライアントごとの経緯を手元のメモに頼らずに管理できます。
        </P>
        <Callout on="teal">
          15サイトプラン（月¥330,000）なら、1社あたりの原価は¥22,000。<br />
          伴走支援サービスへの組み込みに十分な水準です。
        </Callout>
      </div>
    </section>
  );
}

// ============================================================
// 14. 伴走シナリオ（ホワイト）
// ============================================================
function ScenarioSection() {
  const steps = [
    { phase: "初回訪問", title: "クライアントURLを入力 → AB3C診断（30秒）", detail: "その場でクライアントに分析結果を見せながら「これはどういう意味ですか？」と深掘りの対話をはじめる。「競合との違いが弱い」というチェックポイントを起点に、改善の方向性を一緒に考える。" },
    { phase: "同日", title: "AIチャットで戦略メッセージを確定", detail: "弱点を指摘し、「選ばれる理由」を一緒に言語化。クライアントが「そうそう、これが言いたかった」と感じるまで磨き上げる。戦略メッセージを確定して次のフェーズへ進む。" },
    { phase: "翌週以降", title: "テーマ別施策をアクション化し、担当者に振り分け", detail: "集客・採用・サイト改善など10テーマでAIが初回アドバイスを生成。クライアント内の担当者ごとにアクションを振り分けて管理。「誰が・何を・いつ行うか」を明確にする。" },
    { phase: "次回訪問", title: "戦略・進捗を確認・更新", detail: "確定した戦略と蓄積されたチャット履歴・アクション記録が残っているので、前回の続きからすぐに入れる。施策の進捗を確認し、戦略を微修正しながら伴走を続ける。" },
    { phase: "提案時", title: "PPT/PDFエクスポートで提案書に活用", detail: "分析結果をPowerPoint形式・PDF形式でエクスポート。そのまま提案書に組み込める品質で出力される。" },
  ];

  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="white">伴走支援シナリオ</Eyebrow>
        <H2 on="white">クライアント1社の伴走支援——<br />典型的な活用の流れ</H2>
        <P on="white">以下は、コンサルタントや制作会社が戦略指南AIを使った場合の典型的な伴走支援の流れです。</P>

        <div style={{ position: "relative", margin: "36px 0" }}>
          <div style={{ position: "absolute", left: 23, top: 0, bottom: 0, width: 2, background: C.tealLightBorder }} />
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 20, marginBottom: 28, position: "relative" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, fontFamily: BF, flexShrink: 0, zIndex: 1, boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }}>{i + 1}</div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "inline-block", background: C.teal, color: "#fff", fontSize: 14, fontWeight: 700, padding: "2px 10px", borderRadius: 3, fontFamily: BF, marginBottom: 8 }}>{s.phase}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF, lineHeight: 1.4 }}>{s.title}</div>
                <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.8, fontFamily: BF }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 15. PPTサンプル（ライトティール）
// ============================================================
function PptSection() {
  return (
    <section style={{ background: C.tealLight, padding: "80px 20px", borderTop: `1px solid ${C.tealLightBorder}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="tealLight">サンプルダウンロード</Eyebrow>
        <H2 on="tealLight">提案書として使えるPowerPointを<br />無料でダウンロードできます。</H2>
        <P on="tealLight">
          戦略指南AIの分析結果はPowerPoint形式・PDF形式でエクスポートできます。
          実際の出力イメージを確認するために、サンプルファイルをご用意しました。
          登録不要・完全無料でダウンロードできます。
        </P>

        <div style={{ background: "#fff", border: `2px solid ${C.teal}`, borderRadius: 12, padding: "32px 32px", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap", boxShadow: "0 4px 20px rgba(13,148,136,0.12)" }}>
          <div style={{ width: 72, height: 72, background: "#d04020", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 28, color: "#fff", fontWeight: 700, fontFamily: BF }}>PPT</span>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 6, fontFamily: BF }}>戦略分析サンプルファイル</div>
            <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, fontFamily: BF, marginBottom: 14 }}>AB3C分析の出力例をPowerPoint形式でご確認いただけます。実際の提案書への転用イメージをつかんでください。</div>
            <a
              href="/samples/analyze_sample.pptx"
              download
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.teal, color: "#fff", borderRadius: 8, padding: "14px 24px", fontSize: 18, fontWeight: 700, fontFamily: BF, textDecoration: "none", boxShadow: "0 3px 10px rgba(13,148,136,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(13,148,136,0.50)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(13,148,136,0.35)"; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              サンプルPPTをダウンロード（無料）
            </a>
            <div style={{ marginTop: 10, fontSize: 16, color: C.muted, fontFamily: BF }}>.pptx 形式 · 登録不要 · 無料</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 中間CTA 2（ティール）
// ============================================================
function MidCtaSection2() { return <MidCta text="無料で1サイト診断してみる" />; }

// ============================================================
// 16. 料金（ネイビー）
// ============================================================
function PricingSection() {
  return (
    <section style={{ background: C.navy, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="navy">料金プラン</Eyebrow>
        <H2 on="navy">まず1サイト、無料で試せます。</H2>
        <P on="navy">
          Googleアカウントでログインするだけで、1サイト分の診断が無料で使えます。
          クレジットカードの登録も不要です。
          本格的に導入する前に、実際の分析品質を確認してください。
        </P>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, margin: "36px 0" }}>
          {/* 診断チケット */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "30px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(94,234,212,0.60)", letterSpacing: "0.08em", marginBottom: 10, fontFamily: BF }}>単発・スポット利用</div>
            <div style={{ fontFamily: H, fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16, lineHeight: 1.4 }}>戦略診断チケット</div>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.88)", lineHeight: 1.85, margin: "0 0 20px", fontFamily: BF }}>
              URL入力 → AB3C診断 + サイト改善レポートをワンショットで出力。PDF・PPT・シェアURLで提案書に組み込めます。AIチャット機能なし。有効期限1年。
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "1サイト", price: "¥22,000", note: "/ 年" },
                { label: "10サイト", price: "¥110,000", note: "/ 年（1サイト ¥11,000）" },
                { label: "100サイト", price: "¥770,000", note: "/ 年（1サイト ¥7,700）" },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", paddingBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none" }}>
                  <div style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", fontFamily: BF }}>{r.label}</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: BF }}>{r.price}</span>
                    <span style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", fontFamily: BF }}>{r.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* サブスク */}
          <div style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.45)", borderRadius: 12, padding: "30px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(94,234,212,0.70)", letterSpacing: "0.08em", marginBottom: 10, fontFamily: BF }}>継続・伴走支援向け</div>
            <div style={{ fontFamily: H, fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16, lineHeight: 1.4 }}>戦略指南サブスク</div>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.72)", lineHeight: 1.85, margin: "0 0 20px", fontFamily: BF }}>
              診断機能に加えて、AIチャットで戦略を磨く「策定」フェーズと、施策テーマ別に実行する「アクション」フェーズまで使えます。チャット履歴・確定戦略・アクションリストはDBに保存されます。
            </p>
            <div style={{ borderTop: "1px solid rgba(94,234,212,0.20)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "1サイト", price: "¥66,000", note: "/ 月" },
                { label: "5サイト", price: "¥165,000", note: "/ 月" },
                { label: "15サイト", price: "¥330,000", note: "/ 月（正会員プラン）" },
                { label: "30サイト", price: "¥495,000", note: "/ 月" },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", paddingBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(94,234,212,0.15)" : "none" }}>
                  <div style={{ fontSize: 18, color: "#ccfbf1", fontFamily: BF }}>{r.label}</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: BF }}>{r.price}</span>
                    <span style={{ fontSize: 16, color: "rgba(94,234,212,0.50)", fontFamily: BF }}>{r.note}</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="/pricing" style={{ display: "block", textAlign: "center", background: C.teal, color: "#fff", borderRadius: 8, padding: "14px", marginTop: 20, fontSize: 18, textDecoration: "none", fontFamily: BF, fontWeight: 600, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >全プランの詳細を見る →</a>
          </div>
        </div>

        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.40)", textAlign: "center", fontFamily: BF }}>
          すべて税込。詳細は{" "}
          <a href="/pricing" style={{ color: "#5eead4", fontWeight: 600, textDecoration: "underline" }}>料金ページ</a>
          をご確認ください。
        </p>
      </div>
    </section>
  );
}

// ============================================================
// 17. 制作者プロフィール（ホワイト）
// ============================================================
function CreatorSection() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="white">なぜ汎用AIとは違うのか</Eyebrow>
        <H2 on="white">24年の実務知見が、<br />このツールの骨格です。</H2>
        <P on="white">
          戦略指南AIは、汎用AIにAB3Cのプロンプトを書かせたものではありません。
          権成俊が24年間のウェブコンサルティングで磨いてきた戦略策定の実フロー——
          「何を、どの順番で、どう問うか」——をそのままAIで再現したサービスです。
        </P>
        <CreatorProfileBlock />
      </div>
    </section>
  );
}

// ============================================================
// 18. FAQ（ライトティール）
// ============================================================
function FaqSection() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: "URLのないサービスや商品でも使えますか？", a: "はい、使えます。URL入力のほかに、テキスト入力モードがあります。事業内容・強み・ターゲットなどを自由に書き込んで分析することが可能です。Webサイト改善レポートはURL分析時のみ生成されます。" },
    { q: "クライアントに直接使わせることはできますか？", a: "現時点では、コンサルタント・制作会社のみなさんがクライアントの代わりに操作する形を想定しています。クライアントが自分でログインして使う機能は準備中です。" },
    { q: "ChatGPTやGeminiとどう違うのですか？", a: "汎用AIはあらゆる質問に答えられる一方、戦略の整合性をフレームワークに沿って保ち続けることが苦手です。戦略指南AIはAB3Cフレームワークを骨格として、ターゲット・ベネフィット・アドバンテージの整合性を自動でチェックしながら分析・対話を進めます。「一般論」ではなく「その会社固有の戦略」を引き出すために設計されています。" },
    { q: "1つのアカウントで複数のクライアントを管理できますか？", a: "はい、できます。クライアントのサイトをそれぞれ登録し、戦略・チャット・アクションを別々に管理できます。戦略診断チケット（100サイト）なら100クライアント分、戦略指南サブスク（15サイトプラン）なら15サイト分を一括管理できます。" },
    { q: "試してみたいのですが、何が必要ですか？", a: "Googleアカウントがあればすぐに始められます。クレジットカードの登録は不要です。ログイン後、1サイト分の診断を無料でお試しいただけます。" },
    { q: "分析結果はPDFやPowerPointに出力できますか？", a: "はい。分析結果をPDF形式・PowerPoint形式でエクスポートできます。提案書への組み込みやクライアントへの報告資料として活用できます。" },
    { q: "AIチャットで言語化した戦略は、どこに保存されますか？", a: "戦略指南サブスクでは、戦略確定内容・チャット履歴・アクションリストがすべてデータベースに保存されます。ブラウザを閉じても、次回ログイン時に続きから使えます。戦略診断チケットはチャット機能なし・履歴保存なしの仕様です。" },
  ];

  return (
    <section style={{ background: C.tealLight, padding: "96px 20px 80px", borderTop: `1px solid ${C.tealLightBorder}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow on="tealLight">よくある質問</Eyebrow>
        <H2 on="tealLight">FAQ</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.tealLightBorder}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(13,148,136,0.06)" }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: open === i ? C.tealLight : "#fff", border: "none", cursor: "pointer", textAlign: "left", gap: 12, transition: "background 0.15s" }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: BF, lineHeight: 1.5, flex: 1 }}>{faq.q}</span>
                <span style={{ fontSize: 20, color: C.teal, transition: "transform 0.2s", transform: open === i ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", flexShrink: 0, marginTop: 2 }}>∨</span>
              </button>
              {open === i && (
                <div style={{ padding: "14px 22px 20px", fontSize: 18, color: "#0f766e", lineHeight: 1.85, fontFamily: BF, background: C.tealLight, borderTop: `1px solid ${C.tealLightBorder}` }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 19. 締めCTA（ネイビー）
// ============================================================
function ClosingSection() {
  return (
    <section style={{ background: C.navy, padding: "96px 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2 style={{ fontFamily: H, fontSize: 34, fontWeight: 700, color: "#fff", margin: "0 0 20px", lineHeight: 1.6 }}>
          まず1サイト、無料で試してください。
        </h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.88)", lineHeight: 1.9, margin: "0 0 16px", fontFamily: BF }}>
          Googleアカウントでログインするだけで、すぐに使えます。<br />クレジットカードの登録も不要です。
        </p>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", lineHeight: 1.9, margin: "0 0 40px", fontFamily: BF }}>
          URLを入力して、30秒で分析結果が出てきます。<br />「うちの戦略、こういうことか」と感じていただけるはずです。
        </p>
        <CtaButton label="無料で1サイト診断してみる" size="lg" />
        <div style={{ marginTop: 14, fontSize: 16, color: "rgba(255,255,255,0.35)", fontFamily: BF }}>
          ご不明点は{" "}
          <a href="/contact" style={{ color: "#5eead4", textDecoration: "underline" }}>お問い合わせ</a>
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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: BF }}>
      <Header />
      <main>
        {/* ネイビー     */} <Hero />

        {/* ホワイト     */} <AiMarketingQuestion />
        {/* ライトティール */} <PartialOptimalSection />
        {/* ホワイト     */} <UpstreamSection />
        {/* ネイビー     */} <AiLimitSection />
        {/* ティール帯   */} <MidCtaSection1 />
        {/* ネイビー     */} <WhatIsSection />
        {/* ホワイト     */} <Ab3cSection />
        {/* ネイビー     */} <StrategyMessageSection />
        {/* ライトティール */} <OutputAsPromptSection />
        {/* ホワイト     */} <Step1Section />
        {/* ライトティール */} <ReportDetailSection />
        {/* ネイビー     */} <Step2Section />
        {/* ホワイト     */} <Step3Section />
        {/* ネイビー     */} <ActionSampleSection />
        {/* ティール帯   */} <StatsSection />
        {/* ティール帯   */} <AgencySection />
        {/* ホワイト     */} <ScenarioSection />
        {/* ライトティール */} <PptSection />
        {/* ティール帯   */} <MidCtaSection2 />
        {/* ネイビー     */} <PricingSection />
        {/* ホワイト     */} <CreatorSection />
        {/* ライトティール */} <FaqSection />
        {/* ネイビー     */} <ClosingSection />
      </main>
      <Footer />
    </div>
  );
}
