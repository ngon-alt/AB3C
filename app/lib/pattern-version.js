// 戦略パターンの「版」を見分けるための指紋（サーバーと画面の両方で同じ計算をする・2026-09-22）
//
// 版はパターンごとに数える。中身（パターン本体＋自社の核）が変わったときだけ版が増え、
// 中身が過去の版と全く同じなら同じ版とみなす（過去の版で確定し直した場合など）。
// サーバーの版 ID（strategy-versions.js）と同じ中身の取り出し方をする。
// Node の crypto を使わない（画面側でも読み込むため）。

// キー順に依存しない文字列化（JSONB はキー順を並べ替えるため）
export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

// 文字列の短い指紋（cyrb53）
function fingerprint(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// 版の中身に数える自社の核。強みの根拠評価（赤い吹き出しの元）は注記なので数えない。
// 反映で評価だけが書き換わると、ほかのパターンまで版が上がってしまうため（2026-09-22）
export function coreForVersion(core) {
  if (!core || typeof core !== "object") return null;
  const { all_strengths_evaluations, ...rest } = core;
  return rest;
}

const combosOf = (result) => (Array.isArray(result?.combinations) && result.combinations.length > 0 ? result.combinations : null);

// 分析結果に含まれるパターンの ID 一覧（パターンの無い旧形式は "main" 1つ）
export function patternIdsOf(result) {
  const combos = combosOf(result);
  return combos ? combos.filter(Boolean).map((c) => String(c.id)) : ["main"];
}

// 確定した結果が、どのパターンを確定したものか
export function confirmedPatternId(result) {
  const combos = combosOf(result);
  if (!combos) return "main";
  return String(result.confirmed_combination_id ?? result.recommended_combination_id ?? combos[0]?.id);
}

// 指定パターンの指紋・名前・戦略メッセージ（無ければ null）
export function patternInfo(result, patternId) {
  if (!result || typeof result !== "object") return null;
  const combos = combosOf(result);
  if (combos) {
    const combo = combos.find((c) => c && String(c.id) === String(patternId));
    if (!combo) return null;
    return {
      h: fingerprint(stableStringify({ pattern: combo, company_core: coreForVersion(result.company_core) })),
      label: combo.label || "",
      message: combo.strategy_message?.message || "",
    };
  }
  return {
    h: fingerprint(stableStringify({ benefit: result.benefit ?? null, advantage: result.advantage ?? null, three_c: result.three_c ?? null, strategy_message: result.strategy_message ?? null })),
    label: "",
    message: result.strategy_message?.message || "",
  };
}

// 世代1件分の見出し情報（全パターンの指紋）。サーバーが全世代分を軽い形で画面に送る
export function versionIndexEntry(version) {
  const patterns = {};
  for (const pid of patternIdsOf(version?.result)) {
    const info = patternInfo(version.result, pid);
    if (info) patterns[pid] = info;
  }
  return { id: version?.id, number: version?.number ?? null, created_at: version?.created_at || null, patterns };
}

// 世代の一覧（新しい順）から、パターンごとの版の一覧を作る。
// 返り値: { [パターンID]: [{ pv: 版番号, h, label, message, versionIds: [この中身を持つ世代ID（新しい順）] }]（新しい版が先頭） }
export function buildPatternTree(indexNewestFirst) {
  const tree = {};
  const list = Array.isArray(indexNewestFirst) ? indexNewestFirst.slice().reverse() : [];
  list.forEach((entry, order) => {
    for (const [pid, info] of Object.entries(entry?.patterns || {})) {
      const versions = (tree[pid] ||= []);
      let node = versions.find((n) => n.h === info.h);
      if (!node) {
        node = { pv: versions.length + 1, h: info.h, label: info.label, message: info.message, versionIds: [], lastSeen: order };
        versions.push(node);
      }
      node.versionIds.unshift(entry.id);
      node.label = info.label || node.label;
      node.lastSeen = order;
    }
  });
  // 最近使われた中身が上（過去の版に戻して確定した場合、その版が一番上に来る）
  for (const pid of Object.keys(tree)) tree[pid].sort((a, b) => b.lastSeen - a.lastSeen);
  return tree;
}
