"use client";

import React, { useState } from 'react';

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">お問い合わせ</h1>
          <p className="text-gray-600">
            100サイト以上のプランをご希望の方、その他ご質問がございましたらお気軽にお問い合わせください。
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-xl font-semibold mb-2">送信完了</div>
              <p className="text-gray-600 mb-4">
                お問い合わせありがとうございます。<br />
                2営業日以内に担当者よりご連絡させていただきます。
              </p>
              <button
                onClick={() => setStatus('')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                続けて問い合わせる
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* お名前 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="山田 太郎"
                />
              </div>

              {/* メールアドレス */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@company.com"
                />
              </div>

              {/* 会社名 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  会社名
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="株式会社〇〇"
                />
              </div>

              {/* お問い合わせ種別 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  お問い合わせ種別 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="100サイト以上のプラン希望">100サイト以上のプラン希望</option>
                  <option value="サービス内容について">サービス内容について</option>
                  <option value="技術的な問題">技術的な問題</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              {/* お問い合わせ内容 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="お問い合わせ内容をご記入ください"
                />
              </div>

              {/* エラーメッセージ */}
              {status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  送信に失敗しました。時間をおいて再度お試しください。
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? '送信中...' : '送信する'}
              </button>
            </form>
          )}
        </div>

        {/* 補足情報 */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>営業時間：平日 9:00〜18:00</p>
          <p className="mt-2">
            直接メールでのお問い合わせ：<a href="mailto:info@digi-kaku.or.jp" className="text-blue-600 hover:text-blue-800 underline">info@digi-kaku.or.jp</a>
          </p>
        </div>

        {/* ホームに戻るリンク */}
        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
