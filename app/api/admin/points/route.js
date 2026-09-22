// 管理画面からのポイント付与・照会（キャンプ受講者への付与など）
// 認可は他の /api/admin/* と同じく ADMIN_SECRET（管理者だけが /api/admin/secret で受け取れる）
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { grantPoints, getBalance, getTransactions, POINT_SOURCES } from "../../../lib/points";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (!ADMIN_SECRET || searchParams.get("secret") !== ADMIN_SECRET) {
    return Response.json({ error: "認証エラー" }, { status: 401 });
  }
  const email = (searchParams.get("email") || "").trim();
  if (!email) return Response.json({ error: "メールアドレスを指定してください" }, { status: 400 });
  try {
    const [balance, transactions] = await Promise.all([getBalance(email), getTransactions(email, 100)]);
    return Response.json({ ...balance, transactions });
  } catch (e) {
    return Response.json({ error: e?.message || "照会に失敗しました" }, { status: 500 });
  }
}

export async function POST(req) {
  const { secret, emails, points, source, expiresAt, note } = await req.json();
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return Response.json({ error: "認証エラー" }, { status: 401 });
  }
  if (!POINT_SOURCES[source] || source === "subscription") {
    return Response.json({ error: "付与の種類が不正です" }, { status: 400 });
  }
  // キャンプ受講者などをまとめて付与できるよう、改行・カンマ区切りの複数アドレスを受け付ける
  const list = [...new Set(String(emails || "").split(/[\s,、]+/).map(s => s.trim().toLowerCase()).filter(Boolean))];
  if (!list.length) return Response.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  const invalid = list.filter(e => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (invalid.length) return Response.json({ error: `メールアドレスの形式が不正です: ${invalid.join(", ")}` }, { status: 400 });

  const session = await getServerSession(authOptions);
  const createdBy = session?.user?.email || null;
  const results = [];
  for (const email of list) {
    try {
      const r = await grantPoints({ email, points, source, expiresAt: expiresAt || null, note: note || null, createdBy });
      results.push({ email, ok: true, points: r.points, expiresAt: r.expiresAt });
    } catch (e) {
      results.push({ email, ok: false, error: e?.message || "付与に失敗しました" });
    }
  }
  return Response.json({ results });
}
