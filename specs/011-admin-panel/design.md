# 011 管理画面 (admin-panel) — Design

## Architecture

既存の `AnalysisResults`/`AnalysisScreen`（presentational + client container）の分離パターンを踏襲する。アプリ本体からのナビゲーションは無し（Out of Scope）だが、`/admin`配下の各機能間はトップページ（`app/admin/page.tsx`）からのリンクで遷移できるようにする。PC幅のテーブル表示に合わせて `app/admin/` 配下に専用レイアウトを1つ置く。

```
app/admin/
  layout.tsx              # PC向け余白・最大幅（既存画面のmax-w-mdは使わない）
  page.tsx                 # トップページ（Server Component、他機能へのリンク一覧）
  analysis/page.tsx        # Server Component shell → <AdminAnalysisScreen />
  history/page.tsx         # Server Component shell → <AdminHistoryScreen />

app/api/admin/
  analysis/route.ts        # GET（一覧・ページング）
  analysis/[id]/route.ts   # DELETE（1件削除）
  history/route.ts         # GET（週次表データ）

components/
  AdminAnalysisList.tsx     # presentational（Props受け取り、Storybook対象）
  AdminAnalysisScreen.tsx   # "use client" container（fetch・state管理）
  AdminHistoryTable.tsx     # presentational（Props受け取り、Storybook対象）
  AdminHistoryScreen.tsx    # "use client" container（fetch・state管理）

lib/
  db.ts                     # 既存に関数追加（ページング・削除・範囲取得）
  weeklyHistory.ts           # 週グリッド構築（JST⇔UTC変換を含む）
```

各 `page.tsx` は Server Component のまま `params`/`searchParams` を扱わず、対応する Client Component をそのまま描画する薄いシェルにする（既存 `app/page.tsx` と同様の構成方針）。

## Data Model / Types

### `lib/db.ts` への追加

```ts
export function getAnalysisResultsPage(offset: number, limit: number): AnalysisResult[];
export function countAnalysisResults(): number;
/** 削除できた場合 true、対象が存在しなかった場合 false */
export function deleteAnalysisResult(id: number): boolean;

/** [fromIso, toIso) の範囲の1分足を古い順で返す（週次表の集計用）。 */
export function getCandlesInRange(fromIso: string, toIso: string): RateHistoryPoint[];
```

### `lib/weeklyHistory.ts`（新規）

```ts
export type WeeklyHistoryColumn = { date: string; label: string }; // date: "YYYY-MM-DD" (JST), label: "9/15(月)"
export type WeeklyHistoryRow = { time: string; values: (number | null)[] }; // time: "06:30"〜"05:30"、valuesは列と同じ並び5件
export type WeeklyHistory = {
  weekStartDate: string; // 月曜日のJST日付 "YYYY-MM-DD"
  columns: WeeklyHistoryColumn[]; // 5列（月〜金）
  rows: WeeklyHistoryRow[]; // 47行（6:30始まり30分刻み、翌日5:30まで）
};

/** 現在時刻が属するJST週の月曜日付を返す（月〜日を週とみなす）。 */
export function currentWeekStartJst(now?: Date): string;

/** 与えられた月曜日付からnにより前後の週の月曜日付を返す（n=-1で前週、+1で次週）。 */
export function shiftWeek(weekStartDate: string, weeks: number): string;

/** weekStartDateが月曜日かを検証する。 */
export function isMonday(weekStartDate: string): boolean;

/** 週グリッド構築に必要な1分足の取得範囲 [fromIso, toIso) を返す（DB非依存）。 */
export function weeklyHistoryQueryRange(weekStartDate: string): { fromIso: string; toIso: string };

/** 週グリッドを構築する（純粋関数。DBアクセスは行わず、呼び出し元がcandlesを渡す）。 */
export function buildWeeklyHistory(weekStartDate: string, candles: WeeklyHistoryCandle[]): WeeklyHistory;
```

`lib/weeklyHistory.ts`はDBに依存しない（`lib/db.ts`をimportしない）。実際のDB取得（`getCandlesInRange`）は呼び出し元の`app/api/admin/history/route.ts`が行い、結果を`buildWeeklyHistory`に渡す。これにより`currentWeekStartJst`/`shiftWeek`/`isMonday`をクライアントコンポーネント（`AdminHistoryScreen`、"次週"ボタンの活性判定に使用）からも安全にimportできる（`lib/db.ts`はNode専用の`node:sqlite`に依存しており、クライアントバンドルに含められないため）。

**JST⇔UTC変換の方針**: 日本時間は年間を通じてUTC+9固定（DSTなし）。`Intl.DateTimeFormat`はUTC時刻→JST表示の変換（`analyzeRate.ts`の`toJstDisplay`と同じ用途）にのみ使い、JST壁時計→UTC ISO（DBクエリ用）の変換は `Date.UTC(y, m, d, h, min) - 9 * 60 * 60 * 1000` で行う（固定オフセットなのでタイムゾーンライブラリ不要）。この非対称な使い分けを実装時に混同しないよう、関数コメントに明記する。

各行・列の組み合わせ（5列 × 47行 = 235時点）ごとにJSTの壁時計時刻を組み立て、上記変換でUTC ISO文字列にした上で、`getCandlesInRange`で取得した週全体の1分足をMap化し、`bucket_start`完全一致で参照する（存在しなければ`null`）。

### API型

```ts
// GET /api/admin/analysis
type AdminAnalysisListResponse = {
  results: (AnalysisResult & { outcome: AnalysisOutcome })[];
  total: number;
  page: number;
  pageSize: number;
};

// GET /api/admin/history
type AdminHistoryResponse = WeeklyHistory;
```

## API Contract

### `GET /api/admin/analysis?page=1`
- `page`（省略時1、1未満・非数値は400）。`pageSize`はサーバー固定値（`ADMIN_ANALYSIS_PAGE_SIZE = 20`）でクライアントからは変更不可。
- 200: `AdminAnalysisListResponse`（`outcome`は既存`judgeOutcome`を再利用）
- 400: `{ error: string }`

### `DELETE /api/admin/analysis/:id`
- `id`は正の整数。不正なら400。
- 200: `{ deleted: true }`
- 404: `{ error: "指定された分析結果が見つかりません" }`（`deleteAnalysisResult`がfalseを返した場合）

### `GET /api/admin/history?weekStart=YYYY-MM-DD`
- `weekStart`省略時は`currentWeekStartJst()`を使う。
- 与えられた場合、日付形式かつ月曜日であることを検証（`isMonday`）。不正なら400。
- 200: `WeeklyHistory`

## UI Components (Storybook)

### `AdminAnalysisList`
Props:
```ts
type AdminAnalysisListProps = {
  listState:
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "loaded"; results: AnalysisResultWithOutcome[]; total: number; page: number; pageSize: number };
  deletingId: number | null;
  deleteError: string | null;
  onDelete: (id: number) => void;
  onPageChange: (page: number) => void;
};
```
Stories: `Loading` / `ListError` / `Empty` / `WithResults`（複数ページ想定、ページ送りボタン表示）/ `Deleting`（1行が削除処理中でボタンdisabled）/ `DeleteError`。

### `AdminHistoryTable`
Props:
```ts
type AdminHistoryTableProps = {
  state:
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "loaded"; data: WeeklyHistory };
  canGoNext: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};
```
Stories: `Loading` / `LoadError`（グローバルの`Error`とのシャドーイングを避けるため`Error`から改名）/ `Loaded`（一部セルが欠測のサンプル）/ `SparseData`（大半が欠測）/ `AtLatestWeek`（次週ボタンdisabled）。

いずれもPC幅（`layout: "fullscreen"`、viewportはデフォルトのデスクトップサイズ。既存のモバイル向け`mobilePortrait`指定は使わない）。

## Key Files

- 追加: `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/analysis/page.tsx`, `app/admin/history/page.tsx`
- 追加: `app/api/admin/analysis/route.ts`, `app/api/admin/analysis/[id]/route.ts`, `app/api/admin/history/route.ts`
- 追加: `components/AdminAnalysisList.tsx`, `components/AdminAnalysisList.stories.tsx`, `components/AdminAnalysisScreen.tsx`
- 追加: `components/AdminHistoryTable.tsx`, `components/AdminHistoryTable.stories.tsx`, `components/AdminHistoryScreen.tsx`
- 追加: `lib/weeklyHistory.ts`, `lib/weeklyHistory.test.ts`
- 変更: `lib/db.ts`（`getAnalysisResultsPage` / `countAnalysisResults` / `deleteAnalysisResult` / `getCandlesInRange` 追加）

## Error Handling / Edge Cases

- **削除の競合**: 削除確定時に対象が既に無ければ404を返し、画面は一覧を再取得して最新状態に揃える（Req 2.3）。
- **ページ範囲外**: `page`が総ページ数を超える場合も200で`results: []`を返す（エラーにしない）。
- **次週の上限**: `currentWeekStartJst()`より後の週には進めない。`AdminHistoryScreen`側で表示中の`weekStartDate >= currentWeekStartJst()`なら`canGoNext=false`とし、APIも将来週のリクエストが来た場合は全セル`null`のグリッドを返す（サーバー側でも壊れないようにするが、UIとしてはボタンdisabledで到達させない）。
- **前週の下限**: 特に制限しない。データが存在しない週は全セル`null`（空欄）の表になる（Req 3.5と同じ扱い）。
- **DBエラー**: 各APIはtry/catchで500 `{ error }` を返し、画面はerror状態を表示する（既存`/api/analysis`と同様のパターンだが、GETでも例外を捕捉する点は既存より明示的にする）。
- **週データの欠測**: 該当UTC分に1分足が無い（収集停止・祝日等）場合はセルを`null`とし、UIは「—」を表示（Req 3.5）。

## Testing Approach

- `lib/weeklyHistory.ts`: 純粋関数部分（`currentWeekStartJst` / `shiftWeek` / `isMonday` / JST→UTC変換）を `lib/weeklyHistory.test.ts` で単体テスト（`lib/analyzeRate.test.ts`と同様にvitestの`describe/it`）。JST深夜0時付近やDBT境界（週またぎ）のケースを含める。
- `lib/db.ts`の追加関数は既存同様、直接のユニットテストは設けず（既存の`insertAnalysisResult`等もテスト対象外）、APIレベルの動作確認は手動 + `tsc --noEmit` / `next build` で型・ビルドエラーを検出する。
- UIコンポーネント（`AdminAnalysisList` / `AdminHistoryTable`）はStorybook storyで状態（loading/error/empty/loaded/削除中/次週disabled等）を再現し、`ui-check`スキルで目視確認する。
- 最低限 `npm run lint` / `tsc --noEmit` / `npm run build` を実装完了時に実行する。
