// AB3C分析結果から「スライドモデル」を構築する。
// PPTX 出力と PDF 出力の両方が、この同じモデルを消費する。
// レイアウトは 16:9（10in × 5.625in 相当）を共通仕様とする。

export const COLORS = {
  C: "1a1a14",     // 黒（Customer / Competitor / Company）
  B: "FF0000",     // 赤（Benefit）
  A: "1a6fd4",     // 青（Advantage）
  // 「青はアドバンテージを示すとき以外に使わない」ルール（権さん 2026-05-15）。
  // 実行・改善レポート関連はオレンジ（戦略アクション色）で統一する。
  exec: "ea580c",  // オレンジ（戦略アクション・実行系）
  ink: "1a1a14",
  muted: "555555",
  border: "cccccc",
  bg: "FFFFFF",
  paper: "F8F8F6",
  highlight: "FEF3C7",
};

const safe = (s) => (s == null ? "" : String(s));
const arr = (x) => (Array.isArray(x) ? x : []);

function extractSiteName(input) {
  if (!input) return "（タイトルなし）";
  if (input.startsWith("http")) {
    try { return new URL(input).hostname.replace(/^www\./, ""); }
    catch { return input.slice(0, 40); }
  }
  return input.slice(0, 40);
}

function formatDate(d) {
  const date = d ? new Date(d) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function buildSlides({ result, input, improveResult, visualMock, analyzedAt, historyTitle, issuer }) {
  if (!result) return [];

  const siteName = extractSiteName(input);
  const date = formatDate(analyzedAt);
  const sm = result.strategy_message || {};
  const benefit = result.benefit || {};
  const advantage = result.advantage || {};
  const tc = result.three_c || {};
  const customer = tc.customer || {};
  const competitor = tc.competitor || {};
  const company = tc.company || {};
  const market = customer.market || {};
  const checkpoints = arr(result.checkpoints);
  const hasImprove = !!(improveResult && !improveResult.error
    && (arr(improveResult.contents).length || arr(improveResult.design).length || arr(improveResult.structure).length));
  const hasVisualMock = !!(visualMock && visualMock.visual_mock_html);

  const slides = [];

  // 1. 表紙（戦略メッセージを主役に）
  // 権さん 2026-05-15 フィードバック:
  // - 提案書だと一目で分かるよう「{siteName} | AB3C 分析レポート」を最上部に
  // - 「戦略メッセージ」ラベルはメッセージ本体のすぐ近くに
  // - 下部に差出人欄を設ける
  slides.push({
    type: "cover",
    siteName,
    date,
    historyTitle: safe(historyTitle),
    strategyMessage: safe(sm.message),
    benefitPart: safe(sm.benefit_part),
    advantagePart: safe(sm.advantage_part),
    issuer: safe(issuer) || "戦略指南 AI / senryaku.ai",
  });

  // 2. 目次
  slides.push({
    type: "toc",
    sections: [
      { num: "1", title: "現状把握（3C 分析）", subtitle: "顧客・競合・自社", color: COLORS.C },
      { num: "2", title: "戦略の核", subtitle: "ベネフィット・アドバンテージ・戦略メッセージ", color: COLORS.B },
      { num: "3", title: "品質チェック", subtitle: "戦略の自己点検", color: COLORS.muted },
      ...((hasImprove || hasVisualMock) ? [{ num: "4", title: "実行", subtitle: "ウェブサイト改善・次のアクション", color: COLORS.exec }] : []),
    ],
  });

  // 3. 分析対象
  slides.push({
    type: "analysis-target",
    siteName,
    url: input?.startsWith("http") ? input : null,
    inputExcerpt: !input?.startsWith("http") ? safe(input).slice(0, 200) : null,
  });

  // 4. AB3Cフレームワークとは
  // 権さん 2026-05-15 フィードバック: 大前研一の3C分析ベースであること、関連書籍・関連団体を併載する。
  slides.push({
    type: "framework",
    description: "AB3C は「選ばれる理由」を明らかにする戦略フレームワーク。大前研一氏の3C分析をベースに、デジタル時代により最適化された戦略フレームワークです。超競争環境における「違い」をより具体的に言語化することで「選ばれる理由」を明らかにします。",
    orderNote: "AB3C の順序は「C → B → A」。現状を把握してから、価値と優位性を組み立て、最後に戦略メッセージへと統合します。",
    relatedBook: {
      title: "なぜあなたのウェブには戦略がないのか",
      author: "権 成俊（著）",
      url: "https://www.amazon.co.jp/dp/4774188050/",
    },
    relatedAssociation: {
      name: "一般社団法人 デジタル経営革新協会",
      url: "https://www.digi-kaku.or.jp/",
    },
  });

  // ── 第1部: 現状把握（3C）
  slides.push({ type: "section-divider", num: "1", title: "現状把握", subtitle: "3C 分析 — 顧客・競合・自社", color: COLORS.C });

  // 5. 顧客
  slides.push({
    type: "customer",
    target: safe(customer.target),
    profile: arr(customer.profile),
    stage: safe(customer.stage),
    cutoff: safe(customer.cutoff),
    market: {
      sam: safe(market.sam),
      som: safe(market.som),
      growth: safe(market.growth),
      basis: safe(market.basis),
    },
  });

  // 6. 競合
  slides.push({
    type: "competitor",
    direct: arr(competitor.direct),
    indirect: arr(competitor.indirect),
  });

  // 7. 自社
  slides.push({
    type: "company",
    strength: arr(company.strength),
    structure: safe(company.structure),
    passion: safe(company.passion),
  });

  // ── 第2部: 戦略の核
  slides.push({ type: "section-divider", num: "2", title: "戦略の核", subtitle: "Benefit・Advantage・戦略メッセージ", color: COLORS.B, color2: COLORS.A });

  // 8. ベネフィット
  slides.push({
    type: "benefit",
    core: safe(benefit.core),
    needs: arr(benefit.needs),
    wants: arr(benefit.wants),
  });

  // 9. アドバンテージ
  slides.push({
    type: "advantage",
    what: safe(advantage.what),
    why_good: safe(advantage.why_good),
    why_hard_to_copy: safe(advantage.why_hard_to_copy),
  });

  // 10. 戦略メッセージ（再掲）
  slides.push({
    type: "strategy-message-recap",
    strategyMessage: safe(sm.message),
    benefitPart: safe(sm.benefit_part),
    advantagePart: safe(sm.advantage_part),
  });

  // ── 第3部: 品質チェック（旧名: 整合性チェック・権さん 2026-05-16 リネーム）
  slides.push({ type: "section-divider", num: "3", title: "品質チェック", subtitle: "戦略の自己点検", color: COLORS.muted });

  // 11. 整合性チェック
  // ラベルは CLAUDE.md の日本語ラベル原則に従い、ok → "OK"、warn → "注意"、ng → "NG"。
  // 「問題なし」は分かりづらい（権さん 2026-05-15）。
  slides.push({
    type: "checkpoints",
    items: checkpoints.map(c => ({
      label: safe(c.label),
      status: safe(c.status),       // ok / warn / ng
      statusLabel: c.status === "ok" ? "OK" : c.status === "warn" ? "注意" : c.status === "ng" ? "NG" : "—",
      comment: safe(c.comment),
    })),
  });

  // ── 第4部: 実行（URL 分析時のみ）
  if (hasImprove || hasVisualMock) {
    slides.push({ type: "section-divider", num: "4", title: "実行", subtitle: "ウェブサイト改善・次のアクション", color: COLORS.exec });

    // 12a. ビジュアルモック（改善後ファーストビュー・あれば）
    if (hasVisualMock) {
      slides.push({
        type: "visual-mock",
        html: visualMock.visual_mock_html,
        caption: safe(visualMock.caption),
      });
    }

    // 12b-d. 改善レポート（3カテゴリそれぞれ独立スライド・全項目を載せる）
    // 権さん 2026-05-15 フィードバック: 1スライドに詰めすぎると重なる。3項目超は複数スライドに分割。
    if (hasImprove) {
      const cats = [
        { key: "contents", label: "追加すべきコンテンツ", subtitle: "戦略から導かれる、サイトに足すべき情報や要素", items: arr(improveResult.contents) },
        { key: "design", label: "改善すべきデザイン・ビジュアル", subtitle: "視覚的に整えるべきポイント", items: arr(improveResult.design) },
        { key: "structure", label: "サイト構造の改善", subtitle: "情報設計・導線・ページ構成の改善", items: arr(improveResult.structure) },
      ];
      // 権さん 2026-05-16: 分析結果の文字量によってはまだテキストがかぶるため、
      // 原則 1スライド 2項目までに変更（タイトル＋理由＋実装例の長文を確実に収める）。
      const MAX_PER_SLIDE = 2;
      cats.forEach(cat => {
        if (cat.items.length === 0) return;
        const normalized = cat.items.map(x => ({ title: safe(x.title), reason: safe(x.reason), example: safe(x.example) }));
        const totalSlides = Math.ceil(normalized.length / MAX_PER_SLIDE);
        for (let pi = 0; pi < totalSlides; pi++) {
          const start = pi * MAX_PER_SLIDE;
          const slice = normalized.slice(start, start + MAX_PER_SLIDE);
          slides.push({
            type: "improve-section",
            categoryKey: cat.key,
            categoryLabel: cat.label + (totalSlides > 1 ? `（${pi + 1}/${totalSlides}）` : ""),
            categorySubtitle: cat.subtitle,
            itemNumberStart: start + 1,
            items: slice,
          });
        }
      });
    }
  }

  // 13. 次のアクション（権さん 2026-05-16: 10テーマあることを明示。グループ化してリスト表示）
  slides.push({
    type: "next-actions",
    description: "戦略指南 AI の「戦略アクション」では、確定した戦略をもとに10テーマで具体的な施策を検討できます。",
    groups: [
      {
        label: "集客",
        themes: [
          { name: "SEO", desc: "検索流入を高める対策" },
          { name: "SNS", desc: "SNS 運用とエンゲージメント" },
          { name: "Web広告", desc: "リスティング・ディスプレイ広告" },
          { name: "Googleマップ", desc: "ローカル検索対策（MEO）" },
        ],
      },
      {
        label: "販促・PR",
        themes: [
          { name: "チラシ・DM", desc: "紙媒体での販促企画" },
          { name: "プレスリリース", desc: "メディア露出と認知拡大" },
        ],
      },
      {
        label: "コンテンツ・営業",
        themes: [
          { name: "ウェブサイト改善", desc: "コンテンツ・デザイン・構造の改善" },
          { name: "営業資料", desc: "提案書・パンフレットの整備" },
        ],
      },
      {
        label: "経営・組織",
        themes: [
          { name: "採用", desc: "ビジョン・キャリアプランの言語化" },
          { name: "補助金", desc: "持続化補助金などの計画書化" },
        ],
      },
    ],
  });

  // 14. 戦略指南AIについて
  slides.push({
    type: "about",
    siteUrl: "senryaku.ai",
    description: "AB3C フレームワークを活用した戦略策定 SaaS。分析 → 戦略策定 → アクションまでを一気通貫で支援します。",
  });

  return slides;
}

export function buildFileBaseName({ input, historyTitle }) {
  let base = "AB3C分析";
  try {
    if (input?.startsWith("http")) base = new URL(input).hostname.replace(/^www\./, "");
  } catch {}
  if (historyTitle) base += "_" + String(historyTitle).slice(0, 40);
  return base.replace(/[\\\/:*?"<>|]/g, "_");
}
