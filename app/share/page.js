import { neon } from "@neondatabase/serverless";
import ShareContent from "./ShareContent";

export async function generateMetadata({ searchParams }) {
  return { title: "AB3C分析結果" };
}

export default async function SharePage({ searchParams }) {
  const id = searchParams?.id;
  let input = null;
  let result = null;
  let error = "";

  if (!id) {
    error = "IDが指定されていません。";
  } else {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`SELECT * FROM shared_results WHERE id = ${id}`;
      if (rows.length === 0) {
        error = "データが見つかりませんでした。";
      } else {
        input = rows[0].input_text;
        result = typeof rows[0].result === 'string' ? JSON.parse(rows[0].result) : rows[0].result;
      }
    } catch (e) {
      error = "データの取得に失敗しました。";
    }
  }

  return <ShareContent input={input} result={result} error={error} />;
}
