# AI分析の精度向上（追加指標とプロンプト改訂） — Tasks

- [x] 1. `computeIndicators()` に乖離幅（`overExtension`）の算出を追加し、テストを追加する（Req: 1.1, 1.2, 1.3 / Design: Data Model / Types, computeIndicators）
  - `Indicators` 型に `overExtension: number | null` を追加
  - volatilityが0、またはsmaShortがnullの場合はnullを返す
  - `lib/analyzeRate.test.ts` に正常系・volatility=0・smaShort未算出のテストケースを追加

- [x] 2. `computeLongTermTrend()` を新設し、テストを追加する（Req: 2.1, 2.3 / Design: computeLongTermTrend, LONG_TERM_MINUTES）
  - `LONG_TERM_MINUTES = 24 * 60` 定数を追加
  - `history.length < LONG_TERM_MINUTES` の場合はnullを返す
  - `lib/analyzeRate.test.ts` に件数不足でnull・十分な件数で正しい変化率を返すテストケースを追加

- [x] 3. `ANALYSIS_JUDGMENT_GUIDANCE` 共通定数を新設しexportする（Req: 3.1, 3.2, 3.3 / Design: Architecture, Key Files）
  - 単一指標への依存回避・高値安値更新直後の反転リスク注意・根拠が弱い場合はflat優先、の3点を盛り込む

- [x] 4. `buildPrompt()` を改訂し、新指標の表示と判断基準文言を組み込む（Req: 1.2, 2.2, 3.1〜3.3 / Design: buildPrompt）
  - テクニカル指標セクションに「短期線からの乖離幅」「直近24時間の変化率」を追加（算出不可時は「算出不可（データ不足）」と表示）
  - 末尾に `ANALYSIS_JUDGMENT_GUIDANCE` を挿入

- [x] 5. `runAnalysis()` で長期トレンドを取得し `buildPrompt()` に渡す。`METHOD` を `"v3"` に変更する（Req: 2.1, 4.1 / Design: runAnalysis, METHOD）
  - `getRecentCandles(LONG_TERM_MINUTES)` を追加取得し `computeLongTermTrend()` に渡す
  - `METHOD` 定数とコメントを更新

- [x] 6. `buildDailyOutlookPrompt()` に `ANALYSIS_JUDGMENT_GUIDANCE` を追加する（Req: 3.4 / Design: Key Files）
  - 判定依頼の直前に挿入。指標自体の追加は行わない

- [x] 7. 型チェックとテストで最終確認する（Design: Testing Approach）
  - `npx tsc --noEmit`
  - `npx vitest run`
