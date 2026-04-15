"use client";
import Header from "../components/Header";

const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#78716c", highlight: "#f0ebe0",
  phase1: "#2d6a30", phase2: "#8c5e1a",
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
          <div style={{ fontSize: 16, color: C.ink, marginTop: 8 }}>戦略大臣の全機能と使い方を説明します。</div>
        </div>

        {/* 全体の流れ */}
        <Section title="全体の流れ" icon="🗺️">
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "サイト登録", icon: "📋", color: C.ink },
                { label: "AB3C分析", icon: "🔍", color: C.phase1 },
                { label: "チャットで深掘り", icon: "💬", color: C.phase1 },
                { label: "戦略確定", icon: "✅", color: C.phase1 },
                { label: "施策検討", icon: "🎯", color: C.phase2 },
                { label: "アクション実行", icon: "🚀", color: C.phase2 },
              ].map(function(step, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28 }}>{step.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: step.color, marginTop: 4 }}>{step.label}</div>
                    </div>
                    {i < 5 && <div style={{ fontSize: 20, color: C.muted }}>→</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* 戦略立案フェーズ */}
        <Section title="戦略立案フェーズ（STEP 1）" icon="🔍">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
            <Card title="🌐 URLで分析（既存事業向け）">
              ウェブサイトのURLを入力するだけで、AIがサイトの内容を読み取り、AB3C分析とウェブサイト改善レポートを自動生成します。
              <div style={{ marginTop: 10, background: C.highlight, borderRadius: 6, padding: "12px 14px", fontSize: 14 }}>
                <b>対応できないサイト：</b>楽天・Amazon等のモール型EC、Instagram・Facebook等のSNS、食べログ等の予約サイト
              </div>
            </Card>
            <Card title="✏️ テキストで入力（新規事業向け）">
              事業概要を自由に記述して分析できます。まだウェブサイトがない新規事業や、サイトの内容が実態と異なる場合に有効です。テキスト分析ではウェブサイト改善レポートは生成されません。
            </Card>
          </div>

          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 12 }}>分析結果の見方</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "B — Benefit（お客様が求める価値）", color: C.B, desc: "ニーズ（欠乏感・曖昧な欲求）とウォンツ（具体的欲求）の両面から、お客様が本当に求めている価値を分析します。" },
              { label: "A — Advantage（差別的優位点）", color: C.A, desc: "競合との「好ましい違い」を明らかにします。なぜお客様に選ばれるのか、なぜ真似されにくいのかを示します。" },
              { label: "3C — Customer · Competitor · Company", color: C.C, desc: "お客様（ターゲット・市場規模）・競合（直接競合・異業種競合）・自社（強み・構造・パッション）の3つの視点で事業を構造化します。" },
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

        {/* 分析チャット */}
        <Section title="分析チャット" icon="💬">
          <Card title="分析結果をAIと一緒に磨き上げる">
            分析結果の右側にあるチャットで、AIに質問や修正依頼ができます。
          </Card>
          <div style={{ marginTop: 16 }}>
            <Step number="1" title="質問・修正依頼をする" desc="「ニーズにこういうシーンも追加してほしい」「ターゲットをもっと絞りたい」など、具体的に伝えてください。" />
            <Step number="2" title="AIが回答する" desc="AB3Cフレームワークの観点からアドバイスが返ってきます。" />
            <Step number="3" title="「この会話内容を分析に反映する」をクリック" desc="赤いボタンを押すと、チャットでのやり取りが分析結果に反映されます。変更箇所はハイライト表示されます。" />
          </div>
          <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: "16px 20px", marginTop: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>💡 ハイライト表示</div>
            <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.7 }}>
              反映後、変更された箇所は黄色でハイライトされます。2回目は緑、3回目は青、4回目は赤と色が変わるので、何回修正したかが一目でわかります。
            </div>
          </div>
        </Section>

        {/* 戦略確定 */}
        <Section title="戦略確定" icon="✅">
          <Card title="分析結果に納得したら戦略を確定">
            チャットパネルの一番下にある「戦略を確定」ボタンを押すと、現在の分析結果が確定され、戦略アクションフェーズに進めるようになります。
          </Card>
          <div style={{ marginTop: 16 }}>
            <Step number="1" title="分析結果を確認・修正" desc="チャットで分析結果を磨き上げ、納得のいく内容にします。" />
            <Step number="2" title="「戦略を確定」をクリック" desc="分析結果がサイト管理に保存され、戦略アクションタブが有効になります。" />
            <Step number="3" title="左サイドバーに確定履歴が残る" desc="確定した戦略の履歴がサイドバーに保存されます。過去の確定内容をクリックで振り返れます。" />
          </div>
        </Section>

        {/* 戦略アクションフェーズ */}
        <Section title="戦略アクションフェーズ（STEP 2）" icon="🎯">
          <Card title="戦略に基づいて具体的な施策を検討">
            戦略確定後、戦略アクションタブをクリックすると、10の施策テーマについてAIと相談できます。各施策はAB3C分析結果をベースにしたアドバイスが提供されます。
          </Card>
          <div style={{ marginTop: 16, fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 12 }}>10の施策テーマ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {[
              { icon: "🔍", label: "SEO対策", desc: "キーワード候補・タイトル改善・コンテンツ構成" },
              { icon: "📱", label: "SNS運用", desc: "プラットフォーム選定・投稿企画・カレンダー" },
              { icon: "📣", label: "Web広告", desc: "広告種別選定・広告文案・ターゲティング" },
              { icon: "📍", label: "Googleマップ", desc: "プロフィール改善・口コミ対策・投稿活用" },
              { icon: "📄", label: "チラシ・DM", desc: "キャッチコピー・構成ラフ・配布戦略" },
              { icon: "📰", label: "プレスリリース", desc: "ニュース切り口・文案・配信先" },
              { icon: "🔧", label: "ウェブサイト改善", desc: "コンテンツ・デザイン・構造の改善" },
              { icon: "👥", label: "採用コンテンツ企画", desc: "ビジョン・強み・キャリアパス提案" },
              { icon: "📋", label: "補助金申請", desc: "事業計画書の下書き・たたき台" },
              { icon: "💼", label: "営業資料・提案書", desc: "トーク構成・提案書ドラフト・FAQ" },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: 14, color: C.muted }}>{item.desc}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 12 }}>施策チャットの使い方</div>
            <Step number="1" title="左サイドバーから施策を選択" desc="施策をクリックすると「全体アドバイス」が自動生成されます。" />
            <Step number="2" title="チャットで詳細を詰める" desc="全体アドバイスをベースに、具体的な施策についてAIと会話します。" />
            <Step number="3" title="サブチャットを作成（オプション）" desc="「+ チャット追加」でテーマ内のサブトピック（例：SEO→「TOPページのSEO」）を作成できます。作成時に概要を入力すると、それに基づいたアドバイスが生成されます。" />
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

        {/* データの保存について */}
        <Section title="データの保存と注意事項" icon="⚠️">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>✅ 保存される情報</div>
              <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>分析結果 — サイト管理のデータベースとブラウザの両方に保存されます</li>
                <li>戦略確定履歴 — ブラウザのlocalStorageに保存されます</li>
                <li>戦略アクションチャット履歴 — ブラウザのlocalStorageに保存されます</li>
                <li>サイト管理のサイト一覧 — データベースに保存されます</li>
              </ul>
            </div>
            <div style={{ background: "#fdf0ef", border: "1px solid #f5c6cb", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ データが消えるケース</div>
              <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li><b>ブラウザのキャッシュ・データを消去した場合</b> — 戦略確定履歴、戦略アクションチャット履歴が消えます（分析結果はDBに保存されているため残ります）</li>
                <li><b>別のブラウザやデバイスでアクセスした場合</b> — localStorageは共有されないため、チャット履歴は見えません</li>
                <li><b>シークレットウィンドウで利用した場合</b> — ウィンドウを閉じるとlocalStorageが消えます</li>
                <li><b>サイト管理でサイトを削除した場合</b> — そのサイトの分析結果・チャット履歴がすべて消えます</li>
              </ul>
            </div>
            <div style={{ background: "#d4edda", border: "1px solid #c3e6cb", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.phase1, marginBottom: 8 }}>💡 推奨事項</div>
              <ul style={{ fontSize: 16, color: C.ink, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>重要な分析結果は「シェアURL発行」や「印刷・PDF保存」で保存しておきましょう</li>
                <li>同じブラウザ・同じデバイスで利用することをお勧めします</li>
                <li>戦略が固まったら「戦略を確定」を押して、データベースに保存してください</li>
              </ul>
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

        {/* シェア・印刷 */}
        <Section title="シェア・印刷機能" icon="📤">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="🔗 シェアURL発行">
              分析結果を共有するためのURLを発行できます。このURLを社内共有やクライアントへの提案に活用できます。Google NotebookLMに読み込ませると、スライド資料の自動生成にも使えます。
            </Card>
            <Card title="🖨️ 印刷・PDF保存">
              分析結果をブラウザの印刷機能でPDFとして保存できます。提案書や社内資料として活用できます。
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
              戦略大臣を使えば、従来月300〜500万円が必要だった戦略コンサルティングと同等の分析を、月20〜30万円でクライアントに提供できます。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { title: "スポット提案型", price: "3〜5万円/件", desc: "Web制作の受注前にAB3C分析レポートを提案書として活用。競合との違いを言語化した提案で受注率を高める。" },
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

        <footer style={{ textAlign: "center", marginTop: 60, paddingTop: 20, borderTop: "1px solid " + C.border, color: C.muted, fontSize: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 28 }} />
            <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>一般社団法人デジタル経営革新協会</span>
          </div>
          <div style={{ marginBottom: 8 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted, textDecoration: "underline" }}>ab3c.jp</a> · Powered by Claude AI</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="/terms" style={{ color: C.muted, textDecoration: "underline" }}>利用規約</a>
            <span style={{ color: C.border }}>|</span>
            <a href="/privacy" style={{ color: C.muted, textDecoration: "underline" }}>プライバシーポリシー</a>
            <span style={{ color: C.border }}>|</span>
            <a href="/legal" style={{ color: C.muted, textDecoration: "underline" }}>特定商取引法</a>
          </div>
        </footer>
      </div>
    </main>
    </div>
  );
}
