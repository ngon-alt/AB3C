"use client";
// 戦略指南 AI 楽天版（v1）
// 仕様: docs/楽天版-仕様書-v1.md
// 入力: 自社商品URL + カテゴリー大中小 + 競合URL（v1は手入力。ランキングAPI接続後に自動提示へ）
// 出力: 三段の物語レポート（なぜ売れている → なぜ売れない → どうすればいいか）
import { useState, useEffect } from "react";
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

const CAT_STORAGE_KEY = "rakuten_categories_default";

// 競合は最大4件（レビュー取得・分析コストとのバランス。仕様書3-3）
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
  const [meta, setMeta] = useState(null); // 自社・競合の取得メタ情報（件数・★）

  // カテゴリーの店舗デフォルト保持（仕様書3-2。v1はlocalStorage、DB保存はv2）
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || "null");
      if (saved?.large || saved?.mid || saved?.small) setCats(saved);
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

      // ① 自社商品の取得
      log("自社商品ページとレビューを取得しています…");
      const ownData = await postJson("/api/rakuten/fetch", { url: ownUrl });
      log(`自社: ${ownData.title || ownUrl}（レビュー${ownData.reviewTotal}件を確認）`);

      // ② 競合の取得
      const compList = compUrls.map((u) => u.trim()).filter(Boolean);
      const compData = [];
      for (let i = 0; i < compList.length; i++) {
        log(`競合${i + 1}の商品ページとレビューを取得しています…`);
        const d = await postJson("/api/rakuten/fetch", { url: compList[i] });
        log(`競合${i + 1}: ${d.title || compList[i]}（レビュー${d.reviewTotal}件を確認）`);
        compData.push(d);
      }

      // ③ 商品ごとのレビュー分析（二段構えの一段目）
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

      // ④ 統合分析（二段構えの二段目）
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
      <p style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 28 }}>
        あなたの商品ページと競合のレビューを読み比べ、「売れている店はなぜ売れているのか」「自分はなぜ売れないのか」「では、どうすればいいのか」を分析します。
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

        <h2 style={{ fontSize: 24 }}>3. 競合の商品ページ（最大{MAX_COMPETITORS}件）</h2>
        <p style={{ fontSize: 16, color: "#333", marginTop: 0 }}>
          カテゴリーランキングで見える「比較したい相手」のURLを入れてください。ランキングからの自動提示は近日対応予定です。
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

      {/* ===== レポート ===== */}
      {report && <Report report={report} meta={meta} />}
    </main>
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

function Report({ report, meta }) {
  const s1 = report.story1 || {};
  const s2 = report.story2 || {};
  const s3 = report.story3 || {};
  const verdictColor = (v) =>
    v === "勝っている" ? C.blue : v === "負けている" ? C.red : "#555";

  return (
    <div>
      {report.wantsNote && (
        <Card accent={C.blue}>
          <p style={{ fontSize: 18, lineHeight: 1.9, margin: 0 }}>{report.wantsNote}</p>
        </Card>
      )}

      {/* 取得メタ */}
      {meta && (
        <Card title="今回の比較対象">
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
          <p style={{ fontSize: 16, color: "#555", marginBottom: 0 }}>
            レビュー件数そのものが「多くの人が選んでいる」という信頼のコンテンツです。件数と★の組み合わせから、各商品がどんな選ばれ方をしているかが見えてきます。
          </p>
        </Card>
      )}

      {/* ===== 第一段 ===== */}
      <SectionTitle no="第一段" title="売れている店は、なぜ売れているのか" lead={s1.lead} />
      <Card title="このカテゴリーの土俵（競合に共通する選ばれる理由）">
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

      <Card title="価値サークルによる競合比較（6軸＋共通項目）">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>価値の軸</th>
              <th style={thStyle}>自社</th>
              <th style={thStyle}>競合で最も強いところ</th>
              <th style={thStyle}>判定</th>
            </tr>
          </thead>
          <tbody>
            {(s2.sixAxes || []).map((a, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{a.axis}</td>
                <td style={tdStyle}>{a.own}</td>
                <td style={tdStyle}>{a.competitorBest}</td>
                <td style={{ ...tdStyle, color: verdictColor(a.verdict), fontWeight: 700 }}>{a.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="商品ページの語り方診断（7つの観点）">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>観点</th>
              <th style={thStyle}>診断</th>
              <th style={thStyle}>コメント</th>
            </tr>
          </thead>
          <tbody>
            {(s2.sevenElements || []).map((e, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap" }}>{e.name}</td>
                <td style={{ ...tdStyle, whiteSpace: "nowrap", color: e.status === "整っている" ? C.blue : e.status === "見当たらない" ? C.red : "#555", fontWeight: 700 }}>
                  {e.status}
                </td>
                <td style={tdStyle}>{e.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ===== 第三段 ===== */}
      <SectionTitle no="第三段" title="では、どうすればいいのか" lead={s3.lead} />

      <Card title={s3.stage1?.title || "今すぐやるべきこと（伝え方の改善）"} accent={C.phase1}>
        <h4 style={{ fontSize: 20, margin: "0 0 10px" }}>あなたが重視すべき、お客様の比較ポイント</h4>
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
        {s3.stage1?.strategyMessage?.message && (
          <div style={{ background: C.black, color: "#fff", borderRadius: 8, padding: 20, marginTop: 18 }}>
            <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 6 }}>戦略メッセージ</div>
            <div style={{ fontSize: 22, lineHeight: 1.7, fontFamily: "var(--font-heading)" }}>
              {s3.stage1.strategyMessage.message}
            </div>
            <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.8 }}>
              <span style={{ color: "#ff8080" }}>ベネフィット: {s3.stage1.strategyMessage.benefit_part}</span>
              <br />
              <span style={{ color: "#8ab8f0" }}>アドバンテージ: {s3.stage1.strategyMessage.advantage_part}</span>
            </div>
          </div>
        )}
      </Card>

      <Card title={s3.stage2?.title || "さらに本質的には（価値そのものを高める）"} accent={C.blue}>
        {(s3.stage2?.valueDevelopment || []).map((v, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>{v.axis}：</span>
            <span style={{ fontSize: 18, lineHeight: 1.8 }}>{v.proposal}</span>
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
      { axis: "機能", own: "「冷めても甘い」という評価が複数", competitorBest: "競合Aは香りの鮮度で圧倒", verdict: "並んでいる" },
      { axis: "購入中サービス", own: "梱包の丁寧さへの言及が多い", competitorBest: "競合Aの説明カード同梱", verdict: "負けている" },
    ],
    sevenElements: [
      { name: "ターゲットの悩み", status: "見当たらない", comment: "冒頭が商品スペックから始まっており、悩みへの共感がありません。" },
      { name: "ベネフィット", status: "まだ弱い", comment: "「おいしい」止まりで、何がどう良いのかが3秒で伝わりません。" },
    ],
  },
  story3: {
    lead: "まず伝え方を直し、その上で価値そのものを高める二段階で進めましょう。",
    stage1: {
      title: "今すぐやるべきこと（伝え方の改善）",
      topPriorities: [
        { rank: 1, axis: "味（冷めても甘い）", why: "レビューで最も繰り返される評価語であり、競合にない個性です。" },
        { rank: 2, axis: "梱包・鮮度", why: "購入中サービスへの好意的言及が多く、信頼の入口になっています。" },
      ],
      appealReset: ["ファーストビューを「冷めても甘い」を軸に書き換える"],
      contentPriorities: ["焙煎の意図を語る開発ストーリーを追加する"],
      strategyMessage: {
        message: "（デモ）冷めても甘い、毎日の一杯。",
        benefit_part: "家庭で淹れる毎日のコーヒーがおいしくなる",
        advantage_part: "余韻と冷めた甘みを取る焙煎の意図的選択",
      },
    },
    stage2: {
      title: "さらに本質的には（価値そのものを高める）",
      valueDevelopment: [{ axis: "購入前サービス", proposal: "好みの淹れ方診断のような、選ぶ前の相談コンテンツがあるとよいでしょう。" }],
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
