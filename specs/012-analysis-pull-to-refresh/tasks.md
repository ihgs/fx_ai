# 012 分析画面のプル更新 (analysis-pull-to-refresh) — Tasks

- [x] 1. `components/PullIndicator.tsx`（presentational）と `components/PullIndicator.stories.tsx` を作成する（`Pulling` / `Ready` / `Refreshing` の各状態）（Req: 1.1, 1.2, 1.4 / Design: UI Components (Storybook) / PullIndicator）

- [x] 2. `components/PullToRefresh.tsx`（"use client" タッチジェスチャー検知・スクロールコンテナ）と `components/PullToRefresh.stories.tsx`（idleのみの1story）を作成する。しきい値判定・引っ張り量の減衰・`disabled`中/`refreshing`中の無視・`touchmove`の`preventDefault`（ネイティブリスナー）を実装する（Req: 1.1, 1.2, 1.3, 1.7, 1.8 / Design: Architecture, Error Handling / Edge Cases）

- [x] 3. `components/AnalysisResults.tsx` のルートdivを「スクロール担当（`PullToRefresh`に委譲）」と「レイアウト担当（自身に残す）」に分割し、`refreshError` propとその表示（既存`runError`と同様の`role="alert"`スタイル）を追加する。`components/AnalysisResults.stories.tsx` の既存storyに `refreshError: null` を追加し、新規に `RefreshError` story（`listState`は`loaded`のまま`refreshError`のみエラー文言）を追加する（Req: 1.6 / Design: Data Model, UI Components (Storybook) / AnalysisResults）

- [x] 4. `components/AnalysisScreen.tsx` を `<PullToRefresh onRefresh={...} disabled={isRunning}>` で包み、`refreshError` stateと `handlePullRefresh`（`loadResults()`を再利用し、成功時は`listState`を差し替えてクリア、失敗時は`listState`を維持し`refreshError`にメッセージをセット）を実装する。開発サーバーで`/`を開き、分析画面で実際にプル操作（Playwrightのtouchscreenエミュレーション等）を行い、しきい値超えで一覧が更新されること・しきい値未満やスクロール途中では発火しないこと・AI分析実行中は無効化されることを確認する（Req: Story 1 全体 / Design: Architecture, Error Handling / Edge Cases）

- [x] 5. `ui-check` で `PullIndicator` / `PullToRefresh` / `AnalysisResults`（`RefreshError`含む）の全storyを目視確認し、`npm run lint` / `tsc --noEmit` / `npm run build` を実行して問題がないことを確認する（Design: Testing Approach）
