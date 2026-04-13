# 戦略大臣（AB3C Analyzer）開発ガイド

> **必読**: セッション開始時に `docs/AB3C入門ブック.pdf` を必ず読むこと。AB3Cフレームワークの公式解説書であり、分析ロジックの基盤となる知識が記載されている。

## プロジェクト概要
「戦略大臣」は、権成俊氏が20年以上のコンサルティング実績から開発したAB3Cフレームワーク（Advantage・Benefit・Customer・Competitor・Company）をSaaS化した戦略策定ツール。非エンジニアながらClaudeと協働開発しており、日本の中小企業に戦略コンサルティング品質の分析を届けることをミッションとしている。

- **本番URL**: https://analyzer.ab3c.jp
- **Vercelプロジェクト**: ngon-alts-projects/ab3c-analyzer
- **リポジトリ**: ngon-alt/AB3C
- **主なステークホルダー**: FutureShop（ECプラットフォーム、約2,500社が加盟）との提携試験中

## 技術スタック
```
フロントエンド: Next.js 14.2.5 / React 18 / Client Components ("use client")
認証: NextAuth.js 4.24.0（Google OAuth）
DB: Neon PostgreSQL（users, tickets テーブル）
決済: Stripe（ライブキー sk_live_、Vercel環境変数に設定）
AI: Anthropic Claude API（claude-sonnet-4-6）
メール: Resend（FROM: info@digi-kaku.or.jp）
ホスティング: Vercel（GitHub mainブランチ自動デプロイ）
フォント: Noto Serif JP（Google Fonts経由）
```

## AB3Cフレームワークの理解（重要）

### 基本構造
AB3C分析は「選ばれる理由」を明らかにする事業戦略フレームワーク：
- **B (Benefit)**: お客様が求める価値（ニーズ→ウォンツ）
- **A (Advantage)**: 差別的優位点・好ましい違い（競合より選ばれる理由）
- **3C**: Customer（顧客）・Competitor（競合）・Company（自社）
- **戦略メッセージ**: Benefit + Advantage の統合表現
- **チェックポイント**: AB3Cの整合性を5項目で評価（ok/warn/ng）

### AB3Cフレームワーク原則（コース全7回学習済み）
1. **ビジョンから始めよ**: 大きな石から入れる、ビジョン→戦略→戦術の順
2. **戦略とは**: 問題の本質を見極める
3. **AB3Cで戦略を表現**: 全体と部分を一緒に表現、BenefitとAdvantageをデザインに直結、一気通貫
4. **調査分析**: レビュー・検索KW・VRIO分析でAB3C全要素を調査
5. **商品・サービス企画**: AB3C不成立時は商品開発を提案、価値サークル、業界常識を壊す
6. **コンテンツ企画**: AB3C→ユーザーシナリオ→CJM→コンテンツの順
7. **何者になるか**: 実行できない本質はビジョン欠如、パッション→ポジション→ミッション

### 分析時の重要原則
- ビジョンから問う
- 問題の本質を掘る（表面的課題の奥を問う）
- BenefitとAdvantageを明確に分離
- **一気通貫**（Web・商品・営業・採用すべてに同じ戦略軸）
- 競合視点重視（「好ましい違い」か問う）
- Advantage不成立時は商品・サービス開発を提案
- 経営者の価値観を3層で掘る（外の違い→理由→価値観）
- 業界の常識に疑問を持つ

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
| 赤 | #FF0000 (C.B) | Benefit専用。URL入力タブのボーダーにも使用 |
| 青 | #1a6fd4 (C.A) | Advantage専用。テキスト入力タブのボーダーにも使用 |
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
- beige #fef3c7 (C.highlight): 入力フィールド限定
- カード背景: #e8e8e8
- 非アクティブタブ: #d0d0d0
- 全テキスト: 純黒 #000000 統一

## フォントサイズルール（厳守）
**年配の方が使うサービスのため、文字は大きく。本文は最低18px。**

| 要素 | サイズ | フォント |
|---|---|---|
| 本文・リスト項目 | 18px | system-ui, サンセリフ体 |
| カードタイトル | 26px | Space Mono |
| セクション見出し（B/A/3C） | 26px | Noto Serif JP |
| 戦略メッセージ本文 | 22px | system-ui |
| 改善レポート本文 | 18px | system-ui, サンセリフ体 |
| テーマタブ（伴走） | 18px | system-ui, サンセリフ体 |
| サイドバー | 11-14px（幅制約のため例外） |
| 最小許容サイズ | 16px（一部UI要素のみ） |

**本文は全てサンセリフ体**（system-ui系）。小さい文字でセリフ体は読みづらいため。
見出しのみ Noto Serif JP / Space Mono 使用可。

## 2フェーズ構造

### 分析フェーズ（STEP 1）
```
[サイドバー200px] [メインコンテンツ 1fr] [分析チャット 400px(fixed)]
  緑の濃い背景     分析結果(ResultView)      緑の薄い背景
  分析履歴一覧     + 改善レポート            AnalysisChatPanel
                   💬hover→チャットに質問    送信 + 戦略を確定して伴走へ→
```
- URL/テキスト入力 → AB3C分析 → 結果表示
- URL分析時はウェブサイト改善レポートも同時自動生成
- 各セクションにhover時💬アイコン → クリックでチャットに質問送信
- チャットで深掘り → 「戦略を確定して伴走へ →」で確定

### 伴走フェーズ（STEP 2）
```
[サイドバー200px] [メインコンテンツ 1fr]         [アクションリスト 400px(fixed)]
  茶の濃い背景     戦略メッセージ（黒背景）         茶の薄い背景
  確定戦略         テーマタブ(18px)                アクション一覧
  スレッド一覧     ThreadChat                     クリック→詳細表示
                   初回自動アドバイス生成
```
- 確定戦略メッセージを黒背景で常時表示（分析タブと同じデザイン、Benefit/Advantageサブコメント付き）
- テーマ別チャット（全テーマ並列）
- テーマ初回選択時にAIが戦略ベースの初回アドバイスを自動生成

### デフォルトテーマ（伴走フェーズ）
| ID | ラベル | 初回アドバイス内容 |
|---|---|---|
| marketing | 集客・広告 | SEO/SNS/Googleマップ/プレスリリース/ネット広告/チラシの優先順位 |
| recruit | 採用コンテンツ企画 | ビジョン/強み/待遇案/キャリアプラン案を戦略から推論して提案 |
| website | ウェブサイト改善 | コンテンツ/デザイン/構造の改善優先事項 |
| subsidy | 補助金申請 | 小規模事業者持続化補助金の計画書項目に沿って概要書き出し |

## 料金体系（確定済み・税込・50%OFFキャンペーン中）

### 分析プラン（年間ライセンス・有効期限1年）
| サイト数 | 価格 |
|---|---|
| 1サイト | ¥22,000/年 |
| 10サイト | ¥198,000/年 |
| 100サイト | ¥990,000/年 |

### 伴走プラン（月額・AIチャット付き・1サイト月100回上限）
| サイト数 | 月額 |
|---|---|
| 1サイト | ¥44,000 |
| 5サイト | ¥196,000 |
| 15サイト | ¥392,000 |
| 30サイト | ¥627,000 |
| 60サイト | ¥1,003,000 |
| 120サイト | ¥1,605,000 |

- 年額は月額×10（2ヶ月無料）。税抜は÷1.1
- 定価は全て2倍、現在50%OFFキャンペーン中（5月1日または100名達成まで）
- 3ヶ月返金保証あり。先行ユーザーはキャンペーン価格継続
- **Stripe Price IDは割引後の価格を設定済みのため、allow_promotion_codesを追加すると二重割引になる（注意）**
- 無料トライアル: 分析1回・チャット1回

## APIルート

### コア機能
- `/api/analyze` — AB3C分析実行（Claude API、URL時はウェブ検索使用）
- `/api/chat` — チャット（通常/再分析/採用モード/テーマ別初回アドバイス）
- `/api/improve` — ウェブサイト改善レポート生成
- `/api/recruit` — 採用コンテンツ企画レポート生成（chatHistory対応）
- `/api/share` — 分析結果のシェアURL生成
- `/api/sites` — サイト登録・戦略確定の管理

### その他
- `/api/stripe/checkout`, `/api/stripe/webhook` — 決済
- `/api/check-pro` — PRO判定
- `/api/usage` — 使用状況
- `/api/contact` — コンタクトフォーム（現在console.logのみ、メール送信未実装）
- `/api/email/followup` — フォローメール
- `/api/user/purpose` — 利用目的（自社/代理店）
- `/api/admin/*` — 管理機能

### /api/chat の特殊モード
- `reanalyze: true` — チャット内容を反映した再分析
- `recruitMode: true` — 採用専門のヒアリングモード（戦略から推論したガイド型）
- `initialAdvice: true` — テーマ初回アドバイス自動生成（**チケット消費しない**）
- `threadTheme` — テーマ別コンテキスト付与

## コンポーネント構成（app/page.js）

### 共通コンポーネント
- `ChatBtn` — hover時のみ表示される💬アイコン（phase1色背景・白SVG、position:absolute）
- `hoverShow` — hover時にChatBtnを表示するイベントハンドラ（:scope >で直接子のみ）
- `Card` — 白背景カード（onChat対応、hover時ChatBtn表示）
- `UL` — リスト（各アイテムにonChatItem対応）
- `SectionLabel` — B/A/3Cセクション見出し（onChat対応）
- `ResultView` — AB3C分析結果の全セクション表示（onChat propで全レベル💬対応）
- `Badge` — チェックポイントのok/warn/ngアイコン

### チャットコンポーネント
- `AnalysisChatPanel` — 分析フェーズ用（再分析機能・トピック送信・戦略確定ボタン付き）
- `ThreadChat` — 伴走フェーズ用（テーマ別・アクション登録・採用レポート生成・初回自動生成対応）

## メール実装状況（Resend）
- 実装済み: 登録完了メール・目的別ウェルカムメール（自社利用/代理店）・3日後フォローメール
- 文面確定済み（未実装）:
  - #1 シェアURL(3日後) / #2 アクション相談(5日後) / #3 NotebookLM(8日後)
  - #4 補助金申請(12日後) / #5 毎日のアクション習慣(25日後)
- FROM_EMAIL=info@digi-kaku.or.jp、Resendドメイン認証はさくらサーバーDNS設定待ち

## 開発予定機能・要件

### 未解決バグ（最優先）
1. **伴走タブのテーマ切替が正しく動作しない**
   - 症状: 採用コンテンツ企画を選んでも集客・広告のアドバイスが表示される
   - デバッグ中: 準備中メッセージに`threadId`を表示するコードを追加済み（要確認）
   - 原因候補: ThreadChatの`key={activeThreadId}`による再マウントが効いていない、またはlocalStorageに古いデータが残っている
   - 対処: `↻ 全リセット`ボタンを押してから各テーマを選択してテスト
   - ThreadChat内のuseEffectは依存配列`[]`（マウント時のみ）に変更済み
   - `initialized` refで初期化完了前のlocalStorage保存を防止済み

2. **右カラムの位置調整**
   - sticky top:130px / height:calc(100vh-130px) に設定済み
   - ヘッダー/タブナビはzIndex:200、右カラムはzIndex:100
   - 上部は解決済み、下部のボタン見切れは要確認

### 優先タスク
1. 分析プランユーザーのチャット回数制限（30回上限）
   - 既存のticketsテーブルのremaining_chatsの仕組みを活用
   - 分析プラン契約時にremaining_chats=30のチケットを自動発行
   - Stripe webhook / チケット発行ロジックの確認が必要
   - initialAdvice（テーマ初回アドバイス）はカウントしない（既に実装済み）
2. テーマ初回アドバイスの動作確認・改善
3. マルチサイト管理（サイトURL登録・一覧画面・サイト選択→分析画面）

### 中期タスク
- チュートリアルメール実装（Resend、文面確定済み）
- さくらサーバーDNS設定完了後のResendドメイン認証
- ケーススタディギャラリーページ（/examples）の実装
- セキュリティ脆弱性対応（Next.js 14.2.5、Dependabot alerts含む）
- コンタクトフォームのメール送信実装

### 各テーマのチャット→アクション化フロー
全テーマ共通の流れ:
1. テーマ選択 → AIが戦略ベースの初回アドバイスを自動生成
2. ユーザーと会話しながら具体化
3. AIが具体的なアクションを提案時に `[ACTION: タイトル]` 形式で明示
4. 「アクションに登録」ボタン → 右カラムのアクションリストに追加
5. アクションリストで管理（クリックで詳細表示・削除可能）

### 採用コンテンツ企画の改善要件
- AIが戦略分析から推論した提案をベースにガイド（一問一答ではない）
  - Advantageが弱い場合は待遇面の差別化をアドバイス
  - ビジョンを戦略メッセージから提案して確認
  - 同業界のキャリアパスを提示して比較
  - 独立支援など特有の強みを求職者向けに言い換え

## デプロイ
- mainブランチへのpushでVercel自動デプロイ
- ビルドエラー（neon DB接続）はCI環境のenv未設定が原因。"Compiled successfully" が出ていればOK
- 現在のワークツリー: `.claude/worktrees/zealous-mayer`
- Vercel環境変数変更後は手動再デプロイ必要。新規コミットのpushが最も確実

## 技術的な重要教訓
- `.env.local`等の秘密情報をコミットした場合: `git reset --soft HEAD~1` → ファイル除去 → 再コミット（force pushは不可）
- `str_replace`ツールは大きなファイルで文脈が曖昧だと失敗する。十分にユニークな周辺コードを検索文字列に含める
- `page.js`にインライン記述されたFooterコードはFooter.jsとは別物（ページ固有のインラインコードを先に確認する習慣）
- `page.js` は巨大ファイル（1400行超）。読み込み時はoffset/limitを使用

## 注意事項
- localStorageキー: `ab3c_history`, `ab3c_threads_${siteId}`, `ab3c_thread_${threadId}`, `ab3c_actions_${siteId}`, `ab3c_chat_summaries`
- Header.js, PricingModal.js は変更対象外（指示がない限り）
- 認証・決済フローは変更しない
- 権さんが言っていない発言をClaudeが誤って帰属させないこと（注意）
- UIは反復的なフィードバックで調整（色・サイズを複数ラウンドで詰める傾向）
- 実装前に戦略的優先順位を明示し、合意を取ってから作業開始
