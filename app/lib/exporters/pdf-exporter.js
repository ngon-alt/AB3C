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
  /* 行間隔を全体的に広げる（権さん 2026-05-15: 行間隔が狭い）*/
  .ab3c-pdf-stage * { box-sizing: border-box; line-height: 1.85; }
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
  // 権さん 2026-05-15:
  // - レポート識別子を最上部に移動（提案書だと一目で分かるように）
  // - 「戦略メッセージ」ラベルは本体のすぐ近くに
  // - 下部に差出人欄を新設
  return `
    <div style="position:absolute;inset:0;background:#1a1a14;color:#fff;padding:60px 120px;display:flex;flex-direction:column;">

      <!-- TOP: レポート識別子 -->
      <div style="text-align:center;">
        <div class="head-serif" style="font-size:44px;font-weight:700;color:#fff;line-height:1.4;">${esc(s.siteName)}　|　AB3C 分析レポート</div>
        <div class="mono" style="font-size:22px;color:#fff;letter-spacing:1em;margin-top:14px;opacity:.85;">AB3C  ANALYSIS  REPORT</div>
        <div style="height:1px;background:#fff;width:60%;margin:30px auto 0;opacity:.4;"></div>
      </div>

      <!-- MIDDLE: 戦略メッセージ -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div class="mono" style="letter-spacing:.6em;color:#fff;font-size:26px;margin-bottom:24px;opacity:.9;">── 戦略メッセージ ──</div>
        <div class="head-serif" style="font-size:56px;font-weight:700;text-align:center;line-height:1.65;max-width:1500px;color:#fff;">${esc(s.strategyMessage || "（戦略メッセージ未生成）")}</div>
        ${(s.benefitPart || s.advantagePart) ? `
          <div style="margin-top:40px;font-size:26px;color:#fff;text-align:center;line-height:1.8;">
            ${s.benefitPart ? `<div><span class="mono" style="color:#FF0000;font-weight:700;margin-right:14px;">B</span>${esc(clip(s.benefitPart, 100))}</div>` : ""}
            ${s.advantagePart ? `<div style="margin-top:10px;"><span class="mono" style="color:#1a6fd4;font-weight:700;margin-right:14px;">A</span>${esc(clip(s.advantagePart, 100))}</div>` : ""}
          </div>
        ` : ""}
      </div>

      <!-- BOTTOM: 差出人欄 -->
      <div style="text-align:center;">
        <div style="height:1px;background:#fff;width:60%;margin:0 auto 22px;opacity:.4;"></div>
        <div class="mono" style="font-size:20px;color:#fff;letter-spacing:.6em;opacity:.85;">発  行</div>
        <div style="font-size:28px;color:#fff;margin-top:8px;line-height:1.5;">${esc(s.issuer || "戦略指南 AI / senryaku.ai")}</div>
        <div class="mono" style="font-size:20px;color:#fff;margin-top:10px;letter-spacing:.3em;opacity:.7;">${esc(s.date)}</div>
      </div>
    </div>
  `;
}

function renderTocHtml(s) {
  return `
    <div style="position:absolute;inset:0;padding:80px 100px;">
      <div class="head-serif" style="font-size:56px;font-weight:700;margin-bottom:16px;">目次 — Agenda</div>
      <div style="height:3px;background:#1a1a14;margin-bottom:50px;"></div>
      ${lines(s.sections, (sec) => `
        <div style="display:flex;align-items:center;margin-bottom:30px;">
          <div style="width:130px;height:130px;background:#${sec.color};display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Noto Serif JP',serif;font-size:64px;font-weight:700;">${esc(sec.num)}</div>
          <div style="margin-left:36px;">
            <div class="head-serif" style="font-size:44px;font-weight:700;line-height:1.3;">${esc(sec.title)}</div>
            <div style="font-size:28px;color:#555;margin-top:6px;">${esc(sec.subtitle)}</div>
          </div>
        </div>
      `)}
    </div>
  `;
}

function pageHeaderHtml(title, accentColor = "1a1a14", eyebrow) {
  // PPT 基準: title 30pt, eyebrow 11pt → PDF は ×2 で 60px / 22px
  return `
    <div style="position:absolute;left:0;top:0;bottom:0;width:18px;background:#${accentColor};"></div>
    <div style="padding:60px 100px 0;">
      ${eyebrow ? `<div class="mono" style="font-size:22px;color:#555;letter-spacing:.4em;margin-bottom:12px;">${esc(eyebrow)}</div>` : ""}
      <div class="head-serif" style="font-size:60px;font-weight:700;color:#${accentColor};margin-bottom:24px;">${esc(title)}</div>
      <div style="height:2px;background:#${accentColor};"></div>
    </div>
  `;
}

function renderAnalysisTargetHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("分析対象")}
      <div style="padding:60px 100px;">
        <div class="head-serif" style="font-size:72px;font-weight:700;margin-top:40px;">${esc(s.siteName)}</div>
        ${s.url ? `<div class="mono" style="font-size:32px;color:#1a6fd4;margin-top:16px;word-break:break-all;">${esc(s.url)}</div>` : ""}
        ${s.inputExcerpt ? `
          <div style="margin-top:60px;background:#F8F8F6;border:1px solid #ccc;padding:30px 36px;">
            <div class="mono" style="font-size:22px;color:#555;letter-spacing:.4em;margin-bottom:14px;">入力テキスト（抜粋）</div>
            <div style="font-size:28px;line-height:1.85;">${esc(s.inputExcerpt)}</div>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function renderFrameworkHtml(s) {
  // 権さん 2026-05-15: 大前研一の3C分析ベース + 関連書籍 + 関連団体を併載
  // 権さん 2026-05-17: B の desc「お客様が求める価値（ニーズ→ウォンツ）」の閉じ括弧 ） が
  // 単独で次行に落ちる現象。原因は 24px × 19字 ≈ 456px がチップ本体幅 ~427px を超えるため。
  // 対策: desc を 20px に縮小 + white-space:nowrap で必ず 1 行に固定する。
  const chips = [
    { letter: "C", label: "Customer / Competitor / Company", desc: "顧客・競合・自社の3つのCで現状を把握", color: "1a1a14" },
    { letter: "B", label: "Benefit", desc: "お客様が求める価値（ニーズ→ウォンツ）", color: "FF0000" },
    { letter: "A", label: "Advantage", desc: "競合より選ばれる差別的優位点", color: "1a6fd4" },
  ];
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("AB3C フレームワークとは")}
      <div style="padding:30px 100px;display:flex;flex-direction:column;gap:22px;">
        <div style="display:flex;gap:24px;">
          ${lines(chips, (c) => `
            <div style="flex:1;display:flex;align-items:center;min-width:0;">
              <div style="width:110px;height:160px;background:#${c.color};display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Noto Serif JP',serif;font-size:76px;font-weight:700;flex-shrink:0;">${c.letter}</div>
              <div style="margin-left:20px;flex:1;min-width:0;">
                <div class="mono" style="font-size:20px;color:#555;letter-spacing:.3em;margin-bottom:6px;">${esc(c.label)}</div>
                <div style="font-size:20px;color:#1a1a14;line-height:1.65;white-space:nowrap;">${esc(c.desc)}</div>
              </div>
            </div>
          `)}
        </div>
        <div style="font-size:28px;line-height:1.85;color:#1a1a14;">${esc(s.description)}</div>
        <div style="font-size:24px;color:#555;font-style:italic;line-height:1.7;">${esc(s.orderNote || "")}</div>

        <!-- 関連リソース -->
        <div style="border-top:1px solid #ccc;padding-top:18px;">
          <div class="mono" style="font-size:22px;color:#555;letter-spacing:.4em;margin-bottom:14px;">関連リソース</div>
          ${s.relatedBook ? `
            <div style="font-size:26px;color:#1a1a14;margin-bottom:10px;line-height:1.6;">
              <b>📖 関連書籍：</b>
              <a href="${esc(s.relatedBook.url || "")}" style="color:#1a6fd4;text-decoration:underline;font-weight:700;">『${esc(s.relatedBook.title)}』</a>
              ${s.relatedBook.author ? `<span style="color:#555;margin-left:8px;">${esc(s.relatedBook.author)}</span>` : ""}
            </div>
          ` : ""}
          ${s.relatedAssociation ? `
            <div style="font-size:26px;color:#1a1a14;line-height:1.6;">
              <b>🏛 関連団体：</b>
              <a href="${esc(s.relatedAssociation.url || "")}" style="color:#1a6fd4;text-decoration:underline;font-weight:700;">${esc(s.relatedAssociation.name)}</a>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderSectionDividerHtml(s) {
  // PART 2（color2 あり）は背景を左右で 赤/青 に分割（権さん 2026-05-15）。
  // 文字はすべて白で統一。
  const background = s.color2
    ? `background: linear-gradient(to right, #${s.color} 0%, #${s.color} 50%, #${s.color2} 50%, #${s.color2} 100%);`
    : `background:#${s.color};`;
  return `
    <div style="position:absolute;inset:0;${background}color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div class="mono" style="font-size:36px;color:#fff;letter-spacing:1em;margin-bottom:30px;">PART  ${esc(s.num)}</div>
      <div class="head-serif" style="font-size:120px;font-weight:700;text-align:center;margin-bottom:30px;color:#fff;">${esc(s.title)}</div>
      <div style="font-size:36px;color:#fff;">${esc(s.subtitle)}</div>
      <div style="display:flex;gap:20px;margin-top:50px;">
        <div style="width:360px;height:8px;background:#fff;"></div>
      </div>
    </div>
  `;
}

function renderCustomerHtml(s) {
  // 権さん 2026-05-17: グレー枠が中身（特に「絞り込み条件」最終行）より短く切れる問題を修正。
  // 原因: html2canvas が flex align-items:stretch を確実に再現できず、グレー枠の背景高さが
  // 中身より短くなっていた。対策として page wrapper を flex-column 化し、本文を flex:1 で
  // ヘッダ以下の残りすべてを埋める構造に変更。グレー枠も常にその全高に揃う。
  return `
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;">
      ${pageHeaderHtml("顧客（Customer）", "1a1a14", "PART 1  ─  CUSTOMER")}
      <div style="flex:1;padding:40px 100px 60px;display:flex;gap:40px;min-height:0;">
        <div style="flex:1.2;">
          <div class="mono" style="font-size:24px;color:#555;letter-spacing:.3em;">ターゲット</div>
          <div style="font-size:36px;font-weight:700;margin-top:10px;line-height:1.4;">${esc(s.target || "—")}</div>

          <div class="mono" style="font-size:24px;color:#555;letter-spacing:.3em;margin-top:30px;">プロファイル</div>
          <div style="font-size:26px;line-height:1.95;margin-top:10px;">
            ${s.profile.length ? lines(s.profile, (p) => `<div>・${esc(p)}</div>`) : "—"}
          </div>
        </div>
        <div style="flex:1;background:#F8F8F6;border:1px solid #ccc;padding:30px;align-self:stretch;">
          ${[
            ["購買ステージ", s.stage],
            ["市場規模（SAM）", s.market.sam],
            ["市場規模（SOM）", s.market.som],
            ["成長性", s.market.growth],
            ["絞り込み条件", s.cutoff],
          ].filter(([_, v]) => v).map(([k, v]) => `
            <div style="margin-bottom:20px;">
              <div class="mono" style="font-size:22px;color:#555;letter-spacing:.3em;">${esc(k)}</div>
              <div style="font-size:28px;margin-top:6px;line-height:1.6;">${esc(v)}</div>
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
          <div style="font-size:28px;font-weight:700;margin-bottom:14px;">直接競合</div>
          <div style="background:#F8F8F6;border:1px solid #ccc;padding:24px 30px;min-height:600px;font-size:26px;line-height:1.95;">
            ${s.direct.length ? lines(s.direct, (c) => `<div>・${esc(fmt(c))}</div>`) : "<div style='color:#999'>—</div>"}
          </div>
        </div>
        <div style="flex:1;">
          <div style="font-size:28px;font-weight:700;margin-bottom:14px;">間接競合</div>
          <div style="background:#F8F8F6;border:1px solid #ccc;padding:24px 30px;min-height:600px;font-size:26px;line-height:1.95;">
            ${s.indirect.length ? lines(s.indirect, (c) => `<div>・${esc(fmt(c))}</div>`) : "<div style='color:#999'>—</div>"}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCompanyHtml(s) {
  // 権さん 2026-05-15: 体制・パッションのテキストがはみ出して重なる問題を修正。
  // 権さん 2026-05-17: 自社ページはコンテンツが多くて溢れがち。フォント・行間・余白を全体的に詰める。
  // 強み 24px / 体制・パッション 22px、line-height 1.65、gap 12px、padding-top 10px に圧縮。
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("自社（Company）", "1a1a14", "PART 1  ─  COMPANY")}
      <div style="padding:18px 100px 40px;display:flex;flex-direction:column;gap:12px;height:calc(100% - 180px);">
        <!-- 強み -->
        <div style="flex:3;overflow:hidden;">
          <div class="mono" style="font-size:20px;color:#555;letter-spacing:.4em;margin-bottom:6px;">強み</div>
          <div style="font-size:24px;line-height:1.65;">
            ${s.strength.length ? lines(s.strength, (t) => `<div style="margin-bottom:3px;">・${esc(t)}</div>`) : "—"}
          </div>
        </div>
        <!-- 仕組み（旧: 体制）— 権さん 2026-05-18 ラベル変更 -->
        <div style="flex:2;overflow:hidden;border-top:1px solid #ccc;padding-top:10px;">
          <div class="mono" style="font-size:20px;color:#555;letter-spacing:.4em;margin-bottom:6px;">仕組み</div>
          <div style="font-size:22px;line-height:1.65;">${esc(s.structure || "—")}</div>
        </div>
        <!-- 価値観（旧: パッション）— 権さん 2026-05-18 ラベル変更・italic 解除 -->
        <div style="flex:1.5;overflow:hidden;border-top:1px solid #ccc;padding-top:10px;">
          <div class="mono" style="font-size:20px;color:#555;letter-spacing:.4em;margin-bottom:6px;">価値観</div>
          <div style="font-size:22px;line-height:1.65;">${esc(s.passion || "—")}</div>
        </div>
      </div>
    </div>
  `;
}

function renderBenefitHtml(s) {
  // コアベネフィットは長文も想定。padding 増・line-height 増でオーバーフロー対策。
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("ベネフィット（Benefit）", "FF0000", "PART 2  ─  BENEFIT")}
      <div style="padding:40px 100px;">
        <div style="background:#FFF5F5;border:2px solid #FF0000;padding:28px 36px;">
          <div class="mono" style="font-size:22px;color:#FF0000;letter-spacing:.4em;">お客様が求めるコア価値</div>
          <div style="font-size:36px;font-weight:700;margin-top:14px;line-height:1.75;">${esc(s.core || "—")}</div>
        </div>
        <div style="display:flex;gap:40px;margin-top:36px;">
          <div style="flex:1;">
            <div style="font-size:24px;font-weight:700;color:#FF0000;margin-bottom:14px;">ニーズ（顕在化前の必要性）</div>
            <div style="font-size:26px;line-height:1.95;">
              ${s.needs.length ? lines(s.needs, (t) => `<div>・${esc(t)}</div>`) : "—"}
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:24px;font-weight:700;color:#FF0000;margin-bottom:14px;">ウォンツ（具体的な欲求）</div>
            <div style="font-size:26px;line-height:1.95;">
              ${s.wants.length ? lines(s.wants, (t) => `<div>・${esc(t)}</div>`) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAdvantageHtml(s) {
  // Advantage が長文になりがちなため、フォントを少し小さく、line-height 大、padding を増やしてオーバーフロー回避。
  // 権さん 2026-05-15: そもそも Advantage が長すぎる傾向があるが、レイアウトとして受けられるようにする。
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("アドバンテージ（Advantage）", "1a6fd4", "PART 2  ─  ADVANTAGE")}
      <div style="padding:40px 100px;">
        <div style="background:#F2F8FF;border:2px solid #1a6fd4;padding:30px 36px;">
          <div class="mono" style="font-size:22px;color:#1a6fd4;letter-spacing:.4em;">競合より選ばれる差別的優位点</div>
          <div style="font-size:36px;font-weight:700;margin-top:14px;line-height:1.75;">${esc(s.what || "—")}</div>
        </div>
        <div style="display:flex;gap:40px;margin-top:36px;">
          <div style="flex:1;">
            <div style="font-size:24px;font-weight:700;color:#1a6fd4;margin-bottom:14px;">なぜそれが選ばれるのか</div>
            <div style="font-size:26px;line-height:1.95;">${esc(s.why_good || "—")}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:24px;font-weight:700;color:#1a6fd4;margin-bottom:14px;">なぜ真似しづらいのか</div>
            <div style="font-size:26px;line-height:1.95;">${esc(s.why_hard_to_copy || "—")}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStrategyRecapHtml(s) {
  return `
    <div style="position:absolute;inset:0;background:#1a1a14;color:#fff;display:flex;flex-direction:column;align-items:center;padding:80px 120px;">
      <div style="font-size:24px;color:#fff;letter-spacing:.4em;margin-bottom:14px;">ここまでの分析の結果として導かれる</div>
      <div class="head-serif" style="font-size:52px;font-weight:700;margin-bottom:60px;color:#fff;">戦略メッセージ</div>
      <div class="head-serif" style="font-size:56px;font-weight:700;text-align:center;line-height:1.65;max-width:1500px;flex:1;display:flex;align-items:center;color:#fff;">${esc(s.strategyMessage || "—")}</div>
      ${(s.benefitPart || s.advantagePart) ? `
        <div style="border-top:1px solid #fff;opacity:1;width:100%;max-width:1400px;padding-top:30px;margin-top:30px;font-size:28px;color:#fff;text-align:center;line-height:1.85;">
          ${s.benefitPart ? `<div><span class="mono" style="color:#FF0000;font-weight:700;margin-right:14px;">B（Benefit）</span>${esc(s.benefitPart)}</div>` : ""}
          ${s.advantagePart ? `<div style="margin-top:14px;"><span class="mono" style="color:#1a6fd4;font-weight:700;margin-right:14px;">A（Advantage）</span>${esc(s.advantagePart)}</div>` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function renderCheckpointsHtml(s) {
  // 権さん 2026-05-17: フォント拡大後、5項目目が 1080px に収まらず欠ける。
  // padding / margin を詰め、コメント行間を圧縮して 5項目を確実に表示。
  const colorFor = (st) => st === "ok" ? "0d9488" : st === "warn" ? "ea580c" : st === "ng" ? "FF0000" : "555555";
  const items = s.items.slice(0, 5);
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("品質チェック", "1a1a14", "PART 3  ─  CHECKPOINTS")}
      <div style="padding:14px 100px;">
        ${lines(items, (c) => `
          <div style="display:flex;align-items:stretch;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:8px;">
            <div style="width:130px;background:#${colorFor(c.status)};color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;">${esc(c.statusLabel)}</div>
            <div style="flex:1;padding:8px 20px;">
              <div style="font-size:26px;font-weight:700;margin-bottom:4px;line-height:1.4;">${esc(c.label || "—")}</div>
              <div style="font-size:22px;color:#555;line-height:1.55;">${esc(c.comment || "")}</div>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

// 改善レポート 1ページ分（最大2項目）。build-slides 側でページネーション済み。
// 権さん 2026-05-16: flex:1 の inner column は長文時に重なりが起きるため、
// block レイアウト（自然な高さ + margin-bottom）に変更してオーバーフローを排除する。
function renderImproveSectionHtml(s) {
  const items = s.items || [];
  const startNum = s.itemNumberStart || 1;
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml(s.categoryLabel, "ea580c", "PART 4  ─  WEBSITE IMPROVEMENT")}
      <div style="padding:24px 100px 60px;height:calc(100% - 200px);overflow:hidden;box-sizing:border-box;">
        <div style="font-size:24px;color:#555;margin-bottom:30px;line-height:1.7;">${esc(s.categorySubtitle || "")}</div>
        ${items.length === 0 ? `<div style="color:#999;font-size:24px;">（このカテゴリの提案はありません）</div>` : items.map((item, j) => `
          <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:48px;">
            <div style="flex-shrink:0;width:72px;height:72px;background:#ea580c;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif JP',serif;font-size:36px;font-weight:700;">${startNum + j}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:30px;font-weight:700;margin-bottom:14px;line-height:1.55;">${esc(item.title || "")}</div>
              <div style="font-size:24px;color:#555;line-height:1.85;">
                ${item.reason ? `<div style="margin-bottom:10px;"><b style="color:#ea580c;">理由：</b>${esc(item.reason)}</div>` : ""}
                ${item.example ? `<div><b style="color:#ea580c;">実装例：</b>${esc(item.example)}</div>` : ""}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ビジュアルモック（改善後ファーストビュー）スライド。
// imageDataUrl は exportPdf の前処理 preRenderVisualMocks で準備されている前提。
function renderVisualMockHtml(s) {
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("改善後のファーストビュー・イメージ", "ea580c", "PART 4  ─  VISUAL MOCKUP")}
      <div style="padding:20px 100px 60px;">
        ${s.imageDataUrl ? `
          <div style="border:2px solid #1a1a14;border-radius:6px;overflow:hidden;background:#fff;">
            <img src="${s.imageDataUrl}" style="width:100%;display:block;">
          </div>
        ` : `<div style="text-align:center;padding:120px;color:#999;font-size:20px;">（ビジュアル画像を準備できませんでした）</div>`}
        ${s.caption ? `
          <div style="margin-top:20px;padding:20px 26px;background:#FEF3C7;border-left:6px solid #ea580c;font-size:26px;line-height:1.85;">
            <b style="color:#ea580c;">💡 このビジュアルの意図：</b>${esc(s.caption)}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function renderNextActionsHtml(s) {
  // 権さん 2026-05-16: 2x2 → 4カラム並列レイアウトに変更。
  // 各カラムで縦方向に余裕を持って 2段（名前/説明）表示する。
  const description = s.description || "戦略指南 AI の「戦略アクション」では、確定した戦略をもとに10テーマで具体的な施策を検討できます。";
  const groups = s.groups || [];
  const numCols = Math.min(groups.length, 4);
  return `
    <div style="position:absolute;inset:0;">
      ${pageHeaderHtml("次のアクション", "ea580c", "STRATEGY ACTION")}
      <div style="padding:24px 100px 60px;">
        <div style="font-size:26px;color:#555;line-height:1.7;margin-bottom:22px;">${esc(description)}</div>
        <!-- 権さん 2026-05-17: flex:1 を外し、grid 自体を中身（最長カラム）の自然高さにする。
             これにより 4 カラムの箱全体が縦に詰まる。grid 既定で行ストレッチするので
             全カラムは同じ高さ（最長 = 集客 4テーマ分）になる。 -->
        <div style="display:grid;grid-template-columns:repeat(${numCols}, 1fr);gap:18px;">
          ${lines(groups.slice(0, numCols), (g) => `
            <div style="border:2px solid #ea580c;background:#fff;display:flex;flex-direction:column;overflow:hidden;">
              <div style="background:#ea580c;color:#fff;padding:10px 14px;text-align:center;">
                <div style="font-family:'Noto Serif JP',serif;font-size:26px;font-weight:700;line-height:1.3;">${esc(g.label)}</div>
              </div>
              <div style="background:#FFF7ED;padding:18px 16px;flex:1;">
                ${lines(g.themes, (t) => `
                  <div style="margin-bottom:18px;">
                    <div style="font-size:22px;font-weight:700;color:#1a1a14;line-height:1.5;">
                      <span style="color:#ea580c;margin-right:2px;">・</span>${esc(t.name)}
                    </div>
                    ${t.desc ? `<div style="font-size:17px;color:#555;line-height:1.7;margin-left:12px;margin-top:4px;">${esc(t.desc)}</div>` : ""}
                  </div>
                `)}
              </div>
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
      <div style="font-size:36px;color:#ddd;margin-bottom:60px;">AB3C で戦略を「分析 → 策定 → 実行」まで一気通貫</div>
      <div style="font-size:28px;color:#bbb;text-align:center;line-height:1.85;max-width:1300px;">${esc(s.description)}</div>
      <div class="mono" style="font-size:40px;color:#1a6fd4;margin-top:80px;letter-spacing:.2em;">${esc(s.siteUrl)}</div>
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
  "improve-section": renderImproveSectionHtml,
  "visual-mock": renderVisualMockHtml,
  "next-actions": renderNextActionsHtml,
  "about": renderAboutHtml,
};

const NO_PAGE_NUMBER = new Set(["cover", "section-divider", "about"]);

function footerHtml(pageNum, total, siteName) {
  return `
    <div style="position:absolute;left:100px;right:100px;bottom:30px;display:flex;justify-content:space-between;font-size:18px;color:#999;font-family:inherit;">
      <div>${esc(siteName)}</div>
      <div>戦略指南 AI / AB3C 分析レポート　${pageNum} / ${total}</div>
    </div>
  `;
}

export async function exportPdf({ slides, input, historyTitle }) {
  if (!slides?.length) throw new Error("スライドデータがありません");
  // ビジュアルモック画像を先に準備（PPTX と共通の前処理）
  const { preRenderVisualMocks } = await import("./pptx-exporter");
  await preRenderVisualMocks(slides);

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
