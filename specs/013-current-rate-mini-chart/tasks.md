# 013 現在レート画面のミニチャート (current-rate-mini-chart) — Tasks

- [x] 1. `lib/db.ts` の `RANGE_MS` に `"30m": 30 * 60 * 1000` を追加し、`app/api/rate/usd-jpy/history/route.ts` のエラーメッセージ文言を `"range must be one of: 30m, 1d, 1w, 1m"` に更新する（Req: 1.1 / Design: Data Model, API Contract）

- [x] 2. `components/RateSparkline.tsx`（presentational、軸・凡例・ツールチップ無しの線グラフ）と `components/RateSparkline.stories.tsx`（`Loading` / `Empty` / `DataPortrait` / `DataLandscape`）を作成する（Req: 1.1, 1.2, 1.6, 1.7 / Design: UI Components (Storybook) / RateSparkline）

- [x] 3. `components/RateCard.tsx` のlandscapeレイアウトを自己完結（`mx-auto` + `max-w-2xl`）から親のflex行に委ねる形（`flex-1` + `min-w-0`）に変更する。既存storyの見た目が崩れていないことを確認する（Design: レイアウト方針, UI Components (Storybook) / RateCard）

- [x] 4. `components/CurrentRateScreen.tsx` を、`RateCard`と`RateSparkline`を並べる新しいラッパー（portrait縦積み・landscape横並び）に変更し、既存の60秒ポーリング・visibilitychange制御に相乗りする形で直近30分履歴の取得を追加する。開発サーバーで`/`を開き、実データでの表示とportrait/landscapeそれぞれのレイアウトを確認する（Req: 1.3, 1.4, 1.5, 1.6, 1.7 / Design: Architecture, Error Handling / Edge Cases）

- [x] 5. `ui-check` で `RateSparkline`（全4state）と`RateCard`（既存story、レイアウト変更後の目視回帰確認）を確認し、`npm run lint` / `tsc --noEmit` / `npm run build` を実行して問題がないことを確認する（Design: Testing Approach）
