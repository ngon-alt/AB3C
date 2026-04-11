import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = '戦略大臣';

// ① 新規登録ウェルカムメール
export async function sendWelcomeEmail({ email, name }) {
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: email,
    subject: '【戦略大臣】ご登録ありがとうございます',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">戦略大臣</div>
        <p style="font-size: 16px; line-height: 1.8;">${name || 'お客様'}様、ご登録ありがとうございます。</p>
        <p style="font-size: 16px; line-height: 1.8;">戦略大臣は、あなたのビジネスの「選ばれる理由」をAIが分析する戦略ツールです。</p>
        
        <div style="background: #f5f2eb; border-radius: 8px; padding: 24px; margin: 32px 0;">
          <p style="font-size: 15px; font-weight: bold; margin: 0 0 16px;">まず最初にやること</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0 0 8px;">① あなたのWebサイトのURLを入力して分析する</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0 0 8px;">② 分析結果のAB3Cレポートを確認する</p>
          <p style="font-size: 14px; line-height: 1.8; margin: 0;">③ AIチャットで「競合との違い」を深掘りする</p>
        </div>

        <a href="https://analyzer.ab3c.jp" style="display: inline-block; background: #1a6fd4; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px; font-weight: bold;">さっそく分析を始める</a>

        <p style="font-size: 13px; color: #78716c; margin-top: 40px; line-height: 1.8;">
          無料トライアルでは分析1回・チャット1回をお試しいただけます。<br>
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
