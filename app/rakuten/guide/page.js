"use client";
// 楽天版: 分析の見方ガイド（初めての人向けの学習ページ）
// レポート各セクションからリンクされる。フレームワークの基本をここで説明する

const C = { black: "#1a1a14", red: "#FF0000", blue: "#1a6fd4", phase1: "#0d9488" };

const h2Style = { fontSize: 26, borderLeft: `6px solid ${C.black}`, paddingLeft: 14, marginTop: 48 };
const pStyle = { fontSize: 18, lineHeight: 2.0 };

export default function RakutenGuidePage() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 80px", fontFamily: "var(--font-body)", color: "#000" }}>
      <h1 style={{ fontSize: 32 }}>楽天版・分析の見方ガイド</h1>
      <p style={pStyle}>
        この分析は、20年以上の戦略コンサルティング実績から生まれたAB3Cフレームワークの考え方を、楽天市場の商品ページ向けに組み立て直したものです。むずかしい理論は要りません。レポートは「三段の物語」として、上から順に読めるようになっています。
      </p>

      <h2 style={h2Style}>三段の物語</h2>
      <p style={pStyle}>
        レポートは三つの問いに順番に答えます。
      </p>
      <ol style={{ fontSize: 18, lineHeight: 2.0 }}>
        <li><strong>売れている店は、なぜ売れているのか</strong> —— 競合のお客様レビューから「選ばれる理由」を読み取ります。</li>
        <li><strong>自分は、なぜ売れないのか</strong> —— あなたのページの訴求と、お客様の評価のズレを突き止めます。</li>
        <li><strong>では、どうすればいいのか</strong> —— 今すぐできる「伝え方の改善」と、時間をかける「価値そのものの強化」の二段階で処方します。</li>
      </ol>

      <h2 style={h2Style}>なぜレビューを読むのか</h2>
      <p style={pStyle}>
        楽天で買い物をする人の多くは、商品名を知って指名買いに来るのではなく、カテゴリーを回遊しながら「自分の欲しいもの」を絞り込んでいきます。その学習材料の中心がレビューです。お客様が学習の末に、商品の魅力（と不満）を自分の言葉で書き残したものがレビューであり、「選ばれる理由」はそこに最も生々しく結晶します。レビューの件数そのものも「多くの人が選んでいる」という何よりの信頼の証になっています。
      </p>

      <h2 style={h2Style}>訴求と評価のズレ</h2>
      <p style={pStyle}>
        あなたのページが「これが売りです」と訴えていることと、お客様がレビューで実際に評価していることは、しばしばずれています。たとえばページでは「手頃な価格」を前面に出しているのに、レビューでは「味」が圧倒的に評価されている——この場合、本当の魅力を伝えないまま売り場に立っていることになります。
      </p>
      <p style={pStyle}>
        さらに大事なのは、その評価が<strong>競合と比べて</strong>本物の強みかどうかです。競合もみな「おいしい」と言われているなら、それは強みではなく土俵です。あなただけが違うところを評価されているなら、それは本物の差別的優位であり、<strong>伝えるだけで価値になります</strong>。
      </p>

      <h2 style={h2Style}>価値サークル（6つの軸）</h2>
      <p style={pStyle}>
        商品の価値を6つの軸に分けて見る道具です。円の右半分が<strong>商品力の3軸</strong>（機能・デザイン・パッケージング）、左半分が<strong>サービスの3軸</strong>（購入前・購入中・購入後）。レポートでは各軸に ◯（勝っている）△（並んでいる）×（負けている）が付きます。
      </p>
      <p style={pStyle}>
        この図の良さは、<strong>何をすればいいかが直感的に分かる</strong>ことです。サービス側に×が並んでいれば「サービスで差をつけられている」。そして大事なことに、仕入れ品を売っていて商品そのものを変えられない店でも、<strong>サービスの3軸と「外側のパッケージ」（同梱のおまけ・配送箱の工夫・開けやすい梱包など）は、あなた自身の工夫で強くできます</strong>。
      </p>

      <h2 style={h2Style}>商品ページの語り方（7つの観点）</h2>
      <p style={pStyle}>
        売れる商品ページには、上から下へ流れる「語りの順番」があります。
      </p>
      <ol style={{ fontSize: 18, lineHeight: 2.0 }}>
        <li><strong>ターゲットの悩み</strong>〔<span style={{ fontWeight: 700 }}>顧客（C）× ニーズ</span>〕—— 「こんな方に、こんなお悩みありませんか」と、絞った顧客の課題への共感から入る</li>
        <li><strong>ベネフィット</strong>〔<span style={{ color: C.red, fontWeight: 700 }}>B</span>〕—— 開いた瞬間に「何の商品で、何が得られるか」が分かる（3秒が勝負）</li>
        <li><strong>他社との違い</strong>〔<span style={{ color: C.blue, fontWeight: 700 }}>A</span> ＋ <span style={{ fontWeight: 700 }}>自社・競合（2つのC）</span>〕—— なぜ他ではなくこれなのかを示す。比較表があると構図が一目で伝わる</li>
        <li><strong>証拠（信頼コンテンツ）</strong>〔<span style={{ color: C.blue, fontWeight: 700 }}>Aの根拠</span> ＋ <span style={{ fontWeight: 700 }}>自社（C）</span>〕—— レビューの量と質、売り手が専門家として語るおすすめの理由、第三者の証明（認証・受賞・メディア掲載）、開発ストーリー。レビューがまだ少ない店は、他の3つで客観的な信頼を補う</li>
        <li><strong>使用シーン</strong>〔<span style={{ fontWeight: 700 }}>顧客（C）のシーン</span> × <span style={{ color: C.red, fontWeight: 700 }}>Bの情緒</span>〕—— 絞ったターゲットの場面を具体的に描く。論理ではなく情緒で、「そのシーンなら、こう感じるな」を想像してもらう</li>
        <li><strong>不安解消</strong>〔FAQ・保証〕—— よくある質問・保証・スペック・配送納期・送料がページの中で分かること。ページを離れないと分からない情報は不安になる</li>
        <li><strong>今買う理由</strong>〔最終プッシュ〕—— 最後のひと押し。やりすぎると嫌味になるが、楽天では定番の作法なので適度に入れる</li>
      </ol>
      <p style={pStyle}>
        この順番は、顧客（の悩み）→ ベネフィット → アドバンテージ → その根拠、というAB3Cの物語の順番そのものです。商品ページを直すことは、戦略を語り直すことと同じなのです。
      </p>

      <h2 style={h2Style}>対処療法と根本治療</h2>
      <p style={pStyle}>
        処方箋は二段階に分かれています。<strong>対処療法</strong>は、商品はそのままに「伝え方」を直すこと。お客様が重視している価値の軸に合わせて、訴求の力点とページの内容を変える——今週から動けて、効果も早い改善です。<strong>根本治療</strong>は、価値サークルの軸そのものを強くすること。弱いサービスを作る、誰も立てていない新しい軸を立てる——時間はかかりますが、真似されにくい本物の強みになります。順番が大事です。まず伝え方を直して、今の商品の本当の実力を確かめてから、価値づくりに投資してください。
      </p>

      <div style={{ marginTop: 48 }}>
        <a
          href="/rakuten"
          style={{ display: "inline-block", fontSize: 18, padding: "12px 28px", background: C.phase1, color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}
        >
          ← 分析ページへ戻る
        </a>
      </div>
    </main>
  );
}
