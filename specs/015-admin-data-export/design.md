# 015 管理画面のデータダウンロード - Design

## Architecture

- `app/admin/export/page.tsx`: `AdminExportScreen` を描画するだけのサーバーコンポーネント（既存の `admin/analysis`, `admin/history` と同じ薄いラッパー構成）。
- `components/AdminExportScreen.tsx`（Client Component）: 開始日・終了日の入力状態、バリデーション、ダウンロード実行（fetch → Blob → `<a download>` クリック）を担当。データ取得系の既存 `AdminAnalysisScreen` / `AdminHistoryScreen` と同じ役割分担（Screen=状態管理・副作用、下位コンポーネント=表示専用）。
- `components/AdminExportForm.tsx`（表示専用）: 日付input・ダウンロードボタン・バリデーションエラー/通信エラー表示。Storybookで状態を再現する対象。
- `app/api/admin/export/route.ts`: GET Route Handler。`from`/`to`（JST日付, YYYY-MM-DD）を受け取りバリデーションの上、`lib/exportData.ts` の関数でデータを組み立てて返す。
- `lib/exportData.ts`: 期間バリデーション・データ組み立てのロジック本体（DB層は薄く保ち、集計ロジックはここに置く。`lib/dailyOutlook.ts` / `lib/weeklyHistory.ts` と同じ配置方針）。
- `app/admin/page.tsx`: `ADMIN_LINKS` に「データダウンロード」へのリンクを追加。

## Data Model / Types

`lib/exportData.ts`:

```ts
export type ExportAnalysisResult = AnalysisResult & {
  outcome: AnalysisOutcome;
  baselineBid: number | null;
  actualBid: number | null;
};

export type ExportData = {
  range: { from: string; to: string }; // YYYY-MM-DD (JST)
  analysisResults: ExportAnalysisResult[];
  rateHistory: RateHistoryPoint[]; // 10分間隔
};

export type ExportRangeError = "missing" | "invalid_date" | "start_after_end" | "range_too_long";
```

`lib/db.ts` に追加:

```ts
/** 管理画面のダウンロード用: [fromIso, toIso) の範囲の分析結果を全method対象・古い順で返す。 */
export function getAnalysisResultsInRange(fromIso: string, toIso: string): AnalysisResult[];
```

（`getCandlesInRange` は既存のものをそのまま再利用し、10分間引きは `lib/exportData.ts` 側のJSで行う。DB層にフィルタを増やさない。）

## API Contract

### `GET /api/admin/export?from=YYYY-MM-DD&to=YYYY-MM-DD`

- 成功時 (200): `ExportData` をJSONで返す。
  ```json
  {
    "range": { "from": "2026-09-01", "to": "2026-09-07" },
    "analysisResults": [
      { "id": 1, "executedAt": "...", "method": "v2", "direction": "up", "rationale": "...", "targetAt": "...", "inputTo": "...", "trigger": "scheduled", "outcome": "correct", "baselineBid": 149.8, "actualBid": 150.1 }
    ],
    "rateHistory": [{ "timestamp": "2026-09-01T00:00:00.000Z", "bid": 149.8 }]
  }
  ```
- バリデーションエラー時 (400): `{ "error": "<日本語メッセージ>" }`
  - `from`/`to` 未指定・不正な日付形式 → 「from, toはYYYY-MM-DD形式で指定してください」
  - 開始日 > 終了日 → 「開始日は終了日以前を指定してください」
  - 期間が7日間超（両端含む） → 「指定できる期間は最大7日間です」
- サーバーエラー時 (500): `{ "error": "エクスポートデータの取得に失敗しました" }`

## UI Components (Storybook)

`AdminExportForm.tsx` の Props とStoryバリエーション:

```ts
export type AdminExportFormProps = {
  fromDate: string; // "" 許容
  toDate: string;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onDownload: () => void;
  isDownloading: boolean;
  validationError: string | null; // クライアント側バリデーション（未入力/開始>終了/7日超）
  downloadError: string | null; // サーバーエラー等
};
```

Stories:
- `Default`（未入力、ボタン無効）
- `ValidRange`（入力済み、ボタン有効）
- `Downloading`（ダウンロード中、ボタン無効・ローディング表示）
- `ValidationError`（開始日>終了日、または7日超のインラインエラー）
- `DownloadError`（サーバーエラー表示）

## Key Files

- 追加: `app/admin/export/page.tsx`
- 追加: `components/AdminExportScreen.tsx`
- 追加: `components/AdminExportForm.tsx`
- 追加: `components/AdminExportForm.stories.tsx`
- 追加: `app/api/admin/export/route.ts`
- 追加: `lib/exportRange.ts`（DBに依存しない期間バリデーション。クライアントコンポーネントから直接importできるよう`lib/exportData.ts`から分離）
- 追加: `lib/exportRange.test.ts`
- 追加: `lib/exportData.ts`
- 追加: `lib/exportData.test.ts`
- 変更: `lib/db.ts`（`getAnalysisResultsInRange` 追加）
- 変更: `app/admin/page.tsx`（`ADMIN_LINKS` にリンク追加）

## Error Handling / Edge Cases

- クライアント側で開始日・終了日の未入力・開始>終了・7日超をチェックし、ボタン無効化 or インラインエラーで即座にフィードバックする（サーバー往復を待たせない）。
- サーバー側でも同じバリデーションを行う（クライアントを信頼しない）。
- 期間内に分析結果・レートヒストリーが0件でも200でOK、それぞれ空配列を返す（Req 1.6）。
- ダウンロードファイル名: `fx_export_<from>_<to>.json`（例: `fx_export_2026-09-01_2026-09-07.json`）。
- 10分間引きは `bucket_start`（UTC ISO文字列）の分が10の倍数の行のみ採用する。JSTはUTC+9固定（[[jst-offset]]、分の値はUTCとJSTで一致するため）、単純な `getUTCMinutes() % 10 === 0` で判定できる。

## Testing Approach

- `lib/exportData.test.ts`（vitest）: 期間バリデーション（未入力/不正形式/開始>終了/7日超/境界値7日ちょうど）と、10分間引きロジックを単体テスト。
- `lib/db.ts` の新規関数自体は既存方針通りテスト無し（薄いSQLiteラッパー）。
- `AdminExportForm.stories.tsx` を `ui-check` で目視確認（ボタンの有効/無効、エラー表示）。
- `npx tsc --noEmit` / `npm run lint` / `npx vitest run` で確認。
