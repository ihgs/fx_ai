import { NextResponse } from "next/server";
import { fetchTicker } from "@/lib/fetchTicker";
import type { UsdJpyRate } from "@/lib/types";

const KLINES_URL = "https://forex-api.coin.z.com/public/v1/klines";

type KlinesResponse = {
  status?: number;
  data?: Array<{ openTime?: string; open?: string }>;
};

/**
 * 直近取引日の始値をベストエフォートで取得する。
 * 失敗しても null を返すだけで、呼び出し元（ticker取得）には影響させない（Req 1.5 / Design: Error Handling）。
 */
async function fetchLatestOpen(): Promise<UsdJpyRate["open"]> {
  try {
    const year = new Date().getUTCFullYear();
    const res = await fetch(
      `${KLINES_URL}?symbol=USD_JPY&priceType=BID&interval=1day&date=${year}`,
      { cache: "no-store" },
    );
    const payload = (await res.json()) as KlinesResponse;
    if (payload.status !== 0 || !Array.isArray(payload.data) || payload.data.length === 0) {
      return null;
    }
    const latest = payload.data[payload.data.length - 1];
    if (!latest.open || !latest.openTime) return null;

    const date = new Date(Number(latest.openTime)).toISOString().slice(0, 10);
    return { price: Number(latest.open), date };
  } catch {
    return null;
  }
}

export async function GET() {
  let ticker;
  try {
    ticker = await fetchTicker();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reach upstream rate API" },
      { status: 502 },
    );
  }

  const open = await fetchLatestOpen();

  const rate: UsdJpyRate = {
    symbol: "USD_JPY",
    ...ticker,
    open,
  };

  return NextResponse.json(rate);
}
