import crypto from "crypto";

const BASE = "https://api.urlbox.io/v1";

function sign(queryString, secret) {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

function buildUrl(targetUrl, format, options = {}) {
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
    max_height: "4000",
    ...options,
  });

  const qs = params.toString();
  const token = sign(qs, secret);
  return `${BASE}/${apiKey}/${token}/${format}?${qs}`;
}

// フロントエンド表示用（PNG、高画質）
export function getScreenshotUrl(targetUrl, options = {}) {
  return buildUrl(targetUrl, "png", { quality: "80", ...options });
}

// Claude Vision用（JPEG、低サイズ、5MB制限内に収める）
export function getScreenshotUrlForVision(targetUrl, options = {}) {
  return buildUrl(targetUrl, "jpeg", {
    quality: "60",
    thumb_width: "1024",
    ...options,
  });
}

export async function fetchScreenshotBase64(targetUrl, options = {}) {
  const url = getScreenshotUrlForVision(targetUrl, options);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`urlbox fetch failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) {
    throw new Error(`urlbox image too large: ${buf.length} bytes (>5MB limit)`);
  }
  return {
    url,
    base64: buf.toString("base64"),
    mediaType: "image/jpeg",
  };
}
