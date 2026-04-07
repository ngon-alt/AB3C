import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, category, message } = body;

    // バリデーション
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // TODO: メール送信サービス（Resend、SendGrid等）との連携
    // 現在は仮実装：コンソールにログ出力
    console.log('=== お問い合わせ受信 ===');
    console.log('お名前:', name);
    console.log('メールアドレス:', email);
    console.log('会社名:', company || '未入力');
    console.log('種別:', category);
    console.log('内容:', message);
    console.log('========================');

    // 管理者宛メール送信（後で実装）
    // await sendEmail({
    //   to: 'info@digi-kaku.or.jp',
    //   subject: `【戦略大臣】お問い合わせ: ${category}`,
    //   html: `
    //     <h2>お問い合わせがありました</h2>
    //     <p><strong>お名前:</strong> ${name}</p>
    //     <p><strong>メールアドレス:</strong> ${email}</p>
    //     <p><strong>会社名:</strong> ${company || '未入力'}</p>
    //     <p><strong>種別:</strong> ${category}</p>
    //     <p><strong>内容:</strong></p>
    //     <p>${message.replace(/\n/g, '<br>')}</p>
    //   `
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: '送信に失敗しました' },
      { status: 500 }
    );
  }
}
