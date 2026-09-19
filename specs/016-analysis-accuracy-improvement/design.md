# AI分析の精度向上（追加指標とプロンプト改訂） — Design

## Architecture
- 追加指標の算出は既存の `lib/analyzeRate.ts` を拡張する形で行う。
  - 乖離幅（オーバーエクステンション）は120分の短期データから算出できるため、既存の `computeIndicators()` にフィールドを追加する形で実装する。
  - 長期トレンド（24時間変化率）は120分窓とは別のデータ取得（`getRecentCandles(1440)`）が必要なため、新関数 `computeLongTermTrend()` として分離する。`runAnalysis()` から呼び出し、結果を `buildPrompt()` に渡す。
- プロンプトの判断基準文言（Req 3.1〜3.3）は `lib/analyzeRate.ts` に `ANALYSIS_JUDGMENT_GUIDANCE` という共通文字列定数としてexportし、`buildPrompt()`（analyzeRate.ts）と `buildDailyOutlookPrompt()`（dailyOutlook.ts）の両方から参照する（重複を避け、判断基準を一箇所で管理する）。
- `lib/db.ts` の変更は不要。24時間分の取得は既存の `getRecentCandles(limit)` をそのまま `limit=1440` で利用する（新規クエリ関数は追加しない）。

## Data Model / Types

```ts
// lib/analyzeRate.ts
export type Indicators = {
  smaShort: number | null;
  smaLong: number | null;
  changeRate: number;
  volatility: number;
  high: number;
  low: number;
  overExtension: number | null; // 追加: (直近値 - smaShort) / volatility（標準偏差単位の乖離幅）
};

export type LongTermTrend = {
  changeRate: number; // 直近24時間の変化率（%）。データ不足時は関数がnullを返す。
};
```

- `overExtension` は `smaShort` または `volatility` が算出不可（null/0）の場合は `null`。
- `computeLongTermTrend(history: RateHistoryPoint[]): LongTermTrend | null` は、`history.length < LONG_TERM_MINUTES(1440)` の場合に `null` を返す（既存の `sma()` が窓幅未満でnullを返すのと同じ方針）。
- `AnalysisResult` / DBスキーマへの変更なし（Req 1.3を踏襲、指標はDBに永続化しない）。`method` の値のみ `"v2"` → `"v3"` に変更。

## API Contract
外部インターフェースへの変更はなし。`app/api/analysis/route.ts` 等のレスポンス形状は不変（`method` フィールドの値が `"v3"` になる点のみ）。

## Key Files
- `lib/analyzeRate.ts`
  - `computeIndicators()`: `overExtension` の算出を追加。
  - `computeLongTermTrend()`: 新設。`LONG_TERM_MINUTES = 24 * 60` 定数を追加。
  - `buildPrompt()`: テクニカル指標セクションに「短期線からの乖離幅」「直近24時間の変化率」を追加。末尾に `ANALYSIS_JUDGMENT_GUIDANCE` を挿入。
  - `ANALYSIS_JUDGMENT_GUIDANCE`: 新設・export（Req 3.1〜3.3の文言）。
  - `METHOD`: `"v2"` → `"v3"` に変更（コメントも更新）。
  - `runAnalysis()`: `getRecentCandles(LONG_TERM_MINUTES)` を追加取得し `computeLongTermTrend()` に渡す。
- `lib/dailyOutlook.ts`
  - `buildDailyOutlookPrompt()`: 末尾（判定依頼の直前）に `ANALYSIS_JUDGMENT_GUIDANCE` を挿入。指標追加は行わない（Req 3.4のとおりスコープ外）。
- `lib/analyzeRate.test.ts`
  - `overExtension` のテストケース追加（正常系・volatility=0でnull・smaShort未算出でnull）。
  - `computeLongTermTrend()` のテストケース追加（1440件未満でnull・十分な件数で正しい変化率）。
- `lib/dailyOutlook.test.ts`
  - 変更不要（既存テストは `buildDailyOutlookPrompt` の内部文言を検証していないため影響なし）。

## Error Handling / Edge Cases
- ボラティリティが0（値動きが完全にフラット）の場合: `overExtension` は `null` とし、ゼロ除算を避ける。
- 短期SMAが算出不可（データ不足）の場合: `overExtension` も連動して `null`。
- 24時間分のレート履歴が無い（サービス運用開始直後、DBリセット直後等）場合: `computeLongTermTrend()` が `null` を返し、プロンプトには「算出不可（データ不足）」と表示。分析自体は例外を投げず継続する（既存の「履歴0件のみエラー」という方針を踏襲）。
- `getRecentCandles(1440)` の追加クエリは既存インデックス構成（`symbol, interval, bucket_start`）のままで完結し、スキーマ変更・パフォーマンス上の懸念はない。

## Testing Approach
- 既存のvitestスイート（`lib/analyzeRate.test.ts`, `lib/dailyOutlook.test.ts`）を拡張・実行する。UIコンポーネントの変更は無いため Storybook / `ui-check` は不要。
- `buildPrompt()` / `buildDailyOutlookPrompt()` は非export（内部関数）で文字列組み立てのみのため、既存踏襲どおりスナップショットテストは追加せず、指標算出ロジック（`computeIndicators`, `computeLongTermTrend`）を単体テストで担保する。
- 実装後 `npx tsc --noEmit` と `npx vitest run` で型エラー・既存テストの非破壊を確認する。
- 本番相当の精度改善効果は、本spec適用後1週間程度運用してから `admin/analysis` のエクスポート機能（spec 015）で再度エクスポートし、method="v3"の正答率を今回のmethod="v2"（55.4%）と比較して評価する（この比較作業自体は本specの実装タスクには含めない）。
