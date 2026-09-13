# AI分析の高度化（テクニカル指標） — Design

## Architecture
- `lib/analyzeRate.ts` に指標計算とプロンプト構築を追加する。API/DB/呼び出しフロー自体（spec 004の`runAnalysis(trigger)`シグネチャ、`app/api/analysis/route.ts`、`AnalysisScreen`）は変更しない。
  1. `getRecentCandles(HISTORY_MINUTES)`で取得した終値の時系列（`{timestamp, bid}[]`）から、新設の`computeIndicators()`でテクニカル指標を算出する。
  2. `buildPrompt()`を拡張し、生の時系列に加えて指標のサマリーをプロンプトへ埋め込む。
  3. `METHOD`定数を`"v1"`から`"v2"`に変更する（Req 2.1）。既存の`v1`の分析結果・正答率統計はそのままDBに残り、`v2`は別集計になる（`lib/db.ts`の`getAccuracyStats`系は既に`method`でGROUP BYしている前提を踏襲。実装側で確認する）。

## Data Model / Types
新規の型（DB非永続化、`lib/analyzeRate.ts`内で完結）:
```ts
type Indicators = {
  smaShort: number | null;   // 短期移動平均（直近15分）
  smaLong: number | null;    // 長期移動平均（直近60分、historyが足りなければnull）
  changeRate: number;        // 期間内の変化率（%） = (最新値 - 最古値) / 最古値 * 100
  volatility: number;        // 期間内の標準偏差（終値ベース）
  high: number;              // 期間内の高値（終値ベースの最大値）
  low: number;               // 期間内の安値（終値ベースの最小値）
};
```
- `smaShort`/`smaLong`の窓（15分/60分）は`HISTORY_MINUTES=120`より十分小さく、通常運用（1分間隔でのレート収集が継続している状態）では毎回両方とも算出できる。データ欠損等でhistoryの件数が窓幅に満たない場合のみ`null`（Req 1.4）。
- DBスキーマ（`analysis_results`テーブル）は変更しない（Req 1.3）。指標値は都度計算のみでDB保存しない（Out of Scope）。

## Indicator Calculation
`lib/analyzeRate.ts`に純粋関数として実装する（`history: RateHistoryPoint[]`を受け取り`Indicators`を返す）。
- `smaShort` = 直近15件（15分）の`bid`の単純平均。件数が15未満なら`null`。
- `smaLong` = 直近60件（60分）の`bid`の単純平均。件数が60未満なら`null`。
- `changeRate` = `(history.at(-1).bid - history[0].bid) / history[0].bid * 100`。
- `volatility` = `bid`系列の標本標準偏差。
- `high`/`low` = `bid`系列の最大値/最小値。
- 件数が1件のみの場合、`volatility=0`、`changeRate=0`、`smaShort`/`smaLong`は共に`null`（0除算・NaN回避）。

## Prompt Contract
`buildPrompt(history, indicators)`（既存の`buildPrompt(history)`を拡張）:
```
以下はUSD/JPYの直近{N}分間、1分足の終値（bid）の推移です。

{timestamp}: {bid}
...

【テクニカル指標】
- 短期移動平均（15分）: {smaShort or "算出不可（データ不足）"}
- 長期移動平均（60分）: {smaLong or "算出不可（データ不足）"}
- 期間内変化率: {changeRate}%
- ボラティリティ（標準偏差）: {volatility}
- 期間内高値: {high} / 安値: {low}

この推移とテクニカル指標をもとに、今後1時間程度のUSD/JPYの見通しを...(既存の指示文を維持)
```
既存の出力スキーマ（`AnalysisOutputSchema`: `direction` / `rationale`）は変更しない。

## Key Files
- `lib/analyzeRate.ts`: `computeIndicators()`追加、`buildPrompt()`拡張、`METHOD`を`"v2"`に変更。
- `lib/analyzeRate.test.ts`（新規）: 指標計算の単体テスト。
- `vitest.config.ts`: Node環境のユニットテスト用projectを追加。
- `package.json`: `scripts.test`を追加。

## Error Handling / Edge Cases
- レート履歴が0件の場合は既存どおり`runAnalysis`が例外を投げる（変更なし）。
- 履歴件数が1件のみ、または短期/長期SMAの窓に満たない場合も、`computeIndicators`は例外を投げず算出可能な範囲の値（`null`含む）を返し、分析自体は継続する（Req 1.4）。
- 指標計算はAI呼び出し前のローカル計算のみのため、新たな外部失敗要因は増えない。

## Testing Approach
- `vitest`は既に依存関係に入っているが、現状`vitest.config.ts`はStorybookのbrowserテスト用project（`name: 'storybook'`）のみで、Node環境でのユニットテスト用projectと`test`スクリプトが無い。本specで以下を追加する:
  - `vitest.config.ts`の`test.projects`に、Node環境でファイルパターン`**/*.test.ts`を実行するproject（`name: 'unit'`）を追加する。
  - `package.json`の`scripts`に`"test": "vitest run"`を追加する。
- `lib/analyzeRate.test.ts`（新規）で`computeIndicators()`の単体テストを書く:
  - 十分な件数（120件）: 全指標が算出されること
  - 件数が15/60未満: 該当するSMAが`null`になること
  - 件数が1件: `changeRate=0`, `volatility=0`, 例外を投げないこと
- `npx tsc --noEmit` / `npx eslint` で型・lintを確認する。
- `ANTHROPIC_API_KEY`が利用可能であれば、実際に`runAnalysis("manual")`を実行してプロンプトに指標が含まれること・`method="v2"`で保存されることを手動確認する。難しい場合は`buildPrompt()`の出力文字列を確認するだけに留める。
