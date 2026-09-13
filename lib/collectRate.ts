import { fetchTicker } from "@/lib/fetchTicker";
import { insertCandle, SYMBOL, INTERVAL } from "@/lib/db";
import { logger } from "@/lib/logger";

const BUCKET_MS = 60_000; // 1分（Design: 収集間隔）
const CLOSED_STATUS = "CLOSE"; // 上流APIが休場中に返すstatus値

function currentBucketStart(): string {
  const now = Date.now();
  return new Date(Math.floor(now / BUCKET_MS) * BUCKET_MS).toISOString();
}

/**
 * 現在のUSD/JPYレートを取得し、DBに1分バケットとして保存する。
 * 失敗しても呼び出し元（instrumentation.tsのsetInterval）のスケジュールは継続する（Req 1.2）。
 * instrumentation.ts側の曜日・時刻判定は無駄なAPI呼び出し自体を避けるための事前フィルタであり、
 * ここでの休場判定（上流APIの`status`）は、それをすり抜けた場合（祝日等）の保険として機能する。
 */
export async function collectRate(): Promise<void> {
  try {
    const ticker = await fetchTicker();
    if (ticker.status === CLOSED_STATUS) {
      logger.info(`[collectRate] skipped: upstream reports market closed (status=${ticker.status})`);
      return;
    }
    const bucketStart = currentBucketStart();
    insertCandle({
      symbol: SYMBOL,
      interval: INTERVAL,
      bucketStart,
      open: ticker.bid,
      high: ticker.bid,
      low: ticker.bid,
      close: ticker.bid,
      ask: ticker.ask,
      source: "live",
    });
    logger.info(`[collectRate] collected ${SYMBOL} bid=${ticker.bid} ask=${ticker.ask}`, {
      bucketStart,
    });
  } catch (error) {
    console.error("[collectRate] failed to collect USD/JPY rate:", error);
  }
}
