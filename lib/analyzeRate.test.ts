import { describe, expect, it } from "vitest";
import { computeIndicators } from "@/lib/analyzeRate";
import type { RateHistoryPoint } from "@/lib/db";

function candles(bids: number[], startMinute = 0): RateHistoryPoint[] {
  return bids.map((bid, i) => ({
    timestamp: new Date(2026, 0, 1, 0, startMinute + i).toISOString(),
    bid,
  }));
}

describe("computeIndicators", () => {
  it("十分な件数（120件）では全指標が算出される", () => {
    const bids = Array.from({ length: 120 }, (_, i) => 150 + i * 0.01);
    const result = computeIndicators(candles(bids));

    expect(result.smaShort).not.toBeNull();
    expect(result.smaLong).not.toBeNull();
    expect(result.high).toBeCloseTo(150 + 119 * 0.01);
    expect(result.low).toBeCloseTo(150);
    expect(result.changeRate).toBeGreaterThan(0);
    expect(result.volatility).toBeGreaterThan(0);
  });

  it("件数が短期/長期SMAの窓に満たない場合はnullになる", () => {
    const bids = Array.from({ length: 30 }, (_, i) => 150 + i * 0.01);
    const result = computeIndicators(candles(bids));

    expect(result.smaShort).not.toBeNull(); // 30件 >= 15分窓
    expect(result.smaLong).toBeNull(); // 30件 < 60分窓
  });

  it("件数が1件のみの場合は例外を投げずchangeRate/volatilityが0になる", () => {
    const result = computeIndicators(candles([150.123]));

    expect(result.changeRate).toBe(0);
    expect(result.volatility).toBe(0);
    expect(result.smaShort).toBeNull();
    expect(result.smaLong).toBeNull();
    expect(result.high).toBe(150.123);
    expect(result.low).toBe(150.123);
  });
});
