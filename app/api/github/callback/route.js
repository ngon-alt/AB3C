// GitHub App インストール後のリダイレクト先（Setup URL / Callback URL）。
// v1 は GITHUB_APP_INSTALLATION_ID（環境変数）で単一接続を扱うため、ここでは完了画面のみ表示する。
// （将来のマルチテナント化で installation_id を site_connections に保存する拡張ポイント）
export async function GET(req) {
  const url = new URL(req.url);
  const installationId = url.searchParams.get("installation_id");
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GitHub接続完了</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:72px auto;padding:0 24px;color:#1b2540;line-height:1.9}h1{font-size:22px;margin-bottom:16px}.id{display:inline-block;background:#eef1f7;padding:6px 12px;border-radius:6px;font-family:monospace;font-size:14px}a.btn{display:inline-block;margin-top:24px;background:#21409a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:15px}</style></head>
<body><h1>GitHubの接続が完了しました</h1><p>戦略指南AIに戻り、「Web更新」テーマから、確定した戦略に沿ってサイトを更新できます。</p>
${installationId ? `<p>接続ID（installation_id）: <span class="id">${installationId}</span></p>` : ""}
<a class="btn" href="https://senryaku.ai">senryaku.ai に戻る</a></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
