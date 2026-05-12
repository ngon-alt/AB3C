import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = '戦略指南 AI';

async function sendEmail(to, subject, html, options = {}) {
  if (!resend) {
    console.log('📧 [メール送信スキップ] Resend API キー未設定');
    return { success: true, skipped: true };
  }
  const fromHeader = `${FROM_NAME} <${FROM}>`;
  try {
    const payload = { from: fromHeader, to: [to], subject, html };
    if (options.replyTo) payload.reply_to = options.replyTo;
    if (options.attachments && options.attachments.length > 0) {
      // Resend SDK v6 の Attachment 型:
      //   content: Buffer | string（Bufferならバイナリ、stringはテキストとして扱われる）
      //   content_type: string（snake_case。SDK v4+ で仕様変更）
      // base64文字列を渡すとテキストコンテンツ扱いになるため必ず Buffer 化する。
      payload.attachments = options.attachments.map(a => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? Buffer.from(a.content, 'base64') : a.content,
        content_type: a.contentType,
      }));
    }
    const result = await resend.emails.send(payload);
    // Resend SDK は成功時に { data: { id }, error: null } を、失敗時に { data: null, error: {...} } を返す
    if (result?.error) {
      console.error('📧 メール送信失敗:', { from: fromHeader, to, subject, error: result.error });
      // デバッグ用に使われた from を error に乗せる
      const errWithCtx = typeof result.error === 'object' ? { ...result.error, _from: fromHeader } : { message: String(result.error), _from: fromHeader };
      return { success: false, error: errWithCtx };
    }
    console.log('📧 メール送信成功:', { from: fromHeader, to, subject, id: result?.data?.id, attachmentsCount: options.attachments?.length || 0 });
    return { success: true, data: result };
  } catch (error) {
    console.error('📧 メール送信例外:', { from: fromHeader, to, subject, error });
    return { success: false, error: { message: error?.message || String(error), _from: fromHeader } };
  }
}

// HTML エスケープ（お問い合わせフォームのユーザー入力用）
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendRegistrationEmail({ email, name }) {
  return sendEmail(email, '【戦略指南 AI】ご登録が完了しました', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、ご登録ありがとうございます。</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">戦略指南 AIは、300万円の事業戦略立案サービスをボタン一つで可能にしたツールです。</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">生成AIに戦略を相談すると都度都度の対処療法的な回答になりがちです。先日はこう言っていたのに今日はこんなふうに言っている——矛盾した回答に戸惑うことがありませんか？</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">戦略指南 AIでは環境調査をした上で戦略を固めることで、その後のマーケティングの軸が定まり、一貫性のある経営戦略の実行が可能になります。</p><div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0 0 12px">無料トライアルでできること：</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 4px">・AB3C分析レポート：1回</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 4px">・Webサイト改善レポート：1回</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">・AIチャット相談：1回</p></div><p style="font-size:16px;line-height:1.8;color:#1a1a14">あなたのWebサイトのURLを入れてお試しください。</p><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold;margin-top:8px">さっそく分析を始める →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

export async function sendWelcomeEmail({ email, name }) {
  return sendEmail(email, 'あなたのビジネスの「選ばれる理由」、一緒に見つけましょう。', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、ありがとうございます。自社利用でご登録いただきました。</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">早速ですが、一つ質問させてください。</p><p style="font-size:18px;font-weight:bold;line-height:1.8;color:#1a6fd4;border-left:4px solid #1a6fd4;padding-left:16px;margin:24px 0">「なぜお客様はあなたから買うのですか？」</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">この質問にすぐ答えられる経営者は、実はほとんどいません。でも、この「選ばれる理由」が言語化できた瞬間から、Webサイトも、営業も、採用も、すべてが変わり始めます。</p><hr style="border:none;border-top:1px solid #e5e5e0;margin:32px 0"><p style="font-size:15px;font-weight:bold;color:#1a1a14;margin-bottom:20px">戦略指南 AIの使い方には2つのフェーズがあります。</p><div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:16px"><p style="font-size:13px;font-weight:bold;color:#1a6fd4;margin:0 0 8px">① 戦略策定フェーズ</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">AB3C分析で「選ばれる理由」を言語化し、戦略を固めます。分析結果に「これは違う」と感じたら、AIチャットでその違和感を深掘りしてください。</p></div><div style="background:#f0fff4;border-radius:8px;padding:20px 24px;margin-bottom:32px"><p style="font-size:13px;font-weight:bold;color:#16a34a;margin:0 0 8px">② 戦略アクションフェーズ</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">固めた戦略をぶらさずに、Webサイト改善・営業・採用・補助金申請など、さまざまな施策に展開します。</p></div><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">さっそく分析を始める →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

export async function sendWelcomeEmailAgency({ email, name }) {
  return sendEmail(email, '毎月20万円〜の伴走支援が提供できます', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、ありがとうございます。クライアント提供でご登録いただきました。</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">戦略指南 AIによって戦略を立案し、この戦略にもとづいたマーケティング支援を提供することで、<strong>毎月20万円〜の伴走支援サービス</strong>を提供できます。</p><hr style="border:none;border-top:1px solid #e5e5e0;margin:32px 0"><p style="font-size:15px;font-weight:bold;color:#1a1a14;margin-bottom:20px">あなたがクライアントに提供できること：</p><div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:16px"><p style="font-size:13px;font-weight:bold;color:#1a6fd4;margin:0 0 8px">① 戦略策定フェーズ</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">クライアントのWebサイトをAB3C分析し、「選ばれる理由」を言語化します。出てきたレポートがそのまま提案書になります。</p></div><div style="background:#f0fff4;border-radius:8px;padding:20px 24px;margin-bottom:32px"><p style="font-size:13px;font-weight:bold;color:#16a34a;margin:0 0 8px">② 戦略アクションフェーズ</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">固めた戦略をぶらさずに、Web改善・営業・採用・補助金申請など、あらゆる施策に展開します。毎月AIチャットでクライアントの経営相談に伴走することで、継続契約が自然に生まれます。</p></div><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin-bottom:24px">あなた自身のサイト、またはクライアントのWebサイトURLを入力して、AB3C分析を実行してください。レポートを見れば、提案のイメージが一気につかめます。</p><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">さっそく分析してみる →</a><p style="font-size:14px;color:#78716c;margin-top:32px;line-height:1.8;border-top:1px solid #e5e5e0;padding-top:24px">次回のメールでは「クライアントへの具体的な提案の仕方」をお伝えします。</p><p style="font-size:12px;color:#78716c">一般社団法人デジタル経営革新協会</p></div>`);
}

// 分析完了通知メール
//  - planKind = 'support'  : 戦略指南サブスク / PRO（ダッシュボードに履歴保存される）
//  - planKind = 'diagnosis': 戦略診断チケット / 無料トライアル（履歴保存なし＝持ち帰り必須）
//  - siteId                : 既存サイト再分析時のサイトID（指南プランの場合、メール内リンクを分析結果ページに直接飛ばすのに使用）
export async function sendAnalysisCompleteEmail({ email, name, planKind = 'diagnosis', siteId = null }) {
  if (planKind === 'support') {
    // 指南プラン向け: siteId があれば当該分析ページ、なければダッシュボードへ
    const targetUrl = siteId
      ? `https://senryaku.ai/?site_id=${encodeURIComponent(siteId)}`
      : 'https://senryaku.ai/dashboard';
    const ctaLabel = siteId ? '分析結果を開く →' : 'サイト一覧を見る →';
    return sendEmail(email, '【戦略指南 AI】分析が完了しました。次のステップへ', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${esc(name)||'お客様'}さん、AB3C分析が完了しました。</p><p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px">分析結果は<strong>サイト管理画面に自動保存</strong>されています。いつでも呼び出せます。</p><div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0 0 12px">分析結果を活用する3つの方法</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">① AIチャットで「競合との違い」をさらに深掘りする</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">② Webサイト改善レポートで具体的な改善点を確認する</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">③ 戦略を確定して「戦略アクション」で施策を検討する</p></div><a href="${targetUrl}" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">${ctaLabel}</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
  }

  // 戦略診断チケット / 無料トライアル向け: 持ち帰りを強く促す
  const subject = '【戦略指南 AI】分析が完了しました。結果の持ち帰りをお忘れなく';
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div>
    <p style="font-size:16px;line-height:1.8;color:#1a1a14">${esc(name)||'お客様'}さん、AB3C分析が完了しました。</p>

    <div style="background:#fff3cd;border-left:4px solid #dc2626;border-radius:6px;padding:16px 20px;margin:24px 0">
      <p style="font-size:14px;font-weight:bold;color:#dc2626;margin:0 0 8px">⚠️ 重要：分析結果の持ち帰りをお願いします</p>
      <p style="font-size:14px;line-height:1.7;color:#1a1a14;margin:0">戦略診断チケット・無料トライアルでは、<strong>分析結果はブラウザを閉じると消えてしまいます</strong>。必ず以下のいずれかの方法で保存してください。</p>
    </div>

    <div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:24px 0">
      <p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0 0 12px">📥 持ち帰り方法（3つ）</p>
      <p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">① 分析画面の <strong>「シェアURL発行」</strong> ボタン → 発行されたURLをブックマーク・メモに保存</p>
      <p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">② 分析画面の <strong>「印刷」</strong> ボタン → ダイアログで「PDFとして保存」を選択</p>
      <p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">③ ブラウザのメニューから印刷 → PDF保存</p>
    </div>

    <a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">分析画面を開く →</a>

    <hr style="border:none;border-top:1px solid #e5e5e0;margin:32px 0">

    <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 12px">継続的に戦略を磨きたい場合は <strong>戦略指南サブスク</strong> もご検討ください。</p>
    <ul style="font-size:13px;line-height:1.8;color:#555;margin:0 0 16px;padding-left:20px">
      <li>分析結果・戦略確定履歴がサイト管理画面に保存</li>
      <li>AIチャットで戦略を磨ける（月100回/サイト）</li>
      <li>10施策テーマでアクションを検討できる</li>
    </ul>
    <a href="https://senryaku.ai/pricing" style="display:inline-block;color:#1a6fd4;text-decoration:underline;font-size:14px">戦略指南サブスクの詳細を見る →</a>

    <p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p>
  </div>`;
  return sendEmail(email, subject, html);
}

export async function sendFollowUpEmail({ email, name }) {
  return sendEmail(email, 'レポートを、誰かに見せてみましょう。', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、分析レポートはもうご覧になりましたか？</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">レポートを見て「なるほど」と思ったなら、次の一歩はシンプルです。<strong>誰かに見せてください。</strong></p><div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0 0 12px">2つの方法で簡単に共有できます：</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 12px"><strong>① シェアURLを発行する</strong><br>分析結果画面の「シェアする」ボタンを押すだけ。相手はログイン不要で閲覧できます。</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0"><strong>② PDFで保存する</strong><br>ブラウザの印刷機能から「PDFとして保存」を選ぶだけです。</p></div><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">レポートを開く →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

export async function sendTutorial2Email({ email, name }) {
  return sendEmail(email, '戦略を固めて、安心していませんか？', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん</p><p style="font-size:16px;line-height:1.8;color:#1a1a14">分析レポートができて「よし、戦略が固まった」と安心していませんか？実は、分析はスタート地点です。</p><div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0 0 12px">AIチャットを開いて、今週あなたが予定しているアクションを伝えてください。</p><p style="font-size:14px;line-height:1.8;color:#1a6fd4;margin:0 0 4px">「今週、新しい取引先に営業メールを送る予定です」</p><p style="font-size:14px;line-height:1.8;color:#1a6fd4;margin:0 0 4px">「来週、採用の求人票を更新しようと思っています」</p><p style="font-size:14px;line-height:1.8;color:#1a6fd4;margin:0 0 16px">「今月中にWebサイトのトップページを修正したいです」</p><p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0">そして、こう質問してください。<br>「この中で、戦略を反映させられるアクションはありますか？」</p></div><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">チャットを開く →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

export async function sendTutorial3Email({ email, name }) {
  return sendEmail(email, 'レポートから、営業資料を10分で作る方法', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、シェアURLを使うと営業資料や提案書が10分で作れます。<strong>Google NotebookLMを使った方法です。</strong></p><div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">① NotebookLM（notebooklm.google.com）を開く</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">② 「新しいノートブック」を作成</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 8px">③ 「ウェブサイトを追加」にシェアURLを貼り付ける</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">④ 「スライドを作成して」と指示する</p></div><p style="font-size:16px;line-height:1.8;color:#1a1a14">AB3Cの分析内容をベースにしたスライドが自動で生成されます。そのままクライアントへの提案書として使えます。</p><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">シェアURLを発行する →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

export async function sendTutorial4Email({ email, name }) {
  return sendEmail(email, '補助金申請の構想整理に、戦略指南 AIを使う方法', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、AB3C分析のレポートは、補助金申請の<strong>構想整理・記入のヒント</strong>としてご活用いただけます。</p><div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:14px;font-weight:bold;color:#1a1a14;margin:0 0 12px">手順はこの通りです：</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 12px"><strong>① 申請したい補助金の募集要項を確認する</strong><br>事業計画書や事業内容を記載する添付資料があるはずです。その資料をダウンロードしてください。（ファイルに書き込むのではなく、システムに直接書き込む形式もあります。）</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0 0 12px"><strong>② 資料の記載項目をAIチャットに読み込ませる</strong><br>記載項目や設問をコピーしてチャットに貼り付けてください。</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0"><strong>③ こう質問する</strong><br>「この項目について、AB3Cの分析結果から記入のヒント・論点整理を提示してください」</p></div><div style="background:#fffbe5;border:1px solid #f0d98a;border-radius:6px;padding:14px 18px;margin:20px 0;font-size:13px;line-height:1.8;color:#1a1a14"><strong>⚠️ ご注意</strong><br>本サービスは申請書の作成代行を行うものではありません。AIが提示するのは、申請内容を検討するための戦略整理・構想整理のヒントです。最終的な記載内容はご自身でご確認の上、作成・提出してください。申請書類の作成代行・提出代理が必要な場合は、行政書士等の専門家にご相談ください。</div><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">チャットを開く →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

export async function sendTutorial5Email({ email, name }) {
  return sendEmail(email, '毎朝5分、戦略指南 AIと話す習慣を作りましょう。', `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="font-size:24px;font-weight:bold;margin-bottom:24px;color:#1a1a14">戦略指南 AI</div><p style="font-size:16px;line-height:1.8;color:#1a1a14">${name||'お客様'}さん、ご登録から約1ヶ月が経ちました。一つ、新しい習慣を提案させてください。</p><div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin:28px 0"><p style="font-size:16px;font-weight:bold;color:#1a6fd4;margin:0 0 12px">毎朝5分、その日やることをチャットに話しかけてください。</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;font-style:italic;margin:0 0 8px">「今日の午後、新規クライアントに初回提案をします」</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;font-style:italic;margin:0 0 8px">「今週中に採用ページを更新する予定です」</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;font-style:italic;margin:0 0 16px">「今月中にWebサイトのトップページを修正したいです」</p><p style="font-size:14px;line-height:1.8;color:#1a1a14;margin:0">それだけで、戦略指南 AIが「その取り組みに戦略をどう反映させるか」を一緒に考えてくれます。</p></div><p style="font-size:16px;line-height:1.8;color:#1a1a14">明日の朝、まず一つ話しかけてみてください。</p><a href="https://senryaku.ai" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:15px;font-weight:bold">チャットを開く →</a><p style="font-size:12px;color:#78716c;margin-top:40px">一般社団法人デジタル経営革新協会</p></div>`);
}

// 決済完了時に運営（info@digi-kaku.or.jp）へ通知するメール
// 決裁者プロフィール・選択メニュー・金額を含む
export async function sendPaymentNotificationEmail({
  buyerEmail,
  buyerName,
  purpose,       // 'self' | 'agency' | null
  planType,      // 'analysis' | 'support'
  siteLimit,     // 1 / 5 / 10 / 15 / 30 / 60 / 100 / 120
  interval,      // 'month' | 'year'
  amountJpy,     // 実際の決済額（円）
  priceId,
  stripeSessionId,
}) {
  const NOTIFY_TO = process.env.PAYMENT_NOTIFY_EMAIL || 'info@digi-kaku.or.jp';

  const planLabel =
    planType === 'analysis' ? '戦略診断チケット（1年）' :
    planType === 'support'  ? `戦略指南サブスク（${interval === 'year' ? '年額' : '月額'}）` :
    '不明プラン';
  const purposeLabel = purpose === 'self' ? '自社利用' : purpose === 'agency' ? 'クライアント提供（代理店）' : '未回答';
  const amountStr = typeof amountJpy === 'number' ? `¥${amountJpy.toLocaleString('ja-JP')}` : '—';
  const subject = `【戦略指南 AI／決済通知】${planLabel} ${siteLimit}サイト ${amountStr} — ${buyerEmail}`;

  const html = `<div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:32px 24px;color:#1a1a14">
    <div style="font-size:22px;font-weight:bold;margin-bottom:8px">戦略指南 AI — 決済完了通知</div>
    <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px">新しい決済が完了しました。以下の内容を確認してください。</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr><td style="padding:8px 12px;background:#f5f2eb;width:160px;font-weight:bold">プラン</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${planLabel}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">サイト数</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${siteLimit}サイト</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">決済金額</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0;font-weight:bold;color:#1a6fd4">${amountStr}（税込・クーポン適用後）</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">決裁者メール</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0"><a href="mailto:${buyerEmail}" style="color:#1a6fd4">${buyerEmail}</a></td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">決裁者氏名</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${buyerName || '—'}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">利用目的</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${purposeLabel}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">Stripe Price ID</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0;font-family:monospace;font-size:12px">${priceId || '—'}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold">Stripe Session ID</td><td style="padding:8px 12px;font-family:monospace;font-size:12px">${stripeSessionId || '—'}</td></tr>
    </table>

    <p style="font-size:12px;color:#78716c;margin-top:24px">このメールは Stripe webhook により自動送信されています。</p>
  </div>`;

  return sendEmail(NOTIFY_TO, subject, html);
}

// お問い合わせ受付時、運営（info@digi-kaku.or.jp）へ通知するメール
// Reply-To に送信者のメールを設定してあるので、そのまま返信できる
export async function sendContactNotificationEmail({
  name,
  email,
  company,
  category,
  message,
  pageUrl,      // ユーザーが送信時にいたページ
  userAgent,    // ブラウザ情報（バグ報告の手がかり）
  loggedInEmail,// NextAuthセッションのメール（フォーム入力と違う場合あり）
  attachments,  // [{ filename, content (base64 string without data:prefix), contentType }]
}) {
  const NOTIFY_TO = process.env.CONTACT_NOTIFY_EMAIL || 'info@digi-kaku.or.jp';
  const isBug = /バグ|不具合|エラー|動かな|表示され/.test(String(category || '') + ' ' + String(message || ''));
  const prefix = isBug ? '【バグ報告】' : '【お問い合わせ】';
  const subject = `${prefix}[${category || 'その他'}] ${name || '名前未入力'} — 戦略指南 AI`;

  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:32px 24px;color:#1a1a14">
    <div style="font-size:22px;font-weight:bold;margin-bottom:8px">戦略指南 AI — ${isBug ? 'バグ報告' : 'お問い合わせ'}受付</div>
    <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px">フォームからの送信がありました。このメールに<strong>返信するとそのまま送信者へ返信できます</strong>。</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr><td style="padding:8px 12px;background:#f5f2eb;width:160px;font-weight:bold;vertical-align:top">種別</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0"><strong style="color:${isBug ? '#dc2626' : '#1a6fd4'}">${esc(category)}</strong></td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold;vertical-align:top">お名前</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${esc(name)}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold;vertical-align:top">メール</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0"><a href="mailto:${esc(email)}" style="color:#1a6fd4">${esc(email)}</a></td></tr>
      ${loggedInEmail && loggedInEmail !== email ? `<tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold;vertical-align:top">ログイン中のメール</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0;color:#78716c">${esc(loggedInEmail)}</td></tr>` : ''}
      <tr><td style="padding:8px 12px;background:#f5f2eb;font-weight:bold;vertical-align:top">会社名</td><td style="padding:8px 12px;border-bottom:1px solid #e5e5e0">${esc(company) || '—'}</td></tr>
    </table>

    <div style="margin-bottom:24px">
      <div style="font-size:13px;font-weight:bold;color:#1a1a14;margin-bottom:8px">お問い合わせ内容</div>
      <div style="background:#fafaf7;border:1px solid #e5e5e0;border-radius:6px;padding:16px 20px;font-size:14px;line-height:1.8;white-space:pre-wrap;word-wrap:break-word">${esc(message)}</div>
    </div>

    ${(pageUrl || userAgent) ? `
    <div style="margin-bottom:24px">
      <div style="font-size:12px;font-weight:bold;color:#78716c;margin-bottom:6px">環境情報（バグ報告の手がかり）</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;color:#555">
        ${pageUrl ? `<tr><td style="padding:4px 8px;font-weight:bold;width:120px;vertical-align:top">送信時URL</td><td style="padding:4px 8px;word-break:break-all"><a href="${esc(pageUrl)}" style="color:#1a6fd4">${esc(pageUrl)}</a></td></tr>` : ''}
        ${userAgent ? `<tr><td style="padding:4px 8px;font-weight:bold;vertical-align:top">User-Agent</td><td style="padding:4px 8px;word-break:break-all;font-family:monospace">${esc(userAgent)}</td></tr>` : ''}
      </table>
    </div>
    ` : ''}

    ${(attachments && attachments.length > 0) ? `
    <div style="margin-bottom:24px">
      <div style="font-size:12px;font-weight:bold;color:#78716c;margin-bottom:6px">添付画像（${attachments.length}枚）</div>
      <div style="font-size:12px;color:#555;line-height:1.8">${attachments.map(a => `・${esc(a.filename)}`).join('<br>')}</div>
      <p style="font-size:11px;color:#78716c;margin-top:6px">※ メールの添付ファイルとしてご確認ください。</p>
    </div>
    ` : ''}

    <p style="font-size:12px;color:#78716c;margin-top:24px;border-top:1px solid #e5e5e0;padding-top:16px">このメールは <a href="https://senryaku.ai/contact" style="color:#78716c">/contact</a> フォームから自動送信されています。</p>
  </div>`;

  // replyTo にユーザーのメールを設定 → 返信するとユーザーに届く
  return sendEmail(NOTIFY_TO, subject, html, { replyTo: email, attachments });
}

// 戦略指南サブスクのダウングレードに伴い、古いサイトを自動削除した旨を通知
//  - email: 通知先（契約者本人）
//  - deletedSites: [{ site_name, site_url }, ...]
//  - oldLimit / newLimit: 旧サイト上限 / 新サイト上限
export async function sendPlanDowngradeEmail({ email, name, deletedSites, oldLimit, newLimit }) {
  const count = deletedSites?.length || 0;
  const subject = `【戦略指南 AI】プラン変更に伴い ${count} サイトを削除しました`;
  const listItems = (deletedSites || []).map(s => {
    const label = s.site_name || s.site_url || '(無題のサイト)';
    const url = s.site_url ? ` — ${esc(s.site_url)}` : '';
    return `<li style="margin-bottom:4px">${esc(label)}${url}</li>`;
  }).join('');
  const html = `<div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:40px 20px;color:#1a1a14">
    <div style="font-size:24px;font-weight:bold;margin-bottom:24px">戦略指南 AI</div>
    <p style="font-size:16px;line-height:1.8">${esc(name) || 'お客様'}さん、戦略指南サブスクの変更を承りました。</p>

    <div style="background:#fff3cd;border-left:4px solid #dc2626;border-radius:6px;padding:16px 20px;margin:24px 0">
      <p style="font-size:14px;font-weight:bold;color:#dc2626;margin:0 0 8px">⚠️ サイトの自動削除について</p>
      <p style="font-size:14px;line-height:1.7;color:#1a1a14;margin:0">
        サイト登録上限が <strong>${oldLimit} → ${newLimit}</strong> に変更されたため、
        古いご登録順に <strong>${count} サイト</strong> を削除しました。
      </p>
    </div>

    <div style="background:#fafaf7;border:1px solid #e5e5e0;border-radius:6px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:13px;font-weight:bold;color:#1a1a14;margin-bottom:10px">削除されたサイト（${count}件）</div>
      <ul style="font-size:14px;line-height:1.7;color:#1a1a14;margin:0;padding-left:20px">
        ${listItems}
      </ul>
    </div>

    <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 12px">
      もし別のサイトを残したかった場合は、大変お手数ですが運営までご連絡ください。
      削除されたサイトの分析結果・チャット履歴・戦略確定データもあわせて削除されています。
    </p>

    <a href="https://senryaku.ai/contact?type=bug" style="display:inline-block;background:#1a6fd4;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px;font-weight:bold;margin-top:8px">お問い合わせはこちら →</a>

    <p style="font-size:12px;color:#78716c;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">このメールは戦略指南サブスクのダウングレード処理に伴い自動送信されています。</p>
  </div>`;
  return sendEmail(email, subject, html);
}

// お問い合わせ送信者への受付確認（自動返信）
export async function sendContactAutoReplyEmail({ name, email, category, message, attachments }) {
  const subject = '【戦略指南 AI】お問い合わせを受け付けました';
  const attachmentSummary = (attachments && attachments.length > 0)
    ? `<div style="font-size:13px;line-height:1.8;border-top:1px solid #e5e5e0;padding-top:12px;margin-top:12px"><strong>添付画像：</strong>${attachments.length}枚<br>${attachments.map(a => `・${esc(a.filename)}`).join('<br>')}</div>`
    : '';
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a14">
    <div style="font-size:24px;font-weight:bold;margin-bottom:24px">戦略指南 AI</div>
    <p style="font-size:16px;line-height:1.8">${esc(name) || 'お客様'}さん、お問い合わせいただきありがとうございます。</p>
    <p style="font-size:16px;line-height:1.8">以下の内容で受け付けました。担当者より<strong>2営業日以内</strong>にご返信いたします。今しばらくお待ちください。</p>

    <div style="background:#f5f2eb;border-radius:8px;padding:20px 24px;margin:24px 0">
      <div style="font-size:13px;color:#78716c;margin-bottom:8px">受付内容</div>
      <div style="font-size:14px;line-height:1.8;margin-bottom:12px"><strong>種別：</strong>${esc(category)}</div>
      <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;word-wrap:break-word;border-top:1px solid #e5e5e0;padding-top:12px">${esc(message)}</div>
      ${attachmentSummary}
    </div>

    <p style="font-size:14px;line-height:1.8;color:#555">もしこのメールに心当たりがない場合は、お手数ですがこのメールを破棄してください。</p>

    <p style="font-size:12px;color:#78716c;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">このメールは自動送信されています。ご返信の必要はありません。お急ぎの場合は <a href="mailto:info@senryaku.ai" style="color:#78716c">info@senryaku.ai</a> まで直接ご連絡ください。<br><br>一般社団法人デジタル経営革新協会</p>
  </div>`;

  return sendEmail(email, subject, html);
}
