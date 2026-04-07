"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

const C = {
  bg: "#fafaf9",
  surface: "#ffffff",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
  highlight: "#fef3c7",
  A: "#1a6fd4",
  B: "#FF0000",
};

export default function Contact() {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: '100サイト以上のプラン希望',
    message: ''
  });
  const [status, setStatus] = useState(''); // 'sending', 'success', 'error'

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/check-pro")
        .then((r) => r.json())
        .then((d) => setIsPro(d.isPro))
        .catch(() => setIsPro(false));
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', company: '', category: '100サイト以上のプラン希望', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* ヘッダー */}
      <div style={{ borderBottom: `2px solid ${C.ink}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <a href="/" style={{ textDecoration: "none" }}>
              <div style={{ fontFamily: "var(--font-eb-garamond), serif", fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 900, lineHeight: 1 }}>
                <span style={{ color: "#1a6fd4" }}>A</span>
                <span style={{ color: "#FF0000" }}>B</span>
                <span style={{ color: "#1a1a14" }}>3C</span>
                <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: "clamp(16px, 3vw, 28px)", color: C.ink, marginLeft: 12 }}>戦略大臣</span>
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: "0.14em", marginTop: 4 }}>
                「選ばれる理由」を見つけるフレームワーク
              </div>
            </a>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, textAlign: "right", lineHeight: 2 }}>
            <div><b style={{ fontFamily: "'Space Mono', monospace", color: "#1a6fd4" }}>A</b> — Advantage（差別的優位点）</div>
            <div><b style={{ fontFamily: "'Space Mono', monospace", color: "#FF0000" }}>B</b> — Benefit（お客様が求める価値）</div>
            <div><b style={{ fontFamily: "'Space Mono', monospace", color: "#1a1a14" }}>3C</b> — Customer · Competitor · Company</div>
          </div>
          {session ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>
                  {session.user?.name}
                  {isPro && <span style={{ marginLeft: 6, background: "#1a6fd4", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 3, fontFamily: "'Space Mono', monospace" }}>PRO</span>}
                </span>
                <button onClick={() => signOut()} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted }}>
                  ログアウト
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a href="/" style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.A, textDecoration: "underline", padding: 0 }}>
                  分析画面へ
                </a>
              </div>
            </div>
          ) : (
            <button onClick={() => signIn("google")} style={{ display: "flex", alignItems: "center", gap: 0, border: "none", borderRadius: 4, cursor: "pointer", padding: 0, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.25)", fontFamily: "Roboto, Arial, sans-serif" }}>
              <div style={{ background: "#fff", padding: "10px 12px 11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
                  <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.6 10.6l7.9-6z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.7 2.2-7.6 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.9 6C6.5 42.5 14.6 48 24 48z"/>
                </svg>
              </div>
              <div style={{ background: "#DB4437", padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                Googleでログイン
              </div>
            </button>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ flex: 1, padding: "48px 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* ページタイトル */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.ink, marginBottom: 8 }}>お問い合わせ</h1>
            <p style={{ color: C.muted, lineHeight: 1.6 }}>
              100サイト以上のプランをご希望の方、その他ご質問がございましたらお気軽にお問い合わせください。
            </p>
          </div>

          {/* フォーム */}
          <div style={{ background: C.surface, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: 8, padding: 32 }}>
            {status === 'success' ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ color: "#16a34a", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>送信完了</div>
                <p style={{ color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                  お問い合わせありがとうございます。<br />
                  2営業日以内に担当者よりご連絡させていただきます。
                </p>
                <button
                  onClick={() => setStatus('')}
                  style={{ color: C.A, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
                >
                  続けて問い合わせる
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* お名前 */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: C.ink, fontWeight: 600, marginBottom: 8 }}>
                    お名前 <span style={{ color: C.B }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                    placeholder="山田 太郎"
                  />
                </div>

                {/* メールアドレス */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: C.ink, fontWeight: 600, marginBottom: 8 }}>
                    メールアドレス <span style={{ color: C.B }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                    placeholder="example@company.com"
                  />
                </div>

                {/* 会社名 */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: C.ink, fontWeight: 600, marginBottom: 8 }}>
                    会社名
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                    placeholder="株式会社〇〇"
                  />
                </div>

                {/* お問い合わせ種別 */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: C.ink, fontWeight: 600, marginBottom: 8 }}>
                    お問い合わせ種別 <span style={{ color: C.B }}>*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                  >
                    <option value="100サイト以上のプラン希望">100サイト以上のプラン希望</option>
                    <option value="サービス内容について">サービス内容について</option>
                    <option value="費用と決済について">費用と決済について</option>
                    <option value="分析結果についてのコンサルティング希望">分析結果についてのコンサルティング希望</option>
                    <option value="技術的な問題">技術的な問題</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                {/* お問い合わせ内容 */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: C.ink, fontWeight: 600, marginBottom: 8 }}>
                    お問い合わせ内容 <span style={{ color: C.B }}>*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, resize: "none", boxSizing: "border-box" }}
                    placeholder="お問い合わせ内容をご記入ください"
                  />
                </div>

                {/* エラーメッセージ */}
                {status === 'error' && (
                  <div style={{ marginBottom: 24, padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#b91c1c" }}>
                    送信に失敗しました。時間をおいて再度お試しください。
                  </div>
                )}

                {/* 送信ボタン */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{ 
                    width: "100%", 
                    background: status === 'sending' ? C.muted : C.A, 
                    color: "#fff", 
                    fontWeight: 600, 
                    padding: "12px 24px", 
                    borderRadius: 6, 
                    border: "none",
                    cursor: status === 'sending' ? "not-allowed" : "pointer",
                    fontSize: 16,
                    transition: "background 0.2s"
                  }}
                >
                  {status === 'sending' ? '送信中...' : '送信する'}
                </button>
              </form>
            )}
          </div>

          {/* 補足情報 */}
          <div style={{ marginTop: 32, textAlign: "center", color: C.muted, fontSize: 14 }}>
            <p>営業時間：平日 9:00〜18:00</p>
            <p style={{ marginTop: 8 }}>
              直接メールでのお問い合わせ：<a href="mailto:info@digi-kaku.or.jp" style={{ color: C.A, textDecoration: "underline" }}>info@digi-kaku.or.jp</a>
            </p>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "32px 20px", marginTop: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", fontSize: 12, color: C.muted, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 32 }} />
            <span style={{ fontSize: 12, color: C.ink }}>一般社団法人デジタル経営革新協会</span>
          </div>
          <div style={{ marginBottom: 8 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted }}>ab3c.jp</a> · Powered by Claude AI</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="/terms" style={{ color: C.muted, textDecoration: "none" }}>利用規約</a>
            <span style={{ color: C.border }}>|</span>
            <a href="/privacy" style={{ color: C.muted, textDecoration: "none" }}>プライバシーポリシー</a>
            <span style={{ color: C.border }}>|</span>
            <a href="/legal" style={{ color: C.muted, textDecoration: "none" }}>特定商取引法</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
