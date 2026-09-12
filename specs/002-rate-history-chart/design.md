# レート履歴のDB保存とチャート表示 — Design

## Tech Stack Versions
spec 001 のバージョン系列を踏襲する（Next.js 16.x / Tailwind CSS 4.x / Storybook 10.x）。追加で以下を採用する。

| 用途 | 選定 | 理由 |
|---|---|---|
| DB | Node.js 組み込み `node:sqlite`（`DatabaseSync`） | 常時起動環境（本devcontainer/自前サーバー）を前提に確定。追加npm依存なしで使える（Node 24で実験フラグ不要で動作確認済み）。ファイルベースで永続化がシンプル。 |
| チャート描画 | `recharts` | Reactとの統合が簡単な折れ線チャートライブラリ。実装時は `dataviz` スキルの配色ガイドに従う。 |
| 定期実行 | Next.js `instrumentation.ts` の `register()` + `setInterval` | 常時起動サーバー前提なので外部cron/サーバーレス向けスケジューラは不要。サーバー起動時に1回登録するだけで完結。 |

## Architecture
- `instrumentation.ts`（プロジェクトルート）: サーバー起動時に DB 初期化（テーブル作成）を行い、`setInterval` で `collectRate()` を1分間隔で呼び出す。
- `lib/fetchTicker.ts`: spec 001 の `app/api/rate/usd-jpy/route.ts` にあった上流ticker取得ロジックを共通化して抽出（DRY。route.ts側もこれを使うようリファクタする）。
- `lib/db.ts`: SQLiteコネクションのシングルトン、テーブル初期化、`insertCandle()` / `getHistory(range)` などのクエリヘルパー。DBファイルは `data/fx.db`（`.gitignore`に追加）。
- `lib/collectRate.ts`: `fetchTicker()` で取得し、現在時刻を収集間隔（1分）でバケット化した `bucket_start` を計算して `insertCandle()` で保存（`INSERT OR IGNORE`。同一バケットへの二重保存は主キー制約で自然に防げる＝Req 1.3）。失敗時は `console.error` のみでスケジュールは継続（Req 1.2）。
- `app/api/rate/usd-jpy/history/route.ts`: `GET ?range=1d|1w|1m` でDBから期間内の履歴を返す。
- `app/chart/page.tsx`: チャート画面（Client Component）。今回は `/chart` に直接置く独立画面（spec 003 でスワイプ導線に統合される前提）。期間セレクター＋チャート＋空状態表示。spec 001 と同じダークテーマ（`bg-black` / `bg-zinc-900`）・縦横レイアウトを踏襲。
- `components/RateChart.tsx`: プレゼンテーション用チャートコンポーネント（`loading` / データあり(縦・横) / `empty` の状態を持つ）。

## Data Model / Types

**保存形式についての方針**: 定期収集は1バケットにつき1点のスナップショットしか取れないが、将来
ダウンタイム分の欠損を GMO コインの `klines`（ローソク足）APIで後から埋める可能性がある
（`requirements.md` Out of Scope。別specで実施）。その際にデータ形が食い違わないよう、
**最初から `klines` と同じ OHLC（ローソク足）構造・同じ `interval` の語彙で保存する**。
定期収集による1点データは `open = high = low = close`（=その時点のbid）として書き込めば、
後から本物のOHLCで同じバケットを埋める／照合する際にも構造の変換が不要になる。

```ts
type RateCandle = {
  symbol: "USD_JPY";
  interval: "1min"; // 収集間隔。GMOコインの klines API の interval 語彙に合わせる
  bucketStart: string; // ISO。収集間隔でフロア丸めしたバケット開始時刻
  open: number;
  high: number;
  low: number;
  close: number;
  ask: number | null; // 定期収集時のみ埋まる参考値（klinesにはaskの概念が別途必要なため backfill 時は null）
  source: "live" | "backfill";
};
```

SQLiteスキーマ:
```sql
CREATE TABLE IF NOT EXISTS rate_candles (
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  bucket_start TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  ask REAL,
  source TEXT NOT NULL,
  PRIMARY KEY (symbol, interval, bucket_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_candles_range
  ON rate_candles(symbol, interval, bucket_start);
```
`PRIMARY KEY (symbol, interval, bucket_start)` が同一バケットの重複書き込みを防ぐ主キー制約になる
（`INSERT OR IGNORE`で二重挿入を無害化）。将来の backfill spec もこのテーブル・同じキーに
`source: "backfill"` として書き込むだけで統合できる。

## API Contract
- `GET /api/rate/usd-jpy/history?range=1d|1w|1m`
  - 200: `{ range: "1d" | "1w" | "1m"; data: { timestamp: string; bid: number }[] }`
    （`rate_candles`の`bucket_start`→`timestamp`、`close`→`bid`にマッピングして返す。チャートは折れ線のみで足の高安は今回使わないため、レスポンスはシンプルな時系列点に絞る。`data`は空配列の場合あり。UI側でReq 2.3の空状態表示を担当）
  - 400: `{ error: string }`（`range`が不正な値の場合）

## UI Components (Storybook)
- `RateChart`: 以下の状態を story で再現する（layoutは`fullscreen`、viewportはspec 001同様iPhone SE相当）
  - `loading`
  - データあり（縦向き）
  - データあり（横向き）
  - `empty`（選択期間内データなし）
- 期間セレクター（1日/1週間/1ヶ月）はダークテーマ・タップしやすい大きさのボタン/タブで実装する。

## Key Files
- `instrumentation.ts`
- `lib/fetchTicker.ts`（spec 001の`route.ts`から抽出・共通化）
- `lib/db.ts`, `lib/collectRate.ts`
- `app/api/rate/usd-jpy/route.ts`（`fetchTicker()`を使うようリファクタ、既存のI/Fは変更しない）
- `app/api/rate/usd-jpy/history/route.ts`
- `app/chart/page.tsx`
- `components/RateChart.tsx`, `components/RateChart.stories.tsx`
- `.gitignore` に `data/`（DBファイル）を追加

## Error Handling / Edge Cases
- 定期収集の失敗（ticker取得・DB書き込みいずれも）は`console.error`に記録し、次回の`setInterval`実行に影響させない（Req 1.2）。
- 重複防止: `(symbol, interval, bucket_start)` の主キー制約と `INSERT OR IGNORE` により、同一バケットへの二重保存は構造的に発生しない（Req 1.3）。
- サーバー停止中は`setInterval`自体が動かないため、その期間のバケットは欠損する（許容する。Out of Scope参照。将来`klines`で埋める場合も同じテーブル・キーに`source: "backfill"`で追記するだけで統合できる）。
- 選択期間内にデータが0件の場合、APIは200で空配列を返し、UIが「データがありません」を表示する（空のグラフを描かない）（Req 2.3）。
- `range`クエリパラメータが `1d`/`1w`/`1m` 以外なら400を返す。

## Testing Approach
- `next build`（内蔵TypeScriptチェック含む）
- `RateChart`はStorybook storyで縦横・各状態を再現し、`ui-check`で目視確認する。
- DBロジック（`insertRate`/`getHistory`/重複防止）は `next dev` 起動でinstrumentationが実際に動くこと、および手動での複数回実行で重複行が増えないことを確認する（本番相当のテストランナーは今回導入しない。軽量に保つ）。
