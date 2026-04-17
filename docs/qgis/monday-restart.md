# 月曜日のQGIS再開メモ

## いまの到達点

- 新規の Agri 用 QGIS プロジェクトを作成した
- プロジェクト名は `qgis/agri-fields-poc-agri.qgz`
- CRS は `EPSG:6677` にした
- 背景地図として `OSM` を追加した
- 作業場所は、与田浦周辺の畑が見える状態まで寄せた
- `agri_fields_boundary` の作業用レイヤーを作った
- 属性列は次のものを追加済み
  - `field_id`
  - `field_name`
  - `field_type`
  - `owner_name`
  - `crop_type`
  - `last_pesticide_date`
  - `soil_ph`
  - `management_note`
  - `rotation_status`
  - `pest_pressure_note`

## いまの作業状況

- 1つ目のポリゴンはまだ本格的に確定していない
- ただし、データを入れるための器はできている
- 月曜日はここから続ける

## 月曜日の最初の手順

1. `qgis/agri-fields-poc-agri.qgz` を開く
1. `agri_fields_boundary` レイヤーがあることを確認する
1. `OSM` を背景にして、与田浦周辺の畑を表示する
1. `agri_fields_boundary` を編集モードにする
1. 1つ目のポリゴンを描く
1. 1件分の属性を入れる
1. まずは保存する

## 5件分の入力メモ

5つの畑の入力方針は [docs/qgis/field-input-plan.md](C:/github/agri-gis/docs/qgis/field-input-plan.md) に置いた。

## 月曜日に必ずやること

1. その地域で取れる実データを混ぜるかどうかを判断する
1. 混ぜるなら、どの列を実データにするか決める
1. 仮置きで残す列を決める
1. 5件の入力値を実データと仮置きの組み合わせでそろえる
1. そのうえでポリゴンを進める

## 1件目の仮入力の候補

- `field_id`: `field_001`
- `field_name`: `与田浦`
- `field_type`: `managed_field`
- `owner_name`: `田中`
- `crop_type`: `mixed_crop`
- `last_pesticide_date`: 空欄
- `soil_ph`: 空欄
- `management_note`: `routine management`
- `rotation_status`: `current`
- `pest_pressure_note`: `none observed`

## 次にやること

- 1つ目のポリゴンを確定する
- 残り4つのポリゴンを同じ地域で作る
- `area_ha` を後で計算する
- 必要なら `agri_context` 用の列名をさらに整える
