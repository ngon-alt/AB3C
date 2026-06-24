import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { sendContactNotificationEmail, sendContactAutoReplyEmail } from '@/app/lib/email';

// 添付画像の上限（フロント側の圧縮ロジックと整合）
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 圧縮後1枚あたり最大5MB
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 合計15MB（Resendの上限40MB以下に抑える）
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, category, message, pageUrl, userAgent, attachments: rawAttachments, recaptchaToken } = body;

    // reCAPTCHA 検証
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (secretKey) {
      if (!recaptchaToken) {
        return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
      }
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${recaptchaToken}`,
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success || verifyData.score < 0.5) {
        return NextResponse.json({ error: 'ボット判定されました。時間をおいて再度お試しください。' }, { status: 400 });
      }
    }

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

    // 添付画像の検証と整形
    let attachments;
    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      if (rawAttachments.length > MAX_ATTACHMENTS) {
        return NextResponse.json({ error: `添付画像は最大${MAX_ATTACHMENTS}枚までです` }, { status: 400 });
      }
      let totalBytes = 0;
      const cleaned = [];
      for (const a of rawAttachments) {
        if (!a || typeof a.content !== 'string' || !a.contentType) {
          return NextResponse.json({ error: '添付画像の形式が不正です' }, { status: 400 });
        }
        if (!ALLOWED_CONTENT_TYPES.has(String(a.contentType))) {
          return NextResponse.json({ error: '画像形式のみ添付可能です（JPEG / PNG / WebP / GIF）' }, { status: 400 });
        }
        // base64サイズ → 実バイト数の概算（base64は4/3倍に膨らむ）
        const approxBytes = Math.floor(a.content.length * 0.75);
        if (approxBytes > MAX_ATTACHMENT_SIZE_BYTES) {
          return NextResponse.json({ error: `1枚あたり${Math.floor(MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024)}MB以下にしてください` }, { status: 400 });
        }
        totalBytes += approxBytes;
        cleaned.push({
          filename: String(a.filename || 'attachment.jpg').slice(0, 100),
          content: a.content,
          contentType: a.contentType,
        });
      }
      if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
        return NextResponse.json({ error: `添付画像の合計サイズが大きすぎます（${Math.floor(MAX_TOTAL_ATTACHMENT_BYTES / 1024 / 1024)}MBまで）` }, { status: 400 });
      }
      attachments = cleaned;
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
      attachments,
    });
    if (!notifyResult.success) {
      const err = notifyResult.error || {};
      // Resendのerrorオブジェクトは { name, message, statusCode } 形式。ユーザー向けに短く整形
      const errSummary = err.message || err.name || (typeof err === 'string' ? err : JSON.stringify(err).slice(0, 200));
      const fromCtx = err._from ? `（from: ${err._from}）` : '';
      console.error('通知メール送信失敗:', err);
      return NextResponse.json(
        {
          error: `送信処理で問題が発生しました: ${errSummary}${fromCtx}`,
          code: err.statusCode || err.name || null,
        },
        { status: 500 }
      );
    }

    // ② 送信者へ自動返信（失敗してもユーザー側は成功扱い）
    // 添付は再送付せず、ファイル名一覧のみで「何を送ったか」を確認できるようにする
    try {
      await sendContactAutoReplyEmail({ name, email, category, message, attachments });
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
