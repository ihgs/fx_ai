# 014 デイリーセッション見通し (daily-session-outlook) — Design

## Architecture

既存の`instrumentation.ts`の定期実行パターン（`setInterval` + JST時刻判定）と、既存の`analysis_results`テーブル・`judgeOutcome`をそのまま再利用する。新しいテーブル・新しいAPIルートは作らない。

```
lib/
  jst.ts                    # 新規: JST日時ユーティリティ（weeklyHistory.tsから抽出、3箇所目の利用のためDRY化）
  weeklyHistory.ts           # 変更: lib/jst.tsの関数を使うようリファクタ（挙動・exportは変えない）
  dailyOutlook.ts            # 新規: セッション定義・前営業日集計・プロンプト生成・生成実行
  dailyOutlook.test.ts        # 新規: 純粋関数部分のユニットテスト
  analyzeRate.ts              # 変更: Geminiクライアント・スキーマ等をexportしてdailyOutlook.tsから再利用
  db.ts                       # 変更: getLatestAnalysisResultByMethod / hasAnalysisResultForDateAndMethod / getRecentAnalysisResults を追加

instrumentation.ts            # 変更: 毎分JST 6:30到達をチェックする新しいsetIntervalを追加

app/api/analysis/route.ts     # 変更: GETレスポンスにdailyOutlookを追加、resultsを直近1週間の日付範囲ベースに変更

components/
  DailySessionOutlook.tsx     # 新規 presentational（Storybook対象）
  DailySessionOutlook.stories.tsx
  AnalysisResults.tsx          # 変更: DailySessionOutlookをリスト上部に表示
  AnalysisResults.stories.tsx  # 変更: dailyOutlookを含むstoryに更新
  AnalysisScreen.tsx           # 変更: APIレスポンスのdailyOutlookを状態に反映
```

### セッション定義とデータ集計

`analysis_results`テーブルは変更しない。`method`列に`"daily-tokyo"` / `"daily-london"` / `"daily-ny"`を入れることで、既存の一覧・正誤判定・正答率集計インフラをそのまま再利用する（`trigger`は既存の`"scheduled"`を流用）。

セッション時間帯（JST固定、`sessionRangeIso`でUTC範囲に変換し既存`getCandlesInRange`で集計）:

| session | 開始 | 終了 |
|---|---|---|
| tokyo | 当日 9:00 | 当日 18:00 |
| london | 当日 17:00 | 翌日 2:00 |
| ny | 当日 22:00 | 翌日 7:00 |

`previousBusinessDayJst(todayDateStr)`で直近営業日（土日をスキップ）を求め、その日の3セッション分＋全体（前営業日0:00〜当日0:00）の高値・安値・始値・終値を`getCandlesInRange`の結果から計算し、プロンプトに含める。

## Data Model / Types

```ts
// lib/dailyOutlook.ts
export type Session = "tokyo" | "london" | "ny";

type SessionStats = { open: number; high: number; low: number; close: number } | null;

// lib/db.ts への追加（新しいテーブルは作らない）
export function getLatestAnalysisResultByMethod(method: string): AnalysisResult | null;
export function hasAnalysisResultForDateAndMethod(method: string, fromIsoInclusive: string, toIsoExclusive: string): boolean;
export function getRecentAnalysisResults(sinceIso: string): AnalysisResult[]; // method LIKE 'daily-%' を除外、新しい順

// components/DailySessionOutlook.tsx
export type DailySessionOutlookItem = {
  direction: "up" | "down" | "flat";
  rationale: string;
  outcome: "correct" | "incorrect" | "pending";
  targetAt: string;
};
export type DailySessionOutlookProps = {
  tokyo: DailySessionOutlookItem | null;
  london: DailySessionOutlookItem | null;
  ny: DailySessionOutlookItem | null;
};
```

## API Contract

### `GET /api/analysis`（既存ルートの変更）
- 200:
```ts
{
  // method LIKE 'daily-%' を除外、直近7日分（新しい順）。baselineBid/actualBidは既存機能(spec直前のPR)を踏襲し
  // judgeOutcomeDetailedで取得する（judgeOutcomeだけに戻すとこれらが失われるので注意）。
  results: (AnalysisResult & { outcome: AnalysisOutcome; baselineBid: number | null; actualBid: number | null })[];
  accuracy: AccuracyStat[]; // resultsから集計するため daily-* は自然に含まれない
  dailyOutlook: {
    // 各methodの最新1件（未生成ならnull）。カード表示にレート値は使わないためjudgeOutcomeのみでよい。
    tokyo: (AnalysisResult & { outcome: AnalysisOutcome }) | null;
    london: (AnalysisResult & { outcome: AnalysisOutcome }) | null;
    ny: (AnalysisResult & { outcome: AnalysisOutcome }) | null;
  };
}
```
- `POST /api/analysis`（手動「分析実行」）は変更しない。

## UI Components (Storybook)

### `DailySessionOutlook`（presentational）
Props: `DailySessionOutlookProps`（上記）。3セッションとも`null`なら「まだ本日の見通しはありません」という簡潔な空状態を1つ表示する。1つ以上データがあれば、既存の分析結果カード（`AnalysisResults.tsx`のリスト項目）と同じ視覚言語のカードをセッションごとに表示し（方向・正誤バッジ・根拠）、未生成のセッションだけ「未生成」と表示する（Req 1.6のセッション単位の失敗分離をUI側にも反映）。
Stories: `Empty`（3つともnull） / `AllGenerated`（3つとも生成済み、outcome違い） / `Partial`（1〜2件のみ生成済み）。

### `AnalysisResults`（既存コンポーネントの変更）
`listState`の`loaded`に`dailyOutlook`を追加し、リストの一番上（見出し「分析」の直下、正答率一覧より上）に`DailySessionOutlook`を表示する。
既存storyの`args`に`dailyOutlook: { tokyo: null, london: null, ny: null }`をデフォルト追加し、`dailyOutlook`ありのstoryを1つ追加する。

いずれもモバイル前提（既存`AnalysisResults.stories.tsx`の`mobilePortrait`方針を踏襲）。

## Key Files

- 追加: `lib/jst.ts`, `lib/dailyOutlook.ts`, `lib/dailyOutlook.test.ts`
- 追加: `components/DailySessionOutlook.tsx`, `components/DailySessionOutlook.stories.tsx`
- 変更: `lib/weeklyHistory.ts`（`lib/jst.ts`を使うようリファクタ）
- 変更: `lib/analyzeRate.ts`（Geminiクライアント・スキーマのexport）
- 変更: `lib/db.ts`（3関数追加）
- 変更: `instrumentation.ts`（6:30チェック用の`setInterval`追加）
- 変更: `app/api/analysis/route.ts`（レスポンス形状変更）
- 変更: `components/AnalysisResults.tsx`, `components/AnalysisResults.stories.tsx`, `components/AnalysisScreen.tsx`

## Error Handling / Edge Cases

- **土日判定**: 既存の`isJstWeekendMarketClosed`（市場休場の時刻境界判定）とは別に、単純に「JSTの曜日が土/日か」だけを見る新しい判定を使う（Req 1.3）。理由: 月曜6:30時点では`isJstWeekendMarketClosed`は「hour(6) < 7」でまだ休場中と判定してしまい、月曜分の生成が動かなくなるため。
- **重複防止**: 各セッションのGemini呼び出し前に、その`method`で当日（JST日付範囲）の行が既に存在するかDBを確認し、あれば生成しない（Req 1.5）。サーバー再起動等でこのチェック処理が同一分内に複数回走っても安全。
- **前営業日データ0件**: 全体統計が計算できない（`getCandlesInRange`が空）場合は3セッションとも生成をスキップし、ログに記録する（Req 1.4）。
- **セッション単位の失敗分離**: 3セッションをループしそれぞれ個別に`try/catch`する。1つが失敗しても他のセッションの生成は継続する（Req 1.6）。
- **表示側の「最新」の定義**: 各セッションのカードは「そのmethodの最新1行」を表示する。当日分の生成が（一時的な失敗等で）無い場合は前営業日以前の最新行が表示され続ける（何も出ないよりはまし、という判断）。
- **一覧の安全上限**: `results`は日付（直近7日）で絞るが、想定外の大量データに備えて内部的に上限件数（例: 500件）も設ける。

## Testing Approach

- `lib/jst.ts`の純粋関数、および`lib/dailyOutlook.ts`の`previousBusinessDayJst` / `sessionRangeIso` / セッション統計計算などの純粋関数部分を、`lib/dailyOutlook.test.ts`でユニットテストする（`lib/weeklyHistory.test.ts`と同じ手法: 決定的な日付を渡して検証）。
- `runDailyOutlookForSession` / `runDailyOutlook`自体（Gemini呼び出し・DB書き込みを含む）は既存の`runAnalysis`と同様、直接のユニットテストは設けない。
- 手動確認: 開発サーバー起動後、実DBに前営業日ぶんのダミーcandleを投入し、`runDailyOutlook`を直接呼び出して3セッション分のレコードが正しく作られること（Gemini APIキーが無い環境では失敗ログのみ確認）、および`GET /api/analysis`のレスポンス形状・分析ページの表示（`DailySessionOutlook`＋直近1週間の一覧）を確認する。
- `DailySessionOutlook`・`AnalysisResults`はStorybook storyで状態を再現し`ui-check`で目視確認する。
- 最低限`npm run lint` / `tsc --noEmit` / `npm run build`を実装完了時に実行する。
