// サイト一覧（GET /api/sites）の取得を共有する。
// ヘッダーとサイト管理ページが同時に一覧を取りに行くと、同じ通信が2本走っていた。
// 実行中の取得があればその結果を使い回す。完了後は保持しないので、登録・削除後の再取得は常に最新になる。
let inFlight = null;

export function fetchSitesList() {
  if (!inFlight) {
    inFlight = fetch("/api/sites")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "サイト一覧の取得に失敗しました（HTTP " + res.status + "）");
        return data;
      })
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}
