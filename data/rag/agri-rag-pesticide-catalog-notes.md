# agri-rag-pesticide-catalog-notes

このノートは、Agri GIS PoC の RAG 応答を安定させるための運用用メモです。

## 運用方針

- 回答は必ず `agri_context` と Knowledge（RAG）だけを根拠にする
- `dosage_l_per_10a` が空のレコードは使わない
- 候補農薬名は、登録済みカタログの `product_name` だけを使う
- 根拠URLは `source_url` を短く添える

## 現行カタログ（2026-04-21）

データソース: `data/rag/agri_pesticide_catalog.csv`

### 病害シナリオ

1. 稲 / いもち病
- ブラシンフロアブル
- dosage_l_per_10a: 0.1
- dilution_ratio: 1000倍

2. 稲 / いもち病
- オリゼメート粒剤
- dosage_l_per_10a: 3.0
- dilution_ratio: 粒剤

3. 野菜類 / べと病
- リドミルゴールドMZ
- dosage_l_per_10a: 0.25
- dilution_ratio: 1000倍

4. 野菜類 / うどんこ病
- トリフミン水和剤
- dosage_l_per_10a: 0.033
- dilution_ratio: 3000倍

### 害虫シナリオ

1. 野菜類 / アブラムシ類
- スタークル顆粒水溶剤
- dosage_l_per_10a: 0.05
- dilution_ratio: 2000倍

2. 野菜類 / ハモグリバエ類
- アファーム乳剤
- dosage_l_per_10a: 0.05
- dilution_ratio: 2000倍

3. 野菜類 / ヨトウムシ類
- プレバソンフロアブル5
- dosage_l_per_10a: 0.02
- dilution_ratio: 4000倍

4. 稲 / イネミズゾウムシ類
- スタークル粒剤
- dosage_l_per_10a: 3.0
- dilution_ratio: 粒剤

## 回答テンプレート（推奨）

- 1段落目: 圃場サマリー（圃場名・面積・作物・土壌 pH・前回散布日・病害虫状況）
- 2段落目: 候補農薬（`product_name`）
- 3段落目: 注意点（必要なときのみ）

段落の間は空行を1つ入れる。

## 禁止

- カタログにない農薬名を出す
- `nan` や空値を計算済みの値として見せる
- 不足情報があるのに断定する

## 更新ルール

- カタログ更新時はこのノートも同時更新する
- Dify では旧版ノートのチャンクを無効化する
- 再インデックス後に必ず3問テストを行う
  - この圃場でまず見るべき点は？
  - いもち病の候補農薬を教えて
  - アブラムシ対策の候補は？
