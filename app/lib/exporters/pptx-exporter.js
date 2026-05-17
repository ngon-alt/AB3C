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
  // 権さん 2026-05-15:
  // - 提案書だと一目で分かるよう、レポート識別子を最上部に
  // - 「戦略メッセージ」ラベルはメッセージ本体のすぐ近くに
  // - 下部に差出人欄を設ける

  // === TOP: レポート識別子 ===
  slide.addText(`${s.siteName}　|　AB3C 分析レポート`, {
    x: 0, y: 0.45, w: W, h: 0.5,
    fontFace: F_HEAD, fontSize: 22, color: "FFFFFF", bold: true, align: "center",
  });
  slide.addText("AB3C  ANALYSIS  REPORT", {
    x: 0, y: 1.0, w: W, h: 0.3,
    fontFace: F_MONO, fontSize: 11, color: "FFFFFF", align: "center", charSpacing: 10,
  });
  slide.addShape("line", { x: 3, y: 1.45, w: W - 6, h: 0, line: { color: "FFFFFF", width: 0.5 } });

  // === MIDDLE: 戦略メッセージ（ラベル＋本体を近接配置） ===
  slide.addText("── 戦略メッセージ ──", {
    x: 0, y: 1.9, w: W, h: 0.3,
    fontFace: F_BODY, fontSize: 13, color: "FFFFFF", align: "center", charSpacing: 4,
  });
  const msg = s.strategyMessage || "（戦略メッセージ未生成）";
  slide.addText(msg, {
    x: 1.0, y: 2.3, w: W - 2.0, h: 2.5,
    fontFace: F_HEAD, fontSize: 28, color: "FFFFFF", bold: true, align: "center", valign: "middle",
    paraSpaceAfter: 6, lineSpacingMultiple: 1.5, shrinkText: true,
  });
  // B / A サブコメント（あれば）— B/A だけ意味のある色を残す
  if (s.benefitPart || s.advantagePart) {
    const yBase = 5.0;
    if (s.benefitPart) {
      slide.addText([
        { text: "B  ", options: { color: COLORS.B, bold: true, fontFace: F_MONO } },
        { text: clip(s.benefitPart, 80), options: { color: "FFFFFF", fontFace: F_BODY } },
      ], { x: 1.5, y: yBase, w: W - 3, h: 0.4, fontSize: 13, align: "center" });
    }
    if (s.advantagePart) {
      slide.addText([
        { text: "A  ", options: { color: COLORS.A, bold: true, fontFace: F_MONO } },
        { text: clip(s.advantagePart, 80), options: { color: "FFFFFF", fontFace: F_BODY } },
      ], { x: 1.5, y: yBase + 0.45, w: W - 3, h: 0.4, fontSize: 13, align: "center" });
    }
  }

  // === BOTTOM: 差出人欄 ===
  slide.addShape("line", { x: 3, y: 6.3, w: W - 6, h: 0, line: { color: "FFFFFF", width: 0.5 } });
  slide.addText("発  行", {
    x: 0, y: 6.4, w: W, h: 0.25,
    fontFace: F_MONO, fontSize: 10, color: "FFFFFF", align: "center", charSpacing: 8,
  });
  slide.addText(s.issuer || "戦略指南 AI / senryaku.ai", {
    x: 0, y: 6.65, w: W, h: 0.35,
    fontFace: F_BODY, fontSize: 14, color: "FFFFFF", align: "center",
  });
  slide.addText(s.date, {
    x: 0, y: 7.05, w: W, h: 0.3,
    fontFace: F_MONO, fontSize: 10, color: "FFFFFF", align: "center", charSpacing: 4,
  });
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
  // 権さん 2026-05-18: 見出し（desc）を大きく、改行することで収まるようにする。
  // 13pt にして desc に明示的な \n を入れて 2 行構成にする。
  // ） が単独で次行に落ちる現象は、手動改行で確実に回避できる。
  const chips = [
    { letter: "C", label: "Customer / Competitor / Company", desc: "顧客・競合・自社の\n3つのCで現状を把握", color: COLORS.C },
    { letter: "B", label: "Benefit", desc: "お客様が求める価値\n（ニーズ→ウォンツ）", color: COLORS.B },
    { letter: "A", label: "Advantage", desc: "競合より選ばれる\n差別的優位点", color: COLORS.A },
  ];
  const chipY = 1.55;
  const chipH = 1.35;
  const chipW = (W - M * 2 - 0.4) / 3;
  chips.forEach((c, i) => {
    const x = M + i * (chipW + 0.2);
    slide.addShape("rect", { x, y: chipY, w: 0.9, h: chipH, fill: { color: c.color }, line: { color: c.color } });
    slide.addText(c.letter, { x, y: chipY, w: 0.9, h: chipH, fontFace: F_HEAD, fontSize: 48, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(c.label, { x: x + 1.0, y: chipY + 0.05, w: chipW - 1.0, h: 0.3, fontFace: F_MONO, fontSize: 10, color: COLORS.muted, charSpacing: 3 });
    slide.addText(c.desc, { x: x + 1.0, y: chipY + 0.35, w: chipW - 1.0, h: chipH - 0.4, fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top", lineSpacingMultiple: 1.35, bold: true });
  });
  // 説明文
  slide.addText(s.description, {
    x: M, y: 3.1, w: W - M * 2, h: 1.5,
    fontFace: F_BODY, fontSize: 14, color: COLORS.ink, valign: "top",
    paraSpaceAfter: 6, lineSpacingMultiple: 1.7,
  });
  slide.addText(s.orderNote || "", {
    x: M, y: 4.65, w: W - M * 2, h: 0.5,
    fontFace: F_BODY, fontSize: 12, color: COLORS.muted, italic: true, lineSpacingMultiple: 1.6,
  });
  // 関連リソース（権さん 2026-05-15: 著書と協会を併載）
  // 注: テキストラン内ハイパーリンク（addText の配列形式に hyperlink を混在）は
  // 一部の PowerPoint で「コンテンツに問題が見つかりました」破損警告の原因になるため、
  // ラベルとリンクを別々の addText に分け、リンクは要素全体に適用する（権さん指摘 2026-05-15）。
  slide.addShape("line", { x: M, y: 5.4, w: W - M * 2, h: 0, line: { color: COLORS.border, width: 0.5 } });
  slide.addText("関連リソース", {
    x: M, y: 5.5, w: W - M * 2, h: 0.3,
    fontFace: F_MONO, fontSize: 11, color: COLORS.muted, charSpacing: 4,
  });
  const labelW = 2.0;
  if (s.relatedBook) {
    slide.addText("関連書籍：", {
      x: M, y: 5.85, w: labelW, h: 0.35,
      fontFace: F_BODY, fontSize: 13, color: COLORS.ink, bold: true,
    });
    const bookLabel = `『${s.relatedBook.title}』${s.relatedBook.author ? "　" + s.relatedBook.author : ""}`;
    slide.addText(bookLabel, {
      x: M + labelW, y: 5.85, w: W - M * 2 - labelW, h: 0.35,
      fontFace: F_BODY, fontSize: 13, color: COLORS.A, bold: true,
      hyperlink: { url: s.relatedBook.url },
    });
  }
  if (s.relatedAssociation) {
    slide.addText("関連団体：", {
      x: M, y: 6.3, w: labelW, h: 0.35,
      fontFace: F_BODY, fontSize: 13, color: COLORS.ink, bold: true,
    });
    slide.addText(s.relatedAssociation.name, {
      x: M + labelW, y: 6.3, w: W - M * 2 - labelW, h: 0.35,
      fontFace: F_BODY, fontSize: 13, color: COLORS.A, bold: true,
      hyperlink: { url: s.relatedAssociation.url },
    });
  }
}

function renderSectionDivider(slide, s) {
  // color2 がある場合（PART 2 = 戦略の核）は背景を左右で2色分割（権さん 2026-05-15）。
  // 赤と青の両方が等しく適切なため、左 = color（B 赤）、右 = color2（A 青）で表現する。
  if (s.color2) {
    slide.addShape("rect", { x: 0, y: 0, w: W / 2, h: H, fill: { color: s.color }, line: { color: s.color } });
    slide.addShape("rect", { x: W / 2, y: 0, w: W / 2, h: H, fill: { color: s.color2 }, line: { color: s.color2 } });
  } else {
    bg(slide, s.color);
  }
  // 中央に大きく章番号と章タイトル — すべて白文字
  slide.addText(`PART  ${s.num}`, { x: 0, y: 2.4, w: W, h: 0.5, fontFace: F_MONO, fontSize: 18, color: "FFFFFF", align: "center", charSpacing: 10 });
  slide.addText(s.title, { x: 0, y: 3.0, w: W, h: 1.0, fontFace: F_HEAD, fontSize: 60, color: "FFFFFF", bold: true, align: "center" });
  slide.addText(s.subtitle, { x: 0, y: 4.2, w: W, h: 0.5, fontFace: F_BODY, fontSize: 18, color: "FFFFFF", align: "center" });
  // 装飾ライン
  slide.addShape("rect", { x: W / 2 - 1.5, y: 5.4, w: 3, h: 0.08, fill: { color: "FFFFFF" } });
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
  slide.addText(s.target || "—", { x: leftX, y: 1.95, w: leftW, h: 0.8, fontFace: F_BODY, fontSize: 18, bold: true, color: COLORS.ink, valign: "top", lineSpacingMultiple: 1.5 });

  slide.addText("プロファイル", { x: leftX, y: 2.95, w: leftW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.muted });
  if (s.profile.length) {
    // 権さん 2026-05-17: 折り返し時に "・" の位置にぶら下がり字下げを効かせる。
    // pptxgenjs の bullet を使うと自動的にハンギングインデントが付き、リスト先頭が明確になる。
    slide.addText(s.profile.map(p => ({ text: p, options: { bullet: { type: "bullet", code: "30FB" } } })), {
      x: leftX, y: 3.25, w: leftW, h: 3.5,
      fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top", paraSpaceAfter: 6, lineSpacingMultiple: 1.6,
    });
  }

  // 右カラム: 市場規模・購買ステージ・絞り込み条件
  // 権さん 2026-05-18: 見出し小さく・本文大きすぎる・余白広い → 見出しを大きく、本文を小さく、余白を詰める
  const rightX = leftX + leftW + 0.4;
  const rightW = W - M - rightX;
  slide.addShape("rect", { x: rightX, y: 1.65, w: rightW, h: 5.45, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
  let y = 1.85;
  const block = (label, value) => {
    if (!value) return;
    // 見出しを 11pt → 13pt bold（プロミネンス UP）
    slide.addText(label, { x: rightX + 0.2, y, w: rightW - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 13, bold: true, color: COLORS.ink });
    y += 0.32;
    // 本文を 14pt → 11pt（余白詰め）
    slide.addText(value, { x: rightX + 0.2, y, w: rightW - 0.4, h: 0.6, fontFace: F_BODY, fontSize: 11, color: COLORS.muted, valign: "top", lineSpacingMultiple: 1.3, shrinkText: true });
    y += 0.7;
  };
  block("購買ステージ", s.stage);
  block("市場規模（SAM）", s.market.sam);
  block("市場規模（SOM）", s.market.som);
  block("成長性", s.market.growth);
  block("絞り込み条件", s.cutoff);
}

// 競合エントリを「社名」「（説明）」「URL」の3パーツに分解する。
// 入力例:
//   "株式会社船井総合研究所（中小企業向け総合コンサル・業種特化型）｜https://www.funaisoken.co.jp/"
//   → { name: "株式会社船井総合研究所", desc: "中小企業向け総合コンサル・業種特化型", url: "https://www.funaisoken.co.jp/" }
// オブジェクト形式 { name, desc, url } もそのまま受け付ける。
// 末尾が "（...）" で閉じていない場合は desc を取らず全体を name とする（誤マッチ回避）。
function parseCompetitor(c) {
  if (typeof c !== "string") {
    return {
      name: c?.name || JSON.stringify(c),
      desc: c?.desc || c?.description || "",
      url: c?.url || "",
    };
  }
  let url = "";
  let rest = c;
  const urlMatch = c.match(/[｜|]\s*(https?:\/\/\S+)\s*$/);
  if (urlMatch) {
    url = urlMatch[1];
    rest = c.slice(0, urlMatch.index).trim();
  }
  let name = rest;
  let desc = "";
  // 末尾が （...） で閉じる場合のみ desc として切り出す
  const descMatch = rest.match(/^(.+?)（(.+?)）\s*$/);
  if (descMatch) {
    name = descMatch[1].trim();
    desc = descMatch[2].trim();
  }
  return { name, desc, url };
}

// 競合リストを「社名 / 　（説明） / 　URL」の3行構造のパラグラフ配列に変換。
// 権さん 2026-05-18: bullet が PPT で正しく描画されずリスト先頭が分からなくなったため、
// 構造化された3行レイアウトで視認性を確保する方針。
//   - 社名: bold、インデントなし
//   - 説明: 半角スペース1個分のインデント + 灰色
//   - URL: 全角スペース1個分のインデント + 青色
function competitorParas(items) {
  const paras = [];
  items.forEach((c, idx) => {
    const p = parseCompetitor(c);
    paras.push({ text: p.name, options: { bold: true, breakLine: true } });
    if (p.desc) {
      paras.push({ text: " （" + p.desc + "）", options: { color: COLORS.muted, breakLine: true } });
    }
    if (p.url) {
      paras.push({ text: "　" + p.url, options: { color: COLORS.A, fontSize: 10, breakLine: true } });
    }
    // エントリ間に視覚的ブランク（小フォントの空行）
    if (idx < items.length - 1) {
      paras.push({ text: " ", options: { fontSize: 6, breakLine: true } });
    }
  });
  return paras;
}

function renderCompetitor(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "競合（Competitor）", COLORS.C, "PART 1  ─  COMPETITOR");
  const colW = (W - M * 2 - 0.4) / 2;
  // 直接競合
  slide.addText("直接競合", { x: M, y: 1.65, w: colW, h: 0.4, fontFace: F_BODY, fontSize: 14, bold: true, color: COLORS.ink });
  slide.addShape("rect", { x: M, y: 2.05, w: colW, h: 4.8, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
  if (s.direct.length) {
    slide.addText(competitorParas(s.direct), {
      x: M + 0.2, y: 2.2, w: colW - 0.4, h: 4.6,
      fontFace: F_BODY, fontSize: 12, color: COLORS.ink, valign: "top",
      lineSpacingMultiple: 1.3, shrinkText: true,
    });
  } else {
    slide.addText("—", { x: M + 0.2, y: 2.2, w: colW - 0.4, h: 0.4, fontFace: F_BODY, fontSize: 13, color: COLORS.muted });
  }
  // 間接競合
  const rx = M + colW + 0.4;
  slide.addText("間接競合", { x: rx, y: 1.65, w: colW, h: 0.4, fontFace: F_BODY, fontSize: 14, bold: true, color: COLORS.ink });
  slide.addShape("rect", { x: rx, y: 2.05, w: colW, h: 4.8, fill: { color: COLORS.paper }, line: { color: COLORS.border } });
  if (s.indirect.length) {
    slide.addText(competitorParas(s.indirect), {
      x: rx + 0.2, y: 2.2, w: colW - 0.4, h: 4.6,
      fontFace: F_BODY, fontSize: 12, color: COLORS.ink, valign: "top",
      lineSpacingMultiple: 1.3, shrinkText: true,
    });
  } else {
    slide.addText("—", { x: rx + 0.2, y: 2.2, w: colW - 0.4, h: 0.4, fontFace: F_BODY, fontSize: 13, color: COLORS.muted });
  }
}

function renderCompany(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "自社（Company）", COLORS.C, "PART 1  ─  COMPANY");
  // 権さん 2026-05-18（再々）:
  // - ラベルを「強み / 仕組み / 価値観」に変更（app/page.js のUI表記に揃える）
  // - 見出しを強く（mono 13pt muted → sans 16pt bold ink、ジャンプ率と視認性 UP）
  // - 本文を二回り小さく（16pt → 12pt、ジャンプ率拡大）
  // 強み（リスト・上半分）
  slide.addText("強み", { x: M, y: 1.5, w: W - M * 2, h: 0.4, fontFace: F_BODY, fontSize: 16, bold: true, color: COLORS.ink });
  if (s.strength.length) {
    slide.addText(s.strength.map(t => ({ text: t, options: { bullet: { type: "bullet", code: "30FB" } } })), {
      x: M, y: 1.95, w: W - M * 2, h: 1.85,
      fontFace: F_BODY, fontSize: 12, color: COLORS.ink, valign: "top",
      paraSpaceAfter: 2, lineSpacingMultiple: 1.35, shrinkText: true,
    });
  }
  // 仕組み（中段）— 旧 "体制"
  slide.addText("仕組み", { x: M, y: 3.85, w: W - M * 2, h: 0.4, fontFace: F_BODY, fontSize: 16, bold: true, color: COLORS.ink });
  slide.addText(s.structure || "—", {
    x: M, y: 4.3, w: W - M * 2, h: 1.5,
    fontFace: F_BODY, fontSize: 12, color: COLORS.ink, valign: "top",
    lineSpacingMultiple: 1.35, shrinkText: true,
  });
  // 価値観（下段）— 旧 "パッション"。権さん 2026-05-18: italic 解除
  slide.addText("価値観", { x: M, y: 5.85, w: W - M * 2, h: 0.4, fontFace: F_BODY, fontSize: 16, bold: true, color: COLORS.ink });
  slide.addText(s.passion || "—", {
    x: M, y: 6.3, w: W - M * 2, h: 0.85,
    fontFace: F_BODY, fontSize: 12, color: COLORS.ink, valign: "top",
    lineSpacingMultiple: 1.35, shrinkText: true,
  });
}

function renderBenefit(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "ベネフィット（Benefit）", COLORS.B, "PART 2  ─  BENEFIT");
  // コアベネフィット（赤帯のカード）— 高さ可変、長文オーバーフロー対策で 2.2in 確保＋shrinkText
  const cardH = 2.2;
  slide.addShape("rect", { x: M, y: 1.65, w: W - M * 2, h: cardH, fill: { color: "FFF5F5" }, line: { color: COLORS.B, width: 1.5 } });
  slide.addText("お客様が求めるコア価値", { x: M + 0.2, y: 1.78, w: W - M * 2 - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: COLORS.B, charSpacing: 4 });
  slide.addText(s.core || "—", {
    x: M + 0.25, y: 2.1, w: W - M * 2 - 0.5, h: cardH - 0.55,
    fontFace: F_BODY, fontSize: 18, bold: true, color: COLORS.ink, valign: "top",
    lineSpacingMultiple: 1.5, shrinkText: true,
  });

  // needs / wants の2カラム
  const colW = (W - M * 2 - 0.4) / 2;
  const ny = 1.65 + cardH + 0.3;
  slide.addText("ニーズ（顕在化前の必要性）", { x: M, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.B, bold: true });
  if (s.needs.length) {
    // 権さん 2026-05-17: 折り返し時のハンギングインデントを効かせる
    slide.addText(s.needs.map(t => ({ text: t, options: { bullet: { type: "bullet", code: "30FB" } } })),
      { x: M, y: ny + 0.35, w: colW, h: H - ny - 0.85, fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top", paraSpaceAfter: 6, lineSpacingMultiple: 1.6 });
  }
  const rx = M + colW + 0.4;
  slide.addText("ウォンツ（具体的な欲求）", { x: rx, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.B, bold: true });
  if (s.wants.length) {
    slide.addText(s.wants.map(t => ({ text: t, options: { bullet: { type: "bullet", code: "30FB" } } })),
      { x: rx, y: ny + 0.35, w: colW, h: H - ny - 0.85, fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top", paraSpaceAfter: 6, lineSpacingMultiple: 1.6 });
  }
}

function renderAdvantage(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "アドバンテージ（Advantage）", COLORS.A, "PART 2  ─  ADVANTAGE");
  // 何が優位か（青帯のカード）— 長文オーバーフロー対策で 2.5in 確保＋shrinkText
  // 権さん 2026-05-15: そもそも Advantage が長すぎる傾向にあるが、レイアウトとしても受けられるようにする
  const cardH = 2.5;
  slide.addShape("rect", { x: M, y: 1.65, w: W - M * 2, h: cardH, fill: { color: "F2F8FF" }, line: { color: COLORS.A, width: 1.5 } });
  slide.addText("競合より選ばれる差別的優位点", { x: M + 0.2, y: 1.78, w: W - M * 2 - 0.4, h: 0.3, fontFace: F_BODY, fontSize: 11, color: COLORS.A, charSpacing: 4 });
  slide.addText(s.what || "—", {
    x: M + 0.25, y: 2.1, w: W - M * 2 - 0.5, h: cardH - 0.55,
    fontFace: F_BODY, fontSize: 18, bold: true, color: COLORS.ink, valign: "top",
    lineSpacingMultiple: 1.5, shrinkText: true,
  });

  // なぜ良いか / なぜ真似しづらいか
  const colW = (W - M * 2 - 0.4) / 2;
  const ny = 1.65 + cardH + 0.3;
  slide.addText("なぜそれが選ばれるのか", { x: M, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.A, bold: true });
  slide.addText(s.why_good || "—", { x: M, y: ny + 0.35, w: colW, h: H - ny - 0.85, fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top", lineSpacingMultiple: 1.6 });

  const rx = M + colW + 0.4;
  slide.addText("なぜ真似しづらいのか", { x: rx, y: ny, w: colW, h: 0.3, fontFace: F_BODY, fontSize: 12, color: COLORS.A, bold: true });
  slide.addText(s.why_hard_to_copy || "—", { x: rx, y: ny + 0.35, w: colW, h: H - ny - 0.85, fontFace: F_BODY, fontSize: 13, color: COLORS.ink, valign: "top", lineSpacingMultiple: 1.6 });
}

function renderStrategyRecap(slide, s) {
  bg(slide, COLORS.ink);
  // 黒背景の通常テキストは白で統一（権さん 2026-05-15）。
  slide.addText("ここまでの分析の結果として導かれる", { x: 0, y: 0.6, w: W, h: 0.3, fontFace: F_BODY, fontSize: 12, color: "FFFFFF", align: "center", charSpacing: 4 });
  slide.addText("戦略メッセージ", { x: 0, y: 0.95, w: W, h: 0.5, fontFace: F_HEAD, fontSize: 26, color: "FFFFFF", bold: true, align: "center" });
  // 戦略メッセージ本体
  slide.addText(s.strategyMessage || "—", {
    x: 1.0, y: 1.9, w: W - 2.0, h: 3.0,
    fontFace: F_HEAD, fontSize: 28, color: "FFFFFF", bold: true, align: "center", valign: "middle",
    lineSpacingMultiple: 1.5,
  });
  // B/A サブ — B/A だけ意味のある色を残す
  if (s.benefitPart || s.advantagePart) {
    slide.addShape("line", { x: 2, y: 5.3, w: W - 4, h: 0, line: { color: "FFFFFF", width: 0.5 } });
    if (s.benefitPart) {
      slide.addText([
        { text: "B（Benefit）  ", options: { color: COLORS.B, bold: true, fontFace: F_MONO } },
        { text: s.benefitPart, options: { color: "FFFFFF", fontFace: F_BODY } },
      ], { x: 1.5, y: 5.5, w: W - 3, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
    }
    if (s.advantagePart) {
      slide.addText([
        { text: "A（Advantage）  ", options: { color: COLORS.A, bold: true, fontFace: F_MONO } },
        { text: s.advantagePart, options: { color: "FFFFFF", fontFace: F_BODY } },
      ], { x: 1.5, y: 6.05, w: W - 3, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
    }
  }
}

function renderCheckpoints(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "品質チェック", COLORS.ink, "PART 3  ─  CHECKPOINTS");
  // 権さん 2026-05-18: 見出しも本文も大きく、本文は特に他の本文と同程度に。
  // ステータスバッジ 14pt、ラベル 15pt bold、コメント 11pt（他ページ body の標準サイズ）。
  // 利用可能領域を上方拡張して 5項目分の余白を確保。
  const items = s.items.slice(0, 5);
  // topY を 1.7 → 1.5 に上げて、footer 手前まで使う領域を 5.3 → 5.5in に拡張
  const topY = 1.5;
  const bottomY = H - 0.4;
  const rowH = (bottomY - topY) / Math.max(items.length, 1);
  items.forEach((c, i) => {
    const y = topY + i * rowH;
    const statusColor = c.status === "ok" ? "0d9488" : c.status === "warn" ? "ea580c" : c.status === "ng" ? COLORS.B : COLORS.muted;
    slide.addShape("rect", { x: M, y, w: 0.9, h: rowH - 0.12, fill: { color: statusColor }, line: { color: statusColor } });
    slide.addText(c.statusLabel, { x: M, y, w: 0.9, h: rowH - 0.12, fontFace: F_BODY, fontSize: 14, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(c.label || "—", { x: M + 1.1, y, w: W - M * 2 - 1.1, h: 0.4, fontFace: F_BODY, fontSize: 15, bold: true, color: COLORS.ink, valign: "middle" });
    // コメントは他ページ本文と同じ 11pt。shrinkText で長文時の自動縮小。
    slide.addText(c.comment || "", {
      x: M + 1.1, y: y + 0.42, w: W - M * 2 - 1.1, h: rowH - 0.56,
      fontFace: F_BODY, fontSize: 11, color: COLORS.muted, valign: "top",
      lineSpacingMultiple: 1.3, shrinkText: true,
    });
  });
}

// 改善レポート 1カテゴリの 1ページ分（最大3項目）。
// 権さん 2026-05-15 フィードバック:
// - 文字が詰まって項目同士が重なる → 1スライドあたり最大3項目に制限（build-slides でページネーション済み）
// - 「冒頭しか示されていない、全体を見せて」→ 全項目分のスライドを生成
function renderImproveSection(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, s.categoryLabel, COLORS.exec, "PART 4  ─  WEBSITE IMPROVEMENT");
  slide.addText(s.categorySubtitle || "", { x: M, y: 1.5, w: W - M * 2, h: 0.3, fontFace: F_BODY, fontSize: 13, color: COLORS.muted });

  const items = s.items;
  if (items.length === 0) {
    slide.addText("（このカテゴリの提案はありません）", { x: M, y: 2.0, w: W - M * 2, h: 0.5, fontFace: F_BODY, fontSize: 15, color: COLORS.muted });
    return;
  }

  // 縦方向の利用可能領域（フッターまで）。
  // 権さん 2026-05-17: build-slides.js の MAX_PER_SLIDE = 2 を前提に、
  // rowH は常に「2項目時の高さ」で固定する。1項目だけのページ（5項目を 2/2/1 で割った最後の頁）も
  // 同じレイアウトで上揃え表示し、下に余白を残す。`usable / items.length` だと 1項目時に縦に伸びて
  // 理由と実装例の間に大きな空白が生まれていた。
  const topY = 1.95;
  const bottomY = H - 0.55;
  const usable = bottomY - topY;
  const MAX_PER_SLIDE = 2;
  const rowH = usable / MAX_PER_SLIDE;
  const startNum = s.itemNumberStart || 1;

  items.forEach((item, j) => {
    const y = topY + j * rowH;
    // 権さん 2026-05-17: 項目見出しを 15pt → 21pt（二回り拡大）。
    // 番号バッジ・本文の y 位置を見出しの高さ拡張に合わせて再配置。
    const titleH = 0.75;
    const innerH = rowH - titleH + 0.05;
    // 番号バッジ（見出しと中央揃え。バッジサイズも 0.55 → 0.65 に拡大）
    slide.addShape("rect", { x: M, y: y + 0.05, w: 0.65, h: 0.65, fill: { color: COLORS.exec }, line: { color: COLORS.exec } });
    slide.addText(String(startNum + j), { x: M, y: y + 0.05, w: 0.65, h: 0.65, fontFace: F_HEAD, fontSize: 22, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    // タイトル
    slide.addText(item.title || "", {
      x: M + 0.85, y: y, w: W - M * 2 - 0.85, h: titleH,
      fontFace: F_BODY, fontSize: 21, bold: true, color: COLORS.ink, valign: "middle",
    });
    // 理由
    if (item.reason) {
      slide.addText([
        { text: "理由：", options: { bold: true, color: COLORS.exec } },
        { text: item.reason, options: { color: COLORS.muted } },
      ], {
        x: M + 0.85, y: y + titleH + 0.05, w: W - M * 2 - 0.85, h: (innerH - 0.1) / 2,
        fontFace: F_BODY, fontSize: 12, valign: "top",
        lineSpacingMultiple: 1.6, shrinkText: true,
      });
    }
    // 実装例（理由と同じ高さで下半分に配置。タイトル拡大に合わせて y を再計算）
    if (item.example) {
      const halfH = (innerH - 0.1) / 2;
      slide.addText([
        { text: "実装例：", options: { bold: true, color: COLORS.exec } },
        { text: item.example, options: { color: COLORS.muted } },
      ], {
        x: M + 0.85, y: y + titleH + 0.05 + halfH + 0.05, w: W - M * 2 - 0.85, h: halfH,
        fontFace: F_BODY, fontSize: 12, valign: "top",
        lineSpacingMultiple: 1.6, shrinkText: true,
      });
    }
  });
}

// ビジュアルモック（改善後ファーストビュー）スライド。
// 渡された HTML を html2canvas で 1920×1080 画像化したものを imageDataUrl として持っている前提。
// 画像の準備は exportPptx の前処理（preRenderVisualMocks）で行う。
function renderVisualMock(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "改善後のファーストビュー・イメージ", COLORS.exec, "PART 4  ─  VISUAL MOCKUP");
  if (s.imageDataUrl) {
    // 16:9 アスペクト比に近い形で配置。中央寄せ。
    const imgW = W - M * 2;
    const imgH = imgW * (9 / 16);
    // sizing は w/h と二重指定になり破損警告の原因になり得るため省略（権さん指摘 2026-05-15）。
    slide.addImage({ data: s.imageDataUrl, x: M, y: 1.65, w: imgW, h: imgH });
    if (s.caption) {
      slide.addShape("rect", { x: M, y: 1.65 + imgH + 0.15, w: W - M * 2, h: 0.7, fill: { color: COLORS.paper }, line: { color: COLORS.exec, width: 1 } });
      slide.addText([
        { text: "💡 このビジュアルの意図：", options: { bold: true, color: COLORS.exec } },
        { text: s.caption, options: { color: COLORS.ink } },
      ], {
        x: M + 0.2, y: 1.65 + imgH + 0.2, w: W - M * 2 - 0.4, h: 0.6,
        fontFace: F_BODY, fontSize: 13, valign: "top", lineSpacingMultiple: 1.5,
      });
    }
  } else {
    slide.addText("（ビジュアル画像を準備できませんでした）", { x: M, y: 3, w: W - M * 2, h: 0.5, fontFace: F_BODY, fontSize: 14, color: COLORS.muted, align: "center" });
  }
}

function renderNextActions(slide, s) {
  bg(slide, COLORS.bg);
  pageHeader(slide, "次のアクション", "ea580c", "STRATEGY ACTION");
  // 権さん 2026-05-16: 2x2 グリッドだと縦方向が狭く、4テーマのカテゴリで説明が重なった。
  // 4カラム並列レイアウトに変更し、各カラムで縦方向に余裕を持って 2段（名前/説明）表示する。
  const description = s.description || "戦略指南 AI の「戦略アクション」では、確定した戦略をもとに10テーマで具体的な施策を検討できます。";
  slide.addText(description, { x: M, y: 1.55, w: W - M * 2, h: 0.5, fontFace: F_BODY, fontSize: 13, color: COLORS.muted, valign: "top", lineSpacingMultiple: 1.6 });

  const groups = s.groups || [];
  const numCols = Math.min(groups.length, 4);
  const colGap = 0.2;
  const colW = (W - M * 2 - colGap * (numCols - 1)) / numCols;
  const gridTopY = 2.15;
  const headerH = 0.55;
  // 権さん 2026-05-17: 縦に長すぎる問題を修正。
  // cellH を「最長カラム」の中身に合わせて計算し、全カラム同じ高さで揃える。
  // 1テーマあたり 0.85in（名前 + 説明 + 余白）、上下パディング合計 0.3in。
  const itemH = 0.85;
  const bodyPadding = 0.3;
  const maxThemes = Math.max(...groups.slice(0, numCols).map(g => (g.themes || []).length), 1);
  const cellH = headerH + bodyPadding + maxThemes * itemH;

  groups.slice(0, numCols).forEach((g, i) => {
    const x = M + i * (colW + colGap);
    const y = gridTopY;

    // ヘッダー（オレンジ帯）— 権さん 2026-05-17: テーマ数バッジは折り返すため削除。
    slide.addShape("rect", { x, y, w: colW, h: headerH, fill: { color: "ea580c" }, line: { color: "ea580c" } });
    slide.addText(g.label, { x: x + 0.15, y, w: colW - 0.3, h: headerH, fontFace: F_HEAD, fontSize: 15, bold: true, color: "FFFFFF", align: "center", valign: "middle" });

    // ボディ（薄オレンジ）
    slide.addShape("rect", { x, y: y + headerH, w: colW, h: cellH - headerH, fill: { color: "FFF7ED" }, line: { color: "ea580c", width: 0.5 } });

    // テーマリスト（縦並び・各テーマは「名前」太字＋「説明」グレー小の2段）
    const themes = g.themes || [];
    const bodyTop = y + headerH + 0.15;

    themes.forEach((t, j) => {
      const ty = bodyTop + j * itemH;
      // テーマ名
      slide.addText([
        { text: "・", options: { color: "ea580c", bold: true } },
        { text: t.name, options: { color: COLORS.ink, bold: true } },
      ], {
        x: x + 0.15, y: ty, w: colW - 0.3, h: 0.32,
        fontFace: F_BODY, fontSize: 12,
      });
      // 説明
      if (t.desc) {
        slide.addText(t.desc, {
          x: x + 0.35, y: ty + 0.35, w: colW - 0.5, h: itemH - 0.4,
          fontFace: F_BODY, fontSize: 9, color: COLORS.muted,
          valign: "top", lineSpacingMultiple: 1.35,
        });
      }
    });
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
  "improve-section": renderImproveSection,
  "visual-mock": renderVisualMock,
  "next-actions": renderNextActions,
  "about": renderAbout,
};

const NO_PAGE_NUMBER = new Set(["cover", "section-divider", "about"]);

// ビジュアルモックの HTML を html2canvas でレンダリングして画像 data URL を返す。
// PPTX / PDF 両方で使えるよう、共通の前処理として export 前に呼ぶ。
export async function preRenderVisualMocks(slides) {
  const visualSlides = slides.filter(s => s.type === "visual-mock" && s.html);
  if (visualSlides.length === 0) return;
  const html2canvasMod = await import("html2canvas");
  const html2canvas = html2canvasMod.default || html2canvasMod;

  for (const s of visualSlides) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:-99999px;top:0;width:1920px;height:1080px;overflow:hidden;background:#ffffff;";
    wrap.innerHTML = s.html;
    document.body.appendChild(wrap);
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const canvas = await html2canvas(wrap, { width: 1920, height: 1080, scale: 1, backgroundColor: "#ffffff", useCORS: true, logging: false });
      s.imageDataUrl = canvas.toDataURL("image/jpeg", 0.88);
    } catch (e) {
      console.warn("visual mock の画像化に失敗:", e);
      s.imageDataUrl = null;
    } finally {
      document.body.removeChild(wrap);
    }
  }
}

export async function exportPptx({ slides, input, historyTitle }) {
  if (!slides?.length) throw new Error("スライドデータがありません");
  // ビジュアルモック画像を先に準備（HTML を canvas 化 → JPEG）
  await preRenderVisualMocks(slides);
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
