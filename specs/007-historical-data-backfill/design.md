# 過去データの取得・保存（バックフィル） — Design

## Architecture
- `scripts/backfillHistory.ts`（新規）: Next.jsアプリの外で `node scripts/backfillHistory.ts` として
  直接実行するCLIスクリプト（Node 24のネイティブTypeScript実行を利用し、ビルド不要）。
  - 引数: `--from=YYYY-MM-DD --to=YYYY-MM-DD`（両端含む、JST基準の暦日）。
  - 対象日を1日ずつ処理し、GMOコイン klines API
    (`GET https://forex-api.coin.z.com/public/v1/klines?symbol=USD_JPY&priceType=BID&interval=1min&date=YYYYMMDD`)
    を呼び出す（既存 `app/api/rate/usd-jpy/route.ts` の `interval=1day` 呼び出しパターンを踏襲、
    `interval=1min` の場合は `date` が年ではなく日付＝`YYYYMMDD` 形式になる点のみ異なる）。
  - レスポンスの各足を `insertCandle()`（`lib/db.ts`、既存）でそのまま保存する。
    `INSERT OR IGNORE` により重複日の再実行や既存ライブデータとの重複が無害化される
    （Req 1.2 は既存関数の再利用で自動的に満たされる。新規の重複排除ロジックは書かない）。
  - `ask` は klines に無いため `null`（spec 002 の `backfill` の扱いと同じ）。`source: "backfill"`。
  - 1日ごとの呼び出し間に短い待機（例: 200ms）を入れ、上流APIへの負荷を避ける。
  - 実際のレスポンスの正確なフィールド名（`openTime`/`open`/`high`/`low`/`close` を想定）は
    実装時に1日分を curl などで確認し確定させる（Out of Scope: 事前のAPI仕様調査）。
- **`lib/db.ts` の変更**: 現在 `import { runMigrations } from "@/lib/migrate";` と `@/` エイリアスで
  importしているが、Next.js のバンドラ（webpack/Turbopack）以外＝プレーンな `node` 実行では
  このエイリアスは解決できない。CLIスクリプトから `lib/db.ts` をそのまま再利用するため、
  `./migrate.ts` という相対import（拡張子明示）に変更する。Next.js側の解決結果は変わらないため
  アプリの挙動に影響は無い。
- **`tsconfig.json` の変更**: 拡張子付きの相対import（`./migrate.ts`）を型チェックで許可するため、
  `compilerOptions.allowImportingTsExtensions: true` を追加する（`noEmit: true` が既に設定済みのため
  追加条件を満たす）。
- `package.json` に `"backfill": "node scripts/backfillHistory.ts"` を追加する（引数はコマンドライン
  経由でそのまま渡せる: `npm run backfill -- --from=2026-08-01 --to=2026-08-31`）。

## Data Model / Types
```ts
// scripts/backfillHistory.ts 内で使うレスポンス型（要実装時検証）
type KlinesResponse = {
  status?: number;
  data?: Array<{ openTime?: string; open?: string; high?: string; low?: string; close?: string }>;
};
```
新規テーブル・マイグレーションは無し（既存 `rate_candles` にそのまま保存する）。

## API Contract
無し（HTTP API は追加しない。CLIスクリプトのみ）。

## Error Handling / Edge Cases
- `--from` > `--to` 、日付形式が不正、いずれかの引数が無い場合は使用方法を表示して終了する。
- 対象範囲に本日以降の日付が含まれる場合はその日をスキップする（Req 1.3）。
  （「本日」の判定はJSTの暦日で行う。既存の週末休場判定 `instrumentation.ts` と同様の
  `Intl.DateTimeFormat(..., { timeZone: "Asia/Tokyo" })` を使う。）
- ある日の klines 呼び出しが失敗（ネットワークエラー、`status !== 0`、空データ）した場合は、
  その日をスキップしてログに記録し、処理を継続する（Req 1.4）。
- 実行完了後、成功日数・スキップ日数・挿入件数のサマリーを標準出力に表示する（Req 2.2）。
- 大きすぎる範囲（例: 数年分）を指定した場合の上限チェックは設けない
  （運用者が意図して実行するCLIのため。Out of Scope）。

## Key Files
- 新規: `scripts/backfillHistory.ts`
- 変更: `lib/db.ts`（import文のみ）, `tsconfig.json`（`allowImportingTsExtensions` 追加）,
  `package.json`（`backfill` script追加）

## Testing Approach
- `npx tsc --noEmit` / `npm run lint` / `npm run build` で型・静的解析・既存ビルドに影響が無いことを
  確認する。
- 実装時にまず klines API (`interval=1min`) の実際のレスポンス形状を1日分 curl で確認し、
  型定義とパース処理を実データに合わせる。
- 開発DB（`data/fx.db`）に対して直近の実在日付（1〜2日分）で実行し、
  `rate_candles` に `source='backfill'` の行が想定件数（1日1440件前後、休場日は少ない）で
  挿入されることを `sqlite3` で確認する。既存のライブ収集データと重複するタイムスタンプが
  上書きされない（`INSERT OR IGNORE`）ことも確認する。
- 未来日・存在しない日付を含む範囲を指定し、エラーにならずスキップ扱いになることを確認する。
