import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { sendContactNotificationEmail, sendContactAutoReplyEmail } from '@/app/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, category, message, pageUrl, userAgent } = body;

    // バリデーション
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // 簡易形式チェック（メール）
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      );
    }

    // 長さ制限（スパム対策）
    if (String(message).length > 5000 || String(name).length > 100) {
      return NextResponse.json(
        { error: '入力内容が長すぎます' },
        { status: 400 }
      );
    }

    // ログイン中のユーザー情報を取得（フォームと違う場合に運営側で照合できるように）
    let loggedInEmail = null;
    try {
      const session = await getServerSession(authOptions);
      loggedInEmail = session?.user?.email || null;
    } catch (e) {
      // セッション取得失敗は致命的ではない
    }

    console.log('=== お問い合わせ受信 ===');
    console.log(`[${category}] ${name} <${email}>${loggedInEmail && loggedInEmail !== email ? ` (logged in as ${loggedInEmail})` : ''}`);
    if (pageUrl) console.log('URL:', pageUrl);

    // ① 運営へ通知メール（reply-to にユーザーメール）
    const notifyResult = await sendContactNotificationEmail({
      name,
      email,
      company,
      category,
      message,
      pageUrl,
      userAgent,
      loggedInEmail,
    });
    if (!notifyResult.success) {
      console.error('通知メール送信失敗:', notifyResult.error);
      return NextResponse.json(
        { error: '送信処理で問題が発生しました。時間をおいて再度お試しください。' },
        { status: 500 }
      );
    }

    // ② 送信者へ自動返信（失敗してもユーザー側は成功扱い）
    try {
      await sendContactAutoReplyEmail({ name, email, category, message });
    } catch (e) {
      console.error('自動返信メール送信エラー（無視）:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: '送信に失敗しました' },
      { status: 500 }
    );
  }
}
