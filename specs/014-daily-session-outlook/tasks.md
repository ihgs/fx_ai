# 014 デイリーセッション見通し (daily-session-outlook) — Tasks

- [x] 1. `lib/jst.ts` を新規作成し、`lib/weeklyHistory.ts`にある共通のJST日時ユーティリティ（`addDaysToDateString` / `parseDateString` / `formatDateString` / `dowOfDateString` / `jstWallClockToUtcIso` / `jstDateAndDow`等）をそこへ移す。`lib/weeklyHistory.ts`は`lib/jst.ts`を使うようリファクタする（exportする関数・挙動は変えない）。既存の`lib/weeklyHistory.test.ts`が引き続き通ることを確認する（Design: Architecture / lib/jst.ts）

- [x] 2. `lib/analyzeRate.ts` のGeminiクライアント・出力スキーマ・JSON変換ヘルパーをexportし、`lib/dailyOutlook.ts`から再利用できるようにする（動作変更なし）（Design: Key Files / lib/analyzeRate.ts）

- [x] 3. `lib/db.ts` に `getLatestAnalysisResultByMethod` / `hasAnalysisResultForDateAndMethod` / `getRecentAnalysisResults`（`method LIKE 'daily-%'`を除外）を追加する（Design: Data Model / lib/db.ts）

- [x] 4. `lib/dailyOutlook.ts` を新規作成する: セッション定義（東京/ロンドン/NY）、`previousBusinessDayJst`、セッション時間範囲→UTC変換、`getCandlesInRange`を使ったセッション別統計計算、プロンプト生成、`runDailyOutlookForSession` / `runDailyOutlook`（重複防止・セッション単位の失敗分離・前営業日データ0件時のスキップを含む）を実装する。`lib/dailyOutlook.test.ts`で純粋関数部分（`previousBusinessDayJst`、セッション統計計算等）をユニットテストする（Req: 1.1, 1.2, 1.4, 1.5, 1.6 / Design: Architecture, セッション定義とデータ集計, Error Handling / Edge Cases）

- [x] 5. `instrumentation.ts` に、毎分JST 6:30到達をチェックする新しい`setInterval`を追加する（土日はスキップする専用の曜日判定を使う。既存の`isJstWeekendMarketClosed`は使わない）。到達時に`runDailyOutlook`を呼び出す（Req: 1.1, 1.3 / Design: Error Handling / Edge Cases 土日判定）

- [x] 6. `app/api/analysis/route.ts` のGETレスポンスに`dailyOutlook`（東京/ロンドン/NYそれぞれの最新1件、`judgeOutcome`適用済み）を追加し、`results`を件数制限から直近7日間の日付範囲制限（`method LIKE 'daily-%'`除外、安全上限付き）に変更する（Req: 2.1, 2.2, 2.3, 2.4 / Design: API Contract）

- [x] 7. `components/DailySessionOutlook.tsx`（presentational）と `components/DailySessionOutlook.stories.tsx`（`Empty` / `AllGenerated` / `Partial`）を作成する（Req: 2.1, 2.4, 2.5 / Design: UI Components (Storybook) / DailySessionOutlook）

- [x] 8. `components/AnalysisResults.tsx`（`DailySessionOutlook`をリスト上部に表示、`dailyOutlook`props追加）・`components/AnalysisResults.stories.tsx`（story更新）・`components/AnalysisScreen.tsx`（APIレスポンスの`dailyOutlook`を状態に反映）を実装する。実DBに前営業日ぶんのダミーcandleを投入して`runDailyOutlook`を直接呼び出し、3セッション分のレコードが作られること・分析ページ先頭に表示されること・直近1週間分の一覧が表示されることを開発サーバーで確認する（確認用データは確認後に削除する）（Req: Story 2 全体 / Design: Architecture, Testing Approach）

- [x] 9. `ui-check` で `DailySessionOutlook` / `AnalysisResults` の全storyを目視確認し、`npm run lint` / `tsc --noEmit` / `npm run build` を実行して問題がないことを確認する（Design: Testing Approach）
