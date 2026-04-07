"use client";

import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

const C = {
  bg: "#f5f5f0",
  surface: "#ffffff",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
};

export default function Legal() {
  const [showPricing, setShowPricing] = useState(false);
  
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <Header onShowPricing={() => setShowPricing(true)} />
      
      {/* 料金モーダル */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      
      <div style={{ flex: 1, padding: "48px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: C.surface, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: 8, padding: "48px 32px" }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">特定商取引法に基づく表記</h1>
        <p className="text-sm text-gray-600 mb-8">最終更新日：2026年4月7日</p>

        <div className="space-y-8">
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">事業者名称</h2>
            <p className="text-gray-700">一般社団法人デジタル経営革新協会</p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">代表者</h2>
            <p className="text-gray-700">代表理事　権 成俊</p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">所在地</h2>
            <p className="text-gray-700">〒170-0003 東京都豊島区駒込1-42-1 第三米山ビル502</p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">電話番号</h2>
            <p className="text-gray-700">090-3012-3301</p>
            <p className="text-sm text-gray-600 mt-2">※お問い合わせはメールでお願いいたします。</p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">メールアドレス</h2>
            <p className="text-gray-700">
              <a href="mailto:info@digi-kaku.or.jp" className="text-blue-600 hover:text-blue-800 underline">
                info@digi-kaku.or.jp
              </a>
            </p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">ウェブサイト</h2>
            <p className="text-gray-700">
              <a href="https://www.digi-kaku.or.jp/" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                https://www.digi-kaku.or.jp/
              </a>
            </p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">サービス名称</h2>
            <p className="text-gray-700">戦略大臣</p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">販売価格</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">無料プラン</h3>
                <p>0円（1回限りのお試し）</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">分析プラン（月額・チャット機能なし）</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>5サイト：55,000円/月</li>
                  <li>10サイト：88,000円/月</li>
                  <li>20サイト：143,000円/月</li>
                  <li>30サイト：198,000円/月</li>
                  <li>40サイト：242,000円/月</li>
                  <li>50サイト：275,000円/月</li>
                  <li>60サイト：308,000円/月</li>
                  <li>70サイト：341,000円/月</li>
                  <li>80サイト：374,000円/月</li>
                  <li>90サイト：407,000円/月</li>
                  <li>100サイト：440,000円/月</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">伴走プラン（月額・チャット機能付き）</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>5サイト：110,000円/月</li>
                  <li>10サイト：176,000円/月</li>
                  <li>20サイト：286,000円/月</li>
                  <li>30サイト：396,000円/月</li>
                  <li>40サイト：484,000円/月</li>
                  <li>50サイト：550,000円/月</li>
                  <li>60サイト：616,000円/月</li>
                  <li>70サイト：682,000円/月</li>
                  <li>80サイト：748,000円/月</li>
                  <li>90サイト：814,000円/月</li>
                  <li>100サイト：880,000円/月</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                ※上記金額は全て税込表示です。<br />
                ※年額プランは10ヶ月分の料金で12ヶ月利用可能です（2ヶ月分無料）。
              </p>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">商品代金以外の必要料金</h2>
            <p className="text-gray-700">
              インターネット接続料金、通信費等はお客様のご負担となります。
            </p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">支払方法</h2>
            <p className="text-gray-700">クレジットカード決済（Stripe経由）</p>
            <p className="text-sm text-gray-600 mt-2">
              ご利用可能なカード：Visa、Mastercard、American Express、JCB、Discover、Diners Club
            </p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">支払時期</h2>
            <p className="text-gray-700">
              サービス申込時に即時決済されます。月額プランは毎月自動更新、年額プランは毎年自動更新されます。
            </p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">サービス提供時期</h2>
            <p className="text-gray-700">
              決済完了後、即座にサービスをご利用いただけます。
            </p>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">返品・キャンセルについて</h2>
            <div className="space-y-2 text-gray-700">
              <p>本サービスはデジタルコンテンツの提供となりますので、<strong>一度お支払いいただいた料金の返金はいたしかねます。</strong></p>
              <p>ただし、以下の場合は返金対応をいたします：</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>当協会の責に帰すべき事由により、サービスが正常に提供されなかった場合</li>
                <li>二重決済等、明らかな決済エラーが発生した場合</li>
              </ul>
              <p className="mt-2">解約はいつでも可能ですが、解約後も次回更新日までは現在のプランをご利用いただけます。</p>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">動作環境</h2>
            <div className="space-y-2 text-gray-700">
              <p>以下のブラウザでご利用いただけます：</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Google Chrome（最新版）</li>
                <li>Microsoft Edge（最新版）</li>
                <li>Safari（最新版）</li>
                <li>Firefox（最新版）</li>
              </ul>
              <p className="mt-2 text-sm text-gray-600">
                ※インターネット接続環境が必要です。<br />
                ※推奨環境以外でのご利用は動作保証外となります。
              </p>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">サービス内容に関する問い合わせ先</h2>
            <div className="space-y-2 text-gray-700">
              <p>Email: <a href="mailto:info@digi-kaku.or.jp" className="text-blue-600 hover:text-blue-800 underline">info@digi-kaku.or.jp</a></p>
              <p className="text-sm text-gray-600">※お問い合わせは原則メールで受け付けております。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">その他</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                本サービスの利用規約については、
                <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">利用規約ページ</a>
                をご確認ください。
              </p>
              <p>
                個人情報の取り扱いについては、
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</a>
                をご確認ください。
              </p>
            </div>
          </section>
        </div>
      </div>
      </div>
      
      <Footer />
    </div>
  );
}
