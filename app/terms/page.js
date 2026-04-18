"use client";

import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

const C = {
  bg: "#ebebeb",
  surface: "#ffffff",
  border: "#e5e5e0",
  ink: "#1a1a14",
  muted: "#78716c",
};

export default function Terms() {
  const [showPricing, setShowPricing] = useState(false);
  
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <Header onShowPricing={() => setShowPricing(true)} />
      
      {/* 料金モーダル */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      
      <div style={{ flex: 1, padding: "48px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: C.surface, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: 8, padding: "48px 32px" }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">戦略大臣 利用規約</h1>
        <p className="text-sm text-gray-600 mb-8">最終更新日：2026年4月7日</p>

        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-gray-700">
            この利用規約（以下「本規約」といいます）は、一般社団法人デジタル経営革新協会（以下「当協会」といいます）が提供する「戦略大臣」（以下「本サービス」といいます）の利用条件を定めるものです。
          </p>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第1条（定義）</h2>
            <p className="text-gray-700 mb-4">本規約において使用する用語の定義は、以下のとおりとします。</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>本サービス</strong>：当協会が提供する「戦略大臣」という名称のウェブサイト戦略分析SaaSツール</li>
              <li><strong>ユーザー</strong>：本サービスを利用する個人または法人</li>
              <li><strong>登録情報</strong>：ユーザーが本サービスに登録した情報</li>
              <li><strong>分析データ</strong>：ユーザーが本サービスで生成した分析結果およびチャット履歴</li>
              <li><strong>無料プラン</strong>：本サービスの無料お試しプラン（1回限り）</li>
              <li><strong>有料プラン</strong>：本サービスの月額または年額の有料プラン</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第2条（本規約への同意）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>ユーザーは、本規約に同意した上で、本サービスを利用するものとします。</li>
              <li>ユーザーが本サービスを利用した時点で、本規約に同意したものとみなします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第3条（サービス内容）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>本サービスは、以下の機能を提供します：
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>ウェブサイトURLを入力することによるAB3C分析</li>
                  <li>分析結果に基づく改善提案</li>
                  <li>AIチャット機能（フルプランのみ）</li>
                </ul>
              </li>
              <li>本サービスには以下のプランがあります：
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>無料お試しプラン</strong>：AB3C分析および改善提案を1回まで利用可能</li>
                  <li><strong>戦略診断プラン</strong>：購入から1年間有効。購入したサイト数分のAB3C分析を利用可能（チャット機能なし・ワンショット利用）</li>
                  <li><strong>フルプラン（戦略診断・策定・アクション）</strong>：月額制または年額制でAB3C分析およびAIチャット機能を利用可能</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第4条（利用登録）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>本サービスの利用を希望する者は、Google OAuth認証によりアカウントを登録するものとします。</li>
              <li>当協会は、以下のいずれかに該当する場合、登録を拒否することができます：
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>登録情報に虚偽の記載がある場合</li>
                  <li>過去に本規約違反により本サービスの利用を停止されたことがある場合</li>
                  <li>その他、当協会が不適切と判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第5条（料金および支払い）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>有料プランの料金は、本サービスのウェブサイトに掲載されたとおりとします。</li>
              <li>ユーザーは、選択したプランの料金を、Stripeを通じてクレジットカードにより支払うものとします。</li>
              <li>月額プランは毎月自動更新され、年額プランは毎年自動更新されます。</li>
              <li>料金は前払いとし、日割り計算は行いません。</li>
              <li><strong>一度支払われた料金は、理由の如何を問わず返金いたしません。</strong></li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第6条（プランの変更・解約）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>ユーザーは、いつでもプランを変更または解約することができます。</li>
              <li>プラン変更は次回更新日から適用されます。</li>
              <li>解約の場合、次回更新日までは現在のプランを利用できます。</li>
              <li>ダウングレードまたは解約の場合、超過分のデータは削除されます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第7条（データの取り扱い）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、ユーザーがアクティブなサブスクリプションを保持している間、分析データを無期限に保存します。</li>
              <li>ユーザーがダウングレードまたは解約した場合、プランに含まれない分析データは削除されます。</li>
              <li>解約後も一定期間はアカウント情報を保持しますが、分析データは完全に削除されます。</li>
              <li>データのバックアップはユーザー自身の責任で行ってください。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第8条（禁止事項）</h2>
            <p className="text-gray-700 mb-4">ユーザーは、以下の行為を行ってはなりません：</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスのサーバーやネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセス行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>本サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>本サービスのアカウントを第三者に譲渡、貸与、または売買する行為</li>
              <li>その他、当協会が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第9条（本サービスの停止・中断）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、以下のいずれかの事由がある場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができます：
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                  <li>その他、当協会が本サービスの提供が困難と判断した場合</li>
                </ul>
              </li>
              <li>当協会は、本サービスの停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第10条（免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、本サービスがユーザーの特定の目的に適合すること、期待する機能・商品的価値・正確性・有用性を有すること、ユーザーによる本サービスの利用がユーザーに適用のある法令または業界団体の内部規則等に適合すること、および不具合が生じないことについて、何ら保証するものではありません。</li>
              <li>本サービスで提供される分析結果は参考情報であり、その精度や有効性について当協会は保証しません。</li>
              <li>当協会は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当協会とユーザーとの間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。</li>
              <li>前項ただし書に定める場合であっても、当協会は、当協会の過失（重過失を除きます）による債務不履行または不法行為によりユーザーに生じた損害のうち特別な事情から生じた損害（当協会またはユーザーが損害発生につき予見し、または予見し得た場合を含みます）について一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第11条（知的財産権）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>本サービスおよび本サービスに関連する一切の情報についての著作権、商標権、特許権その他の知的財産権は、当協会または当協会にライセンスを許諾している者に帰属します。</li>
              <li>ユーザーが生成した分析データの知的財産権はユーザーに帰属します。</li>
              <li>ユーザーは、本サービスの利用にあたり、AB3Cフレームワークを使用する権利を当協会から許諾されますが、これを第三者に再許諾することはできません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第12条（利用規約の変更）</h2>
            <p className="text-gray-700">
              当協会は、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。変更後の本規約は、本サービスのウェブサイトに掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第13条（個人情報の取扱い）</h2>
            <p className="text-gray-700">
              当協会は、本サービスの利用によって取得する個人情報については、当協会の<a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</a>に従い適切に取り扱うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第14条（通知または連絡）</h2>
            <p className="text-gray-700">
              ユーザーと当協会との間の通知または連絡は、当協会の定める方法によって行うものとします。当協会は、ユーザーから、当協会が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第15条（権利義務の譲渡の禁止）</h2>
            <p className="text-gray-700">
              ユーザーは、当協会の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第16条（準拠法・裁判管轄）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4">【お問い合わせ】</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>一般社団法人デジタル経営革新協会</strong></p>
              <p>〒170-0003 東京都豊島区駒込1-42-1 第三米山ビル502</p>
              <p>TEL: 090-3012-3301</p>
              <p>Mail: <a href="mailto:info@senryaku.ai" className="text-blue-600 hover:text-blue-800 underline">info@senryaku.ai</a></p>
              <p>Website: <a href="https://www.digi-kaku.or.jp/" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">https://www.digi-kaku.or.jp/</a></p>
            </div>
          </section>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <p style={{ fontSize: 14, color: C.muted }}>以上</p>
          </div>
        </div>
      </div>
      </div>
      
      <Footer />
    </div>
  );
}
