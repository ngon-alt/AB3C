# 戦略大臣（AB3C Analyzer）開発ガイド

## プロジェクト概要
「戦略大臣」は、AB3Cフレームワークに基づく事業戦略分析SaaS。URLまたはテキスト入力からAIがAB3C分析を実行し、戦略を確定した後に伴走フェーズでアクションを支援する。

- **本番URL**: https://analyzer.ab3c.jp
- **Vercelプロジェクト**: ngon-alts-projects/ab3c-analyzer
- **リポジトリ**: ngon-alt/AB3C

## 技術スタック
- Next.js 14.2.5（App Router）/ React 18
- Anthropic Claude API（claude-sonnet-4-6）
- Neon PostgreSQL（@neondatabase/serverless）
- NextAuth（Google OAuth）
- Stripe（決済）
- Resend（メール）
- Vercel（デプロイ・自動デプロイ）

## AB3Cフレームワークの理解（重要）
AB3C分析は「選ばれる理由」を明らかにする事業戦略フレームワーク：
- **B (Benefit)**: お客様が求める価値（ニーズ→ウォンツ）
- **A (Advantage)**: 差別的優位点・好ましい違い（競合より選ばれる理由）
- **3C**: Customer（顧客）・Competitor（競合）・Company（自社）
- **戦略メッセージ**: Benefit + Advantage の統合表現
- **チェックポイント**: AB3C の整合性を5項目で評価（ok/warn/ng）

### 分析結果JSONスキーマ
```
benefit: { core, needs[], wants[] }
advantage: { what, why_good, why_hard_to_copy }
three_c: {
  customer: { target, profile[], stage, cutoff, market: { sam, som, growth, basis } },
  competitor: { direct[], indirect[] },
  company: { strength[], structure, passion }
}
strategy_message: { message, benefit_part, advantage_part }
checkpoints: [{ label, status, comment }]
```

## 色のルール（厳守）

### 意味のある色（他の用途に使わない）
| 色 | コード | 用途 |
|---|---|---|
| 赤 | #FF0000 (C.B) | Benefit専用 |
| 青 | #1a6fd4 (C.A) | Advantage専用 |
| 黒 | #1a1a14 (C.C) | 3C分析・戦略メッセージ背景 |

### フェーズカラー
| フェーズ | 濃い色 | 薄い色（背景） | 用途 |
|---|---|---|---|
| 分析 | #2d6a30 (phase1) | #8bb88b (phase1Bg) | サイドバー・チャットヘッダー・ボタン / チャット背景 |
| 伴走 | #8c5e1a (phase2) | #f0ebe0 (phase2Bg) | サイドバー・チャットヘッダー・ボタン / チャット背景 |

### UIボタン色
- グレー #555: 操作ボタン（新規分析/再分析/シェア/印刷）
- PROバッジ: 青 #1a6fd4
- プランを見る: 赤 #FF0000

## フォントサイズルール（厳守）
**年配の方が使うサービスのため、文字は大きく。最低18px。**

| 要素 | サイズ | フォント |
|---|---|---|
| 本文・リスト項目 | 18px | system-ui, サンセリフ体 |
| カードタイトル | 26px | Space Mono |
| セクション見出し（B/A/3C） | 26px | Noto Serif JP |
| 戦略メッセージ本文 | 22px | system-ui |
| 改善レポート本文 | 18px | system-ui, サンセリフ体 |
| テーマタブ（伴走） | 18px | system-ui, サンセリフ体 |
| サイドバー | 11-14px（幅制約のため例外） | — |
| 最小許容サイズ | 16px（一部UI要素のみ） | — |

**本文は全てサンセリフ体**（system-ui系）。小さい文字でセリフ体は読みづらいため。
見出しのみ Noto Serif JP / Space Mono 使用可。

## 2フェーズ構造

### 分析フェーズ（STEP 1）
```
[サイドバー200px] [メインコンテンツ 1fr] [分析チャット 400px]
  緑の濃い背景     分析結果(ResultView)      緑の薄い背景
  分析履歴一覧     + 改善レポート            AnalysisChatPanel
                   💬hover→チャットに質問
```
- URL/テキスト入力 → AB3C分析 → 結果表示
- URL分析時はウェブサイト改善レポートも同時自動生成
- 各セクションにhover時💬アイコン → クリックでチャットに質問送信
- チャットで深掘り → 「戦略を確定して伴走へ →」で確定

### 伴走フェーズ（STEP 2）
```
[サイドバー200px] [メインコンテンツ 1fr]    [アクションリスト 400px]
  茶の濃い背景     戦略メッセージ（黒背景）    茶の薄い背景
  確定戦略         テーマタブ                 アクション一覧
  スレッド一覧     ThreadChat                クリック→詳細表示
```
- 確定戦略メッセージを黒背景で常時表示（分析タブと同じデザイン）
- テーマ別チャット（全テーマ並列、各テーマ=チャットで戦略ベースの会話→アクションリストに落とす）
- テーマ初回選択時にAIが戦略ベースの初回アドバイスを自動生成

### デフォルトテーマ（伴走フェーズ）
| ID | ラベル | 初回アドバイス内容 |
|---|---|---|
| marketing | 集客・広告 | SEO/SNS/Googleマップ/プレスリリース/ネット広告/チラシの優先順位 |
| recruit | 採用コンテンツ企画 | ビジョン/強み/待遇案/キャリアプラン案を戦略から推論して提案 |
| website | ウェブサイト改善 | コンテンツ/デザイン/構造の改善優先事項 |
| subsidy | 補助金申請 | 小規模事業者持続化補助金の計画書項目に沿って概要書き出し |

## APIルート

### コア機能
- `/api/analyze` — AB3C分析実行（Claude API、URL時はウェブ検索使用）
- `/api/chat` — チャット（通常/再分析/採用モード/テーマ別初回アドバイス）
- `/api/improve` — ウェブサイト改善レポート生成
- `/api/recruit` — 採用コンテンツ企画レポート生成（chatHistory対応）
- `/api/share` — 分析結果のシェアURL生成
- `/api/sites` — サイト登録・戦略確定の管理

### /api/chat の特殊モード
- `reanalyze: true` — チャット内容を反映した再分析
- `recruitMode: true` — 採用専門のヒアリングモード
- `initialAdvice: true` — テーマ初回アドバイス自動生成（チケット消費しない）
- `threadTheme` — テーマ別コンテキスト付与

## コンポーネント構成（app/page.js）

### 共通コンポーネント
- `ChatBtn` — hover時のみ表示される💬アイコン（緑背景・白SVG）
- `Card` — 白背景カード（onChat対応、hover時ChatBtn表示）
- `UL` — リスト（各アイテムにonChatItem対応）
- `SectionLabel` — B/A/3Cセクション見出し（onChat対応）
- `ResultView` — AB3C分析結果の全セクション表示（onChat propで全レベル💬対応）
- `Badge` — チェックポイントのok/warn/ngアイコン

### チャットコンポーネント
- `AnalysisChatPanel` — 分析フェーズ用（再分析機能・トピック送信・戦略確定ボタン付き）
- `ThreadChat` — 伴走フェーズ用（テーマ別・アクション登録・採用レポート生成対応）

## 料金プラン
- **無料トライアル**: 分析1回・チャット1回
- **分析プラン**: 年間ライセンス。分析回数制限あり
- **伴走プラン**: 月額。伴走フェーズ（チャット）が使える
- 伴走タブにhoverすると非PROユーザーに説明ツールチップ表示

## 開発予定機能・要件

### 採用コンテンツ企画の改善
- 現在: recruitスレッドで戦略ベースのヒアリング → レポート生成
- 改善: AIが戦略分析から推論した提案をベースにガイド
  - Advantageが弱い場合は待遇面の差別化をアドバイス
  - ビジョンを戦略メッセージから提案して確認
  - 同業界のキャリアパスを提示して比較
  - 独立支援など特有の強みを求職者向けに言い換え

### 各テーマのチャット→アクション化フロー
全テーマ共通の流れ:
1. テーマ選択 → AIが戦略ベースの初回アドバイスを自動生成
2. ユーザーと会話しながら具体化
3. AIが具体的なアクションを提案時に `[ACTION: タイトル]` 形式で明示
4. 「アクションに登録」ボタン → 右カラムのアクションリストに追加
5. アクションリストで管理（クリックで詳細表示・削除可能）

### ウェブサイト改善レポートの統合
- 分析フェーズで自動生成（URL分析時）
- 伴走フェーズの「ウェブサイト改善」テーマでも参照・深掘り可能

### 印刷・PDF対応
- `@media print` でサイドバー・ボタン非表示
- result-area / improve-area のみ印刷
- page-break制御あり

## デプロイ
- mainブランチへのpushでVercel自動デプロイ
- ビルドエラー（neon DB接続）はCI環境のenv未設定が原因。"Compiled successfully" が出ていればOK
- 現在のワークツリー: `.claude/worktrees/zealous-mayer`

## 注意事項
- `page.js` は巨大ファイル（1400行超）。読み込み時はoffset/limitを使用
- localStorageキー: `ab3c_history`, `ab3c_threads_${siteId}`, `ab3c_thread_${threadId}`, `ab3c_actions_${siteId}`, `ab3c_chat_summaries`
- Header.js, PricingModal.js は変更対象外（指示がない限り）
- 認証・決済フローは変更しない
