# 分析結果の答え合わせ・正答率 — Design

## Architecture
- 答え合わせは**読み取り時に都度判定する**方式にする（判定結果をDBに書き戻さない）。理由:
  - `analysis_results` は既に `target_at`（答え合わせ対象時刻）と `input_to`（分析実行時点の直近レート時刻）を持っており、`rate_candles` と突き合わせるだけで判定できる。
  - 対象時刻がまだ経過していない（＝`rate_candles` に `target_at` 以降のデータがまだ無い）場合は自然に「判定待ち」になり、Req 1.2 を追加のフラグ管理無しで満たせる。
  - データ量が小さい（SQLite、直近ローソク足のみ参照）ため、都度計算のコストは無視できる。
- `lib/judgeAnalysis.ts`（新規）:
  - `judgeOutcome(result: JudgeableResult): AnalysisOutcome`
    1. `getCandleAtOrAfter(result.inputTo)` で分析実行時点の基準レート（baseline）を取得。
    2. `getCandleAtOrAfter(result.targetAt)` で対象時刻以降で最初に存在するレート（actual）を取得。
    3. どちらかが無ければ `"pending"`。
    4. `actual.bid - baseline.bid` の差分を閾値 `FLAT_THRESHOLD_JPY`（0.05円 = 5銭）で `"up" / "down" / "flat"` に分類し、`result.direction` と一致すれば `"correct"`、不一致なら `"incorrect"`。
  - `buildAccuracyStats(resultsWithOutcome): AccuracyStat[]`
    - `method` ごとにグループ化し、`correct` / `incorrect` / `pending` の件数と `accuracyRate = correct / (correct + incorrect)`（判定済みが0件なら `null`）を算出する。
    - 新しい `method` の値が現れても、グループ化はDBの値に基づき動的に行われるためコード変更は不要（Req 3.1）。
- `lib/db.ts`:
  - `getCandleAtOrAfter(timestamp: string): RateHistoryPoint | null` を追加（`bucket_start >= timestamp` を昇順1件取得）。
  - `AnalysisResult` 型に `method: string` と `inputTo: string` を追加し、`getAnalysisResults` のSELECTにも `method`, `input_to as inputTo` を追加する（答え合わせに必要なため）。
- `app/api/analysis/route.ts`:
  - `GET`: `getAnalysisResults(20)` の各結果に `judgeOutcome()` で `outcome` を付与し、`buildAccuracyStats()` で算出した `accuracy` と合わせて `{ results, accuracy }` を返す（Req 1.3, 2.1, 2.2）。
  - `POST`: 変更無し（新規実行直後は必ず `pending` になるため、判定はレスポンスに含めない＝一覧再取得時にGET側で判定される）。
- `components/AnalysisResults.tsx`:
  - 一覧の上部に手法ごとの正答率サマリーを表示する（`accuracy: AccuracyStat[]`）。
  - 各結果カードに判定ステータスバッジ（正解 / 不正解 / 判定待ち）を表示する。
  - 型はこれまでの慣習（`lib/db.ts` を直接importせず、APIレスポンス形状に合わせた軽量な型をコンポーネント内で定義）を踏襲する。
- `components/AnalysisScreen.tsx`:
  - `GET` のレスポンス型に `accuracy` を追加し、state・propsに渡す。手動実行後は一覧の型が変わるため、`POST` 後の楽観的追加分は `outcome: "pending"` を補って結果配列に追加する（実行直後は必ず判定待ちのため矛盾が無い）。

## Data Model / Types
```ts
// lib/db.ts（既存 AnalysisResult 型を拡張）
export type AnalysisResult = {
  id: number;
  executedAt: string;
  method: string;       // 追加
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;
  inputTo: string;      // 追加（答え合わせの基準レート取得用）
  trigger: "manual" | "scheduled";
};

// lib/judgeAnalysis.ts（新規）
export type AnalysisOutcome = "correct" | "incorrect" | "pending";

export type AccuracyStat = {
  method: string;
  correct: number;
  incorrect: number;
  pending: number;
  accuracyRate: number | null; // correct / (correct + incorrect)。judgeable件数0ならnull
};
```

マイグレーション追加は無し（既存 `analysis_results` テーブルの `method` / `input_to` カラムは spec 004 で既に作成済みで未使用だっただけ）。

## API Contract
`GET /api/analysis`（既存パスのレスポンス形状を拡張）:
```jsonc
{
  "results": [
    {
      "id": 2,
      "executedAt": "2026-09-12T10:00:00.000Z",
      "method": "v1",
      "direction": "up",
      "rationale": "...",
      "targetAt": "2026-09-12T11:00:00.000Z",
      "trigger": "scheduled",
      "outcome": "correct" // "correct" | "incorrect" | "pending"
    }
  ],
  "accuracy": [
    { "method": "v1", "correct": 8, "incorrect": 3, "pending": 2, "accuracyRate": 0.727 }
  ]
}
```
`POST /api/analysis` はレスポンス形状（`{ result }` / `{ error }`）を変更しない。

## UI Components (Storybook)
`AnalysisResults.tsx` に以下の状態を追加する（既存の `loading` / `error` / 実行中 / 実行エラー / 空一覧はそのまま維持）:
- 正答率サマリーが単一手法のみの場合
- 正答率サマリーが複数手法にまたがる場合（Req 2.2 の確認用）
- 判定済み件数が0件（`accuracyRate: null`）で「判定待ちのみ」の表示
- 一覧内に `correct` / `incorrect` / `pending` が混在するケース

## Error Handling / Edge Cases
- `rate_candles` に `inputTo` 時点のデータが欠けている（理論上は分析実行時に参照した候補足なので通常起きないが、DBがリセットされた場合等）→ `judgeOutcome` は `"pending"` を返す（誤判定よりは安全側に倒す）。
- 週末休場スキップ（既存の休場スキップ実装）により `target_at` 直後にデータが無くても、`getCandleAtOrAfter` は「対象時刻以降で最初に存在する足」を探すため、休場明け最初の足で自動的に答え合わせされる（`"pending"`が長引くだけで、恒久的に判定不能にはならない）。
- `accuracyRate` の分母（`correct + incorrect`）が0の場合は `null` とし、UI側は「判定待ちの結果のみ」等の表示にする（0除算・NaN表示を避ける）。

## Key Files
- 変更: `lib/db.ts`（型拡張・SELECT拡張・`getCandleAtOrAfter` 追加）
- 新規: `lib/judgeAnalysis.ts`（`judgeOutcome` / `buildAccuracyStats`）
- 変更: `app/api/analysis/route.ts`（GETレスポンス拡張）
- 変更: `components/AnalysisResults.tsx` / `components/AnalysisResults.stories.tsx`
- 変更: `components/AnalysisScreen.tsx`

## Testing Approach
- `npx tsc --noEmit` / `npm run lint` / `npm run build` で型・静的解析・ビルドを確認する。
- `lib/judgeAnalysis.ts` は自動テスト基盤（unit test）が無いため、一時的な確認スクリプト（`node --import tsx` 等）または開発サーバー上で `rate_candles` に手動でテストデータを入れて `GET /api/analysis` のレスポンスを確認する形で手動検証する（spec 004 のDB層検証と同様の手動確認スタイルを踏襲）。
- UIは `*.stories.tsx` の追加状態を `ui-check` で目視確認する。
