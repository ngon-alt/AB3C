"use client";
import { useState } from "react";
import Header from "../components/Header";

const C = {
  bg: "#f5f2eb", surface: "#ffffff", border: "#e5e5e0",
  ink: "#1a1a14", muted: "#78716c", A: "#1a6fd4",
  phase1: "#0d9488", phase2: "#ea580c",
};

const faqs = [
  {
    category: "サービスについて",
    items: [
      {
        q: "戦略指南 AIとは何ですか？",
        a: "戦略指南 AIは、AB3Cフレームワークを用いてウェブサイトや事業の「選ばれる理由」を明らかにする戦略策定AIです。URLを入力するだけで、Benefit（お客様が求める価値）、Advantage（差別的優位点）、3C（顧客・競合・自社）の分析をAIが自動生成します。",
      },
      {
        q: "AB3C分析とは何ですか？",
        a: "AB3Cは、権成俊氏が20年以上のコンサルティング実績から開発した戦略策定フレームワークです。A（Advantage：差別的優位点）、B（Benefit：お客様が求める価値）、3C（Customer・Competitor・Company）の要素を整理し、「選ばれる理由」を言語化します。",
      },
      {
        q: "どのような人が使えますか？",
        a: "中小企業の経営者、ウェブコンサルタント、ウェブ制作会社、マーケティング担当者など、事業戦略やウェブ戦略を策定する方に最適です。専門知識がなくても、AIがガイドしながら戦略を整理できます。",
      },
      {
        q: "分析にはどのくらい時間がかかりますか？",
        a: "AB3C分析は通常1〜2分程度で完了します。URL分析の場合はウェブサイト改善レポートも同時に生成されるため、合計で2〜3分ほどかかります。",
      },
    ],
  },
  {
    category: "分析機能について",
    items: [
      {
        q: "URLを入力するだけで分析できますか？",
        a: "はい。ウェブサイトのURLを入力すると、AIがサイトの内容を読み取り、AB3C分析とウェブサイト改善レポートを自動生成します。ただし、一部のサイト（楽天・Amazon等のモール型EC、SNS、予約サイト等）は読み取りができない場合があります。その場合は「テキストで入力」から事業概要を直接入力してください。",
      },
      {
        q: "テキスト入力での分析はどう違いますか？",
        a: "テキスト入力では、事業概要を自由に記述して分析できます。まだウェブサイトがない新規事業や、ウェブサイトの内容が実態と異なる場合に有効です。ただし、ウェブサイト改善レポートは生成されません。",
      },
      {
        q: "分析結果は保存されますか？",
        a: "はい。分析結果はサイト管理に自動保存されます。サイト管理画面から過去の分析結果を呼び出すことができます。また、戦略を確定すると確定履歴として保存され、いつでも振り返ることができます。",
      },
      {
        q: "分析結果を修正できますか？",
        a: "はい。分析チャットでAIに修正を依頼し、「この会話内容を分析に反映する」ボタンを押すと、会話内容を反映した分析結果に更新されます。変更箇所はハイライト表示されるので、どこが変わったか一目でわかります。",
      },
      {
        q: "競合分析はどのように行われますか？",
        a: "URL分析の場合、AIがウェブ検索を使って競合他社を調査し、直接競合・異業種競合を特定します。競合リストにはウェブサイトURLも含まれ、クリックで確認できます。",
      },
    ],
  },
  {
    category: "伴走機能について",
    items: [
      {
        q: "戦略アクションフェーズとは何ですか？",
        a: "戦略を確定した後、その戦略に基づいて具体的な施策を検討するフェーズです。SEO対策、SNS運用、Web広告、Googleマップ、チラシ・DM、プレスリリース、ウェブサイト改善、採用コンテンツ企画、補助金申請、営業資料・提案書の10施策についてAIと相談できます。",
      },
      {
        q: "施策チャットでは何ができますか？",
        a: "各施策テーマについて、AB3C分析結果に基づいた具体的なアドバイスをAIが提供します。初回は全体アドバイスが自動生成され、その後はチャットで詳細を詰めていくことができます。テーマ内でサブチャットを作成し、個別のトピックについて深掘りすることも可能です。",
      },
      {
        q: "補助金申請のサポートとは？",
        a: "小規模事業者持続化補助金などの事業計画書の下書き・たたき台をAIが提案します。AB3C分析結果をもとに、企業概要・顧客ニーズ・自社の強み・経営方針などの項目を書き出します。ただし、申請書の作成代行ではなく、最終的な作成・提出はご自身の責任で行ってください。",
      },
    ],
  },
  {
    category: "料金・プランについて",
    items: [
      {
        q: "無料で使えますか？",
        a: "はい。Googleアカウントでログインすると、AB3C分析レポートとウェブサイト改善レポートを1回無料で体験できます。クレジットカード不要です。AIチャットや戦略アクション機能は戦略指南プランで利用可能です。",
      },
      {
        q: "戦略診断チケットと戦略指南プランの違いは？",
        a: "戦略診断チケット（有効期限1年）はAB3C分析レポートとウェブサイト改善レポートの生成のみで、結果はPDF・印刷・シェアURLで持ち帰る一発診断のプランです。診断結果は履歴保存されないため、必ず持ち帰ってください。購入したサイト数分の診断は1年以内に使い切る必要があります。戦略指南プラン（戦略診断・策定・アクション、月額/年額）は診断に加えて、AIチャットで戦略を磨く（戦略策定）、10施策テーマでアクションを検討する（戦略アクション）ところまで継続的に使えます。診断結果や戦略確定履歴も保存されます。",
      },
      {
        q: "50%OFFキャンペーンとは？",
        a: "2026年4月30日までまたは100名到達までの先行ユーザー価格です。50%OFFは初回の契約期間のみ適用され、更新時は通常価格（定価）となります。",
      },
      {
        q: "複数サイトを管理できますか？",
        a: "はい。プランに応じてサイト数の上限が異なります。戦略診断チケットは1/10/100サイト、戦略指南プランは1/5/15/30/60/120サイトから選択できます。サイト管理画面で複数サイトを一元管理し、切り替えて分析・戦略策定ができます。",
      },
      {
        q: "返金保証はありますか？",
        a: "3ヶ月間の返金保証があります。サービスにご満足いただけない場合は、契約から3ヶ月以内であれば全額返金いたします。",
      },
    ],
  },
  {
    category: "技術・セキュリティについて",
    items: [
      {
        q: "どのAIを使っていますか？",
        a: "Anthropic社のClaude AIを使用しています。高い推論能力と日本語対応力を持つAIモデルにより、質の高い戦略分析を提供します。",
      },
      {
        q: "入力したデータは安全ですか？",
        a: "はい。入力されたデータはAI分析のためのみに使用され、第三者に共有されることはありません。通信はSSL暗号化で保護されています。",
      },
      {
        q: "スマートフォンで使えますか？",
        a: "PCでの利用を推奨しています。スマートフォンでもアクセス可能ですが、PC版と同じ画面が表示されるため、画面の大きいデバイスでの利用がより快適です。",
      },
    ],
  },
];

function FAQItem({ q, a }) {
  var [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid " + C.border }}>
      <div onClick={function() { setOpen(!open); }}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: open ? "#f8f6f0" : "transparent" }}>
        <div style={{ fontSize: 16, color: C.ink, fontWeight: 600, flex: 1, paddingRight: 16 }}>{q}</div>
        <span style={{ fontSize: 18, color: C.muted, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 20px 16px 20px", fontSize: 16, color: C.ink, lineHeight: 1.8 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Header />
      <main style={{ padding: "40px 20px 100px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, color: C.ink }}>よくあるご質問</div>
            <div style={{ fontSize: 16, color: C.ink, marginTop: 8 }}>戦略指南 AIについてよく寄せられるご質問をまとめました。</div>
          </div>

          {faqs.map(function(section, si) {
            return (
              <div key={si} style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 700, color: C.phase1, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid " + C.phase1 }}>
                  {section.category}
                </div>
                <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 8, overflow: "hidden" }}>
                  {section.items.map(function(item, ii) {
                    return <FAQItem key={ii} q={item.q} a={item.a} />;
                  })}
                </div>
              </div>
            );
          })}

          <footer style={{ textAlign: "center", marginTop: 60, padding: "20px 0", borderTop: "1px solid " + C.border, color: C.muted, fontSize: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <img src="https://ab3c.jp/img/common/digi_logo.png" alt="一般社団法人デジタル経営革新協会" style={{ height: 28 }} />
              <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>一般社団法人デジタル経営革新協会</span>
            </div>
            <div style={{ marginBottom: 8 }}>AB3C は株式会社ゴンウェブイノベーションズが開発したフレームワークです · <a href="https://ab3c.jp/" style={{ color: C.muted, textDecoration: "underline" }}>ab3c.jp</a> · Powered by Claude AI</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <a href="/terms" style={{ color: C.muted, textDecoration: "underline" }}>利用規約</a>
              <span style={{ color: C.border }}>|</span>
              <a href="/privacy" style={{ color: C.muted, textDecoration: "underline" }}>プライバシーポリシー</a>
              <span style={{ color: C.border }}>|</span>
              <a href="/legal" style={{ color: C.muted, textDecoration: "underline" }}>特定商取引法</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
