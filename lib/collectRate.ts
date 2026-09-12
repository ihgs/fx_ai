import { fetchTicker } from "@/lib/fetchTicker";
import { insertCandle, SYMBOL, INTERVAL } from "@/lib/db";

const BUCKET_MS = 60_000; // 1分（Design: 収集間隔）

function currentBucketStart(): string {
  const now = Date.now();
  return new Date(Math.floor(now / BUCKET_MS) * BUCKET_MS).toISOString();
}

/**
 * 現在のUSD/JPYレートを取得し、DBに1分バケットとして保存する。
 * 失敗しても呼び出し元（instrumentation.tsのsetInterval）のスケジュールは継続する（Req 1.2）。
 */
export async function collectRate(): Promise<void> {
  try {
    const ticker = await fetchTicker();
    insertCandle({
      symbol: SYMBOL,
      interval: INTERVAL,
      bucketStart: currentBucketStart(),
      open: ticker.bid,
      high: ticker.bid,
      low: ticker.bid,
      close: ticker.bid,
      ask: ticker.ask,
      source: "live",
    });
  } catch (error) {
    console.error("[collectRate] failed to collect USD/JPY rate:", error);
  }
}
