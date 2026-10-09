// 戦略策定チャットの会話量に関する上限と、画面に出す警告のしきい値。
// 再分析（/api/chat/reanalyze・/api/chat）と画面の警告バナーで同じ値を使う。
// 値がずれると「まだ全文渡せているのに警告が出る」「切り捨てられているのに警告が出ない」が起きる。

// 再分析に渡す会話の上限。これを超えると古い発言から落とす（暴走防止のみの上限）。
// 戦略の土台はご本人との対話そのものなので、会話は全文を渡すのが原則（2026-09-14 権さん判断）。
export const MAX_CONV_CHARS = 150000;

// 警告バナーのしきい値（上限に対する割合で決める）
export const CONV_WARN_STRONG = Math.round(MAX_CONV_CHARS * 0.9); // 135,000字
export const CONV_WARN_MILD = Math.round(MAX_CONV_CHARS * 0.7);   // 105,000字
