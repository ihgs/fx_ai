# レート履歴のDB保存とチャート表示 — Tasks

- [x] 1. `lib/fetchTicker.ts` を作成し、`app/api/rate/usd-jpy/route.ts` の上流ticker取得ロジックをそこに抽出してリファクタする（既存のAPI I/Fは変更しない）（Design: Architecture, Key Files）
- [x] 2. `lib/db.ts` を実装する（SQLite接続シングルトン、`rate_candles` テーブルの初期化、`insertCandle()` / `getHistory(range)`）。`.gitignore` に `data/` を追加する（Design: Data Model）
- [x] 3. `lib/collectRate.ts` を実装する（`fetchTicker()` → 1分バケットに丸めた `bucket_start` を計算 → `insertCandle()`。失敗時は `console.error` のみでスケジュールは止めない）（Req: 1.1, 1.2, 1.3 / Design: Architecture, Error Handling）
- [x] 4. `instrumentation.ts` を実装し、サーバー起動時にDB初期化を行い `setInterval` で `collectRate()` を1分間隔で呼び出す（Req: 1.1 / Design: Architecture）
- [x] 5. `GET /api/rate/usd-jpy/history` Route Handler を実装する（`range` パラメータのバリデーション、DBクエリ、`{timestamp, bid}[]` へのマッピング）（Req: 2.1, 2.2, 2.3 / Design: API Contract）
- [x] 6. `recharts` を依存に追加し、`RateChart` コンポーネントを実装する。`loading` / データあり（縦向き） / データあり（横向き） / `empty` の4状態の story を作成する（Req: 2.1, 2.2, 2.4 / Design: UI Components）
- [x] 7. `app/chart/page.tsx` を実装する。期間セレクター（1日/1週間/1ヶ月）と `RateChart` を組み込み、`/api/rate/usd-jpy/history` から取得したデータを表示する（Req: 2.1, 2.2, 2.3, 2.4）
