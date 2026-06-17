import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getAppJwt } from "../../../lib/github";

// Web更新の自己診断（鍵の中身は一切返さない）。
// DECODER等の原因切り分け用：どの鍵ソースを読んでいるか・parseできるか・最新コードか を返す。
export const CODE_VERSION = "2026-06-15-diag1";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const b64 = process.env.GITHUB_APP_PRIVATE_KEY_BASE64 || "";
  const plain = process.env.GITHUB_APP_PRIVATE_KEY || "";

  let decodedIsPem = false;
  let decodedHead = "";
  if (b64.trim()) {
    try {
      const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
      decodedIsPem = decoded.includes("PRIVATE KEY");
      decodedHead = decoded.trim().slice(0, 30); // 例: "-----BEGIN RSA PRIVATE KEY-----"（公開情報のヘッダ部のみ）
    } catch (e) {}
  }

  // 実際に署名できるか（鍵が正しく読めるか）を試す。鍵そのものは返さない。
  let jwtOk = false, jwtError = "";
  try { getAppJwt(); jwtOk = true; }
  catch (e) { jwtError = (e?.message || String(e)).slice(0, 120); }

  return NextResponse.json({
    code_version: CODE_VERSION,
    has_app_id: !!process.env.GITHUB_APP_ID,
    has_installation_id: !!process.env.GITHUB_APP_INSTALLATION_ID,
    has_base64: !!b64.trim(),
    base64_len: b64.trim().length,
    has_plain: !!plain.trim(),
    plain_len: plain.trim().length,
    base64_decodes_to_pem: decodedIsPem,
    decoded_header: decodedHead,   // PEMの先頭ヘッダ行だけ（秘密情報ではない）
    key_source_used: (b64.trim() && decodedIsPem) ? "base64" : (plain.trim() ? "plain" : "none"),
    sign_ok: jwtOk,
    sign_error: jwtError,
  });
}
