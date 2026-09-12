import { NextResponse } from "next/server";
import type { UsdJpyRate } from "@/lib/types";

const TICKER_URL = "https://forex-api.coin.z.com/public/v1/ticker";
const KLINES_URL = "https://forex-api.coin.z.com/public/v1/klines";

type TickerResponse = {
  status?: number;
  data?: Array<{ symbol?: string; bid?: string; ask?: string; timestamp?: string }>;
};

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
  let payload: TickerResponse;
  try {
    const res = await fetch(TICKER_URL, { cache: "no-store" });
    payload = (await res.json()) as TickerResponse;
  } catch {
    return NextResponse.json({ error: "Failed to reach upstream rate API" }, { status: 502 });
  }

  if (payload.status !== 0 || !Array.isArray(payload.data)) {
    return NextResponse.json({ error: "Upstream rate API returned an error" }, { status: 502 });
  }

  const usdJpy = payload.data.find((item) => item.symbol === "USD_JPY");
  if (!usdJpy || usdJpy.bid === undefined || usdJpy.ask === undefined || !usdJpy.timestamp) {
    return NextResponse.json({ error: "USD_JPY rate not found in upstream response" }, { status: 502 });
  }

  const open = await fetchLatestOpen();

  const rate: UsdJpyRate = {
    symbol: "USD_JPY",
    bid: Number(usdJpy.bid),
    ask: Number(usdJpy.ask),
    timestamp: usdJpy.timestamp,
    open,
  };

  return NextResponse.json(rate);
}
