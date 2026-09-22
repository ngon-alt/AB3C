// 戦略の「版」に ID を振って管理する（2026-09-22 権さん決定）
//
// 版 = サイト × パターン × 中身。分析・再分析で結果が生成された時点で、パターンごとに ID を登録する。
// 中身が完全に同じなら同じ版（同じ ID）とみなす。確定し直しても中身が同じなら ID は変わらない。
//
// 戦略アクション（テーマ別チャット・アクションリスト）は確定した版にぶら下げる（action_sets）。
// 版を変えて確定し直すと、アクション画面は空から始まる。以前のアクションは元の版の下に保存され、
// その版を確定し直すと戻ってくる。何も消さない（「データを消さない」原則）。
import crypto from "crypto";

// キー順に依存しない JSON 文字列化。JSONB は保存時にキー順を並べ替えるため、
// 画面から送られた結果と DB から読んだ結果で同じハッシュを得るのに必要。
export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

function hashOf(content) {
  return crypto.createHash("sha256").update(stableStringify(content)).digest("hex");
}

const hasCombinations = (result) => Array.isArray(result?.combinations) && result.combinations.length > 0;

// 分析結果から、指定パターンの版の中身を取り出す。
// 3パターン構成: パターン本体＋自社の核（強み・理念）。自社の核が変われば同じパターンでも別の版になる。
// 旧構成（パターンなし）: 結果全体を1つのパターン "main" として扱う。
export function versionContentOf(result, patternId) {
  if (!result || typeof result !== "object") return null;
  if (hasCombinations(result)) {
    const combo = result.combinations.find((c) => c && String(c.id) === String(patternId));
    if (!combo) return null;
    return { patternId: String(combo.id), content: { pattern: combo, company_core: result.company_core ?? null } };
  }
  return {
    patternId: "main",
    content: {
      benefit: result.benefit ?? null,
      advantage: result.advantage ?? null,
      three_c: result.three_c ?? null,
      strategy_message: result.strategy_message ?? null,
    },
  };
}

// 確定済みの結果が、どのパターンを確定したものかを返す
export function confirmedPatternIdOf(result) {
  if (!hasCombinations(result)) return "main";
  return String(result.confirmed_combination_id ?? result.recommended_combination_id ?? result.combinations[0]?.id);
}

export async function ensureVersionTables(sql) {
  await sql.transaction([
    sql`
      CREATE TABLE IF NOT EXISTS strategy_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        pattern_id TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        content JSONB,
        improve_result JSONB,
        visual_mock JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (site_id, pattern_id, content_hash)
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS action_sets (
        site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE CASCADE,
        threads JSONB,
        theme_chats JSONB,
        thread_messages JSONB,
        actions JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (site_id, strategy_version_id)
      )
    `,
    // 戦略策定チャットを空にする・短くする前に、それまでの会話をしまっておく場所
    sql`
      CREATE TABLE IF NOT EXISTS analysis_chat_archives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        messages JSONB NOT NULL,
        reason TEXT,
        archived_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    sql`CREATE INDEX IF NOT EXISTS idx_analysis_chat_archives_site ON analysis_chat_archives(site_id)`,
    sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS current_strategy_version_id UUID`,
  ]);
}

// 版を登録して ID を返す（同じ中身なら既存の ID）
export async function registerVersion(sql, siteId, patternId, content) {
  const hash = hashOf(content);
  const rows = await sql`
    INSERT INTO strategy_versions (site_id, pattern_id, content_hash, content)
    VALUES (${siteId}, ${patternId}, ${hash}, ${JSON.stringify(content)}::jsonb)
    ON CONFLICT (site_id, pattern_id, content_hash) DO UPDATE SET updated_at = strategy_versions.updated_at
    RETURNING id
  `;
  return rows[0]?.id || null;
}

// 分析結果に含まれる全パターンを登録し、{ パターンID: 版ID } を返す
export async function registerAllPatterns(sql, siteId, result) {
  const map = {};
  if (!result || typeof result !== "object") return map;
  const ids = hasCombinations(result) ? result.combinations.filter(Boolean).map((c) => String(c.id)) : ["main"];
  for (const pid of ids) {
    const v = versionContentOf(result, pid);
    if (v) map[v.patternId] = await registerVersion(sql, siteId, v.patternId, v.content);
  }
  return map;
}

// 確定済みの結果から、その版の ID を返す
export async function registerConfirmedVersion(sql, siteId, result) {
  const v = versionContentOf(result, confirmedPatternIdOf(result));
  if (!v) return null;
  return registerVersion(sql, siteId, v.patternId, v.content);
}

// 版 ID が導入される前から確定済みだったサイトに、現在の版を割り当てる。
// 最新の確定履歴（無ければ確定中の latest_analysis）を現在の版とし、
// サイトに1つだけあったアクション一式をその版の下にも保存する（今あるデータは最新の確定に帰属）。
export async function ensureCurrentVersion(sql, siteId) {
  const rows = await sql`
    SELECT current_strategy_version_id, strategy_confirmed, latest_analysis,
           CASE WHEN jsonb_typeof(confirmations) = 'array' AND jsonb_array_length(confirmations) > 0
                THEN confirmations -> -1 ELSE NULL END AS last_confirmation
    FROM sites WHERE id = ${siteId}
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.current_strategy_version_id) return row.current_strategy_version_id;
  const source = row.last_confirmation?.result || (row.strategy_confirmed ? row.latest_analysis : null);
  if (!source) return null;
  const svid = await registerConfirmedVersion(sql, siteId, source);
  if (!svid) return null;
  await sql`UPDATE sites SET current_strategy_version_id = ${svid} WHERE id = ${siteId} AND current_strategy_version_id IS NULL`;
  await archiveWorkingActions(sql, siteId, svid);
  return svid;
}

// サイトの作業中アクション一式を、指定の版の下に保存する（会話は既存分と統合し、どちらも消さない）
export async function archiveWorkingActions(sql, siteId, svid) {
  await sql`
    INSERT INTO action_sets (site_id, strategy_version_id, threads, theme_chats, thread_messages, actions, updated_at)
    SELECT id, ${svid}, threads, theme_chats, thread_messages, actions, NOW()
    FROM sites
    WHERE id = ${siteId}
      AND (threads IS NOT NULL OR theme_chats IS NOT NULL OR thread_messages IS NOT NULL OR actions IS NOT NULL)
    ON CONFLICT (site_id, strategy_version_id) DO UPDATE SET
      threads = COALESCE(EXCLUDED.threads, action_sets.threads),
      theme_chats = COALESCE(EXCLUDED.theme_chats, action_sets.theme_chats),
      thread_messages = (CASE WHEN jsonb_typeof(action_sets.thread_messages) = 'object' THEN action_sets.thread_messages ELSE '{}'::jsonb END)
                     || (CASE WHEN jsonb_typeof(EXCLUDED.thread_messages) = 'object' THEN EXCLUDED.thread_messages ELSE '{}'::jsonb END),
      actions = COALESCE(EXCLUDED.actions, action_sets.actions),
      updated_at = NOW()
  `;
}

// 画面から届いたアクション一式を、指定の版の下に保存する
export async function saveActionSet(sql, siteId, svid, { threadsJson, themeChatsJson, threadMessagesJson, actionsJson }) {
  await sql`
    INSERT INTO action_sets (site_id, strategy_version_id, threads, theme_chats, thread_messages, actions, updated_at)
    VALUES (${siteId}, ${svid}, ${threadsJson}::jsonb, ${themeChatsJson}::jsonb, ${threadMessagesJson}::jsonb, ${actionsJson}::jsonb, NOW())
    ON CONFLICT (site_id, strategy_version_id) DO UPDATE SET
      threads = COALESCE(EXCLUDED.threads, action_sets.threads),
      theme_chats = COALESCE(EXCLUDED.theme_chats, action_sets.theme_chats),
      thread_messages = (CASE WHEN jsonb_typeof(action_sets.thread_messages) = 'object' THEN action_sets.thread_messages ELSE '{}'::jsonb END)
                     || (CASE WHEN jsonb_typeof(EXCLUDED.thread_messages) = 'object' THEN EXCLUDED.thread_messages ELSE '{}'::jsonb END),
      actions = COALESCE(EXCLUDED.actions, action_sets.actions),
      updated_at = NOW()
  `;
}

// 版がこのサイトのものかを確かめる（他サイトの版に書き込ませない）
export async function versionBelongsToSite(sql, siteId, svid) {
  if (!svid) return false;
  const rows = await sql`SELECT 1 FROM strategy_versions WHERE id::text = ${String(svid)} AND site_id = ${siteId}`;
  return rows.length > 0;
}

// 確定の切り替え。版が変わったら、今の作業中アクションを元の版に保存し、
// 新しい版のアクション（あれば）を作業中に読み込む。無ければ空から始める。
// 返り値: { strategyVersionId, switched, actionData }
export async function switchConfirmedVersion(sql, siteId, previousSvid, confirmedResult) {
  const newSvid = await registerConfirmedVersion(sql, siteId, confirmedResult);
  if (!newSvid) return { strategyVersionId: previousSvid, switched: false, actionData: null };
  if (!previousSvid) {
    // 版 ID の無い状態での最初の確定: 作業中のものはそのまま、この版の下にも保存
    await sql`UPDATE sites SET current_strategy_version_id = ${newSvid} WHERE id = ${siteId}`;
    await archiveWorkingActions(sql, siteId, newSvid);
    return { strategyVersionId: newSvid, switched: false, actionData: null };
  }
  if (String(newSvid) === String(previousSvid)) {
    return { strategyVersionId: newSvid, switched: false, actionData: null };
  }
  await archiveWorkingActions(sql, siteId, previousSvid);
  const rows = await sql`
    SELECT threads, theme_chats, thread_messages, actions FROM action_sets
    WHERE site_id = ${siteId} AND strategy_version_id = ${newSvid}
  `;
  const loaded = rows[0] || null;
  const actionData = {
    threads: Array.isArray(loaded?.threads) ? loaded.threads : [],
    theme_chats: loaded?.theme_chats && typeof loaded.theme_chats === "object" ? loaded.theme_chats : {},
    thread_messages: loaded?.thread_messages && typeof loaded.thread_messages === "object" ? loaded.thread_messages : {},
    actions: Array.isArray(loaded?.actions) ? loaded.actions : [],
  };
  await sql`
    UPDATE sites SET
      threads = ${JSON.stringify(actionData.threads)}::jsonb,
      theme_chats = ${JSON.stringify(actionData.theme_chats)}::jsonb,
      thread_messages = ${JSON.stringify(actionData.thread_messages)}::jsonb,
      actions = ${JSON.stringify(actionData.actions)}::jsonb,
      current_strategy_version_id = ${newSvid},
      updated_at = NOW()
    WHERE id = ${siteId}
  `;
  return { strategyVersionId: newSvid, switched: true, actionData };
}

// 改善レポート・ビジュアルを版に保存する（生成済みのものを捨てず、過去の版に戻っても作り直さずに済む）
export async function saveVersionReports(sql, siteId, result, { improveByCombo, visualByCombo, confirmedSvid, improveResult, visualMock }) {
  if (result && (improveByCombo || visualByCombo)) {
    const ids = new Set([...Object.keys(improveByCombo || {}), ...Object.keys(visualByCombo || {})]);
    for (const pid of ids) {
      const v = versionContentOf(result, pid);
      if (!v) continue;
      const svid = await registerVersion(sql, siteId, v.patternId, v.content);
      const imp = improveByCombo?.[pid];
      const vis = visualByCombo?.[pid];
      await sql`
        UPDATE strategy_versions SET
          improve_result = COALESCE(${imp && !imp.error ? JSON.stringify(imp) : null}::jsonb, improve_result),
          visual_mock = COALESCE(${vis && !vis.error ? JSON.stringify(vis) : null}::jsonb, visual_mock),
          updated_at = NOW()
        WHERE id = ${svid}
      `;
    }
  }
  if (confirmedSvid && (improveResult || visualMock)) {
    await sql`
      UPDATE strategy_versions SET
        improve_result = COALESCE(${improveResult ? JSON.stringify(improveResult) : null}::jsonb, improve_result),
        visual_mock = COALESCE(${visualMock ? JSON.stringify(visualMock) : null}::jsonb, visual_mock),
        updated_at = NOW()
      WHERE id = ${confirmedSvid}
    `;
  }
}

// ブラウザの中にだけ残っていた「確定ごとの会話」を、その確定の版の下に引き上げる。
// 既に DB にある会話は上書きしない（DB 側を優先）。
export async function rescueThreadMessages(sql, siteId, items) {
  const byConfirm = {};
  for (const it of items || []) {
    if (!it || !it.confirm_id || !it.chat_id || !Array.isArray(it.messages)) continue;
    (byConfirm[String(it.confirm_id)] ||= {})[String(it.chat_id)] = it.messages;
  }
  const confirmIds = Object.keys(byConfirm);
  if (confirmIds.length === 0) return 0;
  const rows = await sql`
    SELECT elem FROM sites, jsonb_array_elements(CASE WHEN jsonb_typeof(confirmations) = 'array' THEN confirmations ELSE '[]'::jsonb END) AS elem
    WHERE sites.id = ${siteId} AND elem ->> 'id' = ANY(${confirmIds})
  `;
  let rescued = 0;
  for (const { elem } of rows) {
    const svid = elem?.result ? await registerConfirmedVersion(sql, siteId, elem.result) : null;
    const msgs = byConfirm[String(elem?.id)];
    if (!svid || !msgs) continue;
    await sql`
      INSERT INTO action_sets (site_id, strategy_version_id, threads, theme_chats, thread_messages, actions, updated_at)
      SELECT id, ${svid}, threads, theme_chats, ${JSON.stringify(msgs)}::jsonb, '[]'::jsonb, NOW()
      FROM sites WHERE id = ${siteId}
      ON CONFLICT (site_id, strategy_version_id) DO UPDATE SET
        thread_messages = EXCLUDED.thread_messages
                       || (CASE WHEN jsonb_typeof(action_sets.thread_messages) = 'object' THEN action_sets.thread_messages ELSE '{}'::jsonb END),
        updated_at = NOW()
    `;
    rescued += Object.keys(msgs).length;
  }
  return rescued;
}
