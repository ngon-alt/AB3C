"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

const C = {
  bg: "#ebebeb",
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
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('type') === 'bug'
    ? 'バグ報告・不具合'
    : '100サイト以上のプラン希望';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: initialCategory,
    message: ''
  });
  const [status, setStatus] = useState(''); // 'sending', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [showPricing, setShowPricing] = useState(false);

  // ログイン済みならメール・名前を自動記入
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user.name || '',
        email: prev.email || session.user.email || '',
      }));
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    // バグ報告の手がかりとして環境情報を付加
    const payload = {
      ...formData,
      pageUrl: typeof window !== 'undefined' ? document.referrer || window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          company: '',
          category: initialCategory,
          message: ''
        });
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.error || '送信に失敗しました。時間をおいて再度お試しください。');
        setStatus('error');
      }
    } catch (error) {
      setErrorMsg('通信エラーが発生しました。時間をおいて再度お試しください。');
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* ヘッダー */}
      <Header onShowPricing={() => setShowPricing(true)} />
      
      {/* 料金モーダル */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}


      {/* メインコンテンツ */}
      <div style={{ flex: 1, padding: "48px 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* ページタイトル */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.ink, marginBottom: 8 }}>お問い合わせ</h1>
            <p style={{ color: C.muted, lineHeight: 1.7 }}>
              バグ報告・不具合のご連絡、サービスに関するご質問、<br />
              大規模プランのご相談など、お気軽にお寄せください。
            </p>
            {initialCategory === 'バグ報告・不具合' && (
              <div style={{ marginTop: 16, background: "#fffbe5", border: "1px solid #f0d98a", borderRadius: 6, padding: "12px 16px", fontSize: 13, lineHeight: 1.7, color: C.ink, textAlign: "left" }}>
                <strong>バグ報告ありがとうございます。</strong><br />
                不具合の発生状況（どの画面で、どの操作をしたか、どんな表示になったか）を具体的にご記入いただけると、修正までの時間が大幅に短縮されます。スクリーンショットがあれば、直接メール（info@senryaku.ai）に添付してお送りください。
              </div>
            )}
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
                    <option value="バグ報告・不具合">🐛 バグ報告・不具合</option>
                    <option value="機能要望">💡 機能要望・改善提案</option>
                    <option value="サービス内容について">サービス内容について</option>
                    <option value="費用と決済について">費用と決済について</option>
                    <option value="分析結果についてのコンサルティング希望">分析結果についてのコンサルティング希望</option>
                    <option value="税理士の紹介希望">税理士の紹介希望</option>
                    <option value="100サイト以上のプラン希望">100サイト以上のプラン希望</option>
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
                    rows="8"
                    style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
                    placeholder={formData.category === 'バグ報告・不具合'
                      ? `【どの画面で】例：戦略アクションタブの「補助金申請」\n【どの操作で】例：分析結果を開いた直後に「アクションに登録」ボタンを押した\n【どうなったか】例：エラー画面が出て戻れなくなった\n【期待した動作】例：アクションリストに追加されるはず\n※可能なら発生日時・スクリーンショットも（画像は info@senryaku.ai に別途送付）`
                      : 'お問い合わせ内容をご記入ください'}
                  />
                  {formData.category === 'バグ報告・不具合' && (
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                      送信時の URL と User-Agent（ブラウザ情報）は、バグ再現の手がかりとして自動的に添付されます。
                    </p>
                  )}
                </div>

                {/* エラーメッセージ */}
                {status === 'error' && (
                  <div style={{ marginBottom: 24, padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#b91c1c" }}>
                    {errorMsg || '送信に失敗しました。時間をおいて再度お試しください。'}
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
              直接メールでのお問い合わせ：<a href="mailto:info@senryaku.ai" style={{ color: C.A, textDecoration: "underline" }}>info@senryaku.ai</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
