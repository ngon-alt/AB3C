import { Resend } from "resend";

// Resend API キーがない場合はダミーで初期化（メール機能は無効）
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = '戦略大臣';

// メール送信関数（API キーがない場合はログ出力のみ）
async function sendEmail(to, subject, html) {
  if (!resend) {
    console.log('📧 [メール送信スキップ] Resend API キー未設定');
    console.log(`To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true };
  }
  
  try {
    const data = await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: [to],
      subject: subject,
      html: html,

cat > app/lib/email.js << 'EOF'
import { Resend } from "resend";

// Resend API キーがない場合はダミーで初期化（メール機能は無効）
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = '戦略大臣';

// メール送信関数（API キーがない場合はログ出力のみ）
async function sendEmail(to, subject, html) {
  if (!resend) {
    console.log('📧 [メール送信スキップ] Resend API キー未設定');
    console.log(`To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true };
  }
  
  try {
    const data = await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: [to],
      subject: subject,
      html: html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('メール送信エラー:', error);
    return { success: false, error };
  }
}

export async function sendRegistrationEmail({ email, name }) {
  const subject = '戦略大臣へようこそ！';
  const html = `<p>${name || 'お客様'}、ご登録ありがとうございます。</p>`;
  return sendEmail(email, subject, html);
}

export async function sendWelcomeEmail({ email, name }) {
  const subject = 'AB3C分析を始めましょう';
  const html = `<p>${name || 'お客様'}、早速分析を始めてみましょう。</p>`;
  return sendEmail(email, subject, html);
}

export async function sendWelcomeEmailAgency({ email, name }) {
  const subject = 'パートナー向け情報をお届けします';
  const html = `<p>${name || 'お客様'}、代理店向けの情報をお送りします。</p>`;
  return sendEmail(email, subject, html);
}

export async function sendAnalysisCompleteEmail({ email, name }) {
  const subject = '分析が完了しました';
  const html = `<p>${name || 'お客様'}、AB3C分析が完了しました。</p>`;
  return sendEmail(email, subject, html);
}

export async function sendFollowUpEmail({ email, name }) {
  const subject = 'フォローアップ';
  const html = `<p>${name || 'お客様'}、ご利用ありがとうございます。</p>`;
  return sendEmail(email, subject, html);
}
