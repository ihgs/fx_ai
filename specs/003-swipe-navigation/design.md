# 画面スワイプによる切り替え — Design

## Tech Stack Versions
spec 001/002 のバージョン系列・依存構成をそのまま踏襲する。**新規の依存パッケージは追加しない**
（CSSの`scroll-snap`とブラウザ標準の`scroll`イベントだけでスワイプを実現するため、スワイプ用ライブラリは不要）。

## Architecture

**方針**: 3画面（現在値・チャート・分析プレースホルダー）を**同時にマウントしたまま**、横方向の
CSS `scroll-snap`コンテナで並べる。スワイプ＝ネイティブのタッチスクロールそのものなので、
JSでのタッチイベント処理が不要になる。3画面とも常にマウントされたままなので、画面を切り替えても
アンマウント／再フェッチが起きず、Req 1.4（状態保持）が構造的に満たされる。

- **ルーティングの変更**: 現状 `/`（現在値）と `/chart`（チャート）が別ルートになっているが、
  本specで**1つのページ（`/`）に統合**する。`/chart` ルートは廃止する（まだ本番公開前のため、
  リダイレクト等は用意しない）。
- `app/page.tsx`: スワイプコンテナ本体。`<SwipeContainer>` に3つの画面を子として並べる:
  `<CurrentRateScreen />` → `<ChartScreen />` → `<AnalysisPlaceholder />`（Req 1.1の順序）。
- `components/SwipeContainer.tsx`: 横スクロール＋`snap-x snap-mandatory`のコンテナ。
  `onScroll`でスクロール位置から現在のインデックスを算出し、`SwipeIndicator`に渡す。
  インジケーターのタップで対象スライドへ`scrollTo({ behavior: "smooth" })`する（Req 2.1）。
- `components/SwipeIndicator.tsx`: 画面下部に固定表示するドット。現在位置をハイライトし、
  タップで`onSelect(index)`を呼ぶプレゼンテーション用コンポーネント（Req 1.2, 2.1）。
- `components/CurrentRateScreen.tsx`: 既存 `app/page.tsx` の中身（`RateCard`+fetchロジック）を
  そのまま移設。外側の`<main>`ラッパーは外し、`SwipeContainer`が提供するスライド領域に収める。
- `components/ChartScreen.tsx`: 既存 `app/chart/page.tsx` の中身（期間セレクター+`RateChart`+
  fetchロジック）をそのまま移設。同様に外側の`<main>`は外す。
- `components/AnalysisPlaceholder.tsx`: 「準備中」の静的表示（spec 004 導入までのプレースホルダー、
  Req 1.3）。ダークテーマを踏襲。

## Data Model / Types
新規のデータモデルなし（既存の`UsdJpyRate` / `RateChartPoint`をそのまま使う）。

## UI Components (Storybook)
- `SwipeIndicator`: 3ドット中0/1/2番目がアクティブの3状態をstoryで再現する（layoutは`fullscreen`、
  viewportはこれまで同様iPhone SE相当）。
- `SwipeContainer`自体は実データ依存の子を並べる構成のため、storyでは3色のダミーブロックを
  子に入れた最小構成のみ用意し、実際のスワイプ・インジケーター連動の確認は`ui-check`と
  `next dev`での手動確認で行う。
- `CurrentRateScreen` / `ChartScreen`は中身が spec 001 / 002 の`RateCard` / `RateChart`の
  storyで既にカバーされているため、新たなstoryは作らない（画面全体としての統合確認は
  `next dev`での手動確認に委ねる）。

## Key Files
- `app/page.tsx`（スワイプコンテナに書き換え）
- `app/chart/page.tsx`（削除。中身は`components/ChartScreen.tsx`に移設）
- `components/SwipeContainer.tsx`, `components/SwipeIndicator.tsx`, `components/SwipeIndicator.stories.tsx`
- `components/CurrentRateScreen.tsx`（`app/page.tsx`から移設）
- `components/ChartScreen.tsx`（`app/chart/page.tsx`から移設）
- `components/AnalysisPlaceholder.tsx`

## Error Handling / Edge Cases
- `CurrentRateScreen` / `ChartScreen`のエラーハンドリングはspec 001/002のものをそのまま維持する
  （本specでは変更しない）。
- スクロール位置からインデックスを算出する際、端末の慣性スクロールで一時的に中間値になっても
  最も近いスライドに丸める（`Math.round`）ことで、インジケーターの表示が暴れないようにする。
- 指を離すまでは自然に追従してよいが、離した瞬間は必ず隣の画面にきちんとスナップする必要がある
  （実機確認で発覚: 指定なしだと斜め方向の指の動きが縦スクロールと誤認識されたり、素早いフリックで
  スナップ位置を飛ばして中途半端な位置に止まることがあった）。`touch-pan-x`（`touch-action`を
  横方向のみに限定）と各スライドへの`scroll-snap-stop: always`（フリック時にスナップ位置を
  飛ばさない）で対応する。あわせてモバイルブラウザのアドレスバー表示/非表示による高さのズレを
  避けるため、コンテナの高さは`h-screen`（100vh）ではなく`h-dvh`（動的ビューポート高さ）にする。

## Testing Approach
- `next build`（内蔵TypeScriptチェック含む）
- `SwipeIndicator`はStorybook storyで3状態を再現し、`ui-check`で目視確認する。
- スワイプ全体の動作（3画面が同時にマウントされたまま切り替わること、チャートの選択期間が
  スワイプ後も保持されること）は`next dev`を起動し、実際にスクロール/インジケーターのタップで
  画面を切り替えて手動確認する（自動テストは導入しない。軽量に保つ）。
