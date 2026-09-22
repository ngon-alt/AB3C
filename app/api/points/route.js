// ログイン中のユーザーのポイント残高（期限内の束の合計と、次に期限が来る分）と、契約中のプラン
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getBalance, getActivePointSubscription, POINT_TIERS, POINT_PURCHASES } from "../../lib/points";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }
  try {
    const [{ balance, nextExpiry, lots }, subscription] = await Promise.all([
      getBalance(session.user.email),
      getActivePointSubscription(session.user.email),
    ]);
    return Response.json({
      balance,
      nextExpiry,
      lots: lots.map(l => ({ source: l.source, sourceLabel: l.sourceLabel, remaining: l.remaining, expiresAt: l.expires_at })),
      subscription: subscription && { tier: subscription.tier, tierLabel: subscription.tierLabel, interval: subscription.interval, monthlyPoints: subscription.monthlyPoints },
      // 購入画面用のメニュー（価格IDは返さない）
      menu: {
        tiers: Object.entries(POINT_TIERS).map(([id, t]) => ({ id, label: t.label, points: t.points, monthYen: t.monthYen })),
        purchases: Object.entries(POINT_PURCHASES).map(([id, p]) => ({ id, label: p.label, pointsPerUnit: p.pointsPerUnit, unitYen: p.unitYen })),
      },
    });
  } catch (e) {
    console.error("[points] 残高の取得に失敗:", e?.message || e);
    return Response.json({ error: "ポイント残高を取得できませんでした" }, { status: 500 });
  }
}
