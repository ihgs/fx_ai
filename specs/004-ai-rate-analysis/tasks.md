# AI分析 — Tasks

- [ ] 1. `@anthropic-ai/sdk` と `zod` を依存に追加する。`migrations/0002_create_analysis_results.sql` を作成し、`lib/db.ts` に `insertAnalysisResult()` / `getAnalysisResults(limit)` / `getRecentCandles(limit)` を実装する（Design: Data Model, Key Files）
- [ ] 2. `lib/analyzeRate.ts` を実装する（直近レート履歴の取得 → `client.messages.parse()` で構造化出力取得 → `target_at`計算 → DB保存。履歴0件やAPI/DB失敗時は例外を投げる）（Req: 1.3 / Design: Architecture）
- [ ] 3. `instrumentation.ts` に1時間間隔のスケジューラを追加し、JST 7時〜22時の間だけ `runAnalysis("scheduled")` を呼ぶ（Req: 1.2 / Design: Architecture, Error Handling）
- [ ] 4. `GET` / `POST /api/analysis` Route Handler を実装する（`GET`: 直近20件を返す、`POST`: `runAnalysis("manual")`を呼び結果か502を返す）（Req: 1.1, 1.4, 1.5 / Design: API Contract）
- [ ] 5. `components/AnalysisResults.tsx` を実装し、`loading` / `error` / 通常時 / 実行中 / 実行エラー / 空一覧 の6状態の story を作成する（Req: 1.1, 1.4, 1.5 / Design: UI Components）
- [ ] 6. `components/AnalysisScreen.tsx` を実装し、`app/page.tsx` の `AnalysisPlaceholder` を置き換える（Req: 1.1, 1.4, 1.5 / Design: Architecture, Key Files）
- [ ] 7. DB層（`insertAnalysisResult`/`getAnalysisResults`/`getRecentCandles`）とエラー表示経路（`ANTHROPIC_API_KEY`未設定時）を手動確認する。キー設定後は実際の分析実行もE2Eで確認する（Design: Testing Approach）
