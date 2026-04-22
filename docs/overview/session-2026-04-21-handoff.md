# Session Handoff - 2026-04-21

## 目的

このメモは、Mac 再起動後または Windows 側で `git pull` 後に、そのまま作業再開できるように作成した引き継ぎ資料です。

今回の作業軸は次の 4 点です。

- 実ポリゴン表示への移行完了
- Dify 接続の安定化
- 農薬 RAG を圃場文脈に橋渡しする実装
- フロント側での継続意思・圃場別ルート分岐

## 実現できたこと

### 1. 地図とデータの整合

- ダミー矩形を廃止し、QGIS で再作成した実ポリゴンを使用
- `data/boundaries/agri-fields-boundary.geojson` を正本として運用
- `web/public/boundaries/agri-fields-boundary.geojson` に配信用コピーを配置
- CSV/GeoJSON のズレを解消し、`field_id` 結合で表示とチャット文脈が一致

### 2. Web 側 UI/UX の安定化

- `web/src/App.jsx` を単一 `App` 実装に整理
- PC 画面での高さ崩れ（地図・入力欄が伸び続ける問題）を修正
- PC では送信ボタン非表示、Enter 送信前提に統一
- チャット領域のスクロールバー配色をパネルに合わせて調整
- フィールドカードの英語コード表示を日本語化

### 3. Dify 実接続・入力契約の修正

- proxy の CORS をローカル可変ポート（`127.0.0.1` / `localhost`）に対応
- `agri_context` を Dify 送信前に JSON 文字列化する処理を proxy 側で維持
- `web/src/difyChat.js` で `agri_context` に以下を追加
  - `task_type`
  - `target_crop`
  - `target_pest`
  - `query`
- プレースホルダー値 (`—`) が Dify 側へ流れないよう正規化ガードを追加

### 4. 圃場→害虫→農薬候補の橋渡し

- 圃場データに `suspected_pest` を追加
- `field_002` などに害虫報告を持たせ、RAG 導線を明示
- Dify 側 `コード実行2` で
  - `agri_context` パース
  - `target_crop` / `target_pest` を優先利用
  - `agri_pesticide_catalog.csv` 由来チャンクを優先
  - `matched_products` を構造化
- Dify 側 `LLM3` プロンプトを「構造化結果の要約」に寄せて改善

### 5. フロント側での継続意思と off-topic の制御

- `はいどうぞ` や `お願い` は、選択中の圃場文脈に応じてローカルで継続ルートに寄せる
- `かつ丼` や `雑談` などの off-topic は Dify に投げず、その場で柔らかく返す
- PoC では、圃場が既知なら農薬候補返答をフロントで決め打ちしてもよい

## 修正した主要ファイル（Repo 側）

- `web/src/App.jsx`
- `web/src/difyChat.js`
- `web/src/styles.css`
- `web/src/agriFormat.js`（追加）
- `data/exports/agri_fields_summary.csv`
- `data/boundaries/agri-fields-boundary.geojson`（追加）
- `web/public/boundaries/agri-fields-boundary.geojson`（追加）
- `web/public/exports/agri_fields_summary.csv`（追加）
- `web/scripts/dify-proxy.mjs`
- `web/scripts/railway-server.mjs`

## Dify 側で実施済みの調整（手動）

- `質問分類器`: `sys.query` ベースで分岐運用中
- `知識検索`: `agri-rag` 参照
- `コード実行2`: 知識検索結果 + `agri_context` を受け、候補を構造化
- `LLM3`: `コード実行2.result` を根拠に短い候補回答を生成
- `回答` ノード: 検証時は `LLM3` 優先で確認
- `agri_pesticide_catalog.csv` チャンク編集（`ムシラップ` の `dosage_l_per_10a` を修正）

## 未完了タスク（次担当向け）

1. Web 実送信時の Dify 最終挙動確認
2. `LLM2` / `LLM3` の最終統合方針（分岐統合か単一応答か）確定
3. `agri_pesticide_catalog.csv` の RAG データ拡充
4. `dosage_l_per_10a` が範囲値（例: `100-300`）の場合の deterministic 計算ノード追加
5. 画像入力（Vision）を Workflow 入力に正式接続
6. 回答テンプレートの統一（候補農薬・根拠・次アクション）
7. GIS 質問の intent route 設計

### 3 の具体タスク（RAG データ拡充）

- `ヨトウムシ類` x 対象作物の候補農薬行を追加（`product_name`, `dosage_l_per_10a`, `dilution_ratio`, `source_url` を必須化）
- `ハモグリバエ類` x 対象作物の候補農薬行を追加
- `イネミズゾウムシ類` x 対象作物の候補農薬行を追加
- 病害シナリオを 1 本追加（`field_001` を病害寄りケースとして運用し、病名に対応する候補農薬を RAG で引けるようにする）
- 追加後に Dify ナレッジ再インデックスし、`コード実行2` の `matched_products` でヒットを確認

### 4 の具体タスク（GIS 質問強化）

- 近接: `この圃場の周辺で病害虫圧が高い圃場は？`
- 隣接: `隣の圃場に病害虫が出ているなら注意したい`
- 比較: `与田浦北と与田浦東、どちらを先に見に行くべき？`
- 空間条件: `川沿いの圃場だけ表示して`
- バッファ: `病害虫圃場の周辺 200m を注意区域にする`

### 病害シナリオ化のメモ

- 暫定運用: `target_pest` に病名（例: `うどんこ病`）を入れて既存フロー互換で進める
- 次フェーズ: `target_issue_type` (`pest` / `disease`) と `target_issue` の導入を検討
- `field_001` の観察事項は病害疑いを示す文面へ寄せ、病害→対応農薬のデモ導線を明確化

## 明日の実装計画

### フェーズ1: 安定化（最優先）

- Dify Workflow の最終回答ノード設計を確定
- `pest_recommendation` パスを E2E で再検証

### フェーズ2: 計算の決定論化

- `dosage_l_per_10a` / `dilution_ratio` をコードノードで解釈
- 面積連動の必要散布液量・必要薬量を deterministic で返す

### フェーズ3: Vision 統合

- 画像入力を受けて害虫候補抽出
- `target_pest` が空のときの補完ルートを設計

### フェーズ4: GIS 質問の intent route 追加

- 距離・隣接・比較・範囲指定の質問を Dify 前に判定する
- 幾何計算はフロントまたは軽量ヘルパーで確定する
- Dify には結果の要約だけを渡す

## 明日再開するときの手順（Mac / Windows 共通）

1. リポジトリ同期
   - `git pull --rebase`
2. Node バージョン確認
   - `nvm use 24.13.1`
3. Web 起動
   - `cd web`
   - `npm run dev -- --host 127.0.0.1 --port 5173`
4. Proxy 起動（別ターミナル）
   - `cd web`
   - `node scripts/dify-proxy.mjs`
5. 疎通確認
   - `http://127.0.0.1:8787/healthz`
   - フロントで圃場選択 → 質問送信

## 注意点

- QGIS 正本と `web/public` 配信用ファイルは必ず同期すること
- `field_id` を変更しないこと（結合キー）
- Dify 側の KB 編集後は、古いチャンク混在に注意して再確認すること
