# AI分析 — Design

## Tech Stack Versions
spec 001〜003 のバージョン系列・依存構成をそのまま踏襲する。追加で以下を採用する。

| 用途 | 選定 | 理由 |
|---|---|---|
| AI API | `@google/genai`（公式TypeScript SDK） | Gemini APIを使う（当初のAnthropic APIから切替）。`GEMINI_API_KEY`環境変数を`.env.local`に設定する必要がある。 |
| モデル | `gemini-flash-latest` | 定期実行（1日16回）+ 手動実行があるためコストを抑える目的で軽量なflashエイリアスモデルを使う（分類寄りの軽いタスクのため）。将来別モデルにしたい場合は`lib/analyzeRate.ts`内の`MODEL`定数1箇所を変えるだけで済む。 |
| 構造化出力 | `client.models.generateContent()` + `responseJsonSchema`（Zodスキーマを`z.toJSONSchema()`でJSON Schema化して渡す） | 見通し（up/down/flat）と根拠をJSONで確実に受け取るため。 |

## Architecture
- `lib/analyzeRate.ts`: `runAnalysis(trigger: "manual" | "scheduled")` を実装。
  1. `lib/db.ts`の`getRecentCandles(120)`で直近120分（1分足×120）のレート履歴を取得。0件なら分析をスキップしてエラーを投げる。
  2. 履歴をプロンプトに整形し、`client.models.generateContent()` + JSON Schema（`direction: "up"|"down"|"flat"`, `rationale: string`）で構造化出力を取得。
  3. `target_at`（この予測の答え合わせ対象時刻。spec 005用）を`実行時刻 + 1時間`として計算。
  4. `lib/db.ts`の`insertAnalysisResult()`で保存。
  5. 失敗時（API呼び出し・DB書き込みいずれも）は例外を投げる。呼び出し元（APIルート/スケジューラ）がそれぞれの文脈で処理する（Req 1.4）。
- `instrumentation.ts`: 既存の1分間隔`collectRate`用`setInterval`に加えて、2つ目の`setInterval`（1時間間隔）を登録する。tick毎に**日本時間の現在時刻**を`Intl.DateTimeFormat`（`timeZone: "Asia/Tokyo"`）で算出し、**7時〜22時の範囲内の時だけ** `runAnalysis("scheduled")`を呼ぶ（それ以外の時間帯は何もしない）（Req 1.2）。`setInterval`はサーバー起動時刻を基準に1時間おきに発火するため、実際の発火時刻は毎時ちょうどには揃わない（軽量に保つため許容する。厳密な毎時整合が必要になれば別途対応）。
- `app/api/analysis/route.ts`:
  - `GET`: `lib/db.ts`の`getAnalysisResults(20)`で直近20件を新しい順に返す（Req 1.5）。
  - `POST`: `runAnalysis("manual")`を呼び、成功したら新しい結果を返す。失敗したら502（Req 1.1, 1.4）。
- `components/AnalysisResults.tsx`: プレゼンテーション用コンポーネント。一覧のロード状態（`loading`/`error`/`loaded`）、実行中フラグ（`isRunning`）、実行エラー（`runError`）、「分析実行」ボタン（`onRunAnalysis`）を受け取る。spec 001/002のRateCard/RateChartと同じダークテーマを踏襲。
- `components/AnalysisScreen.tsx`: `app/page.tsx`から使う「賢い」ラッパー。マウント時に一覧を取得し、ボタン押下で`POST`を呼んで結果を一覧の先頭に追加する。CurrentRateScreen/ChartScreenと同様、storyは作らない（中身は`AnalysisResults`のstoryでカバーする）。
- `app/page.tsx`: `AnalysisPlaceholder`を`AnalysisScreen`に差し替える。

## Data Model / Types
```ts
export type AnalysisResult = {
  id: number;
  executedAt: string;   // ISO
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;      // ISO。この予測の答え合わせ対象時刻（spec 005用）
  trigger: "manual" | "scheduled";
};
```

SQLiteスキーマ（`migrations/0002_create_analysis_results.sql`。spec 002の自作マイグレーションランナーで管理）:
```sql
CREATE TABLE analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  executed_at TEXT NOT NULL,
  method TEXT NOT NULL,       -- 分析手法の識別子。spec 005で複数化に備え今回は固定値1種類のみ
  direction TEXT NOT NULL,    -- 'up' | 'down' | 'flat'
  rationale TEXT NOT NULL,
  target_at TEXT NOT NULL,
  input_from TEXT NOT NULL,   -- 入力に使ったレート履歴の範囲（from, ISO）
  input_to TEXT NOT NULL,     -- 入力に使ったレート履歴の範囲（to, ISO）
  trigger TEXT NOT NULL       -- 'manual' | 'scheduled'
);
CREATE INDEX idx_analysis_results_executed_at ON analysis_results(executed_at);
```
`method`列を最初から持たせておくことで、spec 005で分析手法を追加する際にスキーマ変更が不要になる（spec 002のOHLCテーブルと同じ考え方）。

## API Contract
- `GET /api/analysis`
  - 200: `{ results: AnalysisResult[] }`（新しい順、最大20件。0件の場合は空配列）
- `POST /api/analysis`
  - 200: `{ result: AnalysisResult }`
  - 502: `{ error: string }`（レート履歴が無い／AI API呼び出し失敗／DB書き込み失敗のいずれか）

## UI Components (Storybook)
- `AnalysisResults`: 以下の状態を story で再現する（layoutは`fullscreen`、viewportはこれまで同様iPhone SE相当）
  - `loading`（一覧ロード中）
  - `error`（一覧ロード失敗）
  - 一覧あり・通常時（分析実行ボタンが有効）
  - 一覧あり・実行中（`isRunning: true`、ボタンが無効化され「分析中...」表示）
  - 一覧あり・実行エラー（`runError`セット、一覧はそのまま表示されることを確認できる状態）
  - 一覧が空（初回で結果がまだ無い状態、「まだ分析結果がありません」表示）

## Key Files
- `lib/analyzeRate.ts`
- `migrations/0002_create_analysis_results.sql`
- `lib/db.ts`（`insertAnalysisResult()` / `getAnalysisResults(limit)` / `getRecentCandles(limit)` を追加）
- `instrumentation.ts`（1時間間隔・JST 7-22時限定の`setInterval`を追加）
- `app/api/analysis/route.ts`
- `components/AnalysisResults.tsx`, `components/AnalysisResults.stories.tsx`
- `components/AnalysisScreen.tsx`
- `app/page.tsx`（`AnalysisPlaceholder`→`AnalysisScreen`に差し替え）
- `package.json`（`@google/genai`, `zod`を追加）
- `.env.local`（`GEMINI_API_KEY`。gitignore済みの`.env*`パターンでコミット対象外）

## Error Handling / Edge Cases
- レート履歴が0件の場合、分析を実行せずエラーを投げる（手動実行なら502、定期実行なら`console.error`のみでスケジュール継続）。
- AI API呼び出し失敗（認証エラー含む）・構造化出力のパース失敗・DB書き込み失敗はすべて同様に扱う。
- 手動実行が失敗しても、既存の分析結果一覧はそのまま表示され続ける（一覧の再取得はしない。Req 1.4）。
- 定期実行は`collectRate`と同様、1回の失敗が次回の実行に影響しない。
- JST 7-22時判定は`Intl.DateTimeFormat`の`timeZone: "Asia/Tokyo"`で行い、サーバー自体のタイムゾーン設定に依存しない。

## Testing Approach
- `next build`（内蔵TypeScriptチェック含む）
- `AnalysisResults`はStorybook storyで各状態を再現し、`ui-check`で目視確認する。
- `GEMINI_API_KEY`が未設定の間は実際のAI呼び出しは検証できない。その間はエラー表示経路（Req 1.4）が正しく動くことと、DB層（`insertAnalysisResult`/`getAnalysisResults`/`getRecentCandles`）が単体で正しく動くことを手動確認する。キー取得後に実際の分析実行をE2Eで確認する。
