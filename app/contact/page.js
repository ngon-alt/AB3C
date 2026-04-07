"use client";

import React, { useState } from 'react';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: '100サイト以上のプラン希望',
    message: ''
  });
  const [status, setStatus] = useState(''); // 'sending', 'success', 'error'

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
    <div style={{ minHeight: "100vh", background: C.bg, padding: "48px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* ヘッダー */}
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

        {/* ホームに戻るリンク */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <a href="/" style={{ color: C.A, textDecoration: "underline" }}>
            ← トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
