import { Suspense } from "react";
import ShareContent from "./ShareContent";

export default function SharePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 60, fontFamily: "serif" }}>読み込み中…</div>}>
      <ShareContent />
    </Suspense>
  );
}
