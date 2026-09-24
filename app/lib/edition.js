// 現行版（senryaku.ai）と新規事業版を、同じリポジトリのまま分けるための土台（2026-09-25）
//
// 正典は docs/新規事業版-画面遷移設計-20260924.md の「0-2. 現行版と混ざらないようにする」。
// どちらの版かは **環境変数 EDITION だけ** が決める。ブラウザからは指定させない。
// 指定させると、送り間違いがそのまま両者の混線になるため。
//
//   senryaku.ai（Vercel: ab3c-analyzer）        … EDITION 未設定 → "site"
//   新規事業版（Vercel: 新しいプロジェクト）    … EDITION=newbiz
//
// sites テーブルの kind 列にこの値を入れ、読み書きのすべてに条件として付ける。
// これで、コードの書き間違いでは相手側のデータに触れない。
export const EDITION = process.env.EDITION === "newbiz" ? "newbiz" : "site";
export const isNewbiz = EDITION === "newbiz";
