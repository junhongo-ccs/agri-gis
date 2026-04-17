# QGIS フィールド入力プラン

## 目的

月曜日に 5 つのフィールドポリゴンを作るとき、1つ目の入力方針を残りの 4 つへ揃えるためのメモです。

このメモでは、実データとして入れる欄と、仮置きで進める欄の両方を月曜日に見直す前提にする。

## 共通ルール

- 5 つのフィールドは同じ地域の近くで作る
- いきなり遠くへ散らさない
- 分からない値は無理に埋めず、空欄にする
- `demo_*` のような露骨なデモ語は使わない
- できるだけ業務データっぽい自然な語にする
- 実データとして入れられる欄は、月曜日にその場で差し込む
- 仮置きのままにする欄も、月曜日に明示する

## 1件目

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

## 2件目

- `field_id`: `field_002`
- `field_name`: 近くの地名や区画名
- `field_type`: `managed_field`
- `owner_name`: `田中`
- `crop_type`: `mixed_crop`
- `last_pesticide_date`: 空欄
- `soil_ph`: 空欄
- `management_note`: `routine management`
- `rotation_status`: `current`
- `pest_pressure_note`: `none observed`

## 3件目

- `field_id`: `field_003`
- `field_name`: 近くの地名や区画名
- `field_type`: `managed_field`
- `owner_name`: `田中`
- `crop_type`: `mixed_crop`
- `last_pesticide_date`: 空欄
- `soil_ph`: 空欄
- `management_note`: `routine management`
- `rotation_status`: `current`
- `pest_pressure_note`: `none observed`

## 4件目

- `field_id`: `field_004`
- `field_name`: 近くの地名や区画名
- `field_type`: `managed_field`
- `owner_name`: `田中`
- `crop_type`: `mixed_crop`
- `last_pesticide_date`: 空欄
- `soil_ph`: 空欄
- `management_note`: `routine management`
- `rotation_status`: `current`
- `pest_pressure_note`: `none observed`

## 5件目

- `field_id`: `field_005`
- `field_name`: 近くの地名や区画名
- `field_type`: `managed_field`
- `owner_name`: `田中`
- `crop_type`: `mixed_crop`
- `last_pesticide_date`: 空欄
- `soil_ph`: 空欄
- `management_note`: `routine management`
- `rotation_status`: `current`
- `pest_pressure_note`: `none observed`

## 使い方

2〜5件目は、1件目の値をそのまま並べたうえで、`field_id` だけを連番にする。

- `field_name` は、それぞれ近くの見える地名や区画名にする
- `owner_name` は同じ `田中` でよい
- `crop_type` は同じ `mixed_crop` でよい
- `management_note` は同じ `routine management` でよい
- `rotation_status` は同じ `current` でよい
- `pest_pressure_note` は同じ `none observed` でよい
- `last_pesticide_date` と `soil_ph` は、分からなければ空欄のままでよい

## 月曜日にやること

1. 5 つのポリゴンを近い場所で作る
1. まず 1 件目を確定する
1. 2〜5 件目は同じルールで繰り返す
1. `field_name` だけは現地図に見える地名を優先する
1. 実データとして入れる欄と仮置きで進める欄を切り分ける
1. 面積計算はあとでまとめてやる
