# 運用ログ強化（infoレベル） — Design

## Architecture
- `lib/logger.ts`（新規）: `logger.info` / `logger.warn` / `logger.error` を提供する軽量ロガー。
  外部ライブラリは追加せず、内部実装は `console.info` / `console.warn` / `console.error` を使う。
  `LOG_LEVEL` 環境変数（`"info" | "warn" | "error"`、既定 `"info"`）で閾値未満のログを抑制する。
- `lib/collectRate.ts`: レート取得・保存に成功した直後に `logger.info` を1行追加する
  （symbol・bucketStart・bid/askを含む）。既存の失敗時 `console.error` は変更しない（Req 1.2）。
- `lib/analyzeRate.ts`（`runAnalysis`）: `insertAnalysisResult` 成功後、返り値を返す直前に
  `logger.info` を1行追加する（trigger・method・directionを含む）。manual/scheduled 両方の
  呼び出し経路で共通のため、ここ1箇所への追加で Req 2.1 を満たす。既存の失敗時（例外throw）挙動は
  変更しない（Req 2.2）。
- `instrumentation.ts`:
  - レート収集の `setInterval` コールバックで `isJstWeekendMarketClosed()` によりスキップした
    場合に `logger.info` でスキップした旨を出す（Req 1.3）。
  - 分析の `setInterval` コールバックで、休場中スキップ・時間外スキップそれぞれの分岐に
    `logger.info` でスキップ理由を出す（Req 2.3）。
  - 既存の `console.error("[runAnalysis] scheduled analysis failed:", error)` は変更しない。

## Data Model / Types
```ts
// lib/logger.ts
export type LogLevel = "info" | "warn" | "error";

export const logger: {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};
```
DBスキーマ・マイグレーションの変更は無し。

## API Contract
無し（バックグラウンド処理へのログ追加のみで、既存APIレスポンス形状に変更は無い）。

## Error Handling / Edge Cases
- `LOG_LEVEL` に `"info" | "warn" | "error"` 以外の値が設定された場合は `"info"` にフォールバックする
  （Req 3.2）。
- ロガー内部で例外が発生しても本処理（レート収集・分析）に影響させない
  （`console.*` 呼び出し自体が失敗するケースは想定しないが、念のため薄いtry-catchは設けない
  ＝シンプルさを優先し、`console.*` は失敗しない前提とする）。
- 既存の全ログ呼び出し箇所（`[collectRate]`, `[runAnalysis]` 等のprefixの慣習）を踏襲し、
  ログメッセージの先頭に処理名のprefixを付ける。

## Key Files
- 新規: `lib/logger.ts`
- 変更: `lib/collectRate.ts`, `lib/analyzeRate.ts`, `instrumentation.ts`

## Testing Approach
- `npx tsc --noEmit` / `npm run lint` / `npm run build` で型・静的解析・ビルドを確認する。
- 自動テスト基盤が無いため、開発サーバー（`npm run dev`）を起動し以下を手動確認する:
  - `LOG_LEVEL` 未設定時、1分ごとに `[collectRate]` のinfoログが出力されること
  - `LOG_LEVEL=error` を設定して起動した場合、`[collectRate]` のinfoログが出力されないこと
    （エラー発生時のみ出力されることを確認）
  - 手動でAI分析を実行し `[runAnalysis]` のinfoログ（trigger=manual）が出力されること
