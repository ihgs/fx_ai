import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { runMigrations } from "./migrate.ts";

export const SYMBOL = "USD_JPY";
export const INTERVAL = "1min";

const DB_PATH = join(process.cwd(), "data", "fx.db");

export type RateCandle = {
  symbol: string;
  interval: string;
  bucketStart: string;
  open: number;
  high: number;
  low: number;
  close: number;
  ask: number | null;
  source: "live" | "backfill";
};

export type RateHistoryPoint = {
  timestamp: string;
  bid: number;
};

export type AnalysisResult = {
  id: number;
  executedAt: string;
  method: string;
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;
  inputTo: string;
  trigger: "manual" | "scheduled";
};

export type NewAnalysisResult = {
  executedAt: string;
  method: string;
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;
  inputFrom: string;
  inputTo: string;
  trigger: "manual" | "scheduled";
};

const RANGE_MS = {
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
} as const;

export type HistoryRange = keyof typeof RANGE_MS;

export function isValidRange(range: string): range is HistoryRange {
  return range in RANGE_MS;
}

let db: DatabaseSync | undefined;

function getDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH, { timeout: 5000 });
  // WALモード: 別プロセス（backfillHistory.ts等）からの同時書き込みでも
  // 即座に「database is locked」にならないようにする。
  db.exec("PRAGMA journal_mode = WAL;");
  runMigrations(db);
  return db;
}

/** サーバー起動時に明示的にDB・テーブルを初期化する（instrumentation.ts から呼ばれる）。 */
export function initDb(): void {
  getDb();
}

/**
 * 同一バケット（symbol/interval/bucketStart）が既に存在する場合、通常は無害化（無視）されるが、
 * backfill（確定値）からの保存はliveの値を上書きする（backfillの方が確定した正しい値のため）。
 */
export function insertCandle(candle: RateCandle): void {
  getDb()
    .prepare(
      `INSERT INTO rate_candles
         (symbol, interval, bucket_start, open, high, low, close, ask, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (symbol, interval, bucket_start) DO UPDATE SET
         open = excluded.open,
         high = excluded.high,
         low = excluded.low,
         close = excluded.close,
         ask = excluded.ask,
         source = excluded.source
       WHERE excluded.source = 'backfill'`,
    )
    .run(
      candle.symbol,
      candle.interval,
      candle.bucketStart,
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.ask,
      candle.source,
    );
}

export function getHistory(range: HistoryRange): RateHistoryPoint[] {
  const since = new Date(Date.now() - RANGE_MS[range]).toISOString();
  return getDb()
    .prepare(
      `SELECT bucket_start as timestamp, close as bid
       FROM rate_candles
       WHERE symbol = ? AND interval = ? AND bucket_start >= ?
       ORDER BY bucket_start ASC`,
    )
    .all(SYMBOL, INTERVAL, since) as unknown as RateHistoryPoint[];
}

/** 直近 `limit` 件の1分足を古い順で返す（AI分析の入力用）。 */
export function getRecentCandles(limit: number): RateHistoryPoint[] {
  const rows = getDb()
    .prepare(
      `SELECT bucket_start as timestamp, close as bid
       FROM rate_candles
       WHERE symbol = ? AND interval = ?
       ORDER BY bucket_start DESC
       LIMIT ?`,
    )
    .all(SYMBOL, INTERVAL, limit) as unknown as RateHistoryPoint[];
  return rows.reverse();
}

export function insertAnalysisResult(input: NewAnalysisResult): AnalysisResult {
  const info = getDb()
    .prepare(
      `INSERT INTO analysis_results
         (executed_at, method, direction, rationale, target_at, input_from, input_to, trigger)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.executedAt,
      input.method,
      input.direction,
      input.rationale,
      input.targetAt,
      input.inputFrom,
      input.inputTo,
      input.trigger,
    );

  return {
    id: Number(info.lastInsertRowid),
    executedAt: input.executedAt,
    method: input.method,
    direction: input.direction,
    rationale: input.rationale,
    targetAt: input.targetAt,
    inputTo: input.inputTo,
    trigger: input.trigger,
  };
}

export function getAnalysisResults(limit: number): AnalysisResult[] {
  return getDb()
    .prepare(
      `SELECT id, executed_at as executedAt, method, direction, rationale,
              target_at as targetAt, input_to as inputTo, trigger
       FROM analysis_results
       ORDER BY executed_at DESC
       LIMIT ?`,
    )
    .all(limit) as unknown as AnalysisResult[];
}

/** 管理画面の一覧用: 指定件数分をオフセット付きで返す（新しい順）。 */
export function getAnalysisResultsPage(offset: number, limit: number): AnalysisResult[] {
  return getDb()
    .prepare(
      `SELECT id, executed_at as executedAt, method, direction, rationale,
              target_at as targetAt, input_to as inputTo, trigger
       FROM analysis_results
       ORDER BY executed_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as unknown as AnalysisResult[];
}

export function countAnalysisResults(): number {
  const row = getDb().prepare(`SELECT COUNT(*) as count FROM analysis_results`).get() as { count: number };
  return row.count;
}

/** 指定idの分析結果を削除する。対象が存在しなかった場合はfalseを返す。 */
export function deleteAnalysisResult(id: number): boolean {
  const info = getDb().prepare(`DELETE FROM analysis_results WHERE id = ?`).run(id);
  return Number(info.changes) > 0;
}

/** 週次表の集計用: [fromIso, toIso) の範囲の1分足を古い順で返す。 */
export function getCandlesInRange(fromIso: string, toIso: string): RateHistoryPoint[] {
  return getDb()
    .prepare(
      `SELECT bucket_start as timestamp, close as bid
       FROM rate_candles
       WHERE symbol = ? AND interval = ? AND bucket_start >= ? AND bucket_start < ?
       ORDER BY bucket_start ASC`,
    )
    .all(SYMBOL, INTERVAL, fromIso, toIso) as unknown as RateHistoryPoint[];
}

/** 答え合わせ用: 指定時刻以降で最初に存在するローソク足（無ければnull）。 */
export function getCandleAtOrAfter(timestamp: string): RateHistoryPoint | null {
  const row = getDb()
    .prepare(
      `SELECT bucket_start as timestamp, close as bid
       FROM rate_candles
       WHERE symbol = ? AND interval = ? AND bucket_start >= ?
       ORDER BY bucket_start ASC
       LIMIT 1`,
    )
    .get(SYMBOL, INTERVAL, timestamp) as RateHistoryPoint | undefined;
  return row ?? null;
}
