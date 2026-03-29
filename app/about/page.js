"use client";
const C = {
  A: "#1a6fd4", B: "#FF0000", C: "#1a1a14", red: "#c0392b",
  bg: "#f5f2eb", surface: "#ffffff", border: "#ddd8cc",
  ink: "#1a1a14", muted: "#3a3a2e", highlight: "#f0ebe0",
};

export default function AboutPage() {
  return (
    <main style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Noto Serif JP', serif", padding: "40px 20px 100px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 20, marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
              <span style={{ color: "#1a6fd4" }}>A</span>
              <span style={{ color: "#FF0000" }}>B</span>
              <span style={{ color: "#1a1a14" }}>3C</span>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 5 }}>
              AB3C分析とは
            </div>
          </div>
          <a href="https://analyzer.ab3c.jp" style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 2 }}>
            ← 分析ツールへ
          </a>
        </div>

        {/* 導入 */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 20, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            「選ばれる理由」をつくるフレームワーク
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 20 }}>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              インターネットが登場したことで、消費者は膨大な情報や商品の選択肢を手に入れました。企業やその商品・サービスが選ばれるためには、競合と比較されたうえで「こっちのほうがいい」と思ってもらえる<b style={{ color: C.ink }}>「選ばれる理由」</b>が必要です。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              AB3C分析は、そんな「選ばれる理由」を明らかにするフレームワークです。フレームワークとは、思考の補助線のようなもの。決まった手順に沿って考えると、「選ばれる理由」を見つけ出すことができます。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted }}>
              すでに「選ばれる理由」となるような強みや特徴を持っているなら、AB3C分析でそれを上手く表現できます。まだ「選ばれる理由」がないなら、どのような強みや特徴があれば「選ばれる理由」になるのかを分析できます。AB3C分析は、インターネットを脅威からチャンスに変える武器なのです。
            </p>
          </div>

         
        </div>

{/* 開発者・背景 */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 20, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            AB3C分析の特徴
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 16 }}>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              AB3C分析は、<a href="https://www.gonweb.co.jp/" target="_blank" rel="noopener noreferrer" style={{ color: C.A }}>株式会社ゴンウェブイノベーションズ</a>代表・権 成俊が考案した戦略立案フレームワークです。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              もともと世界的に有名なコンサルタント・大前研一氏が提唱した<b style={{ color: C.ink }}>3C分析</b>というフレームワークがあります。Customer（顧客）・Competitor（競合）・Company（自社）の3つの視点で事業を分析するもので、モノ不足からモノ余りの時代へと移り変わる中で、競合を意識しなければ価格競争に陥るということを示唆したフレームワークです。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              インターネットの登場によってさらに競争が激化する中、ウェブコンサルタントとして活動する権は、3C分析に<b style={{ color: C.ink }}>Benefit（お客様が求める価値）</b>と<b style={{ color: C.ink }}>Advantage（差別的優位点）</b>という要素を加え、AB3C分析として定義しました。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted }}>
              AB3C分析はインターネット超競争時代の戦略立案において、<b style={{ color: C.ink }}>「何が明らかに違うか」を明確にすること</b>を目指しています。インターネットマーケティングに非常に効果的であり、それ以外のあらゆる事業戦略立案にも活用できるフレームワークです。
            </p>
          </div>
        </div>

        {/* B — Benefit */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.B, marginBottom: 20, borderLeft: `4px solid ${C.B}`, paddingLeft: 14 }}>
            B — Benefit（お客様が求める価値）
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 16 }}>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              AB3C分析の出発点は、<b style={{ color: C.ink }}>お客様を定義すること</b>です。売り上げを大きくしたいと思うと「誰でもいいから買ってほしい」と思いがちですが、インターネット社会においては、たくさんの人にとってのベターな商品ではなく、<b style={{ color: C.ink }}>誰かにとってのオンリーワン商品</b>になる必要があります。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted }}>
              そのためには、まずお客様が求める価値「ベネフィット」を理解することが重要です。ベネフィットとは、お客様がその商品を購入することによって得られる価値のことです。
            </p>
          </div>

          {/* ニーズとウォンツ */}
          <div style={{ background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>ニーズとウォンツ</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 16 }}>
              <div style={{ background: C.surface, borderRadius: 6, padding: "16px 18px", borderLeft: `4px solid ${C.B}` }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.B, marginBottom: 8 }}>ニーズ（欠乏感）</div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>まだ欲しいものが曖昧な状態の欲求。「友達とお酒を飲みたい」「家で晩酌したい」など。市場は大きいが、販売努力が必要。</p>
              </div>
              <div style={{ background: C.surface, borderRadius: 6, padding: "16px 18px", borderLeft: `4px solid ${C.B}` }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: C.B, marginBottom: 8 }}>ウォンツ（獲得欲求）</div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>具体的に欲しいものが決まっている欲求。「アサヒビールが飲みたい」など。価格比較をして最も安いところで買う傾向がある。</p>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>
              人の欲求は「ニーズ」から始まり、情報を入手することで具体的な「ウォンツ」に発展し、購入に至ります。<b style={{ color: C.ink }}>「ニーズ」「ウォンツ」の幅の中のどの段階でお客様にアプローチするか</b>が重要です。
            </p>
          </div>

          {/* 戦略キャンバス */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>戦略キャンバス</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>
              お客様が商品を購入するとき、いくつかの条件を組み合わせて商品を選択しています。これらの条件を比較するのに<b style={{ color: C.ink }}>戦略キャンバス</b>という表現が便利です。お客様が比較しているであろう条件を並べて、自社と競合の程度を比較します。自社の方が有利な条件を見つけ、それを重視しているお客様にターゲットを絞り込むと、選ばれやすくなります。
            </p>
          </div>
        </div>

        {/* A — Advantage */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.A, marginBottom: 20, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            A — Advantage（差別的優位点・好ましい違い）
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 16 }}>
            <p style={{ fontSize: 15, lineHeight: 2, color: C.muted, marginBottom: 16 }}>
              お客様に選ばれるためには、まずベネフィットを提供できることが前提です。しかし、ベネフィットだけでは「選ばれる理由」にはなりません。同じベネフィットを提供する競合がいるからです。そこで必要なのが<b style={{ color: C.ink }}>「好ましい違い＝アドバンテージ」</b>です。
            </p>
            <div style={{ background: C.highlight, borderRadius: 6, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: C.A, marginBottom: 8 }}>重要：「違い」ではなく「好ましい違い」</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted }}>
                例えば、青いビールを開発したとします。明らかな違いではありますが、これを選ぶお客様は少ないでしょう。比較しているベネフィットに含まれないので、好ましいと思わないからです。一方、無農薬原料を使った体への負担が少ないビールなら、健康を気にするお客様にとって「好ましい違い」になります。
              </p>
            </div>
          </div>

          {/* 自社の特徴 Company */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 16 }}>アドバンテージは自社の強みに根差したものでなければならない</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted, marginBottom: 16 }}>インターネットの時代にはすぐに他社に真似されてしまいます。そのため、アドバンテージは<b style={{ color: C.ink }}>自社の強みに根差した真似されにくいもの</b>でなければなりません。自社の特徴を掘り下げるとき、3段階で考えます。</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { num: "1", title: "具体的な強みを保有しているか", desc: "特別な技術・ノウハウ・原料・設備など。他社でも簡単に手に入るものでは、アドバンテージは長く維持できません。" },
                { num: "2", title: "強みにつながる構造的特徴があるか", desc: "規模・仕組み・体制など、競合が真似しにくい構造があるか。小規模であることが逆に強みになる場合もあります。" },
                { num: "3", title: "経営者の価値観・パッション", desc: "経営者の価値観がビジョンを生み、日々の行動を生み、商品を生み出します。価値観の違いが最も真似されにくい強みになります。" },
              ].map((item, i) => (
                <div key={i} style={{ background: C.highlight, borderRadius: 6, padding: "14px 18px", display: "flex", gap: 14 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: C.A, flexShrink: 0, width: 28 }}>{item.num}.</div>
                  <div>
                    <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{item.title}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: C.muted }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3C */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.C, marginBottom: 20, borderLeft: `4px solid ${C.C}`, paddingLeft: 14 }}>
            3C — Customer · Competitor · Company
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Customer */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: C.C, marginBottom: 12 }}>Customer — お客様</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted, marginBottom: 12 }}>
                インターネット社会では、たくさんの人にとってのベターな商品ではなく、<b style={{ color: C.ink }}>誰かにとってのオンリーワン</b>になる必要があります。お客様を絞り込むことで、訴求すべきメッセージが明確になります。
              </p>
              <div style={{ background: C.highlight, borderRadius: 6, padding: "12px 16px", fontSize: 13, color: C.muted }}>
                <b>考えるべき点：</b>誰があなたのお客様か。ニーズ段階かウォンツ段階か。誰を切り捨てるか。
              </div>
            </div>

            {/* Competitor */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: C.C, marginBottom: 12 }}>Competitor — 競合</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted, marginBottom: 12 }}>
                競合とは、お客様が自社の商品と比較する相手です。ウォンツ段階のお客様は同業他社と比較しますが、ニーズ段階のお客様は異業種とも比較します。
              </p>
              <div style={{ background: C.highlight, borderRadius: 6, padding: "12px 16px", fontSize: 13, color: C.muted }}>
                <b>例：</b>TVの競合はスマートフォンです。同じニーズ（暇つぶし）を満たす異業種が競合になります。
              </div>
            </div>

            {/* Company */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: C.C, marginBottom: 12 }}>Company — 自社</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted, marginBottom: 12 }}>
                自社の強みを3段階（具体的強み→構造的特徴→パッション）で掘り下げます。いまは強みと言えるような特徴がなくても、オリジナルの価値観が見つかれば、それをベースに強みを生み出せます。
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "パッション", desc: "経営者の価値観・情熱が出発点。3年間一つのことに取り組むことでポジションが築かれます。" },
                  { label: "ポジション", desc: "「あの会社は〇〇が強みだね」と言われるようになること。実績の積み上げによって生まれます。" },
                  { label: "ミッション", desc: "他社にはまねのできない卓越したレベル。パッションとポジションの積み上げが自社の使命を生みます。" },
                ].map((item, i) => (
                  <div key={i} style={{ background: C.highlight, borderRadius: 4, padding: "10px 14px", fontSize: 13, color: C.muted }}>
                    <b style={{ color: C.ink }}>{item.label}：</b>{item.desc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 戦略メッセージ */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 20, borderLeft: `4px solid ${C.ink}`, paddingLeft: 14 }}>
            戦略メッセージ = Benefit + Advantage
          </div>
          <div style={{ background: C.ink, borderRadius: 8, padding: "28px 32px", marginBottom: 16 }}>
            <p style={{ fontSize: 15, lineHeight: 2, color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>
              AB3Cが成立したら、これを商品やウェブサイトなどのデザインにつなげましょう。BenefitとAdvantageの二つを合わせて<b style={{ color: "#fff" }}>戦略メッセージ</b>と呼びます。
            </p>
            <p style={{ fontSize: 15, lineHeight: 2, color: "rgba(255,255,255,0.85)" }}>
              ウェブサイトを制作するとき、TOPページのメインビジュアルでこの二つを表現することを考えましょう。AB3Cが明らかになれば、デザインによってどのようなメッセージを伝えればよいかが明らかになり、事業戦略とデザインが直結します。
            </p>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>良いAB3Cの3つの条件</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { num: "1", label: "わかりやすい", desc: "一言で言える。一目でわかる。" },
                { num: "2", label: "裏付けがある", desc: "根拠のある強みに基づいている。" },
                { num: "3", label: "ワクワクする", desc: "明るい未来を目指して頑張れる。" },
              ].map((item, i) => (
                <div key={i} style={{ background: C.highlight, borderRadius: 6, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: C.A, marginBottom: 8 }}>{item.num}</div>
                  <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{item.label}</div>
                  <p style={{ fontSize: 13, color: C.muted }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5つのチェックポイント */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 20, borderLeft: `4px solid ${C.A}`, paddingLeft: 14 }}>
            AB3C 5つのチェックポイント
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: C.muted, marginBottom: 20 }}>
            AB3Cが完成したと思ったら以下の点をチェックしましょう。実際はこれらの要素の間を行ったり来たりしながらAB3Cを描きます。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { num: "1", label: "切り捨てたか", desc: "お客様を絞り込むということは、見込み客の一部を切り捨てるということ。そこには痛みが伴う。誰を切り捨てたか。" },
              { num: "2", label: "価値の本質は？", desc: "欲しいのはドリルではなく穴であり、さらに穴をあけたい理由がある。ウォンツだけではなく、ニーズまで掘り下げたか。なぜなぜ5回。" },
              { num: "3", label: "異業種の競合は？", desc: "同業他社だけではなく、ニーズに基づく異業種との比較の可能性まで考えたか。TVの競合はスマートフォンである。" },
              { num: "4", label: "強みを作ることを考えたか？", desc: "いまある強みだけではアドバンテージを生み出せない。アドバンテージを生み出すために、必要な強みを生み出すことから考える。イノベーションは1手ではならない。2手目ではじめて差別化できる。" },
              { num: "5", label: "明らかな違いか？", desc: "アドバンテージは「明らかな違い」でなくてはならない。一言で言える。一目でわかる。程度の違い、バランスの違いでは伝わらない。" },
            ].map((item, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: C.A, flexShrink: 0, width: 32 }}>{item.num}.</div>
                <div>
                  <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{item.label}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: C.ink, borderRadius: 8, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>さっそくAB3C分析を試してみましょう</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 20, lineHeight: 1.8 }}>URLを入力するだけで、あなたのビジネスの「選ばれる理由」を分析します。</p>
          <a href="https://analyzer.ab3c.jp" style={{ display: "inline-block", background: C.A, borderRadius: 4, color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "12px 28px", textDecoration: "none" }}>
            ▶ 分析ツールへ
          </a>
        </div>

        <footer style={{ textAlign: "center", marginTop: 60, paddingTop: 20, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 32 }} />
            <span style={{ fontSize: 12, color: C.ink }}>一般社団法人デジタル経営革新協会</span>
          </div>
          <div>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted }}>ab3c.jp</a> · Powered by Claude AI</div>
        </footer>
      </div>
    </main>
  );
}
