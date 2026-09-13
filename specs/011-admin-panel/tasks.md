# 011 管理画面 (admin-panel) — Tasks

- [x] 1. `lib/db.ts` に管理画面用のDB関数を追加する（`getAnalysisResultsPage`, `countAnalysisResults`, `deleteAnalysisResult`, `getCandlesInRange`）（Req: 1.1, 1.2, 2.2, 2.3 / Design: Data Model / lib/db.ts への追加）

- [x] 2. `lib/weeklyHistory.ts` を新規作成する（`currentWeekStartJst`, `shiftWeek`, `isMonday`, `buildWeeklyHistory`、JST⇔UTC変換）。あわせて `lib/weeklyHistory.test.ts` で純粋関数部分をユニットテストする（Req: 3.2, 3.3, 3.6, 3.7, 3.8 / Design: lib/weeklyHistory.ts）

- [x] 3. `app/api/admin/analysis/route.ts`（GET: ページング付き一覧）と `app/api/admin/analysis/[id]/route.ts`（DELETE: 1件削除）を実装する（Req: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4 / Design: API Contract）

- [x] 4. `app/api/admin/history/route.ts`（GET: 週次表データ）を実装する（Req: 3.1, 3.4, 3.5, 3.6, 3.8 / Design: API Contract）

- [x] 5. `components/AdminAnalysisList.tsx`（presentational）と `components/AdminAnalysisList.stories.tsx` を作成する（Loading / ListError / Empty / WithResults / Deleting / DeleteError の各状態）（Req: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3 / Design: UI Components (Storybook) / AdminAnalysisList）

- [x] 6. `app/admin/layout.tsx`（PC向け幅・余白）、`components/AdminAnalysisScreen.tsx`（"use client" コンテナ: 一覧取得・ページ送り・削除確認ダイアログ・削除実行）、`app/admin/analysis/page.tsx` を実装し、`/admin/analysis` を実際に開いて一覧表示・削除が動作することを確認する（Req: Story 1, Story 2 / Design: Architecture）

- [x] 7. `components/AdminHistoryTable.tsx`（presentational）と `components/AdminHistoryTable.stories.tsx` を作成する（Loading / Error / Loaded / SparseData / AtLatestWeek の各状態）（Req: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8 / Design: UI Components (Storybook) / AdminHistoryTable）

- [x] 8. `components/AdminHistoryScreen.tsx`（"use client" コンテナ: 週データ取得・前週/次週切り替え）と `app/admin/history/page.tsx` を実装し、`/admin/history` を実際に開いて週次表の表示・週送りが動作することを確認する（Req: Story 3 / Design: Architecture）

- [x] 9. `ui-check` で `AdminAnalysisList` / `AdminHistoryTable` の全storyを目視確認し、`npm run lint` / `tsc --noEmit` / `npm run build` を実行して問題がないことを確認する（Design: Testing Approach）

- [x] 10. `app/admin/page.tsx`（トップページ、`/admin/analysis`・`/admin/history`へのリンク一覧）を実装し、`/admin`を実際に開いて各リンクで遷移できることを確認する（Req: 4.1, 4.2 / Design: Architecture）
