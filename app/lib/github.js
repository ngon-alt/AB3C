import crypto from "crypto";

// GitHub App 連携ヘルパー（Web更新機能 Phase 1）
// 認証は GitHub App：App ID + private key で JWT を作り、installation access token（1時間有効）を都度発行する。
// 長命トークンは保存しない。直接 main へ push はしない（PR方式）。

const GH_API = "https://api.github.com";
const GH_HEADERS = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getPrivateKey() {
  let key = process.env.GITHUB_APP_PRIVATE_KEY || "";
  key = key.trim();
  // 値を丸ごとクォートで囲んで保存されたケースを剥がす
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  // Vercel等でエスケープされた改行 "\r\n" / "\n"、および実改行の CRLF を実LFに正規化する
  key = key
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  return key;
}

// GitHub App 用 JWT（RS256・最大10分有効）
export function getAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) throw new Error("GITHUB_APP_ID が未設定です");
  if (!getPrivateKey()) throw new Error("GITHUB_APP_PRIVATE_KEY が未設定です");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }));
  const data = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(data);
  const sig = signer.sign(getPrivateKey()).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sig}`;
}

// installation access token（1時間有効）を取得
export async function getInstallationToken(installationId) {
  const id = installationId || process.env.GITHUB_APP_INSTALLATION_ID;
  if (!id) throw new Error("installation_id（GITHUB_APP_INSTALLATION_ID）が未設定です");
  const jwt = getAppJwt();
  const res = await fetch(`${GH_API}/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, ...GH_HEADERS },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`installation token の取得に失敗しました (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.token;
}

// installation token で GitHub API を叩く
export async function ghFetch(token, path, options = {}) {
  return fetch(path.startsWith("http") ? path : `${GH_API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...GH_HEADERS, ...(options.headers || {}) },
  });
}

// インストールがアクセスできるリポジトリ一覧
export async function listInstallationRepos(installationId) {
  const token = await getInstallationToken(installationId);
  const res = await ghFetch(token, "/installation/repositories?per_page=100");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`リポジトリ一覧の取得に失敗しました (${res.status}): ${t}`);
  }
  const data = await res.json();
  return (data.repositories || []).map(r => ({
    full_name: r.full_name,
    default_branch: r.default_branch,
    private: r.private,
  }));
}

// ── Web更新（編集→PR）フローのデータ層 ──────────────────────────
// すべて installation token 経由。直接 main へ push はしない（必ず作業ブランチ＋PR）。

// 編集対象になりやすいテキスト/コンテンツ系のファイルだけに絞るための拡張子。
// バイナリ・依存・ビルド成果物はツリーから除外し、AIに渡すトークンを節約する。
const EDITABLE_EXT = /\.(astro|html?|md|mdx|mdoc|markdown|jsx?|tsx?|vue|svelte|njk|liquid|hbs|ejs|pug|json|ya?ml|toml|css|scss)$/i;
const EXCLUDE_DIR = /(^|\/)(node_modules|\.next|\.git|dist|build|out|\.vercel|\.netlify|coverage|vendor)(\/|$)/i;

// リポジトリのファイルパス一覧（再帰）。編集対象になりやすいものだけ返す。
export async function getRepoTree(token, repoFullName, branch) {
  const res = await ghFetch(token, `/repos/${repoFullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`リポジトリ構成の取得に失敗しました (${res.status}): ${t}`);
  }
  const data = await res.json();
  const paths = (data.tree || [])
    .filter(n => n.type === "blob" && !EXCLUDE_DIR.test(n.path) && EDITABLE_EXT.test(n.path))
    .map(n => n.path);
  return { paths, truncated: !!data.truncated };
}

// 1ファイルの本文を取得（base64 をデコードして返す）。sha は更新時に必要。
export async function getFileContent(token, repoFullName, path, ref) {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const res = await ghFetch(token, `/repos/${repoFullName}/contents/${path.split("/").map(encodeURIComponent).join("/")}${q}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ファイル取得に失敗しました（${path}）(${res.status}): ${t}`);
  }
  const data = await res.json();
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`指定パスはファイルではありません（${path}）`);
  }
  const content = Buffer.from(data.content || "", data.encoding || "base64").toString("utf-8");
  return { content, sha: data.sha, path: data.path };
}

// ブランチの先端コミットSHAを取得
export async function getBranchHeadSha(token, repoFullName, branch) {
  const res = await ghFetch(token, `/repos/${repoFullName}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ブランチ ${branch} の取得に失敗しました (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.object?.sha;
}

// 新しいブランチを作成（fromSha から分岐）
export async function createBranch(token, repoFullName, newBranch, fromSha) {
  const res = await ghFetch(token, `/repos/${repoFullName}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: fromSha }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`作業ブランチの作成に失敗しました（${newBranch}）(${res.status}): ${t}`);
  }
  return res.json();
}

// ファイルを作成/更新（contents API PUT）。更新時は既存 blob の sha が必須。
export async function putFile(token, repoFullName, { path, content, message, branch, sha }) {
  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await ghFetch(token, `/repos/${repoFullName}/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ファイルのコミットに失敗しました（${path}）(${res.status}): ${t}`);
  }
  return res.json();
}

// プルリクエストを作成
export async function createPullRequest(token, repoFullName, { head, base, title, body }) {
  const res = await ghFetch(token, `/repos/${repoFullName}/pulls`, {
    method: "POST",
    body: JSON.stringify({ head, base, title, body }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`プルリクエストの作成に失敗しました (${res.status}): ${t}`);
  }
  return res.json();
}

// 作業ブランチ名を生成（衝突しにくいよう日時＋連番ベース）。
// 例: senryaku/update-20260615-0453-ab12
export function buildWorkBranchName(prefix = "senryaku/update") {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${stamp}-${rand}`;
}
