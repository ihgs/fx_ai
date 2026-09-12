const TICKER_URL = "https://forex-api.coin.z.com/public/v1/ticker";

export type TickerData = {
  bid: number;
  ask: number;
  timestamp: string;
};

type TickerResponse = {
  status?: number;
  data?: Array<{ symbol?: string; bid?: string; ask?: string; timestamp?: string }>;
};

/**
 * USD/JPY の現在レート（ticker）を取得する。失敗時は例外を投げる
 * （呼び出し元がAPIレスポンスやDB保存スキップなど、それぞれの文脈で処理する）。
 */
export async function fetchTicker(): Promise<TickerData> {
  let payload: TickerResponse;
  try {
    const res = await fetch(TICKER_URL, { cache: "no-store" });
    payload = (await res.json()) as TickerResponse;
  } catch {
    throw new Error("Failed to reach upstream rate API");
  }

  if (payload.status !== 0 || !Array.isArray(payload.data)) {
    throw new Error("Upstream rate API returned an error");
  }

  const usdJpy = payload.data.find((item) => item.symbol === "USD_JPY");
  if (!usdJpy || usdJpy.bid === undefined || usdJpy.ask === undefined || !usdJpy.timestamp) {
    throw new Error("USD_JPY rate not found in upstream response");
  }

  return {
    bid: Number(usdJpy.bid),
    ask: Number(usdJpy.ask),
    timestamp: usdJpy.timestamp,
  };
}
