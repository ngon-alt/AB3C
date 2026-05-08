"use client";
import Header from "../components/Header";
import Footer from "../components/Footer";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#78716c", highlight: "#f0ebe0",
  phase1: "#2a2a26", phase2: "#2a2a26",
};

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 16, borderLeft: "4px solid " + C.phase1, paddingLeft: 14 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.phase1, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "20px 24px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

export default function HowtoPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
    <main style={{ padding: "40px 20px 100px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink }}>初めての方へ — 使い方ガイド</div>
          <div style={{ fontSize: 16, color: C.ink, marginTop: 8 }}>戦略指南 AIの全機能と使い方を説明します。</div>
        </div>

        {/* 戦略指南 AIとは */}
        <Section title="戦略指南 AIとは" icon="🏯">
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "24px 28px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 16, lineHeight: 1.7 }}>
              経営の根本となる「戦略」の策定を支援するAIツールです。
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 10 }}>こんな方のために生まれました</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { icon: "👤", label: "経営者", desc: "戦略策定が苦手で、自社の「選ばれる理由」を言語化したい方" },
                { icon: "💼", label: "コンサルタント", desc: "クライアントの戦略を大量に検討する必要がある方" },
                { icon: "🎨", label: "デザイナー・クリエイター", desc: "手を動かすのは得意だが、戦略の裏付けがほしい方" },
                { icon: "📊", label: "営業マン", desc: "クライアントに手軽に戦略を提案したい方" },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ background: "#f8f8f6", border: "1px solid " + C.border, borderRadius: 6, padding: "14px 16px" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.highlight, borderRadius: 6, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8 }}>
                従来、AIは「答えのない問い」＝戦略のような領域は苦手とされてきました。しかし、<b>AB3C分析</b>というフレームワークを導入することで、高い精度で戦略策定ができるようになりました。
              </div>
            </div>
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8 }}>
              戦略指南 AIは戦略を策定するだけではありません。戦略を策定した後には<b>「戦略アクション」</b>機能を使って、SEO・SNS・広告・採用・補助金など、たくさんの具体的な施策を企画することができます。
            </div>
          </div>
        </Section>

        {/* 全体の流れ */}
        <Section title="全体の流れ" icon="🗺️">
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "URL入力", icon: "🌐", color: C.phase1 },
                { label: "AB3C分析", icon: "🔍", color: C.phase1 },
                { label: "サイト改善レポート", icon: "🔧", color: C.phase1 },
                { label: "チャットで深掘り", icon: "💬", color: C.phase1 },
                { label: "戦略確定", icon: "✅", color: C.phase1 },
                { label: "戦略アクション", icon: "🎯", color: C.phase2 },
                { label: "実行", icon: "🚀", color: C.phase2 },
              ].map(function(step, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28 }}>{step.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: step.color, marginTop: 4 }}>{step.label}</div>
                    </div>
                    {i < 6 && <div style={{ fontSize: 20, color: C.muted }}>→</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* 使い方 — 戦略策定フェーズ */}
        <Section title="使い方 — 戦略策定フェーズ" icon="📖">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* STEP 1: URL入力・分析 */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.phase1, marginBottom: 12 }}>STEP 1 — URLを入力して分析する</div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 12 }}>
                すでにウェブサイトをお持ちなら、URLを入力して「分析する」ボタンを押すだけ。ウェブサイトの内容を読み取り、あなたの事業の戦略をAIがアドバイスしてくれます。
              </div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 12 }}>
                同時に<b>ウェブサイト改善レポート</b>も書き出されます。このレポートだけを見るだけでも、サイトの大幅な改善が可能です。
              </div>
              <div style={{ background: C.highlight, borderRadius: 6, padding: "12px 16px", fontSize: 14, color: C.ink }}>
                💡 新規事業の立案時など、ウェブサイトがない場合は「テキストで入力」タブから事業概要を自由に記述して分析できます。
              </div>
            </div>

            {/* STEP 2: チャットで深掘り */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.phase1, marginBottom: 12 }}>STEP 2 — チャットで戦略を磨き上げる</div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 12 }}>
                分析結果を受けて、疑問に思うところをチャットで相談しましょう。「これはどういう意味？」「私としてはこうしたいんだけど、ウェブサイトでは伝わっていないかな」といったことを話し合うことで、よりイメージする戦略にAIが理解を深めていきます。
              </div>

              {/* 吹き出しアイコンからチャットに送る機能の説明 */}
              <div style={{ background: C.highlight, borderRadius: 6, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.phase1, marginBottom: 8 }}>
                  💡 分析結果の各項目から直接チャットへ
                </div>
                <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.8, marginBottom: 12 }}>
                  分析結果のセクションや各項目にカーソルを合わせると、右上に <b style={{ color: C.phase1 }}>💬 吹き出しアイコン</b> が表示されます。クリックすると、その項目に関する質問が自動でチャット欄に送られ、AIに直接相談できます。
                </div>
                <div style={{ background: "#fff", border: "1px solid " + C.border, borderRadius: 6, padding: "8px", textAlign: "center" }}>
                  <img
                    src="/howto/chat-bubble-step2.png"
                    alt="分析結果の各項目に表示される💬吹き出しアイコン"
                    style={{ maxWidth: "50%", height: "auto", borderRadius: 4 }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 8, fontStyle: "italic" }}>
                    ↑ Benefitセクションやニーズの各項目にホバーすると💬アイコンが表示されます
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8 }}>
                そして<b>「この会話内容を分析に反映する」</b>ボタンを押すと、チャットの内容も含めて、より精度の高い戦略分析結果を書き出してくれます。これを繰り返すことで、戦略がどんどん磨かれていきます。
              </div>
            </div>

            {/* STEP 3: 戦略確定 */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.phase1, marginBottom: 12 }}>STEP 3 — 戦略を確定する</div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 12 }}>
                「この戦略で良い」と思ったら、チャットパネルの一番下にある<b>「戦略を確定して ② 戦略アクションへ →」</b>ボタンを押しましょう。戦略が確定したら、それに紐づいて様々な施策を検討できる<b>戦略アクションタブ</b>が有効になります。
              </div>
              <div style={{ background: "#fff", border: "1px solid " + C.border, borderRadius: 6, padding: "8px", textAlign: "center" }}>
                <img
                  src="/howto/strategy-confirm-step3.png"
                  alt="チャットパネル下部のボタン群（チャットに送信・分析に反映・戦略を確定する）"
                  style={{ maxWidth: "50%", height: "auto", borderRadius: 4 }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div style={{ fontSize: 13, color: C.muted, marginTop: 8, fontStyle: "italic" }}>
                  ↑ 一番下の大きなボタンが「戦略を確定して ② 戦略アクションへ →」です
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 使い方 — 戦略アクションフェーズ */}
        <Section title="使い方 — 戦略アクションフェーズ" icon="🎯">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 16 }}>
                戦略アクションタブでは、SEO・SNS・Web広告・採用・補助金など<b>10の項目</b>について、確定した戦略に則った具体的なアクションのアドバイスがもらえます。項目に分類されないアクションについても、新規で追加することが可能です。
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { icon: "🔍", label: "SEO対策" }, { icon: "📱", label: "SNS運用" },
                  { icon: "📣", label: "Web広告" }, { icon: "📍", label: "Googleマップ" },
                  { icon: "📄", label: "チラシ・DM" }, { icon: "📰", label: "プレスリリース" },
                  { icon: "🔧", label: "ウェブサイト改善" }, { icon: "👥", label: "採用コンテンツ企画" },
                  { icon: "📋", label: "補助金申請" }, { icon: "💼", label: "営業資料・提案書" },
                ].map(function(item, i) {
                  return (
                    <div key={i} style={{ background: "#f8f8f6", border: "1px solid " + C.border, borderRadius: 6, padding: "10px 14px", fontSize: 15, fontWeight: 600 }}>
                      {item.icon} {item.label}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 12 }}>
                アクションについてチャットで話し合い、「これはぜひやりたい」と思うものがあれば、<b>アクションリストに登録</b>していってください。アクションリストが、あなたの経営を改善していくための施策のリストとなります。
              </div>
              <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8 }}>
                そのリストを持って、担当者に指示を出しましょう。施策を実行していく中で戦略を見直したくなった場合は、改めてサイト分析を行い、戦略を再度確定し直すことができます。
              </div>
            </div>
          </div>
        </Section>

        {/* サイト管理 */}
        <Section title="サイト管理" icon="📋">
          <Card title="複数サイトを一元管理">
            ヘッダーの「サイト管理」ボタンからダッシュボードにアクセスできます。サイトの追加・名前変更・削除、分析結果の確認ができます。
          </Card>
          <div style={{ marginTop: 16 }}>
            <Step number="1" title="サイトを登録" desc="ダッシュボードの「新規サイト登録」からサイト名やURLを入力して登録します。プランに応じてサイト数の上限があります。" />
            <Step number="2" title="サイトを切り替え" desc="ヘッダーのプルダウンメニューから分析中のサイトを切り替えられます。" />
            <Step number="3" title="分析を開く" desc="ダッシュボードのサイトカードから「分析を開く」をクリックすると、保存された分析結果が復元されます。" />
          </div>
        </Section>

        {/* AB3C分析結果の見方 */}
        <Section title="AB3C分析結果の見方" icon="📊">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "B — Benefit（お客様が求める価値）", color: C.B, desc: "ニーズ（欠乏感・曖昧な欲求）とウォンツ（具体的欲求）の両面から、お客様が本当に求めている価値を分析します。" },
              { label: "A — Advantage（差別的優位点）", color: C.A, desc: "競合との「好ましい違い」を明らかにします。なぜお客様に選ばれるのか、なぜ真似されにくいのかを示します。" },
              { label: "3C — Customer · Competitor · Company", color: C.C, desc: "お客様（ターゲット・市場規模）・競合（直接競合・異業種競合）・自社（強み・仕組み・価値観）の3つの視点で事業を構造化します。" },
              { label: "戦略メッセージ = Benefit + Advantage", color: C.phase1, desc: "「選ばれる理由」を一言で表現したメッセージ。ウェブサイト・営業資料・採用ページなど、すべての発信の核心になります。" },
              { label: "5つのチェックポイント", color: C.ink, desc: "AB3Cが成立しているかを5つの観点で評価します。✅（OK）⚠️（注意）❌（NG）で現状の課題が一目でわかります。" },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ background: C.surface, border: "1px solid " + C.border, borderLeft: "4px solid " + item.color, borderRadius: 4, padding: "14px 18px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, lineHeight: 1.7, color: C.ink }}>{item.desc}</div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 戦略パターン（3つの組み合わせ） */}
        <Section title="戦略パターン（3つの組み合わせ）" icon="🎯">
          <Card title="AIが3つの戦略パターンを提案">
            分析を実行すると、AIは「ターゲット × ベネフィット × アドバンテージ」の組み合わせ方を3パターン提案します。それぞれが独立した完全なAB3C分析になっており、別のターゲット・別の競合・別の強みで構成されています。AB3C戦略分析レポートの上部にあるピル型の切替ボタン（P1ローズ・P2紫・P3茶）で、いつでも切り替えて見比べられます。
          </Card>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 6 }}>⭐ AIのおすすめ表示</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}>3パターンのうち、AIが最も成立しやすいと判断した1つに「⭐ おすすめ」が付きます。最初はそのパターンが選ばれた状態で表示されます。</div>
            </div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 6 }}>🔄 パターンごとに連動</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}>切替ボタンを押すと、AB3C分析・改善レポート・ファーストビューイメージのすべてがそのパターン用の内容に切り替わります（必要に応じて自動生成）。</div>
            </div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 6 }}>💾 パターンごとに戦略確定</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}>各パターンを「戦略を確定する」で個別に確定できます。確定履歴サイドバーには、それぞれが別エントリとして残ります。</div>
            </div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 6 }}>🎨 色で対応関係が分かる</div>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}>選択中のパターンと「現在表示中」帯のアクセントが同じ色（ローズ/紫/茶）になります。AB3C原則の赤・青・黒は使わず、別の3色で区別。</div>
            </div>
          </div>
        </Section>

        {/* ウェブサイト改善レポート */}
        <Section title="ウェブサイト改善レポート" icon="🔧">
          <Card title="URL分析時に自動生成">
            URLで分析を行うと、AB3C分析に加えてウェブサイト改善レポートが自動生成されます。分析結果の下部に表示され、以下の3つの観点から具体的な改善提案が行われます。
          </Card>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px", borderTop: "3px solid " + C.A }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.A, marginBottom: 6 }}>追加すべきコンテンツ</div>
              <div style={{ fontSize: 14, color: C.ink }}>戦略メッセージを伝えるために不足しているページや情報</div>
            </div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px", borderTop: "3px solid " + C.B }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.B, marginBottom: 6 }}>デザイン・ビジュアル改善</div>
              <div style={{ fontSize: 14, color: C.ink }}>ターゲットに刺さるデザインの方向性</div>
            </div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "14px", borderTop: "3px solid " + C.C }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.C, marginBottom: 6 }}>サイト構造の改善</div>
              <div style={{ fontSize: 14, color: C.ink }}>ユーザー導線、CTA配置の最適化</div>
            </div>
          </div>
        </Section>

        {/* データの保存について */}
        <Section title="データの保存と注意事項" icon="⚠️">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>✅ 保存される情報</div>
              <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>分析結果・改善レポート — データベースに保存されます</li>
                <li>戦略確定履歴 — データベースに保存されます</li>
                <li>戦略アクションのチャット履歴・施策・アクションリスト — データベースに保存されます</li>
                <li>サイト管理のサイト一覧 — データベースに保存されます</li>
              </ul>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 10, lineHeight: 1.7 }}>
                同じアカウントでログインしていれば、別のブラウザ・別のデバイスからでも続きから利用できます。
              </div>
            </div>
            <div style={{ background: "#fdf0ef", border: "1px solid #f5c6cb", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ データが消えるケース</div>
              <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li><b>サイト管理でサイトを削除した場合</b> — そのサイトに関するすべての情報（分析結果・確定履歴・チャット履歴・アクション）が削除されます</li>
                <li><b>サイト切替直後など、保存処理が完了する前にブラウザを閉じた場合</b> — 直近数秒の入力分が失われる可能性があります</li>
              </ul>
            </div>
            <div style={{ background: "#d4edda", border: "1px solid #c3e6cb", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 8 }}>💡 推奨事項</div>
              <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>重要な分析結果は「シェアURL発行」や「印刷・PDF保存」で持ち帰っておくと安心です</li>
                <li>戦略が固まったら「戦略を確定」を押して、確定スナップショットを残しておきましょう</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* シェア・印刷 */}
        <Section title="シェア・印刷機能" icon="📤">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="🔗 シェアURL発行（全パターン）">
              分析結果を共有するためのURLを発行できます。<b>3つの戦略パターンすべて</b>がシェアURLに含まれ、シェア先の方も同じピル型ボタンでパターンを切り替えて見られます。Google NotebookLMに読み込ませると、スライド資料の自動生成にも使えます。
            </Card>
            <Card title="🖨️ 表示中のパターンを印刷・PDF">
              <b>現在切り替えているパターン</b>を印刷・PDF保存します。他のパターンを保存したい場合は、そのパターンに切り替えてから押してください。提案書や社内資料として活用できます。
            </Card>
          </div>
        </Section>

        {/* Web制作者・コンサルタント向け */}
        <div id="for-professionals" style={{ marginBottom: 40, border: "2px solid " + C.A, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: C.A, padding: "16px 24px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.12em", marginBottom: 4 }}>FOR PROFESSIONALS</div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
              Web制作者・コンサルタントの活用ガイド
            </div>
          </div>
          <div style={{ padding: "24px", background: "#fff" }}>
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, marginBottom: 20 }}>
              戦略指南 AIを使えば、従来月300〜500万円が必要だった戦略コンサルティングと同等の分析を、月20〜30万円でクライアントに提供できます。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { title: "戦略診断・提案型", price: "3〜5万円/件", desc: "Web制作の受注前にAB3C戦略診断レポートを提案書として活用。競合との違いを言語化した提案で受注率を高める。" },
                { title: "月次サポート型", price: "月20〜30万円", desc: "毎月戦略を更新し、AIチャットでクライアントの経営相談に対応。制作後の運用フェーズを継続契約化。" },
                { title: "複数クライアント管理型", price: "月100〜300万円", desc: "複数の中小企業クライアントをまとめて管理。15サイトプランで15社を同時にサポート。" },
              ].map(function(model, i) {
                return (
                  <div key={i} style={{ background: "#f8f8f8", border: "1px solid " + C.border, borderRadius: 8, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{model.title}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.A, background: "#e8f0fe", padding: "3px 10px", borderRadius: 4 }}>{model.price}</div>
                    </div>
                    <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.7 }}>{model.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: C.phase1, borderRadius: 8, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12 }}>さっそく分析してみましょう</div>
          <a href="/" style={{ display: "inline-block", background: "#fff", borderRadius: 4, color: C.phase1, fontSize: 16, fontWeight: 700, padding: "12px 28px", textDecoration: "none" }}>
            ▶ 分析ツールへ
          </a>
        </div>

      </div>
    </main>
    <Footer />
    </div>
  );
}
