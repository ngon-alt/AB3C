// スライドモデルを .pptx ファイルに書き出す。
// pptxgenjs を動的 import してバンドル肥大化を避ける（クライアント側のみ実行）。
//
// 仕様:
//   - 16:9（LAYOUT_WIDE = 13.333in × 7.5in）
//   - 見出し: Noto Serif JP / 本文: Yu Gothic UI（年配ユーザー前提で本文 18pt 以上）
//   - 色: AB3C カラールール厳守（C=黒 / B=赤 / A=青）

import { COLORS, buildFileBaseName } from "./build-slides";

const F_HEAD = "Noto Serif JP";
const F_BODY = "Yu Gothic UI";
const F_MONO = "Consolas";

// LAYOUT_WIDE: 13.333 × 7.5 inches
const W = 13.333;
const H = 7.5;

const M = 0.6; // 標準余白
const MAX_LIST_LEN = 200;

const clip = (s, n = MAX_LIST_LEN) => {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? str.slice(0, n) + "…" : str;
};

function addFooter(slide, pageNum, totalPages, siteName) {
  slide.addText(siteName, { x: M, y: H - 0.35, w: 6, h: 0.25, fontFace: F_BODY, fontSize: 9, color: COLORS.muted });
  slide.addText(`戦略指南 AI / AB3C 分析レポート　${pageNum} / ${totalPages}`, { x: W - 6 - M, y: H - 0.35, w: 6, h: 0.25, fontFace: F_BODY, fontSize: 9, color: COLORS.muted, align: "right" });
}

function bg(slide, color) {
  slide.background = { color };
}

// ─── 各スライドタイプのレンダラ ──────────────────────────────

function renderCover(slide, s) {
  bg(slide, COLORS.ink);
  slide.addText("── 戦略メッセージ ──", { x: 0, y: 0.7, w: W, h: 0.4, fontFace: F_BODY, fontSize: 14, color: "AAAAAA", align: "center", charSpacing: 6 });
  // 戦略メッセージ本体（明朝・大きく中央）
  const msg = s.strategyMessage || "（戦略メッセージ未生成）";
  slide.addText(msg, {
    x: 1.0, y: 1.6, w: W - 2.0, h: 3.6,
    fontFace: F_HEAD, fontSize: 32, color: "FFFFFF", bold: true, align: "center", valign: "middle",
    paraSpaceAfter: 6,
  });
  // B / A サブコメント（あれば）
  if (s.benefitPart || s.advantagePart) {
    const yBase = 5.3;
    if (s.benefitPart) {
      slide.addText([
        { text: "B  ", options: { color: COLORS.B, bold: true, fontFace: F_MONO } },
        { text: clip(s.benefitPart, 80), options: { color: "EEEEEE", fontFace: F_BODY } },
      ], { x: 1.5, y: yBase, w: W - 3, h: 0.4, fontSize: 14, align: "center" });
    }
    if (s.advantagePart) {
      slide.addText([
        { text: "A  ", options: { color: COLORS.A, bold: true, fontFace: F_MONO } },
        { text: clip(s.advantagePart, 80), options: { color: "EEEEEE", fontFace: F_BODY } },
      ], { x: 1.5, y: yBase + 0.5, w: W - 3, h: 0.4, fontSize: 14, align: "center" });
    }
  }
  // フッター（サイト名 / 日付 / レポート種別）
  slide.addShape("line", { x: 1, y: 6.5, w: W - 2, h: 0, line: { color: "555555", width: 0.5 } });
  slide.addText(`${s.siteName}　|　AB3C 分析レポート`, { x: 1, y: 6.65, w: W - 2, h: 0.3, fontFace: F_BODY, fontSize: 13, color: "DDDDDD", align: "center" });
  slide.addText(`${s.date}　/　戦略指南 AI`, { x: 1, y: 7.0, w: W - 2, h: 0.3, fontFace: F_MONO, fontSize: 10, color: "999999", align: "center", charSpacing: 4 });
}

function renderToc(slide, s) {
  bg(slide, COLORS.bg);
  slide.addText("目次 — Agenda", { x: M, y: 0.5, w: W - M * 2, h: 0.6, fontFace: F_HEAD, fontSize: 28, bold: true, color: COLORS.ink });
  slide.addShape("line", { x: M, y: 1.15, w: W - M * 2, h: 0, line: { color: COLORS.ink, width: 1.5 } });
  const startY = 1.6;
  const rowH = 1.05;
  s.sections.forEach((sec, i) => {
    const y = startY + i * rowH;
    slide.addShape("rect", { x: M, y, w: 0.9, h: 0.8, fill: { color: sec.color }, line: { color: sec.color } });
    slide.addText(sec.num, { x: M, y, w: 0.9, h: 0.8, fontFace: F_HEAD, fontSize: 32, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(sec.title, { x: M + 1.2, y, w: W - M * 2 - 1.2, h: 0.45, fontFace: F_HEAD, fontSize: 22, bold: true, color: COLORS.ink });
    slide.addText(sec.subtitle, { x: M + 1.2, y: y + 0.45, w: W - M * 2 - 1.2, h: 0.35, fontFace: F_BODY, fontSize: 14, color: COLORS.muted });
  });
}

function renderAnalysisTarget(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "分析対象");
  slide.addText(s.siteName, { x: M, y: 1.5, w: W - M * 2, h: 0.7, fontFace: F_HEAD, fontSize: 36, bold: true, color: COLORS.ink });
  if (s.url) {
    slide.addText(s.url, { x: M, y: 2.3, w: W - M * 2, h: 0.5, fontFace: F_MONO, fontSize: 16, color: COLORS.A, hyperlink: { url: s.url } });
  }
  if (s.inputExcerpt) {
    slide.addShape("rect", { x: M, y: 3.2, w: W - M * 2, h: 2.5, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
    slide.addText("入力テキスト（抜粋）", { x: M + 0.2, y: 3.3, w: W - M * 2 - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: COLORS.muted, charSpacing: 4 });
    slide.addText(s.inputExcerpt, { x: M + 0.2, y: 3.65, w: W - M * 2 - 0.4, h: 2.0, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top" });
  }
}

function renderFramework(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "AB3C フレームワークとは");
  // 3色のチップ + 説明
  const chips = [
    { letter: "C", label: "Customer / Competitor / Company", desc: "顧客・競合・自社の3つのCで現状を把握", color: COLORS.C },
    { letter: "B", label: "Benefit", desc: "お客様が求める価値（ニーズ → ウォンツ）", color: COLORS.B },
    { letter: "A", label: "Advantage", desc: "競合より選ばれる差別的優位点", color: COLORS.A },
  ];
  const chipY = 1.55;
  const chipH = 1.5;
  const chipW = (W - M * 2 - 0.4) / 3;
  chips.forEach((c, i) => {
    const x = M + i * (chipW + 0.2);
    slide.addShape("rect", { x, y: chipY, w: 1.0, h: chipH, fill: { color: c.color }, line: { color: c.color } });
    slide.addText(c.letter, { x, y: chipY, w: 1.0, h: chipH, fontFace: F_HEAD, fontSize: 56, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(c.label, { x: x + 1.1, y: chipY + 0.15, w: chipW - 1.1, h: 0.4, fontFace: F_MONO, fontSize: 11, color: COLORS.muted, charSpacing: 3 });
    slide.addText(c.desc, { x: x + 1.1, y: chipY + 0.55, w: chipW - 1.1, h: chipH - 0.55, fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top" });
  });
  slide.addText(s.description, { x: M, y: 3.5, w: W - M * 2, h: 2.5, fontFace: F_BODY, fontSize: 16, color: COLORS.ink, valign: "top", paraSpaceAfter: 6 });
  slide.addText("AB3C の順序は「C → B → A」。現状を把握してから、価値と優位性を組み立て、最後に戦略メッセージへと統合します。", {
    x: M, y: 6.0, w: W - M * 2, h: 0.7, fontFace: F_BODY, fontSize: 14, color: COLORS.muted, italic: true,
  });
}

function renderSectionDivider(slide, s) {
  bg(slide, s.color);
  // 中央に大きく章番号と章タイトル
  slide.addText(`PART  ${s.num}`, { x: 0, y: 2.4, w: W, h: 0.5, fontFace: F_MONO, fontSize: 18, color: "FFFFFF", align: "center", charSpacing: 10 });
  slide.addText(s.title, { x: 0, y: 3.0, w: W, h: 1.0, fontFace: F_HEAD, fontSize: 60, color: "FFFFFF", bold: true, align: "center" });
  slide.addText(s.subtitle, { x: 0, y: 4.2, w: W, h: 0.5, fontFace: F_BODY, fontSize: 18, color: "EEEEEE", align: "center" });
  // 第2部だけは B 赤と A 青の2色ラインを下に
  if (s.color2) {
    slide.addShape("rect", { x: W / 2 - 2, y: 5.4, w: 1.8, h: 0.08, fill: { color: s.color } });
    slide.addShape("rect", { x: W / 2 + 0.2, y: 5.4, w: 1.8, h: 0.08, fill: { color: s.color2 } });
  } else {
    slide.addShape("rect", { x: W / 2 - 1.5, y: 5.4, w: 3, h: 0.08, fill: { color: "FFFFFF" } });
  }
}

function pageHeader(slide, title, accentColor = COLORS.ink, eyebrow) {
  // 左端の色帯（4mm相当）
  slide.addShape("rect", { x: 0, y: 0, w: 0.15, h: H, fill: { color: accentColor }, line: { color: accentColor } });
  if (eyebrow) {
    slide.addText(eyebrow, { x: M, y: 0.45, w: W - M * 2, h: 0.3, fontFace: F_MONO, fontSize: 11, color: COLORS.muted, charSpacing: 6 });
  }
  slide.addText(title, { x: M, y: eyebrow ? 0.75 : 0.5, w: W - M * 2, h: 0.7, fontFace: F_HEAD, fontSize: 30, bold: true, color: accentColor });
  slide.addShape("line", { x: M, y: 1.4, w: W - M * 2, h: 0, line: { color: accentColor, width: 1 } });
}

function renderCustomer(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "顧客（Customer）", COLORS.C, "PART 1  ─  CUSTOMER");
  // 左カラム: ターゲット・購買ステージ
  const leftX = M;
  const leftW = (W - M * 2 - 0.4) * 0.55;
  slide.addText("ターゲット", { x: leftX, y: 1.65, w: leftW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.muted });
  slide.addText(s.target || "—", { x: leftX, y: 1.95, w: leftW, h: 0.7, fontFace: F_BODY, fontSize: 18, bold: true, color: COLORS.ink, valign: "top" });

  slide.addText("プロファイル", { x: leftX, y: 2.85, w: leftW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.muted });
  if (s.profile.length) {
    slide.addText(s.profile.map(p => ({ text: "・" + p, options: {} })), {
      x: leftX, y: 3.15, w: leftW, h: 3.5,
      fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top", paraSpaceAfter: 4,
    });
  }

  // 右カラム: 市場規模・購買ステージ・絞り込み条件
  const rightX = leftX + leftW + 0.4;
  const rightW = W - M - rightX;
  slide.addShape("rect", { x: rightX, y: 1.65, w: rightW, h: 5, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
  let y = 1.85;
  const block = (label, value) => {
    if (!value) return;
    slide.addText(label, { x: rightX + 0.2, y, w: rightW - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: COLORS.muted });
    y += 0.3;
    slide.addText(value, { x: rightX + 0.2, y, w: rightW - 0.4, h: 0.6, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top" });
    y += 0.7;
  };
  block("購買ステージ", s.stage);
  block("市場規模（SAM）", s.market.sam);
  block("市場規模（SOM）", s.market.som);
  block("成長性", s.market.growth);
  block("絞り込み条件", s.cutoff);
}

function renderCompetitor(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "競合（Competitor）", COLORS.C, "PART 1  ─  COMPETITOR");
  const colW = (W - M * 2 - 0.4) / 2;
  // 直接競合
  slide.addText("直接競合", { x: M, y: 1.65, w: colW, h: 0.4, fontFace: F_BODY, fontSize: 14, bold: true, color: COLORS.ink });
  slide.addShape("rect", { x: M, y: 2.05, w: colW, h: 4.8, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
  if (s.direct.length) {
    slide.addText(s.direct.map(c => "・" + (typeof c === "string" ? c : (c.name || JSON.stringify(c)))).join("\n"),
      { x: M + 0.2, y: 2.2, w: colW - 0.4, h: 4.6, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top", paraSpaceAfter: 4 });
  } else {
    slide.addText("—", { x: M + 0.2, y: 2.2, w: colW - 0.4, h: 0.4, fontFace: F_BODY, fontSize: 14, color: COLORS.muted });
  }
  // 間接競合
  const rx = M + colW + 0.4;
  slide.addText("間接競合", { x: rx, y: 1.65, w: colW, h: 0.4, fontFace: F_BODY, fontSize: 14, bold: true, color: COLORS.ink });
  slide.addShape("rect", { x: rx, y: 2.05, w: colW, h: 4.8, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
  if (s.indirect.length) {
    slide.addText(s.indirect.map(c => "・" + (typeof c === "string" ? c : (c.name || JSON.stringify(c)))).join("\n"),
      { x: rx + 0.2, y: 2.2, w: colW - 0.4, h: 4.6, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top", paraSpaceAfter: 4 });
  } else {
    slide.addText("—", { x: rx + 0.2, y: 2.2, w: colW - 0.4, h: 0.4, fontFace: F_BODY, fontSize: 14, color: COLORS.muted });
  }
}

function renderCompany(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "自社（Company）", COLORS.C, "PART 1  ─  COMPANY");
  // 強み（リスト）
  slide.addText("強み", { x: M, y: 1.65, w: W - M * 2, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.muted });
  if (s.strength.length) {
    slide.addText(s.strength.map(t => "・" + t).join("\n"),
      { x: M, y: 1.95, w: W - M * 2, h: 2.5, fontFace: F_BODY, fontSize: 16, color: COLORS.ink, valign: "top", paraSpaceAfter: 4 });
  }
  // 体制
  slide.addText("体制", { x: M, y: 4.7, w: W - M * 2, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.muted });
  slide.addText(s.structure || "—", { x: M, y: 5.0, w: W - M * 2, h: 0.8, fontFace: F_BODY, fontSize: 15, color: COLORS.ink, valign: "top" });
  // パッション
  slide.addText("パッション", { x: M, y: 5.95, w: W - M * 2, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.muted });
  slide.addText(s.passion || "—", { x: M, y: 6.25, w: W - M * 2, h: 0.6, fontFace: F_BODY, fontSize: 15, color: COLORS.ink, valign: "top", italic: true });
}

function renderBenefit(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "ベネフィット（Benefit）", COLORS.B, "PART 2  ─  BENEFIT");
  // コアベネフィット（赤帯のカード）
  slide.addShape("rect", { x: M, y: 1.65, w: W - M * 2, h: 1.2, fill: { color: "FFF5F5" }, line: { color: COLORS.B, width: 1.5 } });
  slide.addText("お客様が求めるコア価値", { x: M + 0.2, y: 1.75, w: W - M * 2 - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: COLORS.B, charSpacing: 4 });
  slide.addText(s.core || "—", { x: M + 0.2, y: 2.05, w: W - M * 2 - 0.4, h: 0.75, fontFace: F_BODY, fontSize: 20, bold: true, color: COLORS.ink, valign: "top" });

  // needs / wants の2カラム
  const colW = (W - M * 2 - 0.4) / 2;
  const ny = 3.15;
  slide.addText("ニーズ（顕在化前の必要性）", { x: M, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.B, bold: true });
  if (s.needs.length) {
    slide.addText(s.needs.map(t => "・" + t).join("\n"),
      { x: M, y: ny + 0.35, w: colW, h: 3.5, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top", paraSpaceAfter: 4 });
  }
  const rx = M + colW + 0.4;
  slide.addText("ウォンツ（具体的な欲求）", { x: rx, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.B, bold: true });
  if (s.wants.length) {
    slide.addText(s.wants.map(t => "・" + t).join("\n"),
      { x: rx, y: ny + 0.35, w: colW, h: 3.5, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top", paraSpaceAfter: 4 });
  }
}

function renderAdvantage(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "アドバンテージ（Advantage）", COLORS.A, "PART 2  ─  ADVANTAGE");
  // 何が優位か（青帯のカード）
  slide.addShape("rect", { x: M, y: 1.65, w: W - M * 2, h: 1.2, fill: { color: "F2F8FF" }, line: { color: COLORS.A, width: 1.5 } });
  slide.addText("競合より選ばれる差別的優位点", { x: M + 0.2, y: 1.75, w: W - M * 2 - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: COLORS.A, charSpacing: 4 });
  slide.addText(s.what || "—", { x: M + 0.2, y: 2.05, w: W - M * 2 - 0.4, h: 0.75, fontFace: F_BODY, fontSize: 20, bold: true, color: COLORS.ink, valign: "top" });

  // なぜ良いか / なぜ真似しづらいか
  const colW = (W - M * 2 - 0.4) / 2;
  const ny = 3.15;
  slide.addText("なぜそれが選ばれるのか", { x: M, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.A, bold: true });
  slide.addText(s.why_good || "—", { x: M, y: ny + 0.35, w: colW, h: 3.5, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top" });

  const rx = M + colW + 0.4;
  slide.addText("なぜ真似しづらいのか", { x: rx, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.A, bold: true });
  slide.addText(s.why_hard_to_copy || "—", { x: rx, y: ny + 0.35, w: colW, h: 3.5, fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top" });
}

function renderStrategyRecap(slide, s) {
  bg(slide, COLORS.ink);
  // 上部に小さく前置き
  slide.addText("ここまでの分析の結果として導かれる", { x: 0, y: 0.6, w: W, h: 0.3, fontFace: F_BODY, fontSize: 12, color: "AAAAAA", align: "center", charSpacing: 4 });
  slide.addText("戦略メッセージ", { x: 0, y: 0.95, w: W, h: 0.5, fontFace: F_HEAD, fontSize: 26, color: "FFFFFF", bold: true, align: "center" });
  // 戦略メッセージ本体
  slide.addText(s.strategyMessage || "—", {
    x: 1.0, y: 1.9, w: W - 2.0, h: 3.0,
    fontFace: F_HEAD, fontSize: 28, color: "FFFFFF", bold: true, align: "center", valign: "middle",
  });
  // B/A サブ
  if (s.benefitPart || s.advantagePart) {
    slide.addShape("line", { x: 2, y: 5.3, w: W - 4, h: 0, line: { color: "555555", width: 0.5 } });
    if (s.benefitPart) {
      slide.addText([
        { text: "B（Benefit）  ", options: { color: COLORS.B, bold: true, fontFace: F_MONO } },
        { text: s.benefitPart, options: { color: "EEEEEE", fontFace: F_BODY } },
      ], { x: 1.5, y: 5.5, w: W - 3, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
    }
    if (s.advantagePart) {
      slide.addText([
        { text: "A（Advantage）  ", options: { color: COLORS.A, bold: true, fontFace: F_MONO } },
        { text: s.advantagePart, options: { color: "EEEEEE", fontFace: F_BODY } },
      ], { x: 1.5, y: 6.05, w: W - 3, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
    }
  }
}

function renderCheckpoints(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "整合性チェック", COLORS.ink, "PART 3  ─  CHECKPOINTS");
  const items = s.items.slice(0, 5);
  const rowH = (H - 2.2) / Math.max(items.length, 1);
  items.forEach((c, i) => {
    const y = 1.7 + i * rowH;
    const statusColor = c.status === "ok" ? "0d9488" : c.status === "warn" ? "ea580c" : c.status === "ng" ? COLORS.B : COLORS.muted;
    slide.addShape("rect", { x: M, y, w: 0.9, h: rowH - 0.15, fill: { color: statusColor }, line: { color: statusColor } });
    slide.addText(c.statusLabel, { x: M, y, w: 0.9, h: rowH - 0.15, fontFace: F_BODY, fontSize: 12, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(c.label || "—", { x: M + 1.1, y, w: W - M * 2 - 1.1, h: 0.4, fontFace: F_BODY, fontSize: 15, bold: true, color: COLORS.ink });
    slide.addText(c.comment || "", { x: M + 1.1, y: y + 0.42, w: W - M * 2 - 1.1, h: rowH - 0.55, fontFace: F_BODY, fontSize: 13, color: COLORS.muted, valign: "top" });
  });
}

function renderImprove(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "ウェブサイト改善レポート", COLORS.A, "PART 4  ─  WEBSITE IMPROVEMENT");
  const cols = [
    { label: "追加すべきコンテンツ", items: s.contents, color: COLORS.A },
    { label: "改善すべきデザイン", items: s.design, color: COLORS.B },
    { label: "サイト構造の改善", items: s.structure, color: COLORS.C },
  ];
  const colW = (W - M * 2 - 0.4) / 3;
  cols.forEach((col, i) => {
    const x = M + i * (colW + 0.2);
    slide.addShape("rect", { x, y: 1.65, w: colW, h: 0.5, fill: { color: col.color }, line: { color: col.color } });
    slide.addText(col.label, { x, y: 1.65, w: colW, h: 0.5, fontFace: F_BODY, fontSize: 13, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    let y = 2.3;
    col.items.slice(0, 4).forEach((item, j) => {
      slide.addText(`${j + 1}. ${item.title}`, { x, y, w: colW, h: 0.4, fontFace: F_BODY, fontSize: 12, bold: true, color: COLORS.ink });
      y += 0.4;
      slide.addText(clip(item.reason, 80), { x, y, w: colW, h: 0.7, fontFace: F_BODY, fontSize: 10, color: COLORS.muted, valign: "top" });
      y += 0.85;
    });
  });
}

function renderNextActions(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "次のアクション", "ea580c", "STRATEGY ACTION");
  slide.addText("戦略指南 AI の「戦略アクション」では、確定した戦略をもとに10テーマで具体的な施策を検討できます。", { x: M, y: 1.65, w: W - M * 2, h: 0.6, fontFace: F_BODY, fontSize: 14, color: COLORS.muted, valign: "top" });
  const colW = (W - M * 2 - 0.4) / 2;
  s.themes.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + 0.4);
    const y = 2.5 + row * 1.0;
    slide.addShape("rect", { x, y, w: colW, h: 0.85, fill: { color: "FFF7ED" }, line: { color: "ea580c" } });
    slide.addText(t.label, { x: x + 0.2, y: y + 0.1, w: colW - 0.4, h: 0.35, fontFace: F_BODY, fontSize: 14, bold: true, color: "ea580c" });
    slide.addText(t.desc, { x: x + 0.2, y: y + 0.45, w: colW - 0.4, h: 0.35, fontFace: F_BODY, fontSize: 11, color: COLORS.ink });
  });
}

function renderAbout(slide, s) {
  bg(slide, COLORS.ink);
  slide.addText("戦略指南 AI", { x: 0, y: 2.5, w: W, h: 0.8, fontFace: F_HEAD, fontSize: 48, color: "FFFFFF", bold: true, align: "center" });
  slide.addText("AB3C で戦略を「分析 → 策定 → 実行」まで一気通貫", { x: 0, y: 3.4, w: W, h: 0.5, fontFace: F_BODY, fontSize: 18, color: "DDDDDD", align: "center" });
  slide.addText(s.description, { x: 2, y: 4.2, w: W - 4, h: 1.2, fontFace: F_BODY, fontSize: 14, color: "BBBBBB", align: "center", valign: "top" });
  slide.addText(s.siteUrl, { x: 0, y: 5.8, w: W, h: 0.5, fontFace: F_MONO, fontSize: 20, color: COLORS.A, align: "center", hyperlink: { url: `https://${s.siteUrl}` } });
}

const RENDERERS = {
  "cover": renderCover,
  "toc": renderToc,
  "analysis-target": renderAnalysisTarget,
  "framework": renderFramework,
  "section-divider": renderSectionDivider,
  "customer": renderCustomer,
  "competitor": renderCompetitor,
  "company": renderCompany,
  "benefit": renderBenefit,
  "advantage": renderAdvantage,
  "strategy-message-recap": renderStrategyRecap,
  "checkpoints": renderCheckpoints,
  "improve": renderImprove,
  "next-actions": renderNextActions,
  "about": renderAbout,
};

const NO_PAGE_NUMBER = new Set(["cover", "section-divider", "about"]);

export async function exportPptx({ slides, input, historyTitle }) {
  if (!slides?.length) throw new Error("スライドデータがありません");
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.title = `AB3C分析レポート - ${historyTitle || ""}`;
  pres.subject = "戦略指南 AI による AB3C 分析";
  pres.company = "戦略指南 AI";

  const siteName = (() => {
    if (!input) return "";
    if (input.startsWith("http")) {
      try { return new URL(input).hostname.replace(/^www\./, ""); } catch { return ""; }
    }
    return "";
  })();

  const total = slides.length;
  slides.forEach((s, i) => {
    const slide = pres.addSlide();
    const renderer = RENDERERS[s.type];
    if (renderer) renderer(slide, s);
    if (!NO_PAGE_NUMBER.has(s.type)) {
      addFooter(slide, i + 1, total, siteName);
    }
  });

  const fileName = buildFileBaseName({ input, historyTitle }) + ".pptx";
  await pres.writeFile({ fileName });
  return fileName;
}
