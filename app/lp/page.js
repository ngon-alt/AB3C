"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CreatorProfileBlock from "../components/CreatorProfileBlock";

// ============================================================
// 戦略指南AI — LP（ナラティブ型・ビジュアル重視）
// ターゲット: コンサルタント・Web制作会社
// 構成: 問い → 問題提起 → 戦略の必要性 → 解決策 → 機能 → 伴走支援 → 料金
// ============================================================

const C = {
  ab3cB: "#FF0000",   // Benefit 専用（赤）
  ab3cA: "#1a6fd4",   // Advantage 専用（青）
  ink: "#1a1a14",
  muted: "#78716c",
  bg: "#f5f2eb",
  surface: "#ffffff",
  border: "#ddd8cc",
  highlight: "#fef3c7",
  altBg: "#f0ebe0",
  accent: "#2a2a26",
};
const H = "'Noto Serif JP', serif";
const BF = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";
const TW = 780;  // 本文カラム幅
const WW = 1040; // ワイドカラム幅（図解・スクショ）

// ============================================================
// 共通コンポーネント
// ============================================================

function CtaButton({ label = "無料で1サイト診断してみる", size = "md" }) {
  const { data: session } = useSession();
  const go = () => session ? (window.location.href = "/") : signIn("google", { callbackUrl: "/" });
  return (
    <button type="button" onClick={go} style={{
      background: C.accent, color: "#fff", border: "none", borderRadius: 8,
      padding: size === "lg" ? "18px 48px" : "14px 30px",
      fontSize: size === "lg" ? 20 : 18, fontWeight: 700, fontFamily: BF,
      cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
      transition: "transform 0.15s, box-shadow 0.15s", display: "inline-block",
      lineHeight: 1.5, letterSpacing: "0.01em",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.36)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.28)"; }}
    >{label}</button>
  );
}

// ブラウザモック付きスクリーンショット
function Shot({ src, alt, caption }) {
  return (
    <figure style={{ margin: "32px 0" }}>
      <div style={{
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          background: "#ddd8cc", padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4f4f","#f0b429","#29c640"].map((col, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: col }} />
            ))}
          </div>
          <div style={{
            flex: 1, background: C.surface, borderRadius: 5,
            padding: "3px 12px", fontSize: 13, color: C.muted,
            fontFamily: BF, border: `1px solid ${C.border}`,
            maxWidth: 300,
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

// 中間 CTA バナー
function MidCta({ text = "まず無料で1サイト試してみる" }) {
  return (
    <div style={{ background: C.altBg, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "36px 20px", textAlign: "center" }}>
      <p style={{ fontSize: 18, color: C.muted, margin: "0 0 16px", fontFamily: BF }}>
        読み進める前に、実際に触れてみてください。
      </p>
      <CtaButton label={text} />
      <div style={{ marginTop: 10, fontSize: 16, color: C.muted, fontFamily: BF }}>
        Googleアカウントで即日スタート · クレジットカード不要
      </div>
    </div>
  );
}

// セクションラベル（eyebrow）
function Eyebrow({ children, dark = false }) {
  return (
    <div style={{
      display: "inline-block", fontSize: 16, fontWeight: 700,
      letterSpacing: "0.12em", color: dark ? "#908880" : C.muted,
      fontFamily: BF, marginBottom: 14, textTransform: "uppercase",
    }}>{children}</div>
  );
}

// 大見出し
function H2({ children, dark = false, center = false }) {
  return (
    <h2 style={{
      fontFamily: H, fontSize: 32, fontWeight: 700,
      color: dark ? "#fff" : C.ink, lineHeight: 1.55,
      margin: "0 0 24px", textAlign: center ? "center" : "left",
    }}>{children}</h2>
  );
}

// 本文段落
function P({ children, dark = false, style: extra = {} }) {
  return (
    <p style={{
      fontSize: 18, color: dark ? "#c0bab0" : C.ink,
      lineHeight: 2.0, margin: "0 0 20px", fontFamily: BF, ...extra,
    }}>{children}</p>
  );
}

// ハイライトボックス
function Callout({ children, dark = false }) {
  return (
    <div style={{
      background: dark ? "rgba(255,255,255,0.06)" : C.highlight,
      border: dark ? "1px solid rgba(255,255,255,0.14)" : `1px solid ${C.border}`,
      borderLeft: dark ? `4px solid rgba(255,255,255,0.3)` : `4px solid ${C.ink}`,
      borderRadius: 8, padding: "20px 24px",
      fontSize: 18, color: dark ? "#d4cfc7" : C.ink,
      lineHeight: 1.9, fontFamily: BF, margin: "28px 0",
    }}>{children}</div>
  );
}

// ============================================================
// 1. ヒーロー
// ============================================================
function Hero() {
  return (
    <section style={{ background: C.accent, padding: "80px 20px 0" }}>
      <div style={{ maxWidth: TW, margin: "0 auto", paddingBottom: 60 }}>
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.22)", color: "#b8b2a8",
          fontSize: 16, fontWeight: 700, letterSpacing: "0.12em",
          padding: "6px 18px", borderRadius: 3, marginBottom: 24, fontFamily: BF,
        }}>
          コンサルタント・Web制作会社向け
        </div>

        <h1 style={{
          fontFamily: H, fontSize: 42, fontWeight: 700, color: "#fff",
          lineHeight: 1.5, margin: "0 0 24px", letterSpacing: "0.02em",
        }}>
          「AIでマーケティングができる」<br />は、本当ですか？
        </h1>

        <p style={{ fontSize: 22, color: "#fff", fontWeight: 700, lineHeight: 1.7, margin: "0 0 12px", fontFamily: BF }}>
          はい、できます。ただし、条件があります。
        </p>
        <p style={{ fontSize: 18, color: "#a09890", lineHeight: 1.9, margin: "0 0 40px", fontFamily: BF }}>
          その条件を満たすために生まれたのが、戦略指南AIです。<br />
          マーケティングの「上流」にある戦略を、AIがサポートします。
        </p>

        <CtaButton label="無料で1サイト診断してみる" size="lg" />
        <div style={{ marginTop: 14, fontSize: 16, color: "#686058", fontFamily: BF }}>
          Googleアカウントで即日スタート · クレジットカード不要
        </div>
      </div>

      {/* ヒーロースクリーンショット */}
      <div style={{ maxWidth: WW, margin: "0 auto", padding: "0 20px" }}>
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
// 2. AIとマーケティング — 何が問われているのか
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
        <Eyebrow>AIとマーケティング</Eyebrow>
        <H2>多くの人が持っている疑問。<br />「AIってマーケティングに使えるの？」</H2>

        <P>
          ChatGPTやGeminiが普及するなかで、こんなことを試みた人は多いはずです。
          SNSの投稿文を作らせる。SEOに強いコンテンツを書かせる。
          サイトのデザインや文章を改善させる。
          いずれも「それらしい答え」が出てきます。
        </P>
        <P>
          なんとなく分かるし、実際に使えそうな気もする。でも、本当に正解なのか、
          これで成果が出るのかと問われると、自信を持って「はい」と言えない。
          そういう感覚、ありませんか。
        </P>

        {/* 具体的な依頼例 */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 12, margin: "32px 0",
        }}>
          {examples.map((ex, i) => (
            <div key={i} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "18px 20px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{
                display: "inline-block", background: C.ink, color: "#fff",
                fontSize: 16, fontWeight: 700, padding: "3px 12px",
                borderRadius: 3, fontFamily: BF, alignSelf: "flex-start",
              }}>{ex.label}</div>
              <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.75, fontFamily: BF, fontStyle: "italic" }}>
                {ex.desc}
              </div>
            </div>
          ))}
        </div>

        <P>
          こうした依頼は、確かに汎用AIで「こなす」ことができます。
          しかし実際にやってみると、少し経ってから気づくことがあります。
        </P>

        <Callout>
          各施策は「もっともらしい」のに、全体を通して見ると<b>一本の線を引けない</b>。<br />
          SNSで伝えていること、SEOで書いていること、サイトで語っていること——<br />
          それぞれがバラバラに動いている、という感覚。
        </Callout>

        <P>
          これが、汎用AIをマーケティングに使うときに起きる「部分最適」の問題です。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 3. 部分最適 — 比較ダイアグラム
// ============================================================
function PartialOptimalSection() {
  return (
    <section style={{ background: C.altBg, padding: "80px 20px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ maxWidth: TW }}>
          <Eyebrow>なぜ部分最適になるのか</Eyebrow>
          <H2>一問一答の構造が、<br />施策をバラバラにする。</H2>
          <P>
            汎用AIは「一問一答」の構造で動きます。
            SNSについて聞けばSNSの答えを出す。
            SEOについて聞けばSEOの答えを出す。
            それぞれの問いに対して、それぞれの「正解」を返します。
          </P>
          <P>
            問題は、その答えどうしが<b>互いを意識していない</b>ことです。
            「SNSでこう伝える」という答えと、「SEOでこう書く」という答えが、
            同じターゲットに向けた同じメッセージとして設計されていない。
            だから全体として一本の軸が通らないのです。
          </P>
        </div>

        {/* 比較ダイアグラム */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "40px 0" }}>
          {/* 左: 汎用AI */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "28px 24px",
          }}>
            <div style={{
              fontSize: 16, fontWeight: 700, letterSpacing: "0.08em",
              color: C.muted, marginBottom: 20, fontFamily: BF, textAlign: "center",
            }}>汎用AI（一問一答）</div>

            {[
              { q: "Q. SNSに何を投稿すればいい？", a: "「ためになる情報を毎日コツコツと発信しましょう」" },
              { q: "Q. SEOキーワードは？", a: "「検索ボリュームの高いキーワードを中心に記事を」" },
              { q: "Q. ウェブサイトの改善点は？", a: "「動画コンテンツを増やすとエンゲージメントが上がります」" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{
                  background: "#f0ebe0", border: `1px solid ${C.border}`,
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
          <div style={{ background: C.accent, borderRadius: 12, padding: "28px 24px" }}>
            <div style={{
              fontSize: 16, fontWeight: 700, letterSpacing: "0.08em",
              color: "#908880", marginBottom: 20, fontFamily: BF, textAlign: "center",
            }}>戦略指南AI（フレームワーク）</div>

            {/* 上流 */}
            <div style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 8, padding: "16px 18px", marginBottom: 10,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: BF }}>
                AB3C分析（戦略の上流）
              </div>
              <div style={{ fontSize: 16, color: "#b0aaa0", fontFamily: BF, lineHeight: 1.7 }}>
                誰に・何を・なぜ選ばれるのか<br />を一気通貫で定義する
              </div>
            </div>
            <div style={{ textAlign: "center", color: "#484440", fontSize: 22, margin: "8px 0" }}>↓</div>

            {/* 戦略確定 */}
            <div style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "12px 16px", marginBottom: 10, textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#d4cfc7", fontFamily: BF }}>
                戦略メッセージが確定
              </div>
            </div>
            <div style={{ textAlign: "center", color: "#484440", fontSize: 22, margin: "8px 0" }}>↓</div>

            {/* 施策群 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["SNS投稿", "SEOコンテンツ", "サイト改善"].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ color: "#60c060", fontWeight: 700, fontSize: 18 }}>✓</span>
                  <span style={{ fontSize: 16, color: "#c8c2b8", fontFamily: BF }}>{item}（戦略軸で統一）</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 24, borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 16,
              textAlign: "center", fontSize: 18, fontWeight: 700,
              color: "#90c8ff", fontFamily: BF, lineHeight: 1.7,
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
// 4. 数字で見る
// ============================================================
function StatsSection() {
  const stats = [
    { num: "30秒", label: "URL入力から分析完了まで" },
    { num: "10", label: "施策テーマ対応数" },
    { num: "¥7,700", label: "1サイトあたりの最低単価" },
    { num: "24年", label: "考案者のウェブ業界歴" },
  ];

  return (
    <section style={{ background: C.ink, padding: "64px 20px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "32px 20px",
              borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
              <div style={{ fontFamily: H, fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 10 }}>
                {s.num}
              </div>
              <div style={{ fontSize: 16, color: "#787068", fontFamily: BF, lineHeight: 1.6 }}>
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
// 5. マーケティングには「上流」がある
// ============================================================
function UpstreamSection() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>問題の本質</Eyebrow>
        <H2>マーケティングには「上流」がある。<br />その上流こそが、戦略だ。</H2>

        <P>
          SNS投稿もSEOも広告も、マーケティングの「下流」の活動です。
          下流は、上流が決まっていてはじめて意味を持ちます。
          上流とは何か。それは「戦略」です。
        </P>
        <P>
          戦略とは、次の3つの問いへの答えです。
          これが決まっていない状態でSNSを投稿しても、「誰でもいいから集客する」ための投稿になります。
          SEOコンテンツを書いても、「誰に向けていいか分からない、素敵な文章」になります。
        </P>

        {/* 上流/下流 フロー図 */}
        <div style={{ margin: "36px 0" }}>
          {/* 上流: 戦略 */}
          <div style={{
            background: C.accent, borderRadius: 12,
            padding: "28px 28px", marginBottom: 12,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.10em", color: "#787068", marginBottom: 16, fontFamily: BF }}>
              上流 — 戦略
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "ターゲット", sub: "誰のために、何の悩みを解決するのか", border: "rgba(255,255,255,0.25)" },
                { label: "Benefit（ベネフィット）", sub: "お客様が得る価値は何か（ニーズ→ウォンツ）", color: C.ab3cB, border: C.ab3cB },
                { label: "Advantage（アドバンテージ）", sub: "競合ではなく自社を選ぶ理由は何か", color: C.ab3cA, border: C.ab3cA },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${item.border || "rgba(255,255,255,0.14)"}`,
                  borderRadius: 8, padding: "16px 16px",
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: item.color || "#fff", marginBottom: 6, fontFamily: BF, lineHeight: 1.4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 16, color: "#908880", lineHeight: 1.7, fontFamily: BF }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 矢印 */}
          <div style={{ textAlign: "center", color: C.border, fontSize: 28, margin: "4px 0" }}>↓</div>

          {/* 下流: 施策 */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "24px 28px",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.10em", color: C.muted, marginBottom: 16, fontFamily: BF }}>
              下流 — 施策（マーケティング活動）
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["SNS投稿", "SEOコンテンツ", "Web広告", "サイト改善", "採用コンテンツ", "補助金申請", "提案書"].map((item, i) => (
                <div key={i} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "8px 16px",
                  fontSize: 16, color: C.muted, fontFamily: BF,
                }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 18, color: C.muted, fontFamily: BF, lineHeight: 1.7 }}>
              → 上流が決まっていれば、どの施策も同じ軸で設計できる。
            </div>
          </div>
        </div>

        <P>
          上流なき下流は、労力を消費しながら成果を出せません。
          どれだけ素晴らしいコンテンツを書いても、誰に届けたいのか・なぜ選ばれるのかが
          定義されていなければ、それは「投げっぱなし」の施策になります。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 6. 汎用AIで戦略を立てる難しさ
// ============================================================
function AiLimitSection() {
  return (
    <section style={{ background: C.altBg, padding: "96px 20px 80px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>汎用AIの限界</Eyebrow>
        <H2>「では、ChatGPTで戦略を<br />立てればいいのでは？」</H2>

        <P>
          確かに、不可能ではありません。
          「ターゲットを教えてください」「強みは何ですか」「競合との違いは？」と
          一つひとつ質問することはできます。
        </P>
        <P>
          しかし実際に試してみると、壁にぶつかります。
        </P>

        {/* 具体的な問題例 */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "28px 28px", margin: "28px 0",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 20, fontFamily: BF }}>
            汎用AIで戦略を立てようとすると、こうなる
          </div>
          {[
            {
              step: "1",
              q: "「うちのターゲット顧客を教えてください」",
              a: "「中小企業の経営者や、ウェブマーケティングに課題を持つ担当者が考えられます」",
              problem: "どの会社にも当てはまる。この会社固有の答えではない。",
            },
            {
              step: "2",
              q: "「うちの強みは何ですか？」",
              a: "「お客様のニーズに寄り添ったサービス、地域密着型のサポート、迅速な対応が挙げられます」",
              problem: "これも同様。競合も同じことを言っている。",
            },
            {
              step: "3",
              q: "「先ほどのターゲット向けの戦略メッセージを作ってください」",
              a: "「地域のお客様に選ばれる、信頼と実績のサービスを提供します」",
              problem: "ターゲット・強み・メッセージの整合性がとれていない。",
            },
          ].map((item, i, arr) => (
            <div key={i} style={{
              borderBottom: i < arr.length - 1 ? `1px dashed ${C.border}` : "none",
              paddingBottom: i < arr.length - 1 ? 20 : 0, marginBottom: i < arr.length - 1 ? 20 : 0,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: C.ink,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, flexShrink: 0, fontFamily: BF,
                }}>{item.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, color: C.ink, fontFamily: BF, fontWeight: 600, marginBottom: 6, lineHeight: 1.5 }}>
                    {item.q}
                  </div>
                  <div style={{ fontSize: 16, color: C.muted, fontFamily: BF, fontStyle: "italic", marginBottom: 8, lineHeight: 1.6 }}>
                    AI: {item.a}
                  </div>
                  <div style={{ fontSize: 16, color: "#b84040", fontFamily: BF, lineHeight: 1.6, fontWeight: 600 }}>
                    問題: {item.problem}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <P>
          戦略の本質は「整合性」にあります。
          ターゲット・ベネフィット・アドバンテージの3要素が一本の軸でつながっているかどうか。
          一つを変えれば他も見直す必要があり、その相互関係を常に意識しながら
          対話を続けることが求められます。
        </P>

        <Callout>
          汎用AIで戦略を正しく立てるには、<b>すでに戦略を知っている人間</b>が必要です。<br />
          戦略リテラシーのない状態で汎用AIを使っても、
          部分最適の答えを集めることしかできません。
        </Callout>
      </div>
    </section>
  );
}

// ============================================================
// 中間 CTA
// ============================================================
function MidCtaSection1() {
  return <MidCta />;
}

// ============================================================
// 7. 戦略指南AIとは
// ============================================================
function WhatIsSection() {
  return (
    <section style={{ background: C.accent, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow dark>解決策</Eyebrow>
        <H2 dark>戦略指南AIは、マーケティングの「上流」を<br />AIでサポートするツールです。</H2>

        <P dark>
          AB3Cフレームワーク（ベネフィット・アドバンテージ・3C分析）に沿って、
          クライアントの事業戦略の骨格を短時間・高精度で言語化します。
          URLを入力するだけで分析がはじまり、AIとの対話で戦略を磨き上げ、
          各施策への展開まで一気通貫でサポートします。
        </P>
        <P dark>
          汎用AIと根本的に異なるのは、戦略フレームワークがあらかじめ組み込まれていることです。
          「次に何を聞けばいいか」「どこが弱いか」「整合性がとれているか」——
          これらを戦略の文法に沿って自動的に判断します。
          20年以上のコンサルティング実務から磨き上げた、AB3Cフレームワークが土台です。
        </P>
      </div>

      {/* スクリーンショット: 分析中 */}
      <div style={{ maxWidth: WW, margin: "48px auto 0", padding: "0 20px" }}>
        <Shot
          src="/howto/分析中.png"
          alt="戦略指南AI 分析中の画面"
          caption="URLを入力後、AB3Cの各要素が順番に生成される。自動で競合調査・市場分析を行い、約30秒で骨格が完成。"
        />
      </div>
    </section>
  );
}

// ============================================================
// 8. AB3Cフレームワーク
// ============================================================
function Ab3cSection() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>フレームワーク</Eyebrow>
        <H2>AB3C分析——<br />「選ばれる理由」を明らかにする戦略フレームワーク</H2>

        <P>
          AB3Cはウェブ業界歴24年の権成俊が考案した、事業戦略を「可視化」するための思考フレームワークです。
          「なぜ自社は選ばれるのか」「どんな価値を届けるのか」「誰に届けるのか」を
          一枚の構造図に収めます。
        </P>

        {/* B / A / 3C カラーボックス */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "36px 0" }}>
          {/* B */}
          <div style={{
            display: "flex", gap: 20, alignItems: "stretch",
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `6px solid ${C.ab3cB}`, borderRadius: 8,
            overflow: "hidden",
          }}>
            <div style={{
              background: C.ab3cB, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 72, padding: "0 8px",
              fontFamily: H, fontSize: 36, fontWeight: 700,
            }}>B</div>
            <div style={{ padding: "20px 20px 20px 4px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF }}>
                Benefit（ベネフィット）
              </div>
              <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.8, fontFamily: BF }}>
                お客様が求める価値。「ニーズ（課題解決）」と「ウォンツ（欲望・感情）」の両軸で定義します。
                ここが曖昧だと、どんな施策も刺さりません。
              </div>
            </div>
          </div>

          {/* A */}
          <div style={{
            display: "flex", gap: 20, alignItems: "stretch",
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `6px solid ${C.ab3cA}`, borderRadius: 8,
            overflow: "hidden",
          }}>
            <div style={{
              background: C.ab3cA, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 72, padding: "0 8px",
              fontFamily: H, fontSize: 36, fontWeight: 700,
            }}>A</div>
            <div style={{ padding: "20px 20px 20px 4px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF }}>
                Advantage（アドバンテージ）
              </div>
              <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.8, fontFamily: BF }}>
                競合ではなく自社を選ぶ理由。「好ましい違い」と表現します。
                「最高品質」「丁寧な対応」のような主観では不十分。
                本人が確信を持って語れる、具体的な根拠が必要です。
              </div>
            </div>
          </div>

          {/* 3C */}
          <div style={{
            display: "flex", gap: 20, alignItems: "stretch",
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `6px solid ${C.ink}`, borderRadius: 8,
            overflow: "hidden",
          }}>
            <div style={{
              background: C.ink, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 72, padding: "0 4px",
              fontFamily: H, fontSize: 30, fontWeight: 700,
            }}>3C</div>
            <div style={{ padding: "20px 20px 20px 4px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF }}>
                Customer · Competitor · Company
              </div>
              <div style={{ fontSize: 18, color: C.ink, lineHeight: 1.8, fontFamily: BF }}>
                顧客（Customer）・競合（Competitor）・自社（Company）の3つの視点。
                戦略はこの3Cを同時に見ることで整合性を持ちます。
                自社だけを見ていては、差別化は生まれません。
              </div>
            </div>
          </div>
        </div>

        <P>
          AB3Cの核は「BenefitとAdvantageが整合している状態」です。
          「これだから選ばれる（Advantage）、そしてその選ばれる理由がお客様の求めるもの（Benefit）に
          ぴったり応えている」——この状態を作ることが、戦略策定の目標です。
        </P>

        {/* スクリーンショット: 分析結果の概要 */}
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
// 9. 出力がプロンプトになる
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
    <section style={{ background: C.altBg, padding: "96px 20px 80px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>出力の使い方</Eyebrow>
        <H2>戦略指南AIの出力が、<br />すべての生成AIへの「プロンプト」になる。</H2>

        <P>
          戦略指南AIが整理した戦略の情報——ターゲット定義、ベネフィット、アドバンテージ、
          戦略メッセージ——はそのまま「他のAIへの指示文」として使えます。
        </P>
        <P>
          テキスト以外の領域（デザイン生成・画像生成・動画制作など）では、
          専門ツールを使った方が品質が高まります。
          そのときに必要なのが「前提情報」としての戦略テキストです。
          戦略指南AIが出力した戦略メッセージやターゲット定義を
          Canva・Midjourney・その他の生成AIに渡すことで、
          ブレのないアウトプットが生まれます。
        </P>

        {/* 出力一覧 */}
        <div style={{ margin: "32px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{
            background: C.surface, border: `2px solid ${C.ink}`,
            borderRadius: 10, padding: "20px 22px", textAlign: "center",
            fontFamily: H, fontSize: 22, fontWeight: 700, color: C.ink,
          }}>
            戦略指南AI の出力
          </div>
          <div style={{ textAlign: "center", color: C.border, fontSize: 24 }}>↓</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {outputs.map((item, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "14px 18px",
              }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4, fontFamily: BF }}>{item.from}</div>
                <div style={{ fontSize: 16, color: C.muted, fontFamily: BF, lineHeight: 1.6 }}>{item.to}</div>
              </div>
            ))}
          </div>
        </div>

        <P>
          「戦略指南AIの中でも文章は生成できるのでは？」——その通りです。
          テキスト生成は戦略指南AIの中で完結できます。
          ただ、デザインや映像など非テキスト領域については、
          各専門ツールを活用するのが現実的です。
          そのための「前提情報」を戦略指南AIで用意できる、と考えてください。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 10. STEP ① 診断
// ============================================================
function Step1Section() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ maxWidth: TW }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: C.accent,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, fontFamily: BF, flexShrink: 0,
            }}>①</div>
            <Eyebrow>STEP 1</Eyebrow>
          </div>
          <H2>URLを入力して、AB3C診断</H2>

          <P>
            クライアントのサイトURLを入力するだけで分析がはじまります。
            競合調査・顧客ニーズ分析・自社分析を自動で行い、
            ベネフィット・アドバンテージ・3Cの構造で結果を生成します。
            URLがなくても、テキスト入力から分析することも可能です。
          </P>
          <P>
            URL分析の場合は、AB3C分析と同時に<b>Webサイト改善レポート</b>も生成されます。
            現在のサイトがAB3C戦略と整合しているかを自動チェックし、
            コンテンツ・デザイン・構造ごとに改善優先事項を提示します。
          </P>
        </div>

        {/* スクリーンショット2枚 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
          <Shot
            src="/howto/URL入力.png"
            alt="URL入力画面"
            caption="URLを貼り付けて「分析開始」を押すだけ。"
          />
          <Shot
            src="/howto/ウェブサイト改善レポート生成中.png"
            alt="Webサイト改善レポート生成中"
            caption="AB3C分析と並行して、Webサイト改善レポートも自動生成。"
          />
        </div>

        {/* チェックポイント機能 */}
        <div style={{ maxWidth: TW, marginTop: 32 }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "24px 26px",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 14, fontFamily: BF }}>
              AB3Cチェックポイント機能
            </div>
            <P>
              分析結果には「チェックポイント」が自動付与されます。
              ベネフィットとアドバンテージの整合性、競合との差別化の明確さ、
              市場規模の妥当性など、5つの観点で弱点を可視化します。
              「どこを改善すべきか」の根拠を持って、クライアントに提案できます。
            </P>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 11. STEP ② 策定
// ============================================================
function Step2Section() {
  return (
    <section style={{ background: C.altBg, padding: "96px 20px 80px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: WW, margin: "0 auto" }}>
        <div style={{ maxWidth: TW }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: C.accent,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, fontFamily: BF, flexShrink: 0,
            }}>②</div>
            <Eyebrow>STEP 2</Eyebrow>
          </div>
          <H2>AIチャットで戦略を磨き、<br />戦略メッセージを確定する</H2>

          <P>
            診断結果をベースに、AIとの対話で戦略を深掘りします。
            分析結果のどの要素にカーソルを当てても、その場でAIへの質問を送れます。
            「この強みの根拠は何ですか？」「競合との違いをもっと明確にするには？」——
            弱点を指摘し、「選ばれる理由」を言語化するまで一緒に考えます。
          </P>
          <P>
            AI秘書機能では、経営者が言語化できていない<b>価値観・原体験・こだわり</b>を
            対話で引き出します。「なぜこの仕事をしているのか」「どんな顧客に最も価値を届けられるか」——
            そういった問いを通じて、競合が真似できない固有のAdvantageを見つけます。
          </P>
          <P>
            納得できたら「戦略を確定する」ボタンを押して確定。
            確定した戦略はデータベースに保存され、次回以降も参照できます。
          </P>
        </div>

        {/* スクリーンショット */}
        <Shot
          src="/howto/chat-bubble-step2.png"
          alt="AIチャット画面"
          caption="各分析要素にカーソルを当てると「チャットで質問」ボタンが表示される。弱点をその場で深掘りできる。"
        />
      </div>
    </section>
  );
}

// ============================================================
// 12. STEP ③ アクション
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: C.accent,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, fontFamily: BF, flexShrink: 0,
          }}>③</div>
          <Eyebrow>STEP 3</Eyebrow>
        </div>
        <H2>施策テーマ別に実行計画を立て、<br />アクションとして記録・管理する</H2>

        <P>
          確定した戦略を軸に、10のテーマでAIが初回アドバイスを自動生成します。
          テーマを選ぶと、AIが戦略情報を踏まえた具体的な施策提案から会話をはじめます。
          「何から手をつければいいかわからない」という状態を解消します。
        </P>
        <P>
          会話を通じて合意した施策は「アクション」として登録。
          誰が・何を・いつ行うかをリスト化し、進捗を管理できます。
          経営者が全体戦略を持ち、担当者に施策を振り分けるという
          伴走支援の理想的な流れが、このツール一本で完結します。
        </P>

        {/* スクリーンショット */}
        <Shot
          src="/howto/strategy-confirm-step3.png"
          alt="戦略確定・アクション管理画面"
          caption="確定した戦略メッセージが常に上部に表示される。テーマ別チャットとアクションリストで施策を管理。"
        />

        {/* 10テーマ アコーディオン */}
        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 16, fontFamily: BF }}>
            対応施策テーマ（10種類）
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {themes.map((theme) => (
              <div key={theme.id} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, overflow: "hidden",
              }}>
                <button
                  type="button"
                  onClick={() => setOpenTheme(openTheme === theme.id ? null : theme.id)}
                  style={{
                    width: "100%", padding: "16px 20px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: BF }}>
                    {theme.label}
                  </span>
                  <span style={{
                    fontSize: 20, color: C.muted, transition: "transform 0.2s",
                    transform: openTheme === theme.id ? "rotate(180deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}>
                    ∨
                  </span>
                </button>
                {openTheme === theme.id && (
                  <div style={{
                    padding: "0 20px 18px", fontSize: 18, color: C.muted,
                    lineHeight: 1.8, fontFamily: BF, borderTop: `1px solid ${C.border}`,
                    paddingTop: 14,
                  }}>
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
// 13. コンサル・制作会社向け — 伴走支援シナリオ
// ============================================================
function AgencySection() {
  return (
    <section style={{ background: C.accent, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow dark>コンサルタント・Web制作会社の方へ</Eyebrow>
        <H2 dark>複数クライアントの戦略を継続管理する、<br />伴走支援の基盤として。</H2>

        <P dark>
          戦略指南AIを最も活かせるのは、複数のクライアントを継続的に支援する伴走支援のシーンです。
          初回訪問でURLを入力して分析を取得し、経営者と一緒に「選ばれる理由」を言語化し、
          戦略をベースに各施策の方針を組み立て、担当者にアクションを振り分けていく。
          そのサイクルをこのツール一本で管理できます。
        </P>
        <P dark>
          登録した各サイトの戦略確定履歴・チャット履歴・アクションリストはデータベースに保存されます。
          次回訪問時に前回の続きからすぐに入れるため、
          クライアントごとの経緯を手元のメモに頼らずに管理できます。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 14. 伴走シナリオ（タイムライン）
// ============================================================
function ScenarioSection() {
  const steps = [
    {
      phase: "初回訪問",
      title: "クライアントURLを入力 → AB3C診断（30秒）",
      detail: "その場でクライアントに分析結果を見せながら「これはどういう意味ですか？」と深掘りの対話をはじめる。「競合との違いが弱い」というチェックポイントを起点に、改善の方向性を一緒に考える。",
    },
    {
      phase: "同日",
      title: "AIチャットで戦略メッセージを確定",
      detail: "弱点を指摘し、「選ばれる理由」を一緒に言語化。クライアントが「そうそう、これが言いたかった」と感じるまで磨き上げる。戦略メッセージを確定して次のフェーズへ進む。",
    },
    {
      phase: "翌週以降",
      title: "テーマ別施策をアクション化し、担当者に振り分け",
      detail: "集客・採用・サイト改善など10テーマでAIが初回アドバイスを生成。クライアント内の担当者ごとにアクションを振り分けて管理。「誰が・何を・いつ行うか」を明確にする。",
    },
    {
      phase: "次回訪問",
      title: "戦略・進捗を確認・更新",
      detail: "確定した戦略と蓄積されたチャット履歴・アクション記録が残っているので、前回の続きからすぐに入れる。施策の進捗を確認し、戦略を微修正しながら伴走を続ける。",
    },
    {
      phase: "提案時",
      title: "PPT/PDFエクスポートで提案書に活用",
      detail: "分析結果をPowerPoint形式・PDF形式でエクスポート。そのまま提案書に組み込める品質で出力される。クライアント報告・社内共有・新規提案のシーンで活用できる。",
    },
  ];

  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>伴走支援シナリオ</Eyebrow>
        <H2>クライアント1社の伴走支援——<br />典型的な活用の流れ</H2>

        <P>
          以下は、コンサルタントや制作会社が戦略指南AIを使った場合の
          典型的な伴走支援の流れです。
        </P>

        <div style={{ position: "relative", margin: "36px 0" }}>
          {/* タイムライン縦線 */}
          <div style={{
            position: "absolute", left: 22, top: 0, bottom: 0,
            width: 2, background: C.border,
          }} />

          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 20, marginBottom: 28, position: "relative" }}>
              {/* ドット */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: C.accent, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, fontFamily: BF,
                flexShrink: 0, zIndex: 1, lineHeight: 1.3, textAlign: "center",
              }}>{s.phase.replace("訪問","").replace("回","").split("").slice(0,2).join("")}</div>

              {/* コンテンツ */}
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "18px 20px", flex: 1,
              }}>
                <div style={{
                  display: "inline-block", background: C.ink, color: "#fff",
                  fontSize: 14, fontWeight: 700, padding: "2px 10px",
                  borderRadius: 3, fontFamily: BF, marginBottom: 8,
                }}>{s.phase}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: BF, lineHeight: 1.4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.8, fontFamily: BF }}>
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <P>
          15サイト（正会員プラン）なら、月¥330,000で15社のクライアントを継続的に支援できます。
          1社あたりの原価は¥22,000。伴走支援サービスへの組み込みに十分な水準です。
        </P>
      </div>
    </section>
  );
}

// ============================================================
// 15. PPT サンプルダウンロード
// ============================================================
function PptSection() {
  return (
    <section style={{ background: C.altBg, padding: "80px 20px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>サンプルダウンロード</Eyebrow>
        <H2>提案書として使えるPowerPointを<br />無料でダウンロードできます。</H2>

        <P>
          戦略指南AIの分析結果はPowerPoint形式・PDF形式でエクスポートできます。
          実際の出力イメージを確認するために、サンプルファイルをご用意しました。
          クライアントへの提案書への組み込み方の参考にしてください。
          登録不要・完全無料でダウンロードできます。
        </P>

        <div style={{
          background: C.surface, border: `2px solid ${C.ink}`,
          borderRadius: 12, padding: "32px 32px",
          display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap",
        }}>
          {/* ファイルアイコン */}
          <div style={{
            width: 72, height: 72, background: "#d04020",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 28, color: "#fff", fontWeight: 700, fontFamily: BF }}>PPT</span>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 6, fontFamily: BF }}>
              戦略分析サンプルファイル
            </div>
            <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, fontFamily: BF, marginBottom: 14 }}>
              AB3C分析の出力例をPowerPoint形式でご確認いただけます。
              実際の提案書への転用イメージをつかんでください。
            </div>
            <a
              href="/samples/analyze_sample.pptx"
              download
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: C.accent, color: "#fff",
                borderRadius: 8, padding: "14px 24px",
                fontSize: 18, fontWeight: 700, fontFamily: BF,
                textDecoration: "none",
                boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.26)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.18)"; }}
            >
              {/* ダウンロードアイコン */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              サンプルPPTをダウンロード（無料）
            </a>
            <div style={{ marginTop: 10, fontSize: 16, color: C.muted, fontFamily: BF }}>
              .pptx 形式 · 登録不要 · 無料
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 中間 CTA 2
// ============================================================
function MidCtaSection2() {
  return <MidCta text="無料で1サイト診断してみる" />;
}

// ============================================================
// 16. 料金プラン
// ============================================================
function PricingSection() {
  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px" }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>料金プラン</Eyebrow>
        <H2>まず1サイト、無料で試せます。</H2>

        <P>
          Googleアカウントでログインするだけで、1サイト分の診断が無料で使えます。
          クレジットカードの登録も不要です。
          本格的に導入する前に、実際の分析品質を確認してください。
        </P>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, margin: "36px 0" }}>
          {/* 診断チケット */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "30px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", marginBottom: 10, fontFamily: BF }}>
              単発・スポット利用
            </div>
            <div style={{ fontFamily: H, fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 16, lineHeight: 1.4 }}>
              戦略診断チケット
            </div>
            <P>
              URL入力 → AB3C診断 + サイト改善レポートをワンショットで出力。
              PDF・PPT・シェアURLで提案書に組み込めます。
              AIチャット機能なし。有効期限1年。
            </P>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "1サイト", price: "¥22,000", note: "/ 年" },
                { label: "10サイト", price: "¥110,000", note: "/ 年（1サイト ¥11,000）" },
                { label: "100サイト", price: "¥770,000", note: "/ 年（1サイト ¥7,700）" },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", gap: 8, flexWrap: "wrap",
                  paddingBottom: i < arr.length - 1 ? 12 : 0,
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ fontSize: 18, color: C.ink, fontFamily: BF }}>{r.label}</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: BF }}>{r.price}</span>
                    <span style={{ fontSize: 16, color: C.muted, fontFamily: BF }}>{r.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* サブスク */}
          <div style={{ background: C.accent, borderRadius: 12, padding: "30px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#787068", letterSpacing: "0.08em", marginBottom: 10, fontFamily: BF }}>
              継続・伴走支援向け
            </div>
            <div style={{ fontFamily: H, fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16, lineHeight: 1.4 }}>
              戦略指南サブスク
            </div>
            <p style={{ fontSize: 18, color: "#b0aaa0", lineHeight: 1.85, margin: "0 0 20px", fontFamily: BF }}>
              診断機能に加えて、AIチャットで戦略を磨く「策定」フェーズと、
              施策テーマ別に実行する「アクション」フェーズまで使えます。
              チャット履歴・戦略確定・アクションリストはデータベースに保存されます。
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "1サイト", price: "¥66,000", note: "/ 月" },
                { label: "5サイト", price: "¥165,000", note: "/ 月" },
                { label: "15サイト", price: "¥330,000", note: "/ 月（正会員プラン）" },
                { label: "30サイト", price: "¥495,000", note: "/ 月" },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", gap: 8, flexWrap: "wrap",
                  paddingBottom: i < arr.length - 1 ? 12 : 0,
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.12)" : "none",
                }}>
                  <div style={{ fontSize: 18, color: "#c8c2b8", fontFamily: BF }}>{r.label}</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: BF }}>{r.price}</span>
                    <span style={{ fontSize: 16, color: "#787068", fontFamily: BF }}>{r.note}</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="/pricing" style={{
              display: "block", textAlign: "center",
              background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#e0dbd0", borderRadius: 8, padding: "14px",
              marginTop: 20, fontSize: 18, textDecoration: "none",
              fontFamily: BF, fontWeight: 600, transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
            >
              全プランの詳細を見る →
            </a>
          </div>
        </div>

        <p style={{ fontSize: 16, color: C.muted, textAlign: "center", fontFamily: BF }}>
          すべて税込。キャンペーン価格を含む詳細は{" "}
          <a href="/pricing" style={{ color: C.ink, fontWeight: 600, textDecoration: "underline" }}>料金ページ</a>
          をご確認ください。
        </p>
      </div>
    </section>
  );
}

// ============================================================
// 17. 制作者プロフィール
// ============================================================
function CreatorSection() {
  return (
    <section style={{ background: C.altBg, padding: "96px 20px 80px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>なぜ汎用AIとは違うのか</Eyebrow>
        <H2>24年の実務知見が、<br />このツールの骨格です。</H2>
        <P>
          戦略指南AIは、汎用AIにAB3Cのプロンプトを書かせたものではありません。
          権成俊が24年間のウェブコンサルティングで磨いてきた戦略策定の実フロー——
          「何を、どの順番で、どう問うか」——をそのままAIで再現したサービスです。
        </P>
        <P>
          その差は、使ってみれば分かります。汎用AIで同じ質問をしても、
          一般論しか返ってこない。戦略指南AIは「あなたの会社固有の戦略」を引き出すために
          設計されています。
        </P>
        <CreatorProfileBlock />
      </div>
    </section>
  );
}

// ============================================================
// 18. FAQ
// ============================================================
function FaqSection() {
  const [open, setOpen] = useState(null);

  const faqs = [
    {
      q: "URLのないサービスや商品でも使えますか？",
      a: "はい、使えます。URL入力のほかに、テキスト入力モードがあります。事業内容・強み・ターゲットなどを自由に書き込んで分析することが可能です。Webサイト改善レポートはURL分析時のみ生成されます。",
    },
    {
      q: "クライアントに直接使わせることはできますか？",
      a: "現時点では、コンサルタント・制作会社のみなさんがクライアントの代わりに操作する形を想定しています。クライアントが自分でログインして使う機能は準備中です。",
    },
    {
      q: "ChatGPTやGeminiとどう違うのですか？",
      a: "汎用AIはあらゆる質問に答えられる一方、戦略の整合性をフレームワークに沿って保ち続けることが苦手です。戦略指南AIはAB3Cフレームワークを骨格として、ターゲット・ベネフィット・アドバンテージの整合性を自動でチェックしながら分析・対話を進めます。「一般論」ではなく「その会社固有の戦略」を引き出すために設計されています。",
    },
    {
      q: "1つのアカウントで複数のクライアントを管理できますか？",
      a: "はい、できます。クライアントのサイトをそれぞれ登録し、戦略・チャット・アクションを別々に管理できます。戦略診断チケット（100サイト）なら100クライアント分、戦略指南サブスク（15サイトプラン）なら15サイト分を一括管理できます。",
    },
    {
      q: "試してみたいのですが、何が必要ですか？",
      a: "Googleアカウントがあればすぐに始められます。クレジットカードの登録は不要です。ログイン後、1サイト分の診断を無料でお試しいただけます。",
    },
    {
      q: "分析結果はPDFやPowerPointに出力できますか？",
      a: "はい。分析結果をPDF形式・PowerPoint形式でエクスポートできます。提案書への組み込みやクライアントへの報告資料として活用できます。サンプルファイルのダウンロードもこのページから行えます。",
    },
    {
      q: "AIチャットで言語化した戦略は、どこに保存されますか？",
      a: "戦略指南サブスクでは、戦略確定内容・チャット履歴・アクションリストがすべてデータベースに保存されます。ブラウザを閉じても、次回ログイン時に続きから使えます。戦略診断チケットはチャット機能なし・履歴保存なしの仕様です。",
    },
  ];

  return (
    <section style={{ background: C.bg, padding: "96px 20px 80px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: TW, margin: "0 auto" }}>
        <Eyebrow>よくある質問</Eyebrow>
        <H2>FAQ</H2>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, overflow: "hidden",
            }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", padding: "18px 22px",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: BF, lineHeight: 1.5, flex: 1 }}>
                  {faq.q}
                </span>
                <span style={{
                  fontSize: 20, color: C.muted, transition: "transform 0.2s",
                  transform: open === i ? "rotate(180deg)" : "rotate(0deg)",
                  display: "inline-block", flexShrink: 0, marginTop: 2,
                }}>
                  ∨
                </span>
              </button>
              {open === i && (
                <div style={{
                  padding: "0 22px 20px",
                  fontSize: 18, color: C.muted, lineHeight: 1.85, fontFamily: BF,
                  borderTop: `1px solid ${C.border}`, paddingTop: 16,
                }}>
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
// 19. 締め CTA
// ============================================================
function ClosingSection() {
  return (
    <section style={{ background: C.accent, padding: "96px 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2 style={{ fontFamily: H, fontSize: 34, fontWeight: 700, color: "#fff", margin: "0 0 20px", lineHeight: 1.6 }}>
          まず1サイト、無料で試してください。
        </h2>
        <p style={{ fontSize: 18, color: "#c0bab0", lineHeight: 1.9, margin: "0 0 16px", fontFamily: BF }}>
          Googleアカウントでログインするだけで、すぐに使えます。<br />
          クレジットカードの登録も不要です。
        </p>
        <p style={{ fontSize: 18, color: "#908880", lineHeight: 1.9, margin: "0 0 40px", fontFamily: BF }}>
          URLを入力して、30秒で分析結果が出てきます。<br />
          「うちの戦略、こういうことか」と感じていただけるはずです。
        </p>
        <CtaButton label="無料で1サイト診断してみる" size="lg" />
        <div style={{ marginTop: 14, fontSize: 16, color: "#686058", fontFamily: BF }}>
          ご不明点は{" "}
          <a href="/contact" style={{ color: "#908880", textDecoration: "underline" }}>お問い合わせ</a>
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
        <Hero />
        <AiMarketingQuestion />
        <PartialOptimalSection />
        <StatsSection />
        <UpstreamSection />
        <AiLimitSection />
        <MidCtaSection1 />
        <WhatIsSection />
        <Ab3cSection />
        <OutputAsPromptSection />
        <Step1Section />
        <Step2Section />
        <Step3Section />
        <AgencySection />
        <ScenarioSection />
        <PptSection />
        <MidCtaSection2 />
        <PricingSection />
        <CreatorSection />
        <FaqSection />
        <ClosingSection />
      </main>
      <Footer />
    </div>
  );
}
