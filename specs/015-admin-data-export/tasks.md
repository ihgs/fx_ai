# 015 管理画面のデータダウンロード - Tasks

- [x] 1. `lib/db.ts` に `getAnalysisResultsInRange(fromIso, toIso)` を追加する（全method対象、`executed_at` 古い順）（Req: 1.2 / Design: Data Model / Types）
- [x] 2. `lib/exportData.ts` を作成する: 期間バリデーション（未入力・不正形式・開始>終了・7日超）、10分間引き（`getUTCMinutes() % 10 === 0`）、`buildExportData(fromDateStr, toDateStr)` によるデータ組み立て（Req: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8 / Design: Data Model, Error Handling）
  - 実装時にDBに依存しない期間バリデーションを `lib/exportRange.ts` として分離（クライアントコンポーネントから直接importして事前バリデーションに使うため。`lib/exportData.ts` は `lib/db.ts` 経由で `node:sqlite` に依存しクライアントバンドルに含められないため）。`lib/exportData.ts` は `validateExportRange` / `ExportRangeError` を re-export。
- [x] 3. `lib/exportData.test.ts` を作成する: 期間バリデーションの各パターン（未入力/不正形式/開始>終了/7日超/境界値7日ちょうど）と10分間引きロジックの単体テスト（Req: 1.4, 1.5, 1.8 / Design: Testing Approach）
  - 期間バリデーションのテストは分離した `lib/exportRange.test.ts` に配置、`lib/exportData.test.ts` は10分間引きのテストのみ。
- [x] 4. `app/api/admin/export/route.ts` を作成する: `from`/`to` クエリパラメータのバリデーション・エラーレスポンス（400/500）・成功時のJSON返却（Req: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8 / Design: API Contract）
- [x] 5. `components/AdminExportForm.tsx` と `components/AdminExportForm.stories.tsx` を作成する: 日付input・ダウンロードボタン・バリデーションエラー/通信エラー表示（Default/ValidRange/Downloading/ValidationError/DownloadErrorの5状態）（Req: 1.4, 1.5, 1.7, 1.8 / Design: UI Components）
  - ValidationErrorに加え、7日超のケースを明示する RangeTooLongError も追加（計6状態）。
- [x] 6. `components/AdminExportScreen.tsx` を作成する: 開始日・終了日の状態管理、クライアント側バリデーション、fetch→Blob→`<a download>` によるダウンロード実行、ローディング/エラー状態の管理（Req: 1.1〜1.8 / Design: Architecture, Error Handling）
- [x] 7. `app/admin/export/page.tsx` を作成し、`app/admin/page.tsx` の `ADMIN_LINKS` に「データダウンロード」へのリンクを追加する（Design: Key Files）
- [x] 8. `ui-check` で `AdminExportForm` の各Storyを目視確認し、`npx tsc --noEmit` / `npm run lint` / `npx vitest run` を実行する（Design: Testing Approach）
  - Playwrightで6状態（Default/ValidRange/Downloading/ValidationError/RangeTooLongError/DownloadError）をスクリーンショット確認済み。レイアウト・エラー表示・ボタンの有効/無効とも設計通り。
