# 分析結果の答え合わせ・正答率 — Tasks

- [x] 1. `lib/db.ts` を拡張する（`AnalysisResult` 型に `method` / `inputTo` を追加、`getAnalysisResults` のSELECTに反映、`getCandleAtOrAfter(timestamp)` を追加）（Design: Data Model, Architecture）
- [x] 2. `lib/judgeAnalysis.ts` を新規作成する（`judgeOutcome()` で正解/不正解/判定待ちを判定、`buildAccuracyStats()` で手法ごとの正答率を集計）（Req: 1.1, 1.2, 2.2, 3.1 / Design: Architecture, Data Model）
- [x] 3. `app/api/analysis/route.ts` の `GET` を拡張し、各結果に `outcome` を付与、`accuracy` を含めて返す（Req: 1.3, 2.1, 2.2 / Design: API Contract）
- [x] 4. `components/AnalysisResults.tsx` を拡張する（正答率サマリー表示、各結果への判定バッジ表示）。`components/AnalysisResults.stories.tsx` に単一手法/複数手法/判定待ちのみ/正解不正解混在の状態を追加する（Req: 1.3, 2.1, 2.2 / Design: UI Components）
- [x] 5. `components/AnalysisScreen.tsx` を拡張し、`accuracy` の取得・保持と、手動実行直後の楽観的追加分に `outcome: "pending"` を補う処理を実装する（Design: Architecture）
- [x] 6. `lib/judgeAnalysis.ts` の判定ロジックを手動検証する（`rate_candles` にテストデータを投入し `GET /api/analysis` のレスポンスで正解/不正解/判定待ちが期待通りになるか確認）。UIは `ui-check` で対象storyを目視確認する（Design: Testing Approach）
