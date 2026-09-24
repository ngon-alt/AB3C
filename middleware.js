import { NextResponse } from "next/server";
import { EDITION } from "./app/lib/edition";

// 現行版（senryaku.ai）と新規事業版を、同じリポジトリ・同じコードのまま分けるための入口の歯止め。
// 正典は docs/新規事業版-画面遷移設計-20260924.md「0-2. 現行版と混ざらないようにする」。
//
//   EDITION=site   （既定・senryaku.ai） … /newbiz の画面は出さない（404）
//   EDITION=newbiz （新規事業版のドメイン）… トップを /newbiz にし、現行版の画面は出さない
//
// データ側の歯止めは sites.kind（app/lib/edition.js）。こちらは画面の歯止め。
// 両方の版で共通して使うもの（ログイン・API・ポイント・法務ページ等）は、どちらでも通す。
const SHARED_PREFIXES = [
  "/api", "/login", "/points", "/account",
  "/terms", "/privacy", "/legal", "/contact", "/updates",
];

const isShared = (path) => SHARED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (isShared(pathname)) return NextResponse.next();

  const isNewbizPath = pathname === "/newbiz" || pathname.startsWith("/newbiz/");

  if (EDITION === "newbiz") {
    // 新規事業版のドメイン: トップは新規事業版のトップ。現行版の画面はそちらへ寄せる
    if (pathname === "/") return NextResponse.rewrite(new URL("/newbiz", req.url));
    if (!isNewbizPath) return NextResponse.redirect(new URL("/newbiz", req.url));
    return NextResponse.next();
  }

  // 現行版のドメイン: 新規事業版の画面は存在しない扱いにする
  if (isNewbizPath) return new NextResponse(null, { status: 404 });
  return NextResponse.next();
}

export const config = {
  // 画像・静的ファイル・Next の内部パスは通す
  matcher: ["/((?!_next/|favicon|icon|opengraph-image|samples/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml|pptx|pdf)$).*)"],
};
