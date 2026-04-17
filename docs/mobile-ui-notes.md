# Mobile UI Notes

このメモは、Mac 側でプロジェクトを開いたときに、モバイル実装の意図と工夫点をすぐ追えるようにまとめたものです。

## Summary

モバイル版は、地図から下部モーダル、チャットへ進む流れを中心に整理しました。

- 地図でエリアを選ぶ
- 下部モーダルで要点を見る
- チャット専用画面で質問する
- `←地図へ戻る` で元の地図に戻る

## What Was Optimized

### 1. Mobile-first information hierarchy

モバイルでは、画面の密度を揃えすぎず、役割ごとに文字サイズを分けました。

- 見出し: 少し大きめ
- 説明文: 本文より1段小さめ
- 補助文: さらに小さめ
- 件数一覧: 補助文以下の扱い

### 2. Bottom modal instead of popup card on mobile

ポリゴンタップ時の詳細は、地図上のポップアップカードではなく、下から出るモーダルに寄せました。

理由:

- 画面の情報が重複しにくい
- スマホで指が届きやすい
- 地図の文脈を保ちやすい

モバイルでは、地図上に常設のポップアップカードは出しません。

### 3. Touch behavior

モバイルの詳細モーダルは次の操作で閉じられます。

- `×` ボタン
- モーダル外のタップ

先頭のノッチ風の飾りは、見た目だけで触れないため削除済みです。

### 4. Chat input and send button

スマホでは、入力欄の右側に送信ボタンを独立して置いています。

- キーボード側の送信キーに依存しない
- 送信ボタンは常設
- SVG は `web/src/icons/send-plane.svg`

送信ボタンは入力欄カードの中には入れず、右側に分離しています。

### 5. Counts list with icons

モバイルの件数一覧は、各行の先頭にアイコンを置いています。

- 黒寄りの文頭アイコン
- ラベル
- 件数

PC 側のポップアップ表示は触らず、モバイルのモーダルだけに反映しています。

## Typography Scale Used on Mobile

アクセシビリティと画面密度のバランスを見て、次の考え方にしています。

- 主要見出し: `1.1rem` 前後
- エリア名: `1.08rem` 前後
- 説明文: `0.92rem` から `0.95rem`
- 補助文: `9px` から `10px`
- チャット本文: `1rem`
- 入力欄文字: `1rem`
- 件数一覧: `0.8rem` 前後

## Files to Check

- [web/src/App.jsx](/C:/github/qgis-dify-tourism-poc/web/src/App.jsx)
- [web/src/icons/ai-sparkle.svg](/C:/github/qgis-dify-tourism-poc/web/src/icons/ai-sparkle.svg)
- [web/src/icons/send-plane.svg](/C:/github/qgis-dify-tourism-poc/web/src/icons/send-plane.svg)
- [docs/stitch-mobile-spec.md](/C:/github/qgis-dify-tourism-poc/docs/stitch-mobile-spec.md)

## Implementation Notes

- Desktop layout is kept intact behind the `lg` breakpoint
- Mobile-only changes live in the `lg:hidden` branch
- The current `master` branch includes the mobile refinements

## Workflow That Worked Well

今回のモバイル改善は、次の流れが特に有効でした。

1. Stitch でまずモバイルの全体像をつかむ
2. Ai Studio に寄せて、実装に近い形で試す
3. GitHub 経由で Codex に確認してもらう
4. 画面を見ながら、見た目と挙動を少しずつ詰める

この流れの良かった点は、最初からコードだけで詰めずに、

- 先に UI の当たりを取れる
- GitHub 経由で変更履歴を残しやすい
- Codex にレビューさせて PC 側を壊していないか確認できる
- macOS 側でも同じ流れを再現しやすい

というところです。

Stitch は「方向づけ」、Ai Studio は「実装の試作」、GitHub は「共有と確認」の役割に分けると、作業がかなりやりやすくなりました。

## Validation

- `npm run build` passes
- Railway deploys from `master`
