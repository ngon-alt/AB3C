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
  // Vercel等で改行が "\n" のリテラルとして保存された場合に対応
  if (key.includes("\\n")) key = key.replace(/\\n/g, "\n");
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
