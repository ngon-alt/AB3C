import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = '戦略大臣';

// 登録完了メール（新規登録直後・目的選択前）
export async function sendRegistrationEmail({ email, name }) {
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: email,
    subject: '【戦略大臣】ご登録が完了しました',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #1a1a14;">戦略大臣</div>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">${name || 'お客様'}さん、ご登録ありがとうございます。</p>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">戦略大臣は、300万円の事業戦略立案サービスをボタン一つで可能にしたツールです。</p>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">生成AIに戦略を相談すると都度都度の対処療法的な回答になりがちです。先日はこう言っていたのに今日はこんなふうに言っている——矛盾した回答に戸惑うことがありませんか？</p>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">戦略大臣では環境調査をした上で戦略を固めることで、その後のマーケティングの軸が定まり、一貫性のある経営戦略の実行が可能になります。</p>

        <div style="background: #f5f2eb; border-radius: 8px; padding: 20px 24px; margin: 28px 0;">
          <p style="font-size: 14px; font-weight: bold; color: #1a1a14; margin: 0 0 12px;">無料トライアルでできること：</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0 0 4px;">・AB3C分析レポート：1回</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0 0 4px;">・Webサイト改善レポート：1回</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0;">・AIチャット相談：1回</p>
        </div>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">あなたのWebサイトのURLを入れてお試しください。</p>

        <a href="https://analyzer.ab3c.jp" style="display: inline-block; background: #1a6fd4; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: bold; margin-top: 8px;">さっそく分析を始める →</a>

        <p style="font-size: 13px; color: #78716c; margin-top: 40px; line-height: 1.8;">
          ご不明な点は<a href="https://analyzer.ab3c.jp/contact" style="color: #1a6fd4;">お問い合わせ</a>ください。
        </p>
        <p style="font-size: 12px; color: #78716c;">一般社団法人デジタル経営革新協会</p>
      </div>
    `,
  });
}

// ① 新規登録ウェルカムメール（自社利用向け）
export async function sendWelcomeEmail({ email, name }) {
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: email,
    subject: 'あなたのビジネスの「選ばれる理由」、一緒に見つけましょう。',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #1a1a14;">戦略大臣</div>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">${name || 'お客様'}さん</p>
        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">ありがとうございます。自社利用でご登録いただきました。</p>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">早速ですが、一つ質問させてください。</p>

        <p style="font-size: 18px; font-weight: bold; line-height: 1.8; color: #1a6fd4; border-left: 4px solid #1a6fd4; padding-left: 16px; margin: 24px 0;">「なぜお客様はあなたから買うのですか？」</p>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">この質問にすぐ答えられる経営者は、実はほとんどいません。でも、この「選ばれる理由」が言語化できた瞬間から、Webサイトも、営業も、採用も、すべてが変わり始めます。</p>

        <hr style="border: none; border-top: 1px solid #e5e5e0; margin: 32px 0;" />

        <p style="font-size: 15px; font-weight: bold; color: #1a1a14; margin-bottom: 20px;">戦略大臣の使い方には2つのフェーズがあります。</p>

        <div style="background: #f0f4ff; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px;">
          <p style="font-size: 13px; font-weight: bold; color: #1a6fd4; margin: 0 0 8px; letter-spacing: 0.08em;">① 戦略プランフェーズ</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0;">AB3C分析で「選ばれる理由」を言語化し、戦略を固めます。分析結果に「これは違う」と感じたら、AIチャットでその違和感を深掘りしてください。戦略が固まるまで何度でも対話できます。</p>
        </div>

        <div style="background: #f0fff4; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px;">
          <p style="font-size: 13px; font-weight: bold; color: #16a34a; margin: 0 0 8px; letter-spacing: 0.08em;">② 戦略アクションフェーズ</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0;">固めた戦略をぶらさずに、Webサイト改善・営業・採用・補助金申請など、さまざまな施策に展開します。普通の生成AIと違い、戦略という「軸」があるので、どの施策も一貫性を持って実行できます。</p>
        </div>

        <a href="https://analyzer.ab3c.jp" style="display: inline-block; background: #1a6fd4; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: bold;">さっそく分析を始める →</a>

        <p style="font-size: 13px; color: #78716c; margin-top: 40px; line-height: 1.8;">
          ご不明な点は<a href="https://analyzer.ab3c.jp/contact" style="color: #1a6fd4;">お問い合わせ</a>ください。
        </p>
        <p style="font-size: 12px; color: #78716c;">一般社団法人デジタル経営革新協会</p>
      </div>
    `,
  });
}

// ① 新規登録ウェルカムメール（代理店・パートナー向け）
export async function sendWelcomeEmailAgency({ email, name }) {
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: email,
    subject: '毎月20万円〜の伴走支援が提供できます',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #1a1a14;">戦略大臣</div>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">${name || 'お客様'}さん</p>
        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">ありがとうございます。クライアント提供でご登録いただきました。</p>

        <p style="font-size: 16px; line-height: 1.8; color: #1a1a14;">戦略大臣によって戦略を立案し、この戦略にもとづいたマーケティング支援を提供することで、<strong>毎月20万円〜の伴走支援サービス</strong>を提供できます。</p>

        <hr style="border: none; border-top: 1px solid #e5e5e0; margin: 32px 0;" />

        <p style="font-size: 15px; font-weight: bold; color: #1a1a14; margin-bottom: 20px;">あなたがクライアントに提供できること：</p>

        <div style="background: #f0f4ff; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px;">
          <p style="font-size: 13px; font-weight: bold; color: #1a6fd4; margin: 0 0 8px; letter-spacing: 0.08em;">① 戦略プランフェーズ</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0;">クライアントのWebサイトをAB3C分析し、「選ばれる理由」を言語化します。出てきたレポートがそのまま提案書になります。</p>
        </div>

        <div style="background: #f0fff4; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px;">
          <p style="font-size: 13px; font-weight: bold; color: #16a34a; margin: 0 0 8px; letter-spacing: 0.08em;">② 戦略アクションフェーズ</p>
          <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin: 0;">固めた戦略をぶらさずに、Web改善・営業・採用・補助金申請など、あらゆる施策に展開します。毎月AIチャットでクライアントの経営相談に伴走することで、継続契約が自然に生まれます。</p>
        </div>

        <p style="font-size: 15px; font-weight: bold; color: #1a1a14; margin-bottom: 12px;">まず最初にやること：</p>
        <p style="font-size: 14px; line-height: 1.8; color: #1a1a14; margin-bottom: 24px;">あなた自身のサイト、またはクライアントのWebサイトURLを入力して、AB3C分析を実行してください。レポートを見れば、提案のイメージが一気につかめます。</p>

        <a href="https://analyzer.ab3c.jp" style="display: inline-block; background: #1a6fd4; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: bold;">さっそく分析してみる →</a>

        <p style="font-size: 14px; color: #78716c; margin-top: 32px; line-height: 1.8; border-top: 1px solid #e5e5e0; padding-top: 24px;">
          次回のメールでは「クライアントへの具体的な提案の仕方」をお伝えします。
        </p>
        <p style="font-size: 13px; color: #78716c; line-height: 1.8;">
          ご不明な点は<a href="https://analyzer.ab3c.jp/contact" style="color: #1a6fd4;">お問い合わせ</a>ください。
        </p>
        <p style="font-size: 12px; color: #78716c;">一般社団法人デジタル経営革新協会</p>
      </div>
    `,
  });
}

// ② 初回分析完了メール
export async function sendAnalysisCompleteEmail({ email, name }) {
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: email,
    subject: '【戦略大臣】分析が完了しました。次のステップへ',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">戦略大臣</div>
        <p style="font-size: 16px; line-height: 1.8;">${name || 'お客様'}様</p>
        <p style="font-size: 16px; line-height: 1.8;">AB3C分析が完了しました。レポートをご確認ください。</p>

        <div style="background: #f5f2eb; border-radius: 8px; padding: 24px; margin: 32px 0;">
          <p style="font-size: 15px; font-weight: bold; margin: 0 0 16px;">分析結果を活用する3つの方法</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0 0 8px;">① AIチャットで「競合との違い」をさらに深掘りする</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0 0 8px;">② Webサイト改善レポートを生成して具体的な改善点を確認する</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0;">③ シェアURLを発行して社内・クライアントと共有する</p>
        </div>

        <a href="https://analyzer.ab3c.jp" style="display: inline-block; background: #1a6fd4; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: bold;">分析結果を見る</a>

        <p style="font-size: 13px; color: #78716c; margin-top: 40px; line-height: 1.8;">
          伴走プランにアップグレードすると、毎月継続的にAIが戦略をサポートします。<br>
          <a href="https://analyzer.ab3c.jp" style="color: #1a6fd4;">プランを見る →</a>
        </p>
        <p style="font-size: 12px; color: #78716c;">一般社団法人デジタル経営革新協会</p>
      </div>
    `,
  });
}

// ③ 3日後フォローメール（未活性ユーザー向け）
export async function sendFollowUpEmail({ email, name }) {
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: email,
    subject: '【戦略大臣】AIチャットはもう試しましたか？',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">戦略大臣</div>
        <p style="font-size: 16px; line-height: 1.8;">${name || 'お客様'}様</p>
        <p style="font-size: 16px; line-height: 1.8;">先日ご登録いただきありがとうございます。<br>まだAIチャットをお試しでない方に、活用のヒントをお伝えします。</p>

        <div style="background: #f5f2eb; border-radius: 8px; padding: 24px; margin: 32px 0;">
          <p style="font-size: 15px; font-weight: bold; margin: 0 0 16px;">こんな質問をしてみてください</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0 0 8px; color: #1a6fd4;">「競合と比べて、私たちの一番の強みは何ですか？」</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0 0 8px; color: #1a6fd4;">「このAdvantageをWebサイトのキャッチコピーにするとしたら？」</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0; color: #1a6fd4;">「このBenefitを採用ページに活かすにはどうすればいいですか？」</p>
        </div>

        <a href="https://analyzer.ab3c.jp" style="display: inline-block; background: #1a6fd4; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: bold;">AIチャットを試してみる</a>

        <p style="font-size: 13px; color: #78716c; margin-top: 40px; line-height: 1.8;">
          ご不明な点は<a href="https://analyzer.ab3c.jp/contact" style="color: #1a6fd4;">お問い合わせ</a>ください。
        </p>
        <p style="font-size: 12px; color: #78716c;">一般社団法人デジタル経営革新協会</p>
      </div>
    `,
  });
}
