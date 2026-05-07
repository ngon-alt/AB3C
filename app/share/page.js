import { neon } from "@neondatabase/serverless";
import ShareContent from "./ShareContent";

export async function generateMetadata({ searchParams }) {
  return { title: "AB3C分析結果" };
}

export default async function SharePage({ searchParams }) {
  const id = searchParams?.id;
  let input = null;
  let result = null;
  let improveResult = null;
  let visualMock = null;
  let improveResultsByCombination = null;
  let visualMocksByCombination = null;
  let error = "";
  let expiredAt = null;

  if (!id) {
    error = "IDが指定されていません。";
  } else {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`SELECT * FROM shared_results WHERE id = ${id}`;
      if (rows.length === 0) {
        error = "データが見つかりませんでした。";
      } else {
        const row = rows[0];
        // 閲覧期限チェック（expires_at がNULLのレガシー扱いは従来どおり表示）
        if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
          error = "このシェアURLは閲覧期限（発行から1年）が切れています。";
          expiredAt = row.expires_at;
        } else {
          input = row.input_text;
          result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;
          improveResult = row.improve_result ? (typeof row.improve_result === 'string' ? JSON.parse(row.improve_result) : row.improve_result) : null;
          visualMock = row.visual_mock ? (typeof row.visual_mock === 'string' ? JSON.parse(row.visual_mock) : row.visual_mock) : null;
          improveResultsByCombination = row.improve_results_by_combination ? (typeof row.improve_results_by_combination === 'string' ? JSON.parse(row.improve_results_by_combination) : row.improve_results_by_combination) : null;
          visualMocksByCombination = row.visual_mocks_by_combination ? (typeof row.visual_mocks_by_combination === 'string' ? JSON.parse(row.visual_mocks_by_combination) : row.visual_mocks_by_combination) : null;
        }
      }
    } catch (e) {
      error = "データの取得に失敗しました。";
    }
  }

  return <ShareContent
    input={input}
    result={result}
    improveResult={improveResult}
    visualMock={visualMock}
    improveResultsByCombination={improveResultsByCombination}
    visualMocksByCombination={visualMocksByCombination}
    error={error}
    expiredAt={expiredAt}
  />;
}
