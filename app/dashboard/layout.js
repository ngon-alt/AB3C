// ダッシュボードはログイン前提のページのため検索エンジンには載せない
export const metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }) {
  return children;
}
