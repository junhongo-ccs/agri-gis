# QGIS × Dify | 観光GIS PoC

QGIS で観光空間データを作り、Dify で会話する PoC です。  
地図を見ながらエリアを選び、右側チャットで観光の話を聞く体験を、CSV と構造化コンテキストでつないでいます。

## Overview

この PoC では、まず QGIS で観光空間データの基礎となるポリゴンを作り、各エリアについてカフェ・レストラン・ホテル・駅などの件数や密度を集計して CSV として書き出します。フロントエンドはその CSV を読み込み、地図上のエリア表示と右側チャットで使う基礎データに変換します。ユーザーが地図上でエリアを選んで質問すると、フロントが選択エリア情報・比較対象・指標値・質問文をまとめた `tourism_context` という JSON を生成し、Dify 互換 API に POST します。Dify はその構造化データを根拠として自然文の回答を返し、フロントはその返答をチャット欄に表示します。

つまり、QGIS で作った空間集計結果を CSV 経由で Web UI に載せ、LLM には自由文ではなく構造化コンテキストを渡して説明させる構成です。  
現在の UI は、デスクトップでは左に地図、右に会話を置く分割を基本にしつつ、モバイルでは「地図 -> 下部モーダル -> チャット -> 地図へ戻る」の流れに切り替えています。

## Mobile Flow

モバイルでは、画面の密度を抑えながら、次の順番で操作できるようにしています。

1. 地図で観光エリアを選ぶ
2. 下部モーダルで件数や要点を見る
3. `チャットでたずねる` で専用チャットに移動する
4. `←地図へ戻る` で地図に戻る

モバイルでの工夫点は [docs/mobile-ui-notes.md](docs/mobile-ui-notes.md) にまとめています。

## Why CSV Matters

CSV を中間成果物にしているのがこの構成の重要な点です。今後精度向上のために指標を増やしたい場合でも、まず QGIS 側で列を追加する形で拡張できます。どの項目が増えたかが表形式ではっきり見えるので、GIS 処理の変更点を追いやすく、フロント側も新しい列を読み込んで `tourism_context` に載せれば対応できます。Dify 側もその追加項目を新しい根拠として解釈できるため、GIS 処理、Web 表示、LLM 入力が疎結合に保たれます。

結果として、分析指標の追加、解釈ロジックの改善、説明精度の向上を段階的に進めやすい構成になっています。

## Flow

1. QGIS で観光エリアのポリゴンを作成する
2. エリアごとの件数・密度を集計し、CSV を出力する
3. `web/` が CSV を読み込み、地図表示用データとチャット文脈を生成する
4. ユーザーの質問時に `tourism_context` を Dify 互換 API へ送信する
5. Dify の回答を右側チャットに表示する

## Repository Structure

- `qgis/`
  QGIS プロジェクトファイル
- `data/`
  集計元データ、境界データ、CSV エクスポート
- `web/`
  React + Vite の地図 UI と Dify 右レール
- `web/debug-width/`
  ブラウザ幅確認用の最小ページ
- `docs/`
  設計メモ、プロンプト、運用チェックリスト

## Local Setup

前提:

- Node `24.13.1` 以上
- `nvm` 推奨

注意:

- `web/` は Node 14 では起動できません
- Vite と依存パッケージが新しい Node 構文を使うため、Node 14 のままでは `npm ci` や `npm run dev` が失敗します

Web UI 起動:

```bash
nvm use
cd web
nvm use
cp -n .env.example .env
npm ci
npm run dev
```

ブラウザ確認先:

- `http://localhost:5173/`

## Windows Notes

会社支給 PC などで既定の Node が 14 系でも、このリポジトリ専用に Node 24 系を使えれば開発できます。現実的な方法は次の 2 つです。

### Option 1: nvm-windows を使う

Windows の既定 Node を直接置き換えず、プロジェクト用に Node 24 を追加する方法です。

```bash
nvm install 24.13.1
nvm use 24.13.1
cd web
npm ci
npm run dev
```

### Option 2: WSL2 を使う

Windows 側の Node が 14 のままでも、WSL2 上で Node 24 を使えば問題ありません。Node の切り替えや依存解決で詰まりにくいので、安定運用しやすい選択です。

WSL2 側で:

```bash
nvm install 24.13.1
nvm use 24.13.1
cd web
npm ci
npm run dev
```

要するに、Windows PC でも開発は可能ですが、Node 14 固定のまま `web/` を動かすのは非現実的です。このプロジェクト用に Node 24 系を併用してください。

## Dify Proxy

Dify 接続まで含めて確認する場合:

```bash
cd web
nvm use
cp -n .env.proxy.example .env.proxy
npm run dify:proxy
```

必要な環境変数:

- `DIFY_API_KEY`
- `DIFY_API_BASE_URL`
- `DIFY_APP_PATH`

ローカル開発では `VITE_DIFY_CHAT_ENDPOINT=/api/dify/chat` を想定しています。

## Key Files

- `qgis/phase1-tourism-poc.qgz`
- `data/exports/phase1_areas_summary_counts.csv`
- `web/src/App.jsx`
- `web/src/difyChat.js`
- `web/scripts/dify-proxy.mjs`

## Key Docs

- `docs/poc-design.md`
- `docs/dify-right-rail.md`
- `docs/dify-setup-checklist.md`
- `docs/railway-deploy.md`
- `docs/progress-and-next-steps.md`
- `docs/company-pc-view-plan.md`
- `docs/company-pc-view-implementation-plan.md`
- `docs/company-pc-view-revision-plan.md`
- `docs/mobile-ui-notes.md`
- `docs/stitch-mobile-spec.md`
