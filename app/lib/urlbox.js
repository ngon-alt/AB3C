import crypto from "crypto";

const BASE = "https://api.urlbox.io/v1";

function sign(queryString, secret) {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

export function getScreenshotUrl(targetUrl, options = {}) {
  const apiKey = process.env.URLBOX_API_KEY;
  const secret = process.env.URLBOX_API_SECRET;
  if (!apiKey || !secret) throw new Error("URLBOX_API_KEY / URLBOX_API_SECRET が未設定です");

  const params = new URLSearchParams({
    url: targetUrl,
    full_page: "true",
    wait_until: "domloaded",
    wait_timeout: "15000",
    hide_cookie_banners: "true",
    block_ads: "true",
    width: "1280",
    quality: "80",
    format: "png",
    ...options,
  });

  const qs = params.toString();
  const token = sign(qs, secret);
  return `${BASE}/${apiKey}/${token}/png?${qs}`;
}

export async function fetchScreenshotBase64(targetUrl, options = {}) {
  const url = getScreenshotUrl(targetUrl, options);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`urlbox fetch failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    url,
    base64: buf.toString("base64"),
    mediaType: "image/png",
  };
}
