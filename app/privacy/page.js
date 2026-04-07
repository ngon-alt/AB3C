"use client";

import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>
        <p className="text-sm text-gray-600 mb-8">最終更新日：2026年4月7日</p>

        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-gray-700">
            一般社団法人デジタル経営革新協会（以下「当協会」といいます）は、「戦略大臣」（以下「本サービス」といいます）における個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第1条（個人情報）</h2>
            <p className="text-gray-700">
              「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第2条（個人情報の収集方法）</h2>
            <p className="text-gray-700 mb-4">当協会は、ユーザーが利用登録をする際に以下の個人情報を収集します：</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Googleアカウント情報（氏名、メールアドレス、プロフィール画像）</li>
              <li>分析対象となるウェブサイトのURL</li>
              <li>生成された分析結果およびチャット履歴</li>
              <li>ご利用のブラウザ情報、IPアドレス、アクセス日時等のアクセスログ</li>
              <li>決済に関する情報（クレジットカード情報はStripe社が管理し、当協会は保存しません）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第3条（個人情報を収集・利用する目的）</h2>
            <p className="text-gray-700 mb-4">当協会が個人情報を収集・利用する目的は、以下のとおりです：</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに対応するため</li>
              <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等の案内を送付するため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じた連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li>本サービスの改善、新サービスの開発のため</li>
              <li>上記の利用目的に付随する目的</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第4条（利用目的の変更）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
              <li>利用目的の変更を行った場合には、変更後の目的について、当協会所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第5条（個人情報の第三者提供）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                </ul>
              </li>
              <li>前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>当協会が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                  <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第6条（個人情報の開示）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                  <li>当協会の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                  <li>その他法令に違反することとなる場合</li>
                </ul>
              </li>
              <li>前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第7条（個人情報の訂正および削除）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>ユーザーは、当協会の保有する自己の個人情報が誤った情報である場合には、当協会が定める手続きにより、当協会に対して個人情報の訂正、追加または削除（以下「訂正等」といいます）を請求することができます。</li>
              <li>当協会は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</li>
              <li>当協会は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第8条（個人情報の利用停止等）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>当協会は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます）を求められた場合には、遅滞なく必要な調査を行います。</li>
              <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
              <li>当協会は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第9条（データの保存期間）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>ユーザーがアクティブなサブスクリプションを保持している間、当協会は分析データを無期限に保存します。</li>
              <li>ユーザーがプランをダウングレードまたは解約した場合、プランに含まれない超過分の分析データは削除されます。</li>
              <li>解約後も一定期間（最長90日間）はアカウント情報を保持しますが、分析データは完全に削除されます。</li>
              <li>法令により保存が義務付けられている情報については、法令で定められた期間保存します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第10条（Cookie等の使用）</h2>
            <p className="text-gray-700 mb-4">
              当協会は、本サービスの利便性向上および利用状況の分析のため、Cookie及び類似の技術を使用しています。ユーザーは、ブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第11条（プライバシーポリシーの変更）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
              <li>当協会が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第12条（お問い合わせ窓口）</h2>
            <p className="text-gray-700 mb-4">
              本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
            </p>
            <div className="bg-gray-100 p-6 rounded-lg space-y-2 text-gray-700">
              <p><strong>一般社団法人デジタル経営革新協会</strong></p>
              <p>〒170-0003 東京都豊島区駒込1-42-1 第三米山ビル502</p>
              <p>Email: <a href="mailto:info@digi-kaku.or.jp" className="text-blue-600 hover:text-blue-800 underline">info@digi-kaku.or.jp</a></p>
              <p>Website: <a href="https://www.digi-kaku.or.jp/" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">https://www.digi-kaku.or.jp/</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">第13条（外部サービスの利用）</h2>
            <p className="text-gray-700 mb-4">
              本サービスでは、以下の外部サービスを利用しています。これらのサービスには、それぞれ独自のプライバシーポリシーが適用されます：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Google OAuth</strong>：認証機能に使用
                <br /><a href="https://policies.google.com/privacy" className="text-blue-600 hover:text-blue-800 underline text-sm" target="_blank" rel="noopener noreferrer">Googleプライバシーポリシー</a>
              </li>
              <li><strong>Stripe</strong>：決済処理に使用
                <br /><a href="https://stripe.com/jp/privacy" className="text-blue-600 hover:text-blue-800 underline text-sm" target="_blank" rel="noopener noreferrer">Stripeプライバシーポリシー</a>
              </li>
              <li><strong>Anthropic Claude API</strong>：AI分析機能に使用
                <br /><a href="https://www.anthropic.com/privacy" className="text-blue-600 hover:text-blue-800 underline text-sm" target="_blank" rel="noopener noreferrer">Anthropicプライバシーポリシー</a>
              </li>
            </ul>
          </section>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">以上</p>
          </div>
        </div>
      </div>
    </div>
  );
}
