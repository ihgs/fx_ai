# 過去データの取得・保存（バックフィル） — Tasks

- [x] 1. `lib/db.ts` の `@/lib/migrate` importを相対import（`./migrate.ts`、拡張子明示）に変更し、`tsconfig.json` に `allowImportingTsExtensions: true` を追加する。既存の `npx tsc --noEmit` / `npm run build` が引き続き通ることを確認する（Design: Architecture）
- [x] 2. `scripts/backfillHistory.ts` を新規作成し、`--from=YYYY-MM-DD --to=YYYY-MM-DD` の引数パース・バリデーション（不正形式・`from > to`・本日以降の日付のスキップ判定はJST基準）を実装する（Req: 1.3 / Design: Architecture, Error Handling）
- [x] 3. klines API（`interval=1min`, `date=YYYYMMDD`）の呼び出し・レスポンスパース処理を実装する。実装時に実際のレスポンスを確認し型定義を確定させる（Req: 1.1 / Design: Data Model）
- [x] 4. 取得した1分足を `insertCandle()` で `source: "backfill"` として保存する日次ループを実装する。1日ごとの失敗（APIエラー・空データ）はスキップしてログに記録し処理を継続する。上流APIへの負荷軽減のため呼び出し間に短い待機を入れる（Req: 1.1, 1.2, 1.4 / Design: Architecture, Error Handling）
- [x] 5. 実行完了時に成功日数・スキップ日数・挿入件数のサマリーを標準出力に表示する処理を実装する（Req: 2.2 / Design: Error Handling）
- [x] 6. `package.json` に `backfill` npm scriptを追加する（`node scripts/backfillHistory.ts`）（Req: 2.1 / Design: Architecture）
- [x] 7. 手動検証する: 直近1〜2日分を指定して実行し `rate_candles` に `source='backfill'` の行が期待件数で保存されることを確認する。既存ライブデータとの重複が上書きされないこと、未来日を含む範囲でスキップされることを確認する（Design: Testing Approach）
