# AI分析の高度化（テクニカル指標） — Tasks

- [x] 1. `vitest.config.ts` にNode環境のユニットテスト用project（`name: 'unit'`, `**/*.test.ts`）を追加し、`package.json` に `"test": "vitest run"` を追加する（Design: Testing Approach, Key Files）※Storybookのbrowser projectがPlaywright未インストール環境で失敗するため、`test`スクリプトは`vitest run --project unit`に絞った
- [x] 2. `lib/analyzeRate.ts` に `computeIndicators()` を実装する（短期SMA(15分)・長期SMA(60分)・変化率・ボラティリティ・高値/安値。件数不足時は該当SMAを`null`、1件のみの場合は`changeRate=0`/`volatility=0`で例外を投げない）（Req: 1.1, 1.4 / Design: Indicator Calculation）
- [x] 3. `lib/analyzeRate.test.ts` を作成し、`computeIndicators()` を「120件」「15/60件未満」「1件のみ」のケースでテストする（Design: Testing Approach）
- [x] 4. `buildPrompt()` を拡張してテクニカル指標のサマリーを含める。`METHOD` を `"v2"` に変更する（Req: 1.2, 2.1 / Design: Prompt Contract, Architecture）
- [x] 5. `npx tsc --noEmit` / `npx eslint` / `npm test` を実行して確認する（すべてパス）。`ANTHROPIC_API_KEY` が未設定のため実際のAI呼び出しでのE2E確認は保留（spec 004実装時と同様）（Design: Testing Approach）
