# 運用ログ強化（infoレベル） — Tasks

- [x] 1. `lib/logger.ts` を新規作成する（`LOG_LEVEL` 環境変数によるレベル制御を含む `logger.info/warn/error`。不正値・未設定時は `"info"` にフォールバック）（Req: 3.1, 3.2, 3.3 / Design: Architecture, Data Model）
- [x] 2. `lib/collectRate.ts` にレート取得・保存成功時のinfoログを追加する（symbol・bucketStart・bid/askを含む）。既存の失敗時 `console.error` は変更しない（Req: 1.1, 1.2 / Design: Architecture）
- [x] 3. `lib/analyzeRate.ts` の `runAnalysis` に分析成功時のinfoログを追加する（trigger・method・directionを含む）。既存の失敗時挙動は変更しない（Req: 2.1, 2.2 / Design: Architecture）
- [x] 4. `instrumentation.ts` のレート収集・AI分析それぞれの `setInterval` コールバック内のスキップ分岐（週末休場・時間外）にinfoログを追加する（Req: 1.3, 2.3 / Design: Architecture）
- [x] 5. 手動検証する: 開発サーバーで `LOG_LEVEL` 未設定時にinfoログが出ること、`LOG_LEVEL=error` 設定時に抑制されること、手動分析実行時のinfoログを確認する（Design: Testing Approach）※`ANTHROPIC_API_KEY`未設定のためrunAnalysis成功ログのE2E確認のみ保留（コードレビューで確認済み）
