import { NextResponse } from "next/server";
import type { UsdJpyRate } from "@/lib/types";

const TICKER_URL = "https://forex-api.coin.z.com/public/v1/ticker";

type TickerResponse = {
  status?: number;
  data?: Array<{ symbol?: string; bid?: string; ask?: string; timestamp?: string }>;
};

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

  const rate: UsdJpyRate = {
    symbol: "USD_JPY",
    bid: Number(usdJpy.bid),
    ask: Number(usdJpy.ask),
    timestamp: usdJpy.timestamp,
  };

  return NextResponse.json(rate);
}
