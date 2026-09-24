"use client";

// 新規事業版 戦略指南 — 画面本体
//
// 正典: docs/新規事業版-画面遷移設計-20260924.md
// 流れ: ①トップ → ③ヒアリング → ④まとめの確認 → ⑤分析中 → ⑥レポート
//
// 混線防止（0-2章）: このファイルは新規事業版だけのもの。現行版の app/page.js には触れない。
// データは /api/newbiz/* 経由でのみ読み書きし、そちら側で kind='newbiz' に固定している。

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";

/* ===== 色（AB3C の意味を持つ色は他の用途に使わない） ===== */
const C = {
  B: "#FF0000",      // ベネフィット
  A: "#1a6fd4",      // アドバンテージ
  C3: "#1a1a14",     // 3C
  phase: "#0d9488",  // 戦略策定フェーズ
  phaseBg: "#e6f4f2",
  line: "#c9c9c9",
  lineSoft: "#e2e2e2",
  page: "#f4f4f2",
  surface: "#f8f8f6",
  card: "#e8e8e8",
  ink: "#000000",
  sub: "#4a4a4a",
  highlight: "#fef3c7",
};
const FB = "var(--font-body, system-ui, -apple-system, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', Meiryo, sans-serif)";
const FH = "'Noto Serif JP', serif";

const yen = (n) => Number(n || 0).toLocaleString("ja-JP");

/* ===== 小さな部品 ===== */
function Btn({ children, onClick, kind = "main", disabled, style, title }) {
  const base = {
    fontFamily: FB, fontSize: 18, padding: "11px 22px", border: "none",
    borderRadius: 3, cursor: disabled ? "not-allowed" : "pointer", lineHeight: 1.4,
  };
  const kinds = {
    main: { background: disabled ? "#c9c9c9" : C.phase, color: disabled ? "#6b6b6b" : "#fff" },
    gray: { background: disabled ? "#c9c9c9" : "#555", color: "#fff" },
    outline: { background: "#fff", color: C.ink, border: `1px solid ${C.line}` },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      style={{ ...base, ...kinds[kind], ...style }}>{children}</button>
  );
}

function Card({ title, color, children, style }) {
  return (
    <div style={{ background: C.card, padding: "18px 22px", marginBottom: 12, ...style }}>
      {title && <h4 style={{ fontFamily: FB, fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: color || C.ink }}>{title}</h4>}
      <div style={{ fontSize: 18, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function SecLabel({ color, jp, en }) {
  return (
    <div style={{ fontFamily: FH, fontSize: 24, paddingLeft: 14, margin: "28px 0 12px", borderLeft: `8px solid ${color}`, color }}>
      {jp}
      {en && <small style={{ display: "block", fontFamily: FB, fontSize: 16, fontWeight: 400, color: C.sub }}>{en}</small>}
    </div>
  );
}

function UL({ items }) {
  if (!items || !items.length) return null;
  return <ul style={{ margin: "6px 0 0", paddingLeft: "1.3em" }}>{items.map((x, i) => <li key={i} style={{ marginBottom: 5 }}>{x}</li>)}</ul>;
}

function Badge({ status }) {
  const m = { ok: [C.phase, "○"], warn: ["#b8860b", "△"], ng: [C.B, "×"] };
  const [bg, ch] = m[status] || m.warn;
  return <span style={{ width: 28, height: 28, borderRadius: "50%", background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flex: "0 0 28px" }}>{ch}</span>;
}

/* ===== 本体 ===== */
export default function NewbizPage() {
  const { data: session, status } = useSession();
  const [stage, setStage] = useState("top"); // top / hearing / summary / analyzing / report
  const [balance, setBalance] = useState(null);
  const [costs, setCosts] = useState({ analyze_standard: 10000, chat: 100, reanalyze: 1000 });
  const [trialPoints, setTrialPoints] = useState(12700);
  const [showTrialNotice, setShowTrialNotice] = useState(false);

  const [businessId, setBusinessId] = useState(null);
  const [siteName, setSiteName] = useState("（名称未設定）");
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [summaryItems, setSummaryItems] = useState([]);
  const [inputText, setInputText] = useState("");
  const [openItem, setOpenItem] = useState(1);
  const [editing, setEditing] = useState(null);

  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [comboId, setComboId] = useState(null);
  const [error, setError] = useState("");

  const chatEnd = useRef(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  /* --- 残高 --- */
  const loadBalance = useCallback(async () => {
    try {
      const r = await fetch("/api/newbiz/points");
      if (!r.ok) return;
      const d = await r.json();
      setBalance(d.balance);
      if (d.costs) setCosts(d.costs);
      if (d.trialPoints) setTrialPoints(d.trialPoints);
    } catch (e) { /* 残高が出ないだけ。操作は止めない */ }
  }, []);

  useEffect(() => { if (session) loadBalance(); }, [session, loadBalance]);

  // はじめてのお知らせ（お試し未使用・未ログインの人に一度だけ）
  useEffect(() => {
    if (status === "loading") return;
    if (session) return;
    try {
      if (!localStorage.getItem("newbiz_trial_notice")) setShowTrialNotice(true);
    } catch (e) { /* 保存領域が使えなくても画面は出す */ }
  }, [status, session]);

  const closeTrialNotice = () => {
    setShowTrialNotice(false);
    try { localStorage.setItem("newbiz_trial_notice", "1"); } catch (e) {}
  };

  /* --- はじめる --- */
  const start = async () => {
    if (!session) { signIn("google", { callbackUrl: "/newbiz?start=1" }); return; }
    setBusy(true); setError("");
    try {
      await fetch("/api/newbiz/points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "trial" }) });
      const r = await fetch("/api/newbiz/business", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "事業をつくれませんでした");
      setBusinessId(d.business.id);
      setStage("hearing");
      await loadBalance();
      await askAI([], d.business.id);
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  // ログインから戻ってきたら、そのままヒアリングを始める
  useEffect(() => {
    if (status !== "authenticated") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("start") === "1" && stage === "top" && !businessId) {
      window.history.replaceState({}, "", "/newbiz");
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  /* --- ヒアリングの往復 --- */
  const askAI = async (history, bid) => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/newbiz/hearing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, businessId: bid || businessId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "応答できませんでした");
      const next = [...history, { role: "assistant", content: d.reply }];
      setMessages(next);
      setStep(d.step);
      await saveHearing(next, d.step, d.complete, bid);
      if (d.complete) await makeSummary(next, bid);
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const send = async () => {
    const t = input.trim();
    if (!t || busy) return;
    const next = [...messages, { role: "user", content: t }];
    setMessages(next); setInput("");
    await askAI(next);
  };

  const saveHearing = async (msgs, st, complete, bid) => {
    try {
      await fetch("/api/newbiz/business", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", id: bid || businessId, hearing: { messages: msgs, step: st, complete } }),
      });
    } catch (e) { /* 保存に失敗しても対話は続けられる */ }
  };

  /* --- まとめ --- */
  const makeSummary = async (msgs, bid) => {
    setBusy(true);
    try {
      const r = await fetch("/api/newbiz/hearing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, mode: "summary", businessId: bid || businessId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "まとめを作れませんでした");
      setSummaryItems(d.items || []);
      setInputText(d.inputText || "");
      if (d.siteName) setSiteName(d.siteName);
      setStage("summary");
      await fetch("/api/newbiz/business", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", id: bid || businessId, siteName: d.siteName, inputText: d.inputText }),
      });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const rebuildInputText = (items) =>
    items.map(it => `【${it.no}. ${it.label}】${it.title || ""}\n${it.body || ""}`).join("\n\n");

  const editBody = (no, body) => {
    const items = summaryItems.map(it => it.no === no ? { ...it, body } : it);
    setSummaryItems(items);
    setInputText(rebuildInputText(items));
  };

  const totalChars = summaryItems.reduce((s, it) => s + (it.body || "").length, 0);

  /* --- 分析 --- */
  const runAnalysis = async () => {
    const cost = costs.analyze_standard;
    setError(""); setStage("analyzing"); setProgress(1);
    let ref = null;
    try {
      // ① 先に引く
      const sp = await fetch("/api/newbiz/points", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spend", feature: "analyze_standard", businessId }),
      });
      const spd = await sp.json();
      if (!sp.ok) {
        setStage("summary");
        setError(sp.status === 402
          ? `ポイントが足りません。この分析には ${yen(spd.required)} ポイント必要ですが、残りは ${yen(spd.balance)} ポイントです。`
          : (spd.error || "ポイントを使えませんでした"));
        return;
      }
      ref = spd.ref;
      setBalance(spd.balance);
      setProgress(2);

      // ② 既存の分析エンジンをそのまま使う（テキスト入力の口）
      const ar = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputText }),
      });
      const ad = await ar.json();
      if (!ar.ok) throw new Error(ad.error || "分析できませんでした");
      setProgress(4);

      // ③ ナラティブ
      let nar = "";
      try {
        const nr = await fetch("/api/newbiz/narrative", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: ad, inputText, businessId }),
        });
        const nd = await nr.json();
        nar = nd.narrative || "";
      } catch (e) { /* ナラティブが無くてもレポートは出す */ }

      const withNar = { ...ad, narrative: nar };
      setAnalysis(withNar); setNarrative(nar);
      setComboId(Array.isArray(ad.combinations) && ad.combinations.length ? (ad.recommended_combination_id ?? ad.combinations[0].id) : null);
      setProgress(5);
      setStage("report");

      await fetch("/api/newbiz/business", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", id: businessId, analysis: withNar }),
      });
      await loadBalance();
    } catch (e) {
      // ④ 失敗したら元の束に戻す
      if (ref) {
        try {
          const rr = await fetch("/api/newbiz/points", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "refund", ref }),
          });
          const rd = await rr.json();
          if (rd.balance !== undefined) setBalance(rd.balance);
        } catch (e2) { /* 戻せなかった場合は管理画面から手当てする */ }
      }
      setStage("summary");
      setError((e.message || "分析できませんでした") + "　ポイントは戻しました。");
    }
  };

  /* ===== 表示 ===== */
  const combos = Array.isArray(analysis?.combinations) ? analysis.combinations : [];
  const combo = combos.find(c => c.id === comboId) || combos[0] || null;
  const view = combo || analysis || {};
  const ben = view.benefit || analysis?.benefit || {};
  const adv = view.advantage || analysis?.advantage || {};
  const cust = view.customer || analysis?.three_c?.customer || {};
  const comp = view.competitor || analysis?.three_c?.competitor || {};
  const core = analysis?.company_core || {};
  const company = analysis?.three_c?.company || {};
  const sm = view.strategy_message || analysis?.strategy_message || {};
  const cps = view.checkpoints || analysis?.checkpoints || [];
  const score = cps.reduce((a, c) => a + (c.status === "ok" ? 2 : c.status === "warn" ? 1 : 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: FB, fontSize: 18, color: C.ink }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 22px", background: "#fff", borderBottom: `1px solid ${C.lineSoft}`, flexWrap: "wrap" }}>
        <div style={{ fontFamily: FH, fontSize: 22, fontWeight: 700 }}>
          （サービス名）
          <small style={{ display: "block", fontFamily: FB, fontSize: 16, fontWeight: 400, color: C.sub }}>
            {stage === "report" || stage === "summary" ? siteName : "AIと一緒に、新規事業をつくる"}
          </small>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 16, flexWrap: "wrap" }}>
          {session && balance !== null && (
            <span style={{ border: `1px solid ${C.line}`, padding: "5px 12px", background: "#fff", whiteSpace: "nowrap" }}>
              残り <b style={{ fontSize: 18 }}>{yen(balance)}</b> ポイント
            </span>
          )}
          {session ? <span style={{ color: C.sub }}>{session.user?.name} さん</span>
            : <Btn kind="outline" style={{ fontSize: 16, padding: "8px 16px" }} onClick={() => signIn("google", { callbackUrl: "/newbiz?start=1" })}>ログイン</Btn>}
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 1240, margin: "14px auto 0", padding: "12px 18px", background: "#fff", borderLeft: `5px solid ${C.B}`, fontSize: 18 }}>
          {error}
        </div>
      )}

      {/* ===== ① トップ ===== */}
      {stage === "top" && (
        <div style={{ maxWidth: 1240, margin: "14px auto 40px", background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ padding: "54px 58px 42px" }}>
            <h1 style={{ fontFamily: FH, fontSize: 40, margin: "0 0 18px", lineHeight: 1.4 }}>
              AIと一緒に、<br />新規事業をつくる。
            </h1>
            <p style={{ fontSize: 20, maxWidth: 820, margin: "0 0 26px", lineHeight: 1.9 }}>
              インタビューと市場調査から、新規事業の戦略を立てます。そのままマーケティングのウェブサイトを生成し、その後のマーケティングのアクションまで支援します。一般論を並べるのではありません。まずあなたの話を聞くところから始めます。
            </p>
            <Btn onClick={start} disabled={busy} style={{ fontSize: 20, padding: "15px 34px" }}>
              {busy ? "準備しています…" : "無料ではじめる"}
            </Btn>
            <div style={{ fontSize: 16, color: C.sub, marginTop: 8 }}>
              お試しで {yen(trialPoints)}ポイント（{yen(trialPoints)}円相当）。登録は、お話を伺う直前で結構です。
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: `1px solid ${C.line}`, margin: "32px 0 0" }}>
              {[
                ["01", "ヒアリング", "AIが5つのことを順に伺います。まとまっていなくて構いません。"],
                ["02", "調査分析", "競合と市場を調べます。あなたの構想が通用するかを確かめます。"],
                ["03", "戦略立案", "戦略が文章になり、ウェブサイトのイメージまで出ます。"],
                ["04", "実行・アクション支援", "社名・営業資料・検索対策・プレスリリースまで。"],
              ].map(([n, t, d], i) => (
                <div key={n} style={{ padding: 20, borderRight: i < 3 ? `1px solid ${C.line}` : "none" }}>
                  <div style={{ fontFamily: FH, fontSize: 16, color: C.phase, letterSpacing: ".1em", marginBottom: 6 }}>{n}</div>
                  <h3 style={{ fontFamily: FH, fontSize: 20, margin: "0 0 8px" }}>{t}</h3>
                  <p style={{ margin: 0, fontSize: 18, color: C.sub }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ①-2 はじめてのお知らせ ===== */}
      {showTrialNotice && stage === "top" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,20,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 }}>
          <div style={{ background: "#fff", maxWidth: 660, width: "100%", padding: "34px 38px", border: `1px solid ${C.line}` }}>
            <h2 style={{ fontFamily: FH, fontSize: 28, margin: "0 0 12px" }}>お試しで {yen(trialPoints)}ポイント（{yen(trialPoints)}円相当）</h2>
            <p style={{ margin: 0 }}>はじめての方に、無料でお渡ししています。これだけのことができます。</p>
            <ul style={{ margin: "14px 0 24px", paddingLeft: "1.3em" }}>
              <li style={{ marginBottom: 6 }}>戦略の分析 1回（{yen(costs.analyze_standard)}ポイント）</li>
              <li style={{ marginBottom: 6 }}>成果物 2本（各1,000ポイント）— 社名の案、営業資料など</li>
              <li style={{ marginBottom: 6 }}>チャットで相談 7往復（各{yen(costs.chat)}ポイント）</li>
            </ul>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Btn onClick={() => { closeTrialNotice(); start(); }}>はじめる</Btn>
              <Btn kind="outline" onClick={closeTrialNotice}>あとで</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ===== ③ ヒアリング ===== */}
      {stage === "hearing" && (
        <div style={{ maxWidth: 1240, margin: "14px auto 40px", background: "#fff", border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
          <div style={{ background: C.phase, color: "#fff", padding: "12px 22px", fontSize: 18, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span>お話を伺っています</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, background: "rgba(255,255,255,.2)", padding: "4px 12px", borderRadius: 3 }}>{step} / 5</span>
              {/* 逃げ道: AIが聞き続けてしまっても、本人の判断でいつでもまとめへ進める */}
              <Btn kind="outline" style={{ fontSize: 16, padding: "6px 14px" }} disabled={busy || messages.length < 2}
                onClick={() => makeSummary(messages)}>ここまでの話でまとめる</Btn>
            </span>
          </div>
          <div style={{ background: C.phaseBg, padding: 22, overflow: "auto", flex: 1 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: "78%", marginBottom: 16, padding: "14px 18px",
                marginLeft: m.role === "user" ? "auto" : 0,
                background: m.role === "user" ? C.C3 : "#fff",
                color: m.role === "user" ? "#fff" : C.ink,
                border: `1px solid ${m.role === "user" ? C.C3 : C.lineSoft}`,
                whiteSpace: "pre-wrap", lineHeight: 1.85,
              }}>
                <div style={{ fontSize: 16, color: m.role === "user" ? "#c9c9c9" : C.sub, marginBottom: 4 }}>{m.role === "user" ? "あなた" : "AI"}</div>
                {m.content}
              </div>
            ))}
            {busy && <div style={{ fontSize: 18, color: C.sub, padding: "8px 4px" }}>…考えています</div>}
            <div ref={chatEnd} />
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, padding: "12px 20px", display: "flex", gap: 10, alignItems: "flex-end", background: "#fff" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
              placeholder="話し言葉のままで結構です。長くなって構いません。（声で入力するときは、キーボードのマイクをお使いください）"
              rows={3}
              style={{ flex: 1, fontFamily: FB, fontSize: 18, padding: "12px 14px", border: `1px solid ${C.line}`, background: C.highlight, resize: "vertical", lineHeight: 1.7 }}
            />
            <Btn onClick={send} disabled={busy || !input.trim()}>送る</Btn>
          </div>
        </div>
      )}

      {/* ===== ④ まとめの確認 ===== */}
      {stage === "summary" && (
        <div style={{ maxWidth: 1000, margin: "14px auto 40px" }}>
          <div style={{ background: "#fff", border: `2px solid ${C.C3}` }}>
            <div style={{ background: C.C3, color: "#fff", padding: "14px 22px", fontFamily: FH, fontSize: 22, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              お聞きした内容
              <span style={{ fontFamily: FB, fontSize: 16, color: "#bdbdb6" }}>全部で約{yen(totalChars)}字</span>
            </div>
            {summaryItems.map(it => (
              <div key={it.no} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <div onClick={() => setOpenItem(openItem === it.no ? 0 : it.no)}
                  style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 22px", cursor: "pointer", background: openItem === it.no ? C.surface : "#fff" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: C.phase, paddingTop: 4 }}>{String(it.no).padStart(2, "0")}</div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontFamily: FH, fontSize: 20, display: "block", marginBottom: 2 }}>{it.title}</b>
                    <span style={{ color: C.sub, fontSize: 18 }}>
                      {it.label}　約{yen((it.body || "").length)}字
                      {openItem !== it.no && `　／　${(it.body || "").slice(0, 46)}…`}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, color: C.sub }}>{openItem === it.no ? "−" : "＋"}</div>
                </div>
                {openItem === it.no && (
                  <div style={{ padding: "4px 22px 22px" }}>
                    {editing === it.no ? (
                      <>
                        <textarea value={it.body} onChange={e => editBody(it.no, e.target.value)} rows={14}
                          style={{ width: "100%", fontFamily: FB, fontSize: 18, lineHeight: 1.9, padding: 16, border: `1px solid ${C.line}`, background: C.highlight, resize: "vertical" }} />
                        <div style={{ marginTop: 10 }}><Btn kind="outline" onClick={() => setEditing(null)}>編集をやめる</Btn></div>
                      </>
                    ) : (
                      <>
                        <div style={{ background: C.surface, border: `1px solid ${C.lineSoft}`, padding: "18px 20px", fontSize: 18, lineHeight: 2, whiteSpace: "pre-wrap" }}>{it.body}</div>
                        <div style={{ marginTop: 12 }}><Btn kind="outline" onClick={() => setEditing(it.no)}>編集する</Btn></div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div style={{ padding: "20px 22px", borderTop: `2px solid ${C.lineSoft}`, background: C.surface, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Btn onClick={runAnalysis} style={{ fontSize: 20, padding: "15px 30px" }}
                disabled={balance !== null && balance < costs.analyze_standard}>
                この内容で分析する（{yen(costs.analyze_standard)}ポイント）
              </Btn>
              <span style={{ fontSize: 16, color: C.sub }}>
                {balance !== null && balance < costs.analyze_standard
                  ? `あと ${yen(costs.analyze_standard - balance)} ポイント必要です`
                  : `分析後の残り ${yen((balance || 0) - costs.analyze_standard)}ポイント　／　3〜4分かかります`}
              </span>
              <Btn kind="outline" onClick={() => setStage("hearing")}>お話の続きに戻る</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ===== ⑤ 分析中 ===== */}
      {stage === "analyzing" && (
        <div style={{ maxWidth: 1000, margin: "14px auto 40px", background: "#fff", border: `1px solid ${C.line}`, padding: "64px 58px", textAlign: "center" }}>
          <h2 style={{ fontFamily: FH, fontSize: 28, margin: "0 0 8px" }}>戦略を組み立てています</h2>
          <p style={{ fontSize: 18, color: C.sub }}>3〜4分ほどかかります。この画面のままお待ちください。</p>
          <div style={{ maxWidth: 560, margin: "30px auto 0", textAlign: "left" }}>
            {["伺った内容を読み込む", "競合を調べる", "市場の大きさを調べる", "戦略を3つのパターンで組み立てる", "あなたの言葉で文章にする"].map((t, i) => (
              <div key={t} style={{ padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 18, color: progress > i + 1 ? C.sub : progress === i + 1 ? C.phase : "#9a9a9a", fontWeight: progress === i + 1 ? 700 : 400 }}>
                {progress > i + 1 ? "✓　" : progress === i + 1 ? "…　" : "　　"}{t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ⑥ レポート ===== */}
      {stage === "report" && analysis && (
        <div style={{ maxWidth: 1000, margin: "14px auto 60px", background: "#fff", border: `1px solid ${C.line}`, padding: "26px 34px 50px" }}>
          {combos.length > 1 && (
            <div style={{ display: "flex", borderBottom: `2px solid ${C.C3}`, marginBottom: 18, flexWrap: "wrap" }}>
              {combos.map(c => (
                <div key={c.id} onClick={() => setComboId(c.id)}
                  style={{
                    fontSize: 18, padding: "11px 20px", marginRight: 4, cursor: "pointer",
                    border: `1px solid ${c.id === comboId ? C.C3 : C.line}`, borderBottom: "none",
                    background: c.id === comboId ? C.C3 : "#d0d0d0", color: c.id === comboId ? "#fff" : C.ink,
                    fontWeight: c.id === comboId ? 700 : 400,
                  }}>
                  パターン{c.id}　{c.label}
                  {analysis.recommended_combination_id === c.id && <span style={{ color: c.id === comboId ? "#7fd6cc" : C.phase, fontWeight: 700 }}>　◎お勧め</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ background: C.C3, color: "#fff", padding: "28px 32px", marginBottom: 22 }}>
            <div style={{ fontSize: 16, color: "#bdbdb6", letterSpacing: ".14em", marginBottom: 10 }}>戦略メッセージ</div>
            <h2 style={{ fontFamily: FH, fontSize: 32, color: "#fff", lineHeight: 1.5, margin: 0 }}>{sm.message}</h2>
            <div style={{ display: "flex", gap: 26, marginTop: 18, flexWrap: "wrap", fontSize: 16 }}>
              {sm.benefit_part && <div><b style={{ display: "block", color: "#ff6b6b" }}>ベネフィット部分</b>{sm.benefit_part}</div>}
              {sm.advantage_part && <div><b style={{ display: "block", color: "#7db4f5" }}>アドバンテージ部分</b>{sm.advantage_part}</div>}
            </div>
          </div>

          {narrative && (
            <div style={{ border: `1px solid ${C.line}`, padding: "26px 30px", marginBottom: 24 }}>
              <h3 style={{ fontFamily: FH, fontSize: 22, margin: "0 0 12px" }}>戦略ナラティブ</h3>
              {narrative.split(/\n{2,}/).map((p, i) => (
                <p key={i} style={{ fontSize: 18, lineHeight: 2.05, margin: "0 0 14px" }}>{p}</p>
              ))}
            </div>
          )}

          <SecLabel color={C.B} jp="B　ベネフィット" en="お客様が求める価値　ニーズ → ウォンツ" />
          {ben.core && <Card title="核心">{ben.core}</Card>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card title="ニーズ（欠乏感・曖昧な欲求）"><UL items={ben.needs} /></Card>
            <Card title="ウォンツ（具体的欲求）"><UL items={ben.wants} /></Card>
          </div>

          <SecLabel color={C.A} jp="A　アドバンテージ" en="差別的優位点・好ましい違い" />
          <Card title="アドバンテージ"><b>{adv.what}</b></Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card title="なぜ好ましいのか">{adv.why_good}</Card>
            <Card title="なぜ真似されにくいか">{adv.why_hard_to_copy}</Card>
          </div>

          <SecLabel color={C.C3} jp="3C　顧客・競合・自社" en="Customer · Competitor · Company" />
          <Card title="ターゲット">{cust.target}<UL items={cust.profile} /></Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card title="アプローチ段階・切り捨て">
              <div><b>段階：</b>{cust.stage}</div>
              <div><b>切り捨て：</b>{cust.cutoff}</div>
            </Card>
            <Card title="市場規模">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[["最大市場", cust.market?.sam], ["狙える市場", cust.market?.som], ["成長率", cust.market?.growth]].map(([k, v]) => (
                  <div key={k} style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "12px 14px" }}>
                    <div style={{ fontSize: 16, color: C.sub }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{v || "—"}</div>
                  </div>
                ))}
              </div>
              {cust.market?.basis && <div style={{ marginTop: 8, fontSize: 16, color: C.sub }}><b>根拠：</b>{cust.market.basis}</div>}
            </Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card title="直接競合 / 異業種競合">
              <div><b>直接：</b></div><UL items={comp.direct} />
              <div style={{ marginTop: 8 }}><b>異業種：</b></div><UL items={comp.indirect} />
            </Card>
            <Card title="強み ← 仕組み ← 価値観">
              <UL items={core.all_strengths || company.strength} />
              <div style={{ marginTop: 8 }}><b>仕組み：</b>{core.structure || company.structure}</div>
              <div style={{ marginTop: 6, color: C.sub }}>価値観：{core.passion || company.passion}</div>
            </Card>
          </div>

          {cps.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, padding: "20px 24px", margin: "24px 0" }}>
              <h4 style={{ fontFamily: FH, fontSize: 20, margin: "0 0 14px" }}>AB3C 5つのチェックポイント</h4>
              {cps.map((cp, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                  <Badge status={cp.status} />
                  <div><b>{cp.label}</b><br /><span style={{ fontSize: 18 }}>{cp.comment}</span></div>
                </div>
              ))}
              <div style={{ textAlign: "right", borderTop: `1px solid ${C.line}`, paddingTop: 14, fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700 }}>
                AB3Cスコア：{score} / 10
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
            <Btn kind="outline" onClick={() => window.print()}>印刷・PDF</Btn>
            <Btn kind="outline" onClick={() => setStage("summary")}>伺った内容を見る</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
