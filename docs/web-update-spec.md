# Web更新 機能仕様（v1 ドラフト）

> 戦略アクションの「Web更新」テーマを、**チャットから実際にウェブサイトを更新する**機能にする。
> 2026-06-14 方針合意：**① GitHub・PR方式**／v1対象は **Vercel・Netlify系の自動デプロイサイト**に限定。CMS API（WordPress等）・FTP/SSH（Xserver等）は後回し。

## 方式変更（2026-06-15 権さん合意）：PR方式 → 直接反映＋Undo/Redo

当初のPR/プレビュー方式から、**チャット指示を base_branch（main）へ直接コミットして即反映**する方式に変更（権さん判断）。理由＝「gitなので必ず戻せる。プレビューを挟まず直接反映でよい」。

- `apply` は作業ブランチ＋PRではなく **base_branch へ直接コミット**（即・自動デプロイで本番反映）
- **戻す**＝「直前の更新の"変更前の内容"で再コミット」（git revert相当・**履歴は破壊しない**追記のみ）。UIに**「↩戻る／↪進む」矢印**を実装
- 戻したあと新しい変更を加えると **redoのワンタップ経路は途切れる**が、過去版はgit履歴に永久に残り、GitHubから復元可能（権さん了承済み）
- **force push / reset / merge は一切しない**。コミットに `[senryaku-web-update]` マーカー
- 留意：直接反映は「戻せる」が「公開を防ぐ」ではない。**戻すまでの間、本番訪問者に変更が見える**。クライアントの重要サイト向けに「直接反映／PR方式」を接続ごと切替できる設定は将来追加（内部フックのみ用意）

## 実装状況（2026-06-15 時点）

**バックエンド＋UI＝実装済み・ビルド緑・基本動作確認済み（認証済み正常系は要実機テスト）**

- `app/page.js` … `WebUpdatePanel`（website＝Web更新テーマ時に表示）。接続状態表示／リポジトリ選択／指示送信→propose→apply直接反映／戻る・進む矢印／会話・undo/redoスタックをlocalStorage永続化
- `GET /api/web-update/config` … 接続状態・既定リポジトリを返す（秘密情報は返さない）

- `app/lib/github.js` … JWT発行→installation token（都度発行・非保存）／リポジトリ一覧／**ツリー取得・ファイル取得・ブランチ作成・コミット(PUT)・PR作成・作業ブランチ名生成**を実装
- `GET /api/github/install-url` … 実装済み（要 `GITHUB_APP_SLUG`）
- `GET /api/github/callback` … 実装済み（完了画面・200確認）
- `GET /api/github/repos` … 実装済み（要ログイン）
- `POST /api/web-update/propose` … 実装済み（指示→対象ファイル推定→変更後内容を返す。コミットしない）
- `POST /api/web-update/apply` … 実装済み（**base_branch へ直接コミット**＝即反映。`kind` で update/undo/redo を切替。PR・merge・force pushはしない）
- 検証：本番ビルド緑（新ルート登録確認）／JWT署名パスを使い捨てRSA鍵で単体テスト9件合格／devサーバーで未認証時 401・callback 200 を確認
- **未認証→401／env未設定→分かりやすいエラー** を返すことを実地確認済み。認証済みの正常系（実際にPRを作る経路）は権さんのログイン＋GitHub App認証情報が必要なため、戻り次第いっしょにテスト

**必要な環境変数（Vercel）**
| 変数 | 用途 | 必須 |
|---|---|---|
| `GITHUB_APP_ID` | App ID | ○ |
| `GITHUB_APP_PRIVATE_KEY` | App秘密鍵(.pem。`\n`リテラル保存にも対応済み) | ○ |
| `GITHUB_APP_INSTALLATION_ID` | v1は単一接続をenvで扱う | ○ |
| `GITHUB_APP_SLUG` | インストールURL生成用（例 `senryaku-web-update`） | install-url使用時 |
| `GITHUB_APP_REPO` | 既定の対象リポジトリ（例 `ngon-alt/koshino-site`）。propose/applyのbodyで上書き可 | 任意 |
| `GITHUB_APP_BASE_BRANCH` | 既定ベースブランチ（未設定なら `main`） | 任意 |

**残り（戻られてから一緒に・主にUI）**
- `app/page.js` の「Web更新」テーマUI：接続状態表示＋接続ボタン／チャット指示→`propose`呼び出し→**差分プレビュー＋【PRを作成】ボタン**→`apply`→PRリンク・プレビューURL提示。※2500行超のファイル＆UIは反復で詰める領域のため、単独実装せず合意の上で着手する
- 課金の扱い（propose/applyは現状チケット消費せず、pro/チケット保有を要件にしているだけ。消費要否は要相談）
- 将来：`site_connections` テーブルでマルチテナント化（v1はenv単一接続）

### API契約（UI実装時の参照）
- `POST /api/web-update/propose` body: `{ instruction, repo_full_name?, base_branch?, installation_id?, analysisResult?, improveResult? }` → `{ repo, base_branch, path, sha, file_reason, summary, before, after }`（422で「特定できず」等）
- `POST /api/web-update/apply` body: `{ repo_full_name?, base_branch?, path, after, sha?, instruction?, summary?, installation_id? }` → `{ ok, pr_url, pr_number, branch, path }`

## 1. 目的と思想

- チャットで「トップの見出しを戦略メッセージに合わせて」のように指示すると、AIが該当ファイルを編集し、**差分をPR（プルリクエスト）として提案**。自動デプロイのプレビューで確認 → マージで本番反映。
- これは権さんが愛用する **staging→preview→main の規律をそのままプロダクト化**したもの。安全機構（人間の承認・プレビュー・PR）が構造に内蔵される。
- ターゲット適合：主ターゲット＝**コンサル/制作会社**。彼らはクライアントのサイトをGitで管理し、PRも理解する。マスSMBの「Git無し問題」を最初から回避。

## 2. v1スコープ

**対象**：ソースがGitHubにあり、Vercel/Netlify等で**PRごとに自動プレビュー・マージで自動本番**になるサイト（静的/JAMstack：Astro, Next, Hugo, Eleventy 等）。

**非対象（後段）**：WordPress等CMSのAPI更新／Xserver等のSSH・FTPデプロイ／GitHub以外のGitホスト。

## 3. 接続モデル（GitHub App）

- **GitHub App** を `ngon-alt` で1つ登録（OAuthより安全：リポジトリ単位の最小権限・短命トークン）。
- 権限（最小）：`contents: read/write`（ファイル読み書き）、`pull_requests: write`（PR作成）、`metadata: read`。
- ユーザーは自分のリポジトリにこのAppを**インストール**して接続。インストールIDを戦略指南側に保存。
- 実行時は **installation access token（1時間有効）** を都度発行して使う。**長命トークンは保存しない**。
- 直接 `main` に push しない。**必ず作業ブランチ＋PR**。

## 4. データモデル（新規）

`site_connections` テーブル（サイト単位の接続設定）:
| カラム | 内容 |
|---|---|
| id | PK |
| site_id | 対象サイト（既存 sites と紐付け） |
| user_email | 所有者 |
| provider | `github`（将来 `netlify` 等） |
| installation_id | GitHub App インストールID |
| repo_full_name | 例 `ngon-alt/koshino-site` |
| base_branch | 既定 `main` |
| framework | 任意ヒント（astro/next/hugo…。自動検出の補助） |
| content_paths | 任意：編集対象になりやすいディレクトリのヒント（例 `src/pages`, `src/content`） |
| created_at / updated_at | |

トークンは保存しない（都度発行）。App private key / webhook secret は **Vercel環境変数**に。

## 5. 接続設定フロー（UI）

1. サイト設定画面に「ウェブサイトに接続（GitHub）」ボタン。
2. GitHub App のインストール画面へ遷移 → ユーザーが対象リポジトリを選んで許可。
3. コールバックで installation_id を取得 → リポジトリ一覧から対象を選択 → base_branch を確認 → `site_connections` に保存。
4. 接続済みなら Web更新テーマで「このサイト（repo名）を更新できます」と表示。

## 6. 編集 → PR フロー（中核）

```
チャット指示（例「トップの見出しを戦略メッセージに合わせて」）
  ↓
① リポジトリツリー取得（GitHub API: git/trees?recursive）
  ↓
② AIが対象ファイルを推定 → 該当ファイル本文を取得（contents API）
  ↓
③ AIが変更後の内容（差分）を生成 → チャットに「変更プレビュー（before/after・差分）」を表示
  ↓
④ ユーザーが【この変更でPRを作成】を承認
  ↓
⑤ 作業ブランチ作成 → ファイル更新コミット → base_branch へPR作成
  ↓
⑥ PRリンク＋自動デプロイのプレビューURLをチャットに提示
  ↓
⑦ ユーザーが確認 → GitHub上でマージ（または将来アプリ内マージボタン）→ 本番反映
```

- **対象ファイル特定**：まずツリー（パス一覧）をAIに渡して候補を絞らせ、必要ファイルだけ本文取得（トークン節約）。framework/content_paths ヒントで精度を上げる。
- **承認は必須**：差分を見せてからのみコミット。AIが勝手に push しない。
- **1指示=1PR**を基本（レビュー単位を小さく）。

## 7. API設計（新規エンドポイント）

- `GET /api/github/install-url` … App インストールURLを返す
- `GET /api/github/callback` … installation_id 受領・保存
- `GET /api/github/repos` … インストール済みリポジトリ一覧
- `POST /api/web-update/propose` … {site_id, instruction} → ツリー/該当ファイルを読み、**差分案**を返す（コミットしない）
- `POST /api/web-update/apply` … 承認された差分で **ブランチ+コミット+PR** を作成し、PR URL を返す

## 8. UI（Web更新テーマ内）

- 接続未設定 → 「まずGitHubに接続してください」＋接続ボタン。
- 接続済み → 通常チャット。AIが変更を提案すると、**差分プレビュー＋【PRを作成】ボタン**を表示。
- PR作成後 → PRリンク・プレビューURL・「確認してマージしてください」を提示。

## 9. セキュリティ／安全機構

- GitHub App・最小権限・短命トークン。長命トークン非保存。private key は環境変数。
- **直接 main へ push しない**（必ずPR）。破壊的変更は人間の承認とプレビューを経る。
- 変更は差分で必ず可視化。大量ファイル一括変更はv1で抑制（1指示=少数ファイル）。
- webhook署名検証（App webhook を使う場合）。

## 10. フェーズ分け

- **Phase 1（最小・デモ可能）**：接続設定＋リポジトリ読み取り＋**単一ファイルの見出し/テキスト変更→PR作成→プレビューURL提示**。Vercel/Netlify自動デプロイ前提。
- **Phase 2**：複数ファイル・複数ターンの継続編集、framework自動検出、アプリ内マージ、変更履歴。
- **Phase 3（後段）**：Xserver等のSSHデプロイ対応、CMS（WordPress）API connector。

## 11. 権さん側の外部準備（実装前に必要）

1. `ngon-alt` で **GitHub App を1つ登録**（権限：contents r/w, pull_requests w, metadata r）。
2. App の **App ID / Client ID / private key (.pem) / webhook secret** を取得。
3. それらを **Vercel環境変数**に設定（例 `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`）。
4. コールバックURL：`https://senryaku.ai/api/github/callback`（staging用に preview も登録）。

→ この登録は私（Claude）では実行できない（GitHub上の手動操作）。手順は私が逐一ガイドします。

## 12. 非対象・留意

- v1はGit管理＋自動デプロイサイト限定。一般SMB（Git無し）は対象外＝**コンサル/制作会社向け**機能として位置づける。
- 「分析しっぱなしにしない＝戦略から実装まで一気通貫」の最終ピース。リニューアル（ブリーフ生成）＝新規方向、Web更新（PR）＝既存サイトの継続反映、という役割分担。
