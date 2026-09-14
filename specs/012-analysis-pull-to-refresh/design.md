# 012 分析画面のプル更新 (analysis-pull-to-refresh) — Design

## Architecture

外部ライブラリは使わず、素のTouch Eventsで実装する。ジェスチャー処理と見た目を分離し、既存の`SwipeContainer`/`SwipeIndicator`の分担（ジェスチャーを持つコンテナ + 見た目だけのインジケーター）に倣う。

```
components/
  PullIndicator.tsx      # presentational（矢印/スピナー、Storybook対象）
  PullToRefresh.tsx       # "use client" 汎用ラッパー（タッチ検知・スクロール担当）
  PullToRefresh.stories.tsx
  AnalysisResults.tsx     # 変更: スクロール担当をPullToRefreshに委譲、refreshErrorのUIを追加
  AnalysisScreen.tsx      # 変更: <PullToRefresh>で包み、handlePullRefreshを実装
```

`PullToRefresh`は`children`を受け取る汎用コンポーネントとして書くが、実際に使うのは分析画面のみ（Req外の画面には組み込まない）。

### スクロール担当の移動

現在`AnalysisResults`のルートdivが`h-full w-full overflow-y-auto`を持ち、スクロールコンテナを兼ねている。プル判定には「スクロールが一番上か」をこのスクロールコンテナで見る必要があるため、スクロールコンテナの所有権を`PullToRefresh`に移す:

- `PullToRefresh`: `<div className="relative h-full w-full overflow-hidden">`（外枠、clip用）の中に、インジケーター用の絶対配置領域と、`overflow-y-auto`を持つ実スクロールdiv（`ref`で参照）を持つ。
- `AnalysisResults`: ルートdivから`h-full w-full overflow-y-auto`を外し、内側のレイアウト（`flex flex-col items-center gap-4 p-6`）のみ残す。

## Data Model / Types

新規のサーバー側データ型は無し。既存の`GET /api/analysis`（`AnalysisResultItem[]` / `AccuracyStat[]`）をそのまま再利用する。

```ts
// components/PullIndicator.tsx
export type PullPhase = "pulling" | "ready" | "refreshing";
export type PullIndicatorProps = {
  phase: PullPhase;
  progress: number; // 0〜1。pulling/readyの矢印回転・不透明度に使う
};

// components/PullToRefresh.tsx
export type PullToRefreshProps = {
  onRefresh: () => Promise<void>; // 例外を投げない前提（失敗時の表示は呼び出し元が状態として持つ）
  disabled?: boolean; // 例: AI分析実行中
  children: ReactNode;
};

// components/AnalysisResults.tsx への追加
export type AnalysisResultsProps = {
  // ...既存フィールド
  refreshError: string | null; // プル更新失敗時のみセット。listState自体は直前の値を維持する
};
```

## API Contract

変更なし。プル更新は既存の`GET /api/analysis`を再実行するだけ（`AnalysisScreen`の初回ロードと同じ`loadResults()`を再利用）。

## UI Components (Storybook)

### `PullIndicator`（presentational）
Props: `{ phase, progress }`
Stories: `Pulling`（`progress: 0.5`）/ `Ready`（`progress: 1`、しきい値到達）/ `Refreshing`（スピナー表示）。

### `PullToRefresh`（"use client" ジェスチャーコンテナ）
実タッチジェスチャーはStorybookでは再現しないため、`SwipeContainer.stories.tsx`と同じ方針で、デフォルト（idle、子要素をそのまま表示）の1storyのみ用意する。

### `AnalysisResults`（既存コンポーネントの変更）
既存storyに加え、`refreshError`がセットされた状態の`RefreshError`storyを追加する（`listState`は`loaded`のまま、`refreshError`のみエラーメッセージが入っている状態）。

いずれもモバイル前提（`globals: { viewport: { value: "mobilePortrait" } }`、既存`AnalysisResults.stories.tsx`の方針を踏襲）。

## Key Files

- 追加: `components/PullIndicator.tsx`, `components/PullIndicator.stories.tsx`
- 追加: `components/PullToRefresh.tsx`, `components/PullToRefresh.stories.tsx`
- 変更: `components/AnalysisResults.tsx`（ルートdivのクラス分割、`refreshError`prop・表示追加）
- 変更: `components/AnalysisResults.stories.tsx`（`RefreshError` story追加、既存storyの`args`に`refreshError: null`追加）
- 変更: `components/AnalysisScreen.tsx`（`<PullToRefresh>`で包む、`refreshError` state・`handlePullRefresh`追加）

## Error Handling / Edge Cases

- **スクロール途中（scrollTop > 0）での下方向ドラッグ**: 通常のスクロールとして扱う。`touchmove`で`scrollTop > 0`と分かった時点で`preventDefault()`を呼ばず、プル状態にも入らない（Req 1.7）。
- **`preventDefault`の実装上の注意**: Reactの`onTouchMove`はデフォルトでpassiveリスナーとして登録されるため`preventDefault()`が効かない。`useEffect`内で`scrollRef.current.addEventListener("touchmove", handler, { passive: false })`のようにネイティブリスナーを張り、プル中のみ`preventDefault()`する。
- **`disabled`中（AI分析実行中）または既に`refreshing`中の再ドラッグ**: `touchstart`時点で無視し、ジェスチャーを開始しない（Req 1.8、二重発火防止）。
- **しきい値未満で指を離した**: `transform`をtransition付きで`translateY(0)`に戻すだけで`onRefresh`は呼ばない（Req 1.3）。
- **プル更新の失敗**: `listState`は直前の値を維持したまま`refreshError`のみセットし、`AnalysisResults`内に既存の`runError`と同様の`role="alert"`スタイルで表示する（Req 1.6）。次回の`handleRunAnalysis`成功時・再度のプル更新成功時にクリアする。
- **PC（マウス操作）**: touchイベントが発火しないため機能自体が起動しない。Out of Scope通りPC代替なし。

## Testing Approach

- ジェスチャー計算（しきい値判定・引っ張り量の減衰計算）は`PullToRefresh`内に閉じた小さいロジックのため、個別のユニットテストは設けず`tsc --noEmit` / `npm run build`で型・ビルドエラーを検出する（既存`lib/db.ts`等と同様の扱い）。
- `PullIndicator`はStorybook storyで`pulling`/`ready`/`refreshing`の各状態を再現し、`ui-check`で目視確認する。
- `PullToRefresh`・`AnalysisResults`（`RefreshError`含む）もstoryを追加し、`ui-check`でレイアウト崩れが無いか確認する。
- 実タッチジェスチャーの動作確認は、開発サーバー起動後にPlaywrightのtouchscreenエミュレーション（`hasTouch: true`のコンテキストで`touchscreen.tap`/座標指定のtouch操作）を使い、実際にプル→更新が発火すること・しきい値未満では発火しないことを確認する。
- 最低限`npm run lint` / `tsc --noEmit` / `npm run build`を実装完了時に実行する。
