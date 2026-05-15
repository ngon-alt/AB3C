// AB3C分析結果から「スライドモデル」を構築する。
// PPTX 出力と PDF 出力の両方が、この同じモデルを消費する。
// レイアウトは 16:9（10in × 5.625in 相当）を共通仕様とする。

export const COLORS = {
  C: "1a1a14",     // 黒（Customer / Competitor / Company）
  B: "FF0000",     // 赤（Benefit）
  A: "1a6fd4",     // 青（Advantage）
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

export function buildSlides({ result, input, improveResult, analyzedAt, historyTitle }) {
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

  const slides = [];

  // 1. 表紙（戦略メッセージを主役に）
  slides.push({
    type: "cover",
    siteName,
    date,
    historyTitle: safe(historyTitle),
    strategyMessage: safe(sm.message),
    benefitPart: safe(sm.benefit_part),
    advantagePart: safe(sm.advantage_part),
  });

  // 2. 目次
  slides.push({
    type: "toc",
    sections: [
      { num: "1", title: "現状把握（3C 分析）", subtitle: "顧客・競合・自社", color: COLORS.C },
      { num: "2", title: "戦略の核", subtitle: "ベネフィット・アドバンテージ・戦略メッセージ", color: COLORS.B },
      { num: "3", title: "整合性チェック", subtitle: "戦略の自己点検", color: COLORS.muted },
      ...(hasImprove ? [{ num: "4", title: "実行", subtitle: "ウェブサイト改善・次のアクション", color: COLORS.A }] : []),
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
  slides.push({
    type: "framework",
    description: "AB3C は「選ばれる理由」を明らかにする戦略フレームワーク。3C（顧客・競合・自社）から始まり、Benefit（お客様が求める価値）と Advantage（差別的優位点）を統合して、戦略メッセージへと組み立てます。",
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

  // ── 第3部: 整合性
  slides.push({ type: "section-divider", num: "3", title: "整合性チェック", subtitle: "戦略の自己点検", color: COLORS.muted });

  // 11. 整合性チェック
  slides.push({
    type: "checkpoints",
    items: checkpoints.map(c => ({
      label: safe(c.label),
      status: safe(c.status),       // ok / warn / ng
      statusLabel: c.status === "ok" ? "問題なし" : c.status === "warn" ? "注意" : c.status === "ng" ? "警告" : "—",
      comment: safe(c.comment),
    })),
  });

  // ── 第4部: 実行（URL 分析時のみ）
  if (hasImprove) {
    slides.push({ type: "section-divider", num: "4", title: "実行", subtitle: "ウェブサイト改善・次のアクション", color: COLORS.A });

    // 12. 改善レポート
    slides.push({
      type: "improve",
      contents: arr(improveResult.contents).map(x => ({ title: safe(x.title), reason: safe(x.reason), example: safe(x.example) })),
      design: arr(improveResult.design).map(x => ({ title: safe(x.title), reason: safe(x.reason), example: safe(x.example) })),
      structure: arr(improveResult.structure).map(x => ({ title: safe(x.title), reason: safe(x.reason), example: safe(x.example) })),
    });
  }

  // 13. 次のアクション
  slides.push({
    type: "next-actions",
    themes: [
      { label: "集客・広告", desc: "SEO / SNS / Google マップ / 広告の優先順位" },
      { label: "ウェブサイト改善", desc: "コンテンツ・デザイン・構造の改善" },
      { label: "採用コンテンツ", desc: "ビジョン・強み・キャリアプランの言語化" },
      { label: "補助金申請", desc: "小規模事業者持続化補助金などの計画書化" },
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
