"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const C = {
  ink: "#1a1a14",
  muted: "#78716c",
  border: "#e5e5e0",
  surface: "#ffffff",
  highlight: "#fef3c7",
  phase1: "#0d9488",
  phase1Bg: "#a7e9e0",
  B: "#FF0000",
  A: "#1a6fd4",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif";

const MAX_ATTACHMENTS = 4;
const MAX_LONG_EDGE = 1280; // 圧縮後の最大ロング辺（px）— Vercel/Resend ペイロード上限に配慮
const JPEG_QUALITY = 0.75;

// ファイルをcanvasで圧縮し { name, dataUrl (base64 w/ prefix), contentType, bytes } を返す
async function compressImage(file) {
  // GIFは動画になりうるので圧縮せずそのまま扱う（サイズオーバーなら弾く）
  if (file.type === "image/gif") {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return { name: file.name, dataUrl, contentType: "image/gif", bytes: file.size };
  }

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });

  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);
  URL.revokeObjectURL(img.src);

  // JPEGに統一（透過情報が失われるがサイズ優先）
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const bytes = Math.floor((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return {
    name: `${baseName}.jpg`,
    dataUrl,
    contentType: "image/jpeg",
    bytes,
  };
}

export default function BugReportFloat() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // '', 'sending', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [attachments, setAttachments] = useState([]); // [{name, dataUrl, contentType, bytes}]
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const slots = MAX_ATTACHMENTS - attachments.length;
    if (slots <= 0) {
      setErrorMsg(`添付は最大${MAX_ATTACHMENTS}枚までです`);
      return;
    }
    setErrorMsg("");
    setCompressing(true);
    try {
      const toProcess = files.slice(0, slots);
      const results = [];
      for (const f of toProcess) {
        if (!f.type.startsWith("image/")) continue;
        try {
          const compressed = await compressImage(f);
          results.push(compressed);
        } catch (err) {
          console.error("圧縮失敗:", err);
        }
      }
      setAttachments(prev => [...prev, ...results]);
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // 表示しないページ（フォーム画面・印刷プレビュー・管理系）
  const hideOn = ["/contact", "/admin"];
  if (hideOn.some(p => pathname?.startsWith(p))) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMsg("内容をご記入ください。");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("メールアドレスをご記入ください。");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      // 添付画像をAPI向けに整形（data URL のプレフィックスを剥がした純粋なbase64文字列）
      const apiAttachments = attachments.map(a => {
        const comma = a.dataUrl.indexOf(",");
        const base64 = comma >= 0 ? a.dataUrl.slice(comma + 1) : a.dataUrl;
        return { filename: a.name, content: base64, contentType: a.contentType };
      });
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session?.user?.name || "",
          email,
          company: "",
          category: "バグ報告・不具合",
          message,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          attachments: apiAttachments,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("");
        setAttachments([]);
        setTimeout(() => { setStatus(""); setOpen(false); }, 3500);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "送信に失敗しました。時間をおいて再度お試しください。");
        setStatus("error");
      }
    } catch (e) {
      setErrorMsg("通信エラーが発生しました。");
      setStatus("error");
    }
  };

  return (
    <>
      {/* 印刷時は非表示 */}
      <style>{`@media print { .bug-report-float { display: none !important; } }`}</style>

      <div className="bug-report-float" style={{ position: "fixed", left: 20, bottom: 20, zIndex: 9999 }}>
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            aria-label="バグ報告"
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#ffffff", color: C.ink,
              border: `2px solid ${C.border}`,
              cursor: "pointer", fontSize: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.32), 0 3px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.16)";
            }}
            title="バグ報告・不具合のご連絡"
          >🐛</button>
        ) : (
          <div style={{
            width: 340, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            overflow: "hidden", fontFamily: FONT,
          }}>
            {/* ヘッダー */}
            <div style={{
              background: C.phase1, color: "#fff", padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15 }}>
                <span style={{ fontSize: 18 }}>🐛</span>
                <span>バグ報告・ご意見</span>
              </div>
              <button
                onClick={() => { setOpen(false); setStatus(""); setErrorMsg(""); }}
                aria-label="閉じる"
                style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2 }}
              >×</button>
            </div>

            {/* 本体 */}
            <div style={{ padding: "14px 16px" }}>
              {status === "success" ? (
                <div style={{ textAlign: "center", padding: "18px 8px" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>送信ありがとうございました</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                    内容を確認し、必要に応じてご返信いたします。
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
                    不具合やお気づきの点をお知らせください。現在のページURL・ブラウザ情報は自動で添付されます。
                  </div>

                  <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                    返信先メールアドレス <span style={{ color: C.B }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={status === "sending"}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4,
                      padding: "8px 10px", fontSize: 14, color: C.ink, fontFamily: FONT,
                      marginBottom: 10, outline: "none",
                    }}
                  />

                  <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>
                    内容 <span style={{ color: C.B }}>*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="どの操作で何が起きましたか？（例: 分析ボタンを押したら画面が白くなった）"
                    rows={5}
                    disabled={status === "sending"}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: C.highlight, border: `1px solid ${C.border}`, borderRadius: 4,
                      padding: "8px 10px", fontSize: 14, color: C.ink, fontFamily: FONT,
                      resize: "vertical", outline: "none",
                    }}
                  />

                  {/* 画像添付 */}
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                      画像添付（任意・最大{MAX_ATTACHMENTS}枚・自動で圧縮されます）
                    </label>
                    {attachments.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        {attachments.map((a, idx) => (
                          <div key={idx} style={{
                            position: "relative", width: 64, height: 64, borderRadius: 4,
                            border: `1px solid ${C.border}`, overflow: "hidden",
                            background: `url(${a.dataUrl}) center/cover no-repeat`,
                          }} title={`${a.name} (${Math.round(a.bytes / 1024)}KB)`}>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              aria-label="削除"
                              style={{
                                position: "absolute", top: 2, right: 2,
                                width: 18, height: 18, borderRadius: "50%",
                                background: "rgba(0,0,0,0.65)", color: "#fff",
                                border: "none", cursor: "pointer",
                                fontSize: 12, lineHeight: 1, padding: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {attachments.length < MAX_ATTACHMENTS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={compressing || status === "sending"}
                        style={{
                          background: "transparent", border: `1px dashed ${C.border}`,
                          borderRadius: 4, padding: "6px 10px", fontSize: 12,
                          color: C.muted, cursor: compressing ? "not-allowed" : "pointer",
                          fontFamily: FONT,
                        }}
                      >
                        {compressing ? "圧縮中…" : `📎 画像を追加（${attachments.length}/${MAX_ATTACHMENTS}）`}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  {errorMsg && (
                    <div style={{ fontSize: 12, color: C.B, marginTop: 8 }}>{errorMsg}</div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={status === "sending"}
                    style={{
                      width: "100%", marginTop: 12,
                      background: status === "sending" ? C.muted : C.ink,
                      color: "#fff", border: "none", borderRadius: 4,
                      padding: "10px 14px", fontSize: 14, fontWeight: 700,
                      cursor: status === "sending" ? "not-allowed" : "pointer",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {status === "sending" ? "送信中…" : "送信する"}
                  </button>

                  <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center", lineHeight: 1.5 }}>
                    詳しく書きたい場合は <a href="/contact?type=bug" style={{ color: C.A }}>通常のお問い合わせフォーム</a> もご利用ください。
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
