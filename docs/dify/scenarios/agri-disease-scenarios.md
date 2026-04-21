# Agri Disease Scenarios for Dify + RAG

## 目的

- `agri_context` の圃場属性と、RAG カタログの病害/害虫候補を結びつける。
- 展示デモで「圃場サマリー -> 病害/害虫判断 -> 候補農薬提示」を安定再現する。

## 参照データ

- RAG投入用CSV: `data/rag/agri_pesticide_catalog.csv`
- 病害サンプルagri_context: `docs/dify/scenarios/agri-context-disease-field001.json`
- 圃場GeoJSON: `web/public/boundaries/agri-fields-boundary.geojson`

## シナリオ一覧（PoC運用）

1. `field_001`（病害シナリオ・主役）
- 圃場: 与田浦
- 作物: 水稲（target_crop: 稲）
- 想定事象: いもち病（target_issue_type: disease）
- 期待挙動: 圃場サマリーを先に出し、次段落で `ブラシンフロアブル` / `オリゼメート粒剤` を候補提示。

2. `field_003`（病害シナリオ・追加）
- 圃場: 与田浦東
- 作物: 野菜（target_crop: 野菜類）
- 想定事象: べと病（target_issue_type: disease）
- 期待挙動: サマリー後に病害候補を提示し、根拠URLを短く添える。

3. `field_002`（害虫シナリオ）
- 想定事象: アブラムシ類（target_issue_type: pest）

4. `field_004`（害虫シナリオ）
- 想定事象: ヨトウムシ類（target_issue_type: pest）

5. `field_005`（害虫シナリオ）
- 想定事象: イネミズゾウムシ類（target_issue_type: pest）

## Dify Knowledge 反映手順

1. Difyのナレッジベース `agri-rag` に `data/rag/agri_pesticide_catalog.csv` をアップロード。
2. 既存チャンクが競合する場合は、旧CSV由来の重複チャンクを無効化または削除。
3. 再インデックス後、次の条件でプレビュー検証。

注意:
- `source_url` はシード値です。展示運用前に一次情報URLへ差し替えてください。

## 動作確認クエリ（推奨）

1. 圃場サマリー系
- 「この圃場でまず見るべき点は？」

2. 病害系（field_001）
- 「病斑が広がっている。対応候補は？」
- 「いもち病の候補農薬を教えて」

3. 害虫系（field_002/004/005）
- 「アブラムシ対策の候補は？」
- 「ヨトウムシ対策の候補は？」
- 「イネミズゾウムシ対策の候補は？」

## 判定基準

- 空文字回答が出ない。
- 1段落目が圃場サマリー。
- 2段落目で候補農薬（`product_name`）を提示。
- 候補がない時だけ「判断できません」。
