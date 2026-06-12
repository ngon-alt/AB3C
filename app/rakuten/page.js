"use client";
// 戦略指南 AI 楽天版（v1）
// 仕様: docs/楽天版-仕様書-v1.md
// 入力: 自社商品URL + カテゴリー大中小（ジャンルAPIでプルダウン・未設定時はテキスト入力） + 競合URL
// 出力: 三段の物語レポート（なぜ売れている → なぜ売れない → どうすればいいか）
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";

const C = {
  black: "#1a1a14",
  red: "#FF0000",
  blue: "#1a6fd4",
  phase1: "#0d9488",
  phase1Bg: "#a7e9e0",
  card: "#ffffff",
  bg: "#e8e8e8",
  highlight: "#fef3c7",
};

// 評価マーク（信号色。Benefit赤/Advantage青の専用色とは別系統）
const EVAL = {
  best: { mark: "◎", color: "#1b5e20", tint: "#d9ecda" },
  good: { mark: "◯", color: "#2e7d32", tint: "#e7f2e8" },
  mid: { mark: "△", color: "#a8770b", tint: "#f7eed3" },
  bad: { mark: "×", color: "#c62828", tint: "#f9e3e3" },
  none: { mark: "—", color: "#888", tint: "#f0f0f0" },
};
const verdictEval = (v) =>
  v === "突出している" ? EVAL.best : v === "勝っている" ? EVAL.good : v === "並んでいる" ? EVAL.mid : v === "負けている" ? EVAL.bad : EVAL.none;
const statusEval = (s) =>
  s === "整っている" ? EVAL.good : s === "まだ弱い" ? EVAL.mid : s === "見当たらない" ? EVAL.bad : EVAL.none;

const CAT_STORAGE_KEY = "rakuten_categories_default";
const MAX_COMPETITORS = 4;

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `エラーが発生しました（${res.status}）`);
  return data;
}

export default function RakutenPage() {
  const { data: session, status } = useSession();
  const [ownUrl, setOwnUrl] = useState("");
  const [cats, setCats] = useState({ large: "", mid: "", small: "" });
  const [compUrls, setCompUrls] = useState([""]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [meta, setMeta] = useState(null);

  // カテゴリーの店舗デフォルト保持（仕様書3-2。v1はlocalStorage、DB保存はv2）
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || "null");
      if (saved?.large || saved?.mid || saved?.small) setCats((c) => ({ ...c, ...saved }));
    } catch {}
  }, []);

  const log = (msg) => setProgress((p) => [...p, msg]);

  async function run() {
    setError("");
    setReport(null);
    setProgress([]);
    setRunning(true);
    try {
      localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(cats));

      log("自社商品ページとレビューを取得しています…");
      const ownData = await postJson("/api/rakuten/fetch", { url: ownUrl });
      log(`自社: ${ownData.title || ownUrl}（レビュー${ownData.reviewTotal}件を確認）`);

      const compList = compUrls.map((u) => u.trim()).filter(Boolean);
      const compData = [];
      for (let i = 0; i < compList.length; i++) {
        log(`競合${i + 1}の商品ページとレビューを取得しています…`);
        const d = await postJson("/api/rakuten/fetch", { url: compList[i] });
        log(`競合${i + 1}: ${d.title || compList[i]}（レビュー${d.reviewTotal}件を確認）`);
        compData.push(d);
      }

      log("自社のレビューとLPを分析しています…");
      const ownSum = await postJson("/api/rakuten/summarize", {
        label: ownData.title || "自社商品",
        isOwn: true,
        lpText: ownData.lpText,
        reviews: ownData.reviews,
      });
      const compSums = [];
      for (let i = 0; i < compData.length; i++) {
        log(`競合${i + 1}のレビューを分析しています…`);
        const s = await postJson("/api/rakuten/summarize", {
          label: compData[i].title || `競合${i + 1}`,
          isOwn: false,
          reviews: compData[i].reviews,
        });
        compSums.push(s);
      }

      log("全体を統合して、三段の物語レポートを作成しています…");
      const synth = await postJson("/api/rakuten/synthesize", {
        categories: cats,
        own: {
          label: ownData.title || "自社商品",
          reviewTotal: ownData.reviewTotal,
          ratingAverage: ownData.ratingAverage,
          summary: ownSum.summary,
        },
        competitors: compData.map((d, i) => ({
          label: d.title || `競合${i + 1}`,
          reviewTotal: d.reviewTotal,
          ratingAverage: d.ratingAverage,
          summary: compSums[i].summary,
        })),
      });

      setMeta({
        own: { label: ownData.title, reviewTotal: ownData.reviewTotal, ratingAverage: ownData.ratingAverage },
        competitors: compData.map((d) => ({
          label: d.title,
          reviewTotal: d.reviewTotal,
          ratingAverage: d.ratingAverage,
        })),
      });
      setReport(synth.report);
      log("完了しました。");
    } catch (e) {
      setError(e.message || "分析に失敗しました");
    } finally {
      setRunning(false);
    }
  }

  // 開発環境限定のレイアウト確認用デモ（/rakuten?demo=1）。本番ビルドでは無効
  const isDemo =
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1";
  if (isDemo && !report) {
    setReport(DEMO_REPORT);
    setMeta(DEMO_META);
  }

  if (status === "loading") return null;
  if (!session && !isDemo) {
    return (
      <main style={{ maxWidth: 720, margin: "60px auto", padding: 24, fontFamily: "var(--font-body)" }}>
        <h1 style={{ fontSize: 32 }}>戦略指南 AI 楽天版</h1>
        <p style={{ fontSize: 18, lineHeight: 1.8 }}>
          楽天市場の商品ページを競合と比較分析し、「売れている店はなぜ売れているのか」「自分はなぜ売れないのか」「では、どうすればいいのか」を一本の物語としてお届けします。
        </p>
        <p style={{ fontSize: 18 }}>ご利用にはログインが必要です。</p>
        <button
          onClick={() => signIn("google")}
          style={{ fontSize: 18, padding: "12px 28px", background: C.phase1, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          ログインして始める
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 80px", fontFamily: "var(--font-body)", color: "#000" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>戦略指南 AI 楽天版</h1>
      <p style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 8 }}>
        あなたの商品ページと競合のレビューを読み比べ、「売れている店はなぜ売れているのか」「自分はなぜ売れないのか」「では、どうすればいいのか」を分析します。
      </p>
      <p style={{ fontSize: 16, marginBottom: 28 }}>
        はじめての方は <a href="/rakuten/guide" style={{ color: C.phase1, fontWeight: 700 }}>分析の見方ガイド</a> をご覧ください。
      </p>

      {/* ===== 入力フォーム ===== */}
      <section style={{ background: C.card, borderRadius: 10, padding: 24, marginBottom: 28, border: `1px solid #ccc` }}>
        <h2 style={{ fontSize: 24, marginTop: 0 }}>1. あなたの商品ページ</h2>
        <input
          value={ownUrl}
          onChange={(e) => setOwnUrl(e.target.value)}
          placeholder="https://item.rakuten.co.jp/あなたの店舗/商品ページ/"
          style={inputStyle}
        />

        <h2 style={{ fontSize: 24 }}>2. カテゴリー（大・中・小）</h2>
        <p style={{ fontSize: 16, color: "#333", marginTop: 0 }}>
          あなたの商品が楽天市場のどの戦場にいるかを意識するための入力です。一度入力すると次回も自動で入ります。
        </p>
        <GenreSelector cats={cats} setCats={setCats} />

        <h2 style={{ fontSize: 24 }}>3. 競合の商品ページ（最大{MAX_COMPETITORS}件）</h2>
        <p style={{ fontSize: 16, color: "#333", marginTop: 0 }}>
          カテゴリーランキングで見える「比較したい相手」のURLを入れてください。今後、ランキングから候補を自動でお見せして選んでいただく方式に進化します（その際も自分で調べた競合を追加できます）。
        </p>
        {compUrls.map((u, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={u}
              onChange={(e) => setCompUrls((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={`競合${i + 1}のURL`}
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />
            {compUrls.length > 1 && (
              <button onClick={() => setCompUrls((arr) => arr.filter((_, j) => j !== i))} style={smallBtn}>
                削除
              </button>
            )}
          </div>
        ))}
        {compUrls.length < MAX_COMPETITORS && (
          <button onClick={() => setCompUrls((arr) => [...arr, ""])} style={smallBtn}>
            ＋ 競合を追加
          </button>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            onClick={run}
            disabled={running || !ownUrl.trim()}
            style={{
              fontSize: 20,
              padding: "14px 36px",
              background: running ? "#999" : C.phase1,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: running ? "default" : "pointer",
              fontWeight: 700,
            }}
          >
            {running ? "分析中…（2〜4分かかります）" : "分析を始める"}
          </button>
        </div>

        {progress.length > 0 && (
          <div style={{ marginTop: 18, background: C.phase1Bg, borderRadius: 8, padding: 16 }}>
            {progress.map((m, i) => (
              <div key={i} style={{ fontSize: 16, lineHeight: 1.9 }}>
                {i === progress.length - 1 && running ? "⏳ " : "✓ "}
                {m}
              </div>
            ))}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 18, background: "#fde8e8", borderRadius: 8, padding: 16, fontSize: 18 }}>
            {error}
          </div>
        )}
      </section>

      {report && <Report report={report} meta={meta} />}
    </main>
  );
}

// ===== カテゴリー選択（ジャンルAPIが使える場合はプルダウン、なければテキスト入力） =====
function GenreSelector({ cats, setCats }) {
  const [mode, setMode] = useState("loading"); // loading | select | text
  const [large, setLarge] = useState([]);
  const [mid, setMid] = useState([]);
  const [small, setSmall] = useState([]);

  const loadChildren = useCallback(async (genreId) => {
    const res = await fetch(`/api/rakuten/genres?genreId=${genreId}`);
    if (!res.ok) throw new Error("genres unavailable");
    const data = await res.json();
    return data.children || [];
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLarge(await loadChildren(0));
        setMode("select");
      } catch {
        setMode("text"); // アプリID未設定・API障害時はテキスト入力にフォールバック
      }
    })();
  }, [loadChildren]);

  if (mode === "loading") {
    return <p style={{ fontSize: 16, color: "#666" }}>カテゴリー一覧を読み込んでいます…</p>;
  }

  if (mode === "text") {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          ["large", "大カテゴリー（例: 食品）"],
          ["mid", "中カテゴリー（例: スイーツ・お菓子）"],
          ["small", "小カテゴリー（例: チーズケーキ）"],
        ].map(([k, ph]) => (
          <input
            key={k}
            value={cats[k]}
            onChange={(e) => setCats((c) => ({ ...c, [k]: e.target.value }))}
            placeholder={ph}
            style={{ ...inputStyle, flex: "1 1 240px" }}
          />
        ))}
      </div>
    );
  }

  const onPick = async (level, e) => {
    const opt = e.target.selectedOptions[0];
    const id = e.target.value;
    const name = opt ? opt.text : "";
    if (level === "large") {
      setCats((c) => ({ ...c, large: name, largeId: id, mid: "", midId: "", small: "", smallId: "" }));
      setMid(id ? await loadChildren(id).catch(() => []) : []);
      setSmall([]);
    } else if (level === "mid") {
      setCats((c) => ({ ...c, mid: name, midId: id, small: "", smallId: "" }));
      setSmall(id ? await loadChildren(id).catch(() => []) : []);
    } else {
      setCats((c) => ({ ...c, small: name, smallId: id }));
    }
  };

  const selStyle = { ...inputStyle, flex: "1 1 240px", marginBottom: 8 };
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <select value={cats.largeId || ""} onChange={(e) => onPick("large", e)} style={selStyle}>
        <option value="">大カテゴリーを選ぶ</option>
        {large.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <select value={cats.midId || ""} onChange={(e) => onPick("mid", e)} style={selStyle} disabled={!mid.length}>
        <option value="">中カテゴリーを選ぶ</option>
        {mid.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <select value={cats.smallId || ""} onChange={(e) => onPick("small", e)} style={selStyle} disabled={!small.length}>
        <option value="">小カテゴリーを選ぶ</option>
        {small.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  fontSize: 18,
  padding: "12px 14px",
  border: "2px solid #bbb",
  borderRadius: 6,
  background: C.highlight,
  marginBottom: 16,
  boxSizing: "border-box",
};

const smallBtn = {
  fontSize: 16,
  padding: "8px 16px",
  background: "#555",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

function SectionTitle({ no, title, lead }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 26, background: C.black, color: "#fff", padding: "14px 20px", borderRadius: 8, marginBottom: 12 }}>
        {no} {title}
      </h2>
      {lead && <p style={{ fontSize: 18, lineHeight: 1.9 }}>{lead}</p>}
    </div>
  );
}

// 各分析ブロックの「これは何の分析か」を説明する帯（フレームワークを知らない人向け）
function Explain({ children }) {
  return (
    <div style={{ background: "#f4f4f0", borderRadius: 6, padding: "12px 16px", marginBottom: 14, fontSize: 16, lineHeight: 1.8, color: "#333" }}>
      {children}
    </div>
  );
}

function Card({ title, children, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 20, marginBottom: 16, border: "1px solid #ddd", borderLeft: `6px solid ${accent || "#ddd"}` }}>
      {title && <h3 style={{ fontSize: 22, marginTop: 0, marginBottom: 12 }}>{title}</h3>}
      {children}
    </div>
  );
}

function List({ items }) {
  if (!items?.length) return <p style={{ fontSize: 18, color: "#555" }}>（該当なし）</p>;
  return (
    <ul style={{ paddingLeft: 22, margin: 0 }}>
      {items.map((t, i) => (
        <li key={i} style={{ fontSize: 18, lineHeight: 1.9 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

// ===== 価値サークル（二重丸・6分割のSVG図） =====
// 上半分=商品力の3軸、下半分=サービスの3軸（権さんの教える際のレイアウトに準拠）。
// highlight に軸名の配列を渡すと、その軸を青枠で強調する（根本治療との接続用）
function ValueCircle({ sixAxes, highlight = [], showLegend = true }) {
  // 9時の位置から時計回りに: 上半分（機能→デザイン→パッケージング）→ 下半分（購入前→購入中→購入後）
  const AXES = ["機能", "デザイン", "パッケージング", "購入前サービス", "購入中サービス", "購入後サービス"];
  const find = (name) => (sixAxes || []).find((a) => (a.axis || "").startsWith(name.slice(0, 3)));
  const isHl = (name) => highlight.some((h) => (h || "").startsWith(name.slice(0, 3)));
  const cx = 230, cy = 200, r1 = 70, r2 = 170;
  const segs = AXES.map((name, i) => {
    // 180度（9時の位置）から時計回りに60度ずつ → i=0..2が上半分、i=3..5が下半分
    const a0 = ((i * 60 + 180) * Math.PI) / 180;
    const a1 = (((i + 1) * 60 + 180) * Math.PI) / 180;
    const amid = (a0 + a1) / 2;
    const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0o, y0o] = p(r2, a0);
    const [x1o, y1o] = p(r2, a1);
    const [x0i, y0i] = p(r1, a0);
    const [x1i, y1i] = p(r1, a1);
    const d = `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${r2} ${r2} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${r1} ${r1} 0 0 0 ${x0i} ${y0i} Z`;
    const axisData = find(name);
    const ev = verdictEval(axisData?.verdict);
    const [lx, ly] = p((r1 + r2) / 2, amid);
    return { name, d, ev, lx, ly, hl: isHl(name) };
  });

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 460 440" style={{ maxWidth: 480, width: "100%" }} role="img" aria-label="価値サークル">
        {segs.map((s, i) => (
          <g key={i}>
            {/* 塗りは「強化を提案している軸」専用。評価はマーク（◎◯△×）だけで表現する */}
            <path d={s.d} fill={s.hl ? "#d8e6f8" : "#fff"} stroke="#999" strokeWidth="1.5" />
            <text x={s.lx} y={s.ly - 14} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: "#1a1a14" }}>
              {s.name.length > 5 ? s.name.replace("サービス", "") : s.name}
            </text>
            {s.name.includes("サービス") && (
              <text x={s.lx} y={s.ly + 3} textAnchor="middle" style={{ fontSize: 12, fill: "#555" }}>
                サービス
              </text>
            )}
            <text x={s.lx} y={s.ly + 30} textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: s.ev.color }}>
              {s.ev.mark}
            </text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={r1 - 4} fill="#fff" stroke="#999" strokeWidth="1.5" />
        {/* 水平線で二重円を貫通させ、上=商品ブロック・下=サービスブロックを示す */}
        <line x1={cx - r2} y1={cy} x2={cx + r2} y2={cy} stroke="#1a1a14" strokeWidth="2.5" />
        <text x={cx} y={cy - 18} textAnchor="middle" style={{ fontSize: 17, fontWeight: 700, fill: "#1a1a14" }}>
          商品
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" style={{ fontSize: 17, fontWeight: 700, fill: "#1a1a14" }}>
          サービス
        </text>
        <text x={cx} y={cy + r2 + 36} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: "#1a1a14" }}>
          価値サークル
        </text>
      </svg>
      {showLegend && (
        <p style={{ fontSize: 16, color: "#555", margin: "4px 0 0" }}>
          ◎=突出している　◯=勝っている　△=並んでいる　×=負けている　—=比較材料なし
        </p>
      )}
    </div>
  );
}

// ===== AB3C図（顧客・自社・競合の三角形 + B/A） =====
// C=黒・B=赤・A=青（AB3Cカラー固定ルール）
function AB3CDiagram({ ab3c }) {
  if (!ab3c) return null;
  // 三角形: 顧客=上、自社=右下、競合=左下
  const P = { customer: [230, 80], company: [370, 300], competitor: [90, 300] };
  const R = 52;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const mB = mid(P.customer, P.company); // B: 顧客⇔自社（提供する価値）
  const mB2 = mid(P.customer, P.competitor); // B: 顧客⇔競合（同じベネフィットを提供する者として比較される）
  const mA = mid(P.company, P.competitor); // A: 自社⇔競合（競合ではなく選ばれる理由＝差別的優位）
  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <svg viewBox="0 0 460 380" style={{ maxWidth: 460, width: "100%" }} role="img" aria-label="AB3C図">
          <line x1={P.customer[0]} y1={P.customer[1]} x2={P.company[0]} y2={P.company[1]} stroke="#888" strokeWidth="2" />
          <line x1={P.customer[0]} y1={P.customer[1]} x2={P.competitor[0]} y2={P.competitor[1]} stroke="#888" strokeWidth="2" />
          <line x1={P.company[0]} y1={P.company[1]} x2={P.competitor[0]} y2={P.competitor[1]} stroke="#888" strokeWidth="2" />
          {[
            ["customer", "顧客"],
            ["company", "自社"],
            ["competitor", "競合"],
          ].map(([k, label]) => (
            <g key={k}>
              <circle cx={P[k][0]} cy={P[k][1]} r={R} fill={C.black} />
              <text x={P[k][0]} y={P[k][1] + 7} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: "#fff" }}>
                {label}
              </text>
            </g>
          ))}
          {/* B: 顧客⇔自社（提供する価値）。右上の辺の外側 */}
          <g>
            <rect x={mB[0] + 14} y={mB[1] - 20} width={56} height={40} rx={6} fill={C.red} />
            <text x={mB[0] + 42} y={mB[1] + 7} textAnchor="middle" style={{ fontSize: 19, fontWeight: 700, fill: "#fff" }}>
              B
            </text>
          </g>
          {/* B: 顧客⇔競合（同じベネフィットを提供する者として比較される）。左上の辺の外側 */}
          <g>
            <rect x={mB2[0] - 70} y={mB2[1] - 20} width={56} height={40} rx={6} fill={C.red} />
            <text x={mB2[0] - 42} y={mB2[1] + 7} textAnchor="middle" style={{ fontSize: 19, fontWeight: 700, fill: "#fff" }}>
              B
            </text>
          </g>
          <g>
            <rect x={mA[0] - 28} y={mA[1] - 20} width={56} height={40} rx={6} fill={C.blue} />
            <text x={mA[0]} y={mA[1] + 7} textAnchor="middle" style={{ fontSize: 19, fontWeight: 700, fill: "#fff" }}>
              A
            </text>
          </g>
        </svg>
      </div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap", color: C.red }}>B ベネフィット</td>
            <td style={tdStyle}>{ab3c.benefit}</td>
          </tr>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap", color: C.blue }}>A アドバンテージ</td>
            <td style={tdStyle}>{ab3c.advantage}</td>
          </tr>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap" }}>顧客</td>
            <td style={tdStyle}>{ab3c.customer}</td>
          </tr>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap" }}>自社</td>
            <td style={tdStyle}>{ab3c.company}</td>
          </tr>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap" }}>競合</td>
            <td style={tdStyle}>{ab3c.competitor}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ===== 商品ページの語り方診断（縦長LPを7ブロックに見立てた図） =====
function SevenBlocks({ elements }) {
  return (
    <div>
      <p style={{ fontSize: 16, color: "#555", marginTop: 0 }}>
        縦長の商品ページを上から下へ、7つの語りのブロックに見立てて診断しています。上から順に読まれる物語の流れです。
      </p>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {(elements || []).map((e, i) => {
          const ev = statusEval(e.status);
          return (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "stretch", border: "2px solid #999", borderRadius: 8, overflow: "hidden", background: ev.tint }}>
                <div style={{ width: 64, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: ev.color, background: "#fff", borderRight: "2px solid #999", flexShrink: 0 }}>
                  {ev.mark}
                </div>
                <div style={{ padding: "10px 14px", flex: 1 }}>
                  <div style={{ fontSize: 19, fontWeight: 700 }}>
                    {i + 1}. {e.name}
                    <span style={{ fontSize: 16, fontWeight: 700, color: ev.color, marginLeft: 10 }}>{e.status}</span>
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.7, color: "#333" }}>{e.comment}</div>
                </div>
              </div>
              {i < (elements || []).length - 1 && (
                <div style={{ textAlign: "center", fontSize: 18, color: "#999", lineHeight: 1.2 }}>↓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Report({ report, meta }) {
  const s1 = report.story1 || {};
  const s2 = report.story2 || {};
  const s3 = report.story3 || {};

  return (
    <div>
      {report.wantsNote && (
        <Card accent={C.blue}>
          <p style={{ fontSize: 18, lineHeight: 1.9, margin: 0 }}>{report.wantsNote}</p>
        </Card>
      )}

      {meta && (
        <Card title="今回の比較対象">
          <Explain>
            今回読み込んだ商品の一覧です。レビュー件数そのものが「多くの人が選んでいる」という信頼のコンテンツであり、件数と★の組み合わせから各商品の選ばれ方が見えてきます（例: 件数が多いのに★が低い=売れているが不満も多い）。
          </Explain>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>商品</th>
                <th style={thStyle}>レビュー件数</th>
                <th style={thStyle}>平均★</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>自社</td>
                <td style={tdStyle}>{meta.own.label}</td>
                <td style={tdStyle}>{meta.own.reviewTotal}</td>
                <td style={tdStyle}>{meta.own.ratingAverage ?? "—"}</td>
              </tr>
              {meta.competitors.map((c, i) => (
                <tr key={i}>
                  <td style={tdStyle}>競合{i + 1}</td>
                  <td style={tdStyle}>{c.label}</td>
                  <td style={tdStyle}>{c.reviewTotal}</td>
                  <td style={tdStyle}>{c.ratingAverage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ===== 第一段 ===== */}
      <SectionTitle no="第一段" title="売れている店は、なぜ売れているのか" lead={s1.lead} />
      <Explain>
        この章は、競合商品のお客様レビューをAIが読み込み、繰り返し現れる特徴的な評価の言葉を抽出して比較したものです。お客様が自分の言葉で書き残した「選ばれる理由」が、ここに最も生々しく表れます。
      </Explain>
      <Card title="このカテゴリーの土俵（競合に共通する選ばれる理由）">
        <Explain>
          どの競合のレビューにも共通して現れる評価です。この土俵に乗れていないと、比較の出発点に立てません。
        </Explain>
        <List items={s1.commonReasons} />
      </Card>
      {(s1.perCompetitor || []).map((c, i) => (
        <Card key={i} title={`${c.label} の山（この店に固有の選ばれる理由）`}>
          <List items={c.reasons} />
        </Card>
      ))}

      {/* ===== 第二段 ===== */}
      <SectionTitle no="第二段" title="自分は、なぜ売れないのか" lead={s2.lead} />
      <Card title="訴求と評価のズレ" accent={C.red}>
        <Explain>
          あなたの商品ページ（LP）が「売りです」と訴えている内容と、あなたのお客様がレビューで実際に高く評価している内容を、AIが突き合わせた結果です。ここがずれていると、本当の魅力が伝わらないまま売り場に立っていることになります。逆に、お客様だけが知っている強みが見つかれば、それは伝えるだけで価値になります。
        </Explain>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ flex: "1 1 300px" }}>
            <h4 style={{ fontSize: 18, margin: "0 0 8px" }}>LPが訴求していること</h4>
            <List items={s2.zure?.lpClaims} />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <h4 style={{ fontSize: 18, margin: "0 0 8px" }}>お客様が実際に評価していること</h4>
            <List items={s2.zure?.customerPraise} />
          </div>
        </div>
        <h4 style={{ fontSize: 18, margin: "0 0 8px", color: C.red }}>ズレの指摘</h4>
        <List items={s2.zure?.gaps} />
      </Card>

      <Card title="価値サークルによる競合比較">
        <Explain>
          商品の価値を6つの軸（商品力: 機能・デザイン・パッケージング ／ サービス: 購入前・購入中・購入後）に分けて、競合との勝ち負けを見る図です。たとえばサービス側に×が並んでいれば「サービスで差をつけられている」ことが一目で分かります。仕入れ品で商品そのものを変えられなくても、サービスの3軸はあなた自身の工夫で強くできます。
        </Explain>
        <ValueCircle sixAxes={s2.sixAxes} />
        <table style={{ ...tableStyle, marginTop: 18 }}>
          <thead>
            <tr>
              <th style={thStyle}>価値の軸</th>
              <th style={thStyle}>あなたの状況</th>
              <th style={thStyle}>競合で最も強いところ</th>
              <th style={thStyle}>判定</th>
            </tr>
          </thead>
          <tbody>
            {(s2.sixAxes || []).map((a, i) => {
              const ev = verdictEval(a.verdict);
              return (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{a.axis}</td>
                  <td style={tdStyle}>{a.own}</td>
                  <td style={tdStyle}>{a.competitorBest}</td>
                  <td style={{ ...tdStyle, color: ev.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {ev.mark} {a.verdict}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="商品ページの語り方診断（7つの観点）">
        <Explain>
          売れる商品ページには「①お客様の悩みに共感する → ②何が得られるかを伝える → ③他社との違いを示す → ④信じられる証拠を見せる → ⑤使う場面を想像させる → ⑥不安を解消する → ⑦今買う理由を示す」という語りの流れがあります。あなたのページがこの流れで語れているかを診断しました。詳しくは<a href="/rakuten/guide" style={{ color: C.phase1, fontWeight: 700 }}>見方ガイド</a>へ。
        </Explain>
        <SevenBlocks elements={s2.sevenElements} />
      </Card>

      {/* ===== 第三段 ===== */}
      <SectionTitle no="第三段" title="では、どうすればいいのか" lead={s3.lead} />
      <Explain>
        処方は三歩です。まず<strong>戦略を絞る</strong>——誰のどんな価値に賭けるかを決める。次に<strong>対処療法</strong>——商品はそのままに「伝え方」を直す、今週から動ける改善。最後に<strong>根本治療</strong>——価値サークルの軸そのものを強くする、戦略レベルの改善。順番が大事です。絞らずに改善を始めると、どこにでもあるページに戻ってしまいます。
      </Explain>

      {s3.focus && (
        <Card title="どこに絞るか ── ターゲットとベネフィットの選択" accent={C.black}>
          <Explain>
            レビューとページから見えてきた「選ばれ方」の候補を比較し、戦略を一点に絞ります。市場は小さくなるように見えますが、絞ったほうが選ばれる理由は強く立ちます。絞った先の戦略をAB3C（顧客・自社・競合とベネフィット・アドバンテージ）の図で確認してください。
          </Explain>
          {(s3.focus.options || []).map((o, i) => (
            <div
              key={i}
              style={{
                border: o.chosen ? `3px solid ${C.black}` : "1px solid #ccc",
                borderRadius: 8,
                padding: 14,
                marginBottom: 10,
                background: o.chosen ? "#fffbe9" : "#fff",
              }}
            >
              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
                {o.chosen ? "★ ここに絞る： " : "案： "}
                {o.target} × {o.benefit}
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.8 }}>{o.reason}</div>
            </div>
          ))}
          <AB3CDiagram ab3c={s3.focus.ab3c} />
          {s3.focus.strategyMessage?.message && (
            <div style={{ background: C.black, color: "#fff", borderRadius: 8, padding: 20, marginTop: 8 }}>
              <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 6 }}>戦略メッセージ</div>
              <div style={{ fontSize: 22, lineHeight: 1.7, fontFamily: "var(--font-heading)" }}>
                {s3.focus.strategyMessage.message}
              </div>
              <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.8 }}>
                <span style={{ color: "#ff8080" }}>ベネフィット: {s3.focus.strategyMessage.benefit_part}</span>
                <br />
                <span style={{ color: "#8ab8f0" }}>アドバンテージ: {s3.focus.strategyMessage.advantage_part}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card title={`対処療法 ── ${s3.stage1?.title || "伝え方を変える（今すぐできる改善）"}`} accent={C.phase1}>
        <h4 style={{ fontSize: 20, margin: "0 0 4px" }}>あなたが重視すべき、お客様の比較ポイント</h4>
        <Explain>
          お客様がこのカテゴリーで商品を比べるときに見ている価値の軸を、レビューでの言及の多さと熱量から推定し、あなたが力を入れるべき順に並べたものです。
        </Explain>
        {(s3.stage1?.topPriorities || []).map((p, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.phase1, marginBottom: 4 }}>
              {p.rank ?? i + 1}位 {p.axis}
            </div>
            <div style={{ fontSize: 18, lineHeight: 1.8 }}>{p.why}</div>
          </div>
        ))}
        <h4 style={{ fontSize: 20, margin: "18px 0 8px" }}>訴求ポイントの再設定</h4>
        <List items={s3.stage1?.appealReset} />
        <h4 style={{ fontSize: 20, margin: "18px 0 8px" }}>コンテンツ増強の優先順位</h4>
        <List items={s3.stage1?.contentPriorities} />
      </Card>

      <Card title={`根本治療 ── ${s3.stage2?.title || "価値そのものを高める（戦略的な改善）"}`} accent={C.blue}>
        <Explain>
          伝え方ではなく、提供する価値そのものに手を入れる提案です。価値サークルの青く塗った軸を強くする、あるいは誰も立てていない新しい軸を立てる——時間はかかりますが、真似されにくい本物の強みになります。
        </Explain>
        <ValueCircle
          sixAxes={s2.sixAxes}
          highlight={(s3.stage2?.valueDevelopment || []).map((v) => v.axis)}
          showLegend={false}
        />
        <p style={{ fontSize: 16, color: "#555", textAlign: "center", marginTop: 0 }}>
          青い塗り＝これから強化を提案する軸
        </p>
        {(s3.stage2?.valueDevelopment || []).map((v, i) => (
          <div key={i} style={{ marginBottom: 14, borderLeft: `4px solid ${C.blue}`, paddingLeft: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>{v.axis} を強化する</div>
            <div style={{ fontSize: 18, lineHeight: 1.8 }}>{v.proposal}</div>
          </div>
        ))}
        <h4 style={{ fontSize: 20, margin: "18px 0 8px" }}>どの軸で戦うか（シナリオ）</h4>
        {(s3.stage2?.scenarios || []).map((sc, i) => (
          <div key={i} style={{ background: "#f4f7fb", borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{sc.name}</div>
            <div style={{ fontSize: 18, color: "#333", marginBottom: 6 }}>ターゲット: {sc.target}</div>
            <List items={sc.actions} />
          </div>
        ))}
        {s3.stage2?.newAxis?.name && (
          <div style={{ border: `2px solid ${C.blue}`, borderRadius: 8, padding: 16, marginTop: 14 }}>
            <div style={{ fontSize: 16, color: C.blue, fontWeight: 700, marginBottom: 4 }}>
              誰も載せていない新しい軸の提案
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{s3.stage2.newAxis.name}</div>
            <div style={{ fontSize: 18, lineHeight: 1.8 }}>{s3.stage2.newAxis.rationale}</div>
          </div>
        )}
      </Card>
    </div>
  );
}

// 開発環境のレイアウト確認専用のダミーデータ（本番では参照されない）
const DEMO_META = {
  own: { label: "（デモ）自家焙煎コーヒー豆 200g", reviewTotal: 48, ratingAverage: 4.3 },
  competitors: [
    { label: "（デモ）競合A スペシャルティコーヒー", reviewTotal: 1240, ratingAverage: 4.6 },
    { label: "（デモ）競合B 訳ありコーヒー大容量", reviewTotal: 3105, ratingAverage: 4.1 },
  ],
};
const DEMO_REPORT = {
  wantsNote: null,
  story1: {
    lead: "上位2商品のレビューを読み比べると、選ばれ方がはっきり分かれています。",
    commonReasons: ["焙煎日が新しく香りが立つ", "発送が早い"],
    perCompetitor: [
      { label: "（デモ）競合A", reasons: ["飲み比べセットで選ぶ楽しさ", "同梱の説明カードが丁寧"] },
      { label: "（デモ）競合B", reasons: ["圧倒的な容量単価", "リピート購入のしやすさ"] },
    ],
  },
  story2: {
    lead: "あなたのLPは「価格の手頃さ」を前面に出していますが、お客様が評価しているのは別の点です。",
    zure: {
      lpClaims: ["毎日飲める手頃な価格", "送料無料"],
      customerPraise: ["冷めても甘みが残る", "梱包が丁寧で香りが逃げない"],
      gaps: ["「手頃さ」を訴えているが、お客様は「冷めても甘い」という味の個性を評価しています"],
    },
    sixAxes: [
      { axis: "機能", own: "「冷めても甘い」という評価が突出して多い", competitorBest: "競合Aは香りの鮮度で評価", verdict: "突出している" },
      { axis: "デザイン", own: "言及なし", competitorBest: "競合Aのパッケージ写真が好評", verdict: "比較材料なし" },
      { axis: "パッケージング", own: "言及なし", competitorBest: "競合Aのギフト箱", verdict: "負けている" },
      { axis: "購入前サービス", own: "言及なし", competitorBest: "競合Aの選び方ガイド", verdict: "負けている" },
      { axis: "購入中サービス", own: "梱包の丁寧さへの言及が多い", competitorBest: "競合Aの説明カード同梱", verdict: "勝っている" },
      { axis: "購入後サービス", own: "言及なし", competitorBest: "目立った言及なし", verdict: "比較材料なし" },
    ],
    sevenElements: [
      { name: "ターゲットの悩み", status: "見当たらない", comment: "冒頭が商品スペックから始まっており、悩みへの共感がありません。" },
      { name: "ベネフィット", status: "まだ弱い", comment: "「おいしい」止まりで、何がどう良いのかが3秒で伝わりません。" },
      { name: "他社との違い", status: "まだ弱い", comment: "焙煎の意図という違いがあるのに語られていません。" },
      { name: "証拠（信頼コンテンツ)", status: "まだ弱い", comment: "レビューはあるがページ内で活かされていません。" },
      { name: "使用シーン", status: "見当たらない", comment: "飲む場面の描写がなく、情緒に届いていません。" },
      { name: "不安解消", status: "整っている", comment: "送料・配送日数はページ内で分かります。" },
      { name: "今買う理由", status: "見当たらない", comment: "今このページで買う理由が示されていません。" },
    ],
  },
  story3: {
    lead: "まず戦略を絞り、伝え方を直し、その上で価値そのものを高める順で進めましょう。",
    focus: {
      options: [
        {
          target: "家庭で毎日淹れる人",
          benefit: "冷めても甘い、毎日の一杯",
          reason: "レビューで最も熱量が高く、競合が誰も語っていない空白です。",
          chosen: true,
        },
        {
          target: "ギフトを探す人",
          benefit: "コーヒー好きに喜ばれる贈り物",
          reason: "市場は大きいものの、競合Aのギフト箱が強く、パッケージ投資が先に必要です。",
          chosen: false,
        },
      ],
      ab3c: {
        customer: "家庭で毎日コーヒーを淹れる30〜50代。マグカップでゆっくり飲むため、冷めてからの味に不満を持っている",
        company: "余韻と冷めた甘みを優先する焙煎を意図的に選択している自家焙煎店",
        competitor: "競合Aは香りの鮮度、競合Bは容量単価。どちらも「淹れたて」の世界で戦っている",
        benefit: "時間が経っても最後の一口までおいしい、毎日のコーヒー",
        advantage: "ピークの香りを譲り、冷めた甘みを取る焙煎設計（誰も語っていない軸）",
      },
      strategyMessage: {
        message: "（デモ）冷めても甘い、毎日の一杯。",
        benefit_part: "家庭で淹れる毎日のコーヒーがおいしくなる",
        advantage_part: "余韻と冷めた甘みを取る焙煎の意図的選択",
      },
    },
    stage1: {
      title: "伝え方を変える（今すぐできる改善）",
      topPriorities: [
        { rank: 1, axis: "味（冷めても甘い）", why: "レビューで最も繰り返される評価語であり、競合にない個性です。" },
        { rank: 2, axis: "梱包・鮮度", why: "購入中サービスへの好意的言及が多く、信頼の入口になっています。" },
        { rank: 3, axis: "価格", why: "土俵としては重要ですが、価格だけでは競合Bに勝てません。3番目に保ちます。" },
      ],
      appealReset: ["ファーストビューを「冷めても甘い」を軸に書き換える"],
      contentPriorities: ["焙煎の意図を語る開発ストーリーを追加する"],
    },
    stage2: {
      title: "価値そのものを高める（戦略的な改善）",
      valueDevelopment: [
        { axis: "購入前サービス", proposal: "好みの淹れ方診断のような、選ぶ前の相談コンテンツがあるとよいでしょう。" },
        { axis: "パッケージング", proposal: "「冷めても甘い」を体現する保温マグ同梱のギフトセットなど、戦略メッセージと一体のパッケージ開発が考えられます。" },
        { axis: "購入後サービス", proposal: "購入後1週間目に「冷めた一杯の楽しみ方」を届けるフォローメールで、リピートの入口を作れます。" },
      ],
      scenarios: [
        { name: "味の個性で戦う", target: "家庭で丁寧に淹れる30〜50代", actions: ["味の比較表を作る"] },
        { name: "ギフトで戦う", target: "コーヒー好きへの贈り物を探す人", actions: ["ギフト包装の写真を充実させる"] },
      ],
      newAxis: { name: "冷めてからの時間軸", rationale: "全商品が「淹れたて」を語る中で、誰も「冷めた後」を語っていません。" },
    },
  },
};

const tableStyle = { width: "100%", borderCollapse: "collapse", marginBottom: 12 };
const thStyle = { fontSize: 16, textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #999", background: "#f2f2f2" };
const tdStyle = { fontSize: 18, padding: "10px", borderBottom: "1px solid #ddd", verticalAlign: "top", lineHeight: 1.7 };
