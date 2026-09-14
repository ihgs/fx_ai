# 013 現在レート画面のミニチャート (current-rate-mini-chart) — Design

## Architecture

既存の`RateChart`（軸・凡例・ツールチップ付きのフル機能チャート、ヒストリー画面用）とは別に、ラベル無しの軽量な`RateSparkline`を新設する。データ取得は既存の`GET /api/rate/usd-jpy/history`を「30分」レンジ対応させて再利用する（新規ルートは作らない）。

```
app/api/rate/usd-jpy/history/route.ts   # 変更: エラーメッセージ文言に30mを追加（ロジック自体はgetHistory(range)の汎用化で対応済み）

components/
  RateSparkline.tsx         # 新規 presentational（軸・凡例なしの線グラフ、Storybook対象）
  RateSparkline.stories.tsx
  RateCard.tsx               # 変更: landscape時のレイアウトを自己完結から親のflex行に委ねる形に変更
  CurrentRateScreen.tsx      # 変更: RateCardと並べてRateSparklineを配置するラッパーを追加、30分ヒストリーのポーリングを追加

lib/
  db.ts                      # 変更: RANGE_MS / HistoryRange に "30m" を追加
```

### レイアウト方針

現在`RateCard`はルートdivに`landscape:mx-auto landscape:max-w-2xl`を持ち、自分自身でlandscape時の最大幅・中央寄せを完結させている。`RateSparkline`を横に並べるため、この責務を親（`CurrentRateScreen`）に委ねる:

- `RateCard`: `landscape:mx-auto landscape:max-w-2xl` を外し、`landscape:flex-1 landscape:min-w-0` に変更する（親のflex行内で幅を分け合う）。
- `CurrentRateScreen`: `RateCard`と`RateSparkline`を`<div className="flex w-full flex-col gap-4 landscape:mx-auto landscape:max-w-4xl landscape:flex-row landscape:items-stretch">`で包む。portraitでは縦積み（Req 1.3）、landscapeでは横並び・概ね半々（Req 1.4）。`items-stretch`により`RateSparkline`の高さは`RateCard`と揃う。

## Data Model / Types

```ts
// lib/db.ts
const RANGE_MS = {
  "30m": 30 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
} as const;
// HistoryRange は自動的に "30m" | "1d" | "1w" | "1m" になる（既存のkeyof typeof RANGE_MSのまま）

// components/RateSparkline.tsx
export type RateSparklinePoint = { timestamp: string; bid: number };
export type RateSparklineProps =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "data"; points: RateSparklinePoint[] };
```

## API Contract

新規ルートは追加しない。既存の`GET /api/rate/usd-jpy/history?range=30m`がそのまま使えるようになる（`isValidRange`が`RANGE_MS`のキーを見て判定するため自動的に対応）。400時のエラーメッセージ文言のみ`"range must be one of: 30m, 1d, 1w, 1m"`に更新する。

## UI Components (Storybook)

### `RateSparkline`（presentational）
Props: `RateSparklineProps`（上記）。
rechartsの`<ResponsiveContainer>` + `<LineChart>` + `<Line>`のみを使い、`<XAxis>` / `<YAxis>` / `<CartesianGrid>` / `<Tooltip>` / `<Legend>`は一切使わない（Req 1.2）。`status: "empty"`のときは「データなし」等の簡潔な文言のみを中央に表示する。
Stories（既存`RateChart.stories.tsx`の規約に倣う）: `Loading` / `Empty` / `DataPortrait`（`mobilePortrait`） / `DataLandscape`（`mobileLandscape`）。

### `RateCard`（既存コンポーネントの変更）
見た目の大枠（loading/error/loadedの表示内容）は変更しない。landscape時の自己完結レイアウト（`mx-auto` + `max-w-2xl`）を、親コンテナが提供するflex行に委ねる形（`flex-1` + `min-w-0`）に変更する。既存の`LoadedLandscape`storyの見た目が変わらないことを`ui-check`で確認する。

いずれもモバイル前提（`layout: "fullscreen"`、既存`RateCard.stories.tsx`/`RateChart.stories.tsx`の方針を踏襲）。

## Key Files

- 追加: `components/RateSparkline.tsx`, `components/RateSparkline.stories.tsx`
- 変更: `lib/db.ts`（`RANGE_MS`に`"30m"`追加）
- 変更: `app/api/rate/usd-jpy/history/route.ts`（エラーメッセージ文言）
- 変更: `components/RateCard.tsx`（landscapeレイアウトの委譲）
- 変更: `components/CurrentRateScreen.tsx`（`RateCard`+`RateSparkline`のラッパー追加、30分履歴のポーリング追加）

## Error Handling / Edge Cases

- **データ0件**（起動直後でDBに30分ぶんのデータが無い等）: `{status: "empty"}`とし、`RateSparkline`は簡潔な空状態文言を表示する（Req 1.6）。
- **フェッチ失敗**: 既存`ChartScreen.tsx`の`loadHistory`と同じ方針で`{status: "empty"}`に畳み込む（専用のerror状態は持たない）。現在レート本体（`RateCard`）の表示・ポーリングには影響させない（Req 1.7）。
- **ポーリング**: 既存`CurrentRateScreen`の60秒interval・`visibilitychange`による開始/停止と同じサイクルに相乗りさせる（`poll()`内でレートと履歴の両方を取得）。専用のtimerは追加しない（Req 1.5）。
- **レイアウト**: portraitは`RateCard`の下に`RateSparkline`を縦積み、landscapeは横並びで概ね半々に分割し、`items-stretch`で高さを揃える。

## Testing Approach

- `RateSparkline`はStorybook storyで`Loading` / `Empty` / `DataPortrait` / `DataLandscape`を再現し、`ui-check`で目視確認する（軸・凡例が出ていないこと、portrait/landscapeそれぞれのレイアウトを含む）。
- `RateCard`のlandscapeレイアウト変更後も既存storyの見た目が崩れていないことを`ui-check`で確認する。
- `lib/db.ts`の`RANGE_MS`拡張は既存の`isValidRange`経由で動くため個別のユニットテストは設けない（`tsc --noEmit`で型を検証）。
- 実データでの確認: 開発サーバーで`CurrentRateScreen`を開き、実際に直近30分のレートが線グラフとして表示されること・portrait/landscapeでの配置切り替えをPlaywright等で確認する。
- 最低限`npm run lint` / `tsc --noEmit` / `npm run build`を実装完了時に実行する。
