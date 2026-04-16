import { NextResponse } from "next/server";

// 旧エンドポイント（チュートリアル#1のみ送信）
// 新エンドポイント /api/email/cron-tutorial に統合済み（#1〜#5を一括処理）
// 後方互換のため残しているが、新規連携は cron-tutorial を使用すること
export async function POST(req) {
  const url = new URL(req.url);
  const newUrl = url.origin + "/api/email/cron-tutorial";

  // 同じヘッダーを引き継いで新エンドポイントへ転送
  const res = await fetch(newUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": req.headers.get("x-cron-secret") || "",
    },
  });

  const body = await res.json();
  return NextResponse.json({
    deprecated: true,
    redirected_to: "/api/email/cron-tutorial",
    ...body,
  }, { status: res.status });
}
