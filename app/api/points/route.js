// ログイン中のユーザーのポイント残高（期限内の束の合計と、次に期限が来る分）
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getBalance } from "../../lib/points";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }
  try {
    const { balance, nextExpiry, lots } = await getBalance(session.user.email);
    return Response.json({
      balance,
      nextExpiry,
      lots: lots.map(l => ({ source: l.source, sourceLabel: l.sourceLabel, remaining: l.remaining, expiresAt: l.expires_at })),
    });
  } catch (e) {
    console.error("[points] 残高の取得に失敗:", e?.message || e);
    return Response.json({ error: "ポイント残高を取得できませんでした" }, { status: 500 });
  }
}
