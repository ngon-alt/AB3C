// スライドモデルを 16:9 の PDF に書き出す。
// 戦略: 各スライドを 1920x1080 の HTML として隠し領域に描画 →
//       html2canvas でキャンバス化 → jsPDF で 1 ページ 1 スライドの PDF にまとめる。
// 日本語フォント埋め込みを避けるため、HTML レンダリングを介する（ブラウザのフォントで描画）。

import { COLORS, buildFileBaseName } from "./build-slides";

const W = 1920;
const H = 1080;

const css = `
  .ab3c-pdf-stage {
    position: fixed; left: -99999px; top: 0;
    width: ${W}px; height: ${H}px;
    overflow: hidden; background: #ffffff;
    font-family: 'Yu Gothic UI', -apple-system, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, sans-serif;
    color: #1a1a14;
  }
  .ab3c-pdf-stage .head-serif { font-family: 'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif; }
  .ab3c-pdf-stage .mono { font-family: 'Space Mono', 'Consolas', monospace; }
  .ab3c-pdf-stage * { box-sizing: border-box; line-height: 1.5; }
`;

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lines = (items, mapper) => items.map(mapper).join("");
const safe = (s) => s == null ? "" : s;
const clip = (s, n = 200) => {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? str.slice(0, n) + "…" : str;
};

// ─── 各スライドタイプの HTML レンダラ ────────────────────────────────────

function renderCoverHtml(s) {
  return `
    <div style="position:absolute;inset:0;background:#1a1a14;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 120px;">
      <div class="mono" style="letter-spacing:.6em;color:#aaa;font-size:22px;margin-bottom:40px;">── 戦略メッセージ ──</div>
      <div class="head-serif" style="font-size:64px;font-weight:700;text-align:center;line-height:1.55;max-width:1500px;">${esc(s.strategyMessage || "（戦略メッセージ未生成）")}</div>
      ${(s.benefitPart || s.advantagePart) ? `
        <div style="margin-top:60px;font-size:24px;color:#eee;text-align:center;line-height:1.7;">
          ${s.benefitPart ? `<div><span class="mono" style="color:#FF0000;font-weight:700;margin-right:14px;">B</span>${esc(clip(s.benefitPart, 100))}</div>` : ""}
          ${s.advantagePart ? `<div style="margin-top:14px;"><span class="mono" style="color:#1a6fd4;font-weight:700;margin-right:14px;">A</span>${esc(clip(s.advantagePart, 100))}</div>` : ""}
        </div>
      ` : ""}
      <div style="position:absolute;bottom:60px;left:0;right:0;text-align:center;">
        <div style="height:1px;background:#555;width:60%;margin:0 auto 24px;"></div>
        <div style="font-size:22px;color:#ddd;">${esc(s.siteName)}　|　AB3C 分析レポート</div>
        <div class="mono" style="font-size:16px;color:#999;margin-top:12px;letter-spacing:.3em;">${esc(s.date)}　/　戦略指南 AI</div>
      </div>
    </div>
  `;
}

function renderTocHtml(s) {
  return `
    <div style="position:absolute;inset:0;padding:80px 100px;">
      <div class="head-serif" style="font-size:52px;font-weight:700;margin-bottom:16px;">目次 — Agenda</div>
      <div style="height:3px;background:#1a1a14;margin-bottom:50px;"></div>
      ${lines(s.sections, (sec) => `
        <div style="display:flex;align-items:center;margin-bottom:30px;">
          <div style="width:130px;height:130px;background:#${sec.color};display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Noto Serif JP',serif;font-size:64px;font-weight:700;">${esc(sec.num)}</div>
          <div style="margin-left:36px;">
            <div class="head-serif" style="font-size:38px;font-weight:700;line-height:1.3;">${esc(sec.title)}</div>
            <div style="font-size:22px;color:#555;margin-top:6px;">${esc(sec.subtitle)}</div>
          </div>
        </div>
      `)}
    </div>
  `;
}

function pageHeaderHtml(title, accentColor = "1a1a14", eyebrow) {
  return `
    <div style="position:absolute;left:0;top:0;bottom:0;width:18px;background:#${accentColor};"></div>
    <div style="padding:60px 100px 0;">
      ${eyebrow ? `<div class="mono" style="font-size:18px;color:#555;letter-spacing:.4em;margin-bottom:12px;">${esc(eyebrow)}</div>` : ""}
      <div class="head-serif" style="font-size:48px;font-weight:700;color:#${accentColor};margin-bottom:24px;">${esc(title)}</div>
      <div style="height:2px;background:#${accentColor};"></div>
    </div>
  `;
}

function renderAnalysisTargetHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("分析対象")}
      <div style="padding:60px 100px;">
        <div class="head-serif" style="font-size:64px;font-weight:700;margin-top:40px;">${esc(s.siteName)}</div>
        ${s.url ? `<div class="mono" style="font-size:26px;color:#1a6fd4;margin-top:16px;word-break:break-all;">${esc(s.url)}</div>` : ""}
        ${s.inputExcerpt ? `
          <div style="margin-top:60px;background:#F8F8F6;border:1px solid #ccc;padding:30px 36px;">
            <div class="mono" style="font-size:16px;color:#555;letter-spacing:.4em;margin-bottom:14px;">入力テキスト（抜粋）</div>
            <div style="font-size:24px;line-height:1.85;">${esc(s.inputExcerpt)}</div>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function renderFrameworkHtml(s) {
  const chips = [
    { letter: "C", label: "Customer / Competitor / Company", desc: "顧客・競合・自社の3つのCで現状を把握", color: "1a1a14" },
    { letter: "B", label: "Benefit", desc: "お客様が求める価値（ニーズ → ウォンツ）", color: "FF0000" },
    { letter: "A", label: "Advantage", desc: "競合より選ばれる差別的優位点", color: "1a6fd4" },
  ];
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("AB3C フレームワークとは")}
      <div style="padding:50px 100px;display:flex;flex-direction:column;gap:30px;">
        <div style="display:flex;gap:30px;margin-top:20px;">
          ${lines(chips, (c) => `
            <div style="flex:1;display:flex;align-items:center;">
              <div style="width:140px;height:200px;background:#${c.color};display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Noto Serif JP',serif;font-size:96px;font-weight:700;">${c.letter}</div>
              <div style="margin-left:24px;flex:1;">
                <div class="mono" style="font-size:14px;color:#555;letter-spacing:.3em;margin-bottom:6px;">${esc(c.label)}</div>
                <div style="font-size:20px;color:#1a1a14;line-height:1.6;">${esc(c.desc)}</div>
              </div>
            </div>
          `)}
        </div>
        <div style="font-size:22px;line-height:1.85;color:#1a1a14;margin-top:30px;">${esc(s.description)}</div>
        <div style="font-size:20px;color:#555;font-style:italic;margin-top:10px;">AB3C の順序は「C → B → A」。現状を把握してから、価値と優位性を組み立て、最後に戦略メッセージへと統合します。</div>
      </div>
    </div>
  `;
}

function renderSectionDividerHtml(s) {
  return `
    <div style="position:absolute;inset:0;background:#${s.color};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div class="mono" style="font-size:28px;color:#fff;letter-spacing:1em;margin-bottom:30px;">PART  ${esc(s.num)}</div>
      <div class="head-serif" style="font-size:120px;font-weight:700;text-align:center;margin-bottom:30px;">${esc(s.title)}</div>
      <div style="font-size:32px;color:#eee;">${esc(s.subtitle)}</div>
      <div style="display:flex;gap:20px;margin-top:50px;">
        ${s.color2 ? `
          <div style="width:220px;height:8px;background:#${s.color};"></div>
          <div style="width:220px;height:8px;background:#${s.color2};"></div>
        ` : `<div style="width:360px;height:8px;background:#fff;"></div>`}
      </div>
    </div>
  `;
}

function renderCustomerHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("顧客（Customer）", "1a1a14", "PART 1  ─  CUSTOMER")}
      <div style="padding:40px 100px;display:flex;gap:40px;">
        <div style="flex:1.2;">
          <div class="mono" style="font-size:16px;color:#555;letter-spacing:.3em;">ターゲット</div>
          <div style="font-size:32px;font-weight:700;margin-top:10px;line-height:1.4;">${esc(s.target || "—")}</div>

          <div class="mono" style="font-size:16px;color:#555;letter-spacing:.3em;margin-top:30px;">プロファイル</div>
          <div style="font-size:22px;line-height:1.85;margin-top:10px;">
            ${s.profile.length ? lines(s.profile, (p) => `<div>・${esc(p)}</div>`) : "—"}
          </div>
        </div>
        <div style="flex:1;background:#F8F8F6;border:1px solid #ccc;padding:30px;">
          ${[
            ["購買ステージ", s.stage],
            ["市場規模（SAM）", s.market.sam],
            ["市場規模（SOM）", s.market.som],
            ["成長性", s.market.growth],
            ["絞り込み条件", s.cutoff],
          ].filter(([_, v]) => v).map(([k, v]) => `
            <div style="margin-bottom:20px;">
              <div class="mono" style="font-size:14px;color:#555;letter-spacing:.3em;">${esc(k)}</div>
              <div style="font-size:20px;margin-top:6px;line-height:1.5;">${esc(v)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderCompetitorHtml(s) {
  const fmt = (c) => typeof c === "string" ? c : (c?.name || JSON.stringify(c));
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("競合（Competitor）", "1a1a14", "PART 1  ─  COMPETITOR")}
      <div style="padding:40px 100px;display:flex;gap:40px;">
        <div style="flex:1;">
          <div style="font-size:22px;font-weight:700;margin-bottom:14px;">直接競合</div>
          <div style="background:#F8F8F6;border:1px solid #ccc;padding:24px 30px;min-height:600px;font-size:20px;line-height:1.85;">
            ${s.direct.length ? lines(s.direct, (c) => `<div>・${esc(fmt(c))}</div>`) : "<div style='color:#999'>—</div>"}
          </div>
        </div>
        <div style="flex:1;">
          <div style="font-size:22px;font-weight:700;margin-bottom:14px;">間接競合</div>
          <div style="background:#F8F8F6;border:1px solid #ccc;padding:24px 30px;min-height:600px;font-size:20px;line-height:1.85;">
            ${s.indirect.length ? lines(s.indirect, (c) => `<div>・${esc(fmt(c))}</div>`) : "<div style='color:#999'>—</div>"}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCompanyHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("自社（Company）", "1a1a14", "PART 1  ─  COMPANY")}
      <div style="padding:40px 100px;">
        <div class="mono" style="font-size:16px;color:#555;letter-spacing:.3em;">強み</div>
        <div style="font-size:22px;line-height:1.85;margin-top:10px;margin-bottom:30px;">
          ${s.strength.length ? lines(s.strength, (t) => `<div>・${esc(t)}</div>`) : "—"}
        </div>
        <div class="mono" style="font-size:16px;color:#555;letter-spacing:.3em;">体制</div>
        <div style="font-size:22px;line-height:1.7;margin-top:6px;margin-bottom:30px;">${esc(s.structure || "—")}</div>
        <div class="mono" style="font-size:16px;color:#555;letter-spacing:.3em;">パッション</div>
        <div style="font-size:22px;line-height:1.7;margin-top:6px;font-style:italic;">${esc(s.passion || "—")}</div>
      </div>
    </div>
  `;
}

function renderBenefitHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("ベネフィット（Benefit）", "FF0000", "PART 2  ─  BENEFIT")}
      <div style="padding:40px 100px;">
        <div style="background:#FFF5F5;border:2px solid #FF0000;padding:28px 36px;">
          <div class="mono" style="font-size:16px;color:#FF0000;letter-spacing:.4em;">お客様が求めるコア価値</div>
          <div style="font-size:32px;font-weight:700;margin-top:12px;line-height:1.5;">${esc(s.core || "—")}</div>
        </div>
        <div style="display:flex;gap:40px;margin-top:36px;">
          <div style="flex:1;">
            <div style="font-size:22px;font-weight:700;color:#FF0000;margin-bottom:14px;">ニーズ（顕在化前の必要性）</div>
            <div style="font-size:20px;line-height:1.85;">
              ${s.needs.length ? lines(s.needs, (t) => `<div>・${esc(t)}</div>`) : "—"}
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:22px;font-weight:700;color:#FF0000;margin-bottom:14px;">ウォンツ（具体的な欲求）</div>
            <div style="font-size:20px;line-height:1.85;">
              ${s.wants.length ? lines(s.wants, (t) => `<div>・${esc(t)}</div>`) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAdvantageHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("アドバンテージ（Advantage）", "1a6fd4", "PART 2  ─  ADVANTAGE")}
      <div style="padding:40px 100px;">
        <div style="background:#F2F8FF;border:2px solid #1a6fd4;padding:28px 36px;">
          <div class="mono" style="font-size:16px;color:#1a6fd4;letter-spacing:.4em;">競合より選ばれる差別的優位点</div>
          <div style="font-size:32px;font-weight:700;margin-top:12px;line-height:1.5;">${esc(s.what || "—")}</div>
        </div>
        <div style="display:flex;gap:40px;margin-top:36px;">
          <div style="flex:1;">
            <div style="font-size:22px;font-weight:700;color:#1a6fd4;margin-bottom:14px;">なぜそれが選ばれるのか</div>
            <div style="font-size:20px;line-height:1.85;">${esc(s.why_good || "—")}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:22px;font-weight:700;color:#1a6fd4;margin-bottom:14px;">なぜ真似しづらいのか</div>
            <div style="font-size:20px;line-height:1.85;">${esc(s.why_hard_to_copy || "—")}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStrategyRecapHtml(s) {
  return `
    <div style="position:absolute;inset:0;background:#1a1a14;color:#fff;display:flex;flex-direction:column;align-items:center;padding:80px 120px;">
      <div style="font-size:22px;color:#aaa;letter-spacing:.4em;margin-bottom:14px;">ここまでの分析の結果として導かれる</div>
      <div class="head-serif" style="font-size:42px;font-weight:700;margin-bottom:60px;">戦略メッセージ</div>
      <div class="head-serif" style="font-size:56px;font-weight:700;text-align:center;line-height:1.55;max-width:1500px;flex:1;display:flex;align-items:center;">${esc(s.strategyMessage || "—")}</div>
      ${(s.benefitPart || s.advantagePart) ? `
        <div style="border-top:1px solid #555;width:100%;max-width:1400px;padding-top:30px;margin-top:30px;font-size:22px;color:#eee;text-align:center;line-height:1.7;">
          ${s.benefitPart ? `<div><span class="mono" style="color:#FF0000;font-weight:700;margin-right:14px;">B（Benefit）</span>${esc(s.benefitPart)}</div>` : ""}
          ${s.advantagePart ? `<div style="margin-top:14px;"><span class="mono" style="color:#1a6fd4;font-weight:700;margin-right:14px;">A（Advantage）</span>${esc(s.advantagePart)}</div>` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function renderCheckpointsHtml(s) {
  const colorFor = (st) => st === "ok" ? "0d9488" : st === "warn" ? "ea580c" : st === "ng" ? "FF0000" : "555555";
  const items = s.items.slice(0, 5);
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("整合性チェック", "1a1a14", "PART 3  ─  CHECKPOINTS")}
      <div style="padding:30px 100px;">
        ${lines(items, (c) => `
          <div style="display:flex;align-items:stretch;margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:18px;">
            <div style="width:140px;background:#${colorFor(c.status)};color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;">${esc(c.statusLabel)}</div>
            <div style="flex:1;padding:14px 24px;">
              <div style="font-size:24px;font-weight:700;margin-bottom:8px;">${esc(c.label || "—")}</div>
              <div style="font-size:18px;color:#555;line-height:1.7;">${esc(c.comment || "")}</div>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

function renderImproveHtml(s) {
  const cols = [
    { label: "追加すべきコンテンツ", items: s.contents, color: "1a6fd4" },
    { label: "改善すべきデザイン", items: s.design, color: "FF0000" },
    { label: "サイト構造の改善", items: s.structure, color: "1a1a14" },
  ];
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("ウェブサイト改善レポート", "1a6fd4", "PART 4  ─  WEBSITE IMPROVEMENT")}
      <div style="padding:30px 100px;display:flex;gap:24px;">
        ${lines(cols, (col) => `
          <div style="flex:1;">
            <div style="background:#${col.color};color:#fff;text-align:center;padding:14px;font-size:20px;font-weight:700;">${esc(col.label)}</div>
            <div style="padding:20px 0;">
              ${col.items.slice(0, 4).map((item, j) => `
                <div style="margin-bottom:18px;">
                  <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${j + 1}. ${esc(item.title)}</div>
                  <div style="font-size:15px;color:#555;line-height:1.6;">${esc(clip(item.reason, 100))}</div>
                </div>
              `).join("")}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

function renderNextActionsHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("次のアクション", "ea580c", "STRATEGY ACTION")}
      <div style="padding:40px 100px;">
        <div style="font-size:22px;color:#555;line-height:1.7;margin-bottom:36px;">戦略指南 AI の「戦略アクション」では、確定した戦略をもとに10テーマで具体的な施策を検討できます。</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          ${lines(s.themes, (t) => `
            <div style="background:#FFF7ED;border:2px solid #ea580c;padding:24px 28px;">
              <div style="font-size:24px;font-weight:700;color:#ea580c;margin-bottom:8px;">${esc(t.label)}</div>
              <div style="font-size:18px;line-height:1.6;">${esc(t.desc)}</div>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
}

function renderAboutHtml(s) {
  return `
    <div style="position:absolute;inset:0;background:#1a1a14;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;">
      <div class="head-serif" style="font-size:96px;font-weight:700;margin-bottom:24px;">戦略指南 AI</div>
      <div style="font-size:28px;color:#ddd;margin-bottom:60px;">AB3C で戦略を「分析 → 策定 → 実行」まで一気通貫</div>
      <div style="font-size:22px;color:#bbb;text-align:center;line-height:1.85;max-width:1300px;">${esc(s.description)}</div>
      <div class="mono" style="font-size:32px;color:#1a6fd4;margin-top:80px;letter-spacing:.2em;">${esc(s.siteUrl)}</div>
    </div>
  `;
}

const HTML_RENDERERS = {
  "cover": renderCoverHtml,
  "toc": renderTocHtml,
  "analysis-target": renderAnalysisTargetHtml,
  "framework": renderFrameworkHtml,
  "section-divider": renderSectionDividerHtml,
  "customer": renderCustomerHtml,
  "competitor": renderCompetitorHtml,
  "company": renderCompanyHtml,
  "benefit": renderBenefitHtml,
  "advantage": renderAdvantageHtml,
  "strategy-message-recap": renderStrategyRecapHtml,
  "checkpoints": renderCheckpointsHtml,
  "improve": renderImproveHtml,
  "next-actions": renderNextActionsHtml,
  "about": renderAboutHtml,
};

const NO_PAGE_NUMBER = new Set(["cover", "section-divider", "about"]);

function footerHtml(pageNum, total, siteName) {
  return `
    <div style="position:absolute;left:100px;right:100px;bottom:30px;display:flex;justify-content:space-between;font-size:14px;color:#999;font-family:inherit;">
      <div>${esc(siteName)}</div>
      <div>戦略指南 AI / AB3C 分析レポート　${pageNum} / ${total}</div>
    </div>
  `;
}

export async function exportPdf({ slides, input, historyTitle }) {
  if (!slides?.length) throw new Error("スライドデータがありません");

  const [{ default: jsPDF }, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasMod.default || html2canvasMod;

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const stage = document.createElement("div");
  stage.className = "ab3c-pdf-stage";
  document.body.appendChild(stage);

  const siteName = (() => {
    if (!input) return "";
    if (input.startsWith("http")) {
      try { return new URL(input).hostname.replace(/^www\./, ""); } catch { return ""; }
    }
    return "";
  })();

  // 16:9 PDF（pptx と同じ 13.333 x 7.5 inch）
  const pdf = new jsPDF({ orientation: "landscape", unit: "in", format: [13.333, 7.5] });
  const pdfW = 13.333;
  const pdfH = 7.5;

  try {
    const total = slides.length;
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      const renderer = HTML_RENDERERS[s.type];
      if (!renderer) continue;
      const html = renderer(s);
      const footer = NO_PAGE_NUMBER.has(s.type) ? "" : footerHtml(i + 1, total, siteName);
      stage.innerHTML = html + footer;
      // フォント読み込み等の安定化のため 1 フレーム待つ
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const canvas = await html2canvas(stage, {
        width: W, height: H, scale: 1,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage([pdfW, pdfH], "landscape");
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH, undefined, "FAST");
    }
    const fileName = buildFileBaseName({ input, historyTitle }) + ".pdf";
    pdf.save(fileName);
    return fileName;
  } finally {
    document.body.removeChild(stage);
    document.head.removeChild(styleEl);
  }
}
