import { describe, expect, it } from "vitest";
import { sampleEvery10Minutes } from "@/lib/exportData";
import type { RateHistoryPoint } from "@/lib/db";

describe("sampleEvery10Minutes", () => {
  function candle(minute: number): RateHistoryPoint {
    return { timestamp: `2026-09-01T00:${String(minute).padStart(2, "0")}:00.000Z`, bid: 150 };
  }

  it("毎時0,10,20,30,40,50分の行のみを残す", () => {
    const candles = Array.from({ length: 60 }, (_, minute) => candle(minute));
    const result = sampleEvery10Minutes(candles);
    expect(result.map((c) => new Date(c.timestamp).getUTCMinutes())).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it("空配列なら空配列を返す", () => {
    expect(sampleEvery10Minutes([])).toEqual([]);
  });
});
