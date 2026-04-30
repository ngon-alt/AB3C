'use client';

// 全ページで動作する「上限超過モーダル」のガード。
// layout.js から読み込まれるため、トップ・ダッシュボード・howto 等どこを開いても
// ライセンス上限を超えていれば自動でモーダルが表示される。
//
// 仕様:
//  - 未ログイン時は何もしない
//  - /api/sites/cap-status を取得し overCap=true ならモーダル表示
//  - 「後で」で閉じても次回ページ遷移時に再表示
//  - 「確定」で削除完了時はページをリロードして UI を最新化
// 表示しないパス（管理画面・印刷ページ等）はパス先頭で除外。

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import SiteCapResolveModal from "./SiteCapResolveModal";

const EXCLUDED_PATH_PREFIXES = ["/admin", "/api", "/share", "/contact"];

export default function SiteCapGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [status2, setStatus2] = useState(null);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/sites/cap-status");
      if (!res.ok) return;
      const data = await res.json();
      setStatus2(data);
      if (data.overCap) setOpen(true);
    } catch (e) {}
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!pathname) return;
    if (EXCLUDED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;
    refresh();
  }, [status, pathname]);

  if (!status2?.overCap) return null;

  return (
    <SiteCapResolveModal
      open={open}
      sites={status2.sites || []}
      cap={status2.cap ?? 0}
      currentCount={status2.currentCount ?? 0}
      reason={status2.reason}
      onResolved={async () => {
        setOpen(false);
        await refresh();
        try { window.location.reload(); } catch (e) {}
      }}
      onDismiss={() => setOpen(false)}
    />
  );
}
