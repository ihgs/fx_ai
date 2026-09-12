import { initDb, insertCandle, SYMBOL, INTERVAL } from "../lib/db.ts";

const KLINES_URL = "https://forex-api.coin.z.com/public/v1/klines";
const REQUEST_INTERVAL_MS = 200; // 上流APIへの負荷軽減のため1日ごとの呼び出し間に待機する

type KlinesResponse = {
  status?: number;
  data?: Array<{ openTime?: string; open?: string; high?: string; low?: string; close?: string }>;
};

function printUsageAndExit(message: string): never {
  console.error(message);
  console.error("Usage: node scripts/backfillHistory.ts --from=YYYY-MM-DD --to=YYYY-MM-DD");
  process.exit(1);
}

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function parseArgs(argv: string[]): { from: string; to: string } {
  const args = new Map<string, string>();
  for (const arg of argv) {
    const match = /^--(from|to)=(.+)$/.exec(arg);
    if (match) args.set(match[1], match[2]);
  }

  const from = args.get("from");
  const to = args.get("to");
  if (!from || !to) return printUsageAndExit("--from と --to は両方とも指定してください");
  if (!isValidDateString(from) || !isValidDateString(to)) {
    return printUsageAndExit("日付は YYYY-MM-DD 形式で指定してください");
  }
  if (from > to) return printUsageAndExit("--from は --to 以前の日付にしてください");

  return { from, to };
}

/** JST基準の「本日」（YYYY-MM-DD）。確定していない当日以降の日付はバックフィル対象外とする（Req 1.3）。 */
function todayJst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 指定日の1分足を取得する。エラー・不正レスポンスは null（呼び出し元でスキップ扱いにする、Req 1.4）。 */
async function fetchDayKlines(date: string): Promise<NonNullable<KlinesResponse["data"]> | null> {
  const apiDate = date.replaceAll("-", "");
  try {
    const res = await fetch(
      `${KLINES_URL}?symbol=${SYMBOL}&priceType=BID&interval=1min&date=${apiDate}`,
      { cache: "no-store" },
    );
    const payload = (await res.json()) as KlinesResponse;
    if (payload.status !== 0 || !Array.isArray(payload.data)) return null;
    return payload.data;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const { from, to } = parseArgs(process.argv.slice(2));
  initDb();

  const today = todayJst();
  let succeededDays = 0;
  let skippedDays = 0;
  let insertedCandles = 0;

  for (const date of eachDateInRange(from, to)) {
    if (date >= today) {
      console.log(`[backfillHistory] ${date}: skip（本日以降は確定した取引日ではない）`);
      skippedDays++;
      continue;
    }

    const candles = await fetchDayKlines(date);
    if (!candles || candles.length === 0) {
      console.log(`[backfillHistory] ${date}: skip（上流APIエラーまたはデータ無し）`);
      skippedDays++;
      await sleep(REQUEST_INTERVAL_MS);
      continue;
    }

    let insertedForDay = 0;
    for (const candle of candles) {
      if (!candle.openTime || !candle.open || !candle.high || !candle.low || !candle.close) continue;
      insertCandle({
        symbol: SYMBOL,
        interval: INTERVAL,
        bucketStart: new Date(Number(candle.openTime)).toISOString(),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        ask: null,
        source: "backfill",
      });
      insertedForDay++;
    }

    console.log(`[backfillHistory] ${date}: ${insertedForDay}件処理（重複は自動的に無視される）`);
    succeededDays++;
    insertedCandles += insertedForDay;
    await sleep(REQUEST_INTERVAL_MS);
  }

  console.log(
    `[backfillHistory] done. success=${succeededDays}日 skipped=${skippedDays}日 processedCandles=${insertedCandles}件`,
  );
}

main();
