import { describe, expect, it } from "vitest";
import { computeIndicators, computeLongTermTrend } from "@/lib/analyzeRate";
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

  it("十分な件数がありボラティリティが0でなければoverExtensionが算出される", () => {
    const bids = Array.from({ length: 120 }, (_, i) => 150 + i * 0.01);
    const result = computeIndicators(candles(bids));

    expect(result.overExtension).not.toBeNull();
    expect(result.overExtension).toBeCloseTo((bids[bids.length - 1] - result.smaShort!) / result.volatility!);
  });

  it("smaShortが算出不可の場合はoverExtensionもnullになる", () => {
    const bids = Array.from({ length: 10 }, (_, i) => 150 + i * 0.01);
    const result = computeIndicators(candles(bids));

    expect(result.smaShort).toBeNull();
    expect(result.overExtension).toBeNull();
  });

  it("ボラティリティが0（全て同一値）の場合はoverExtensionがnullになる", () => {
    const bids = Array.from({ length: 120 }, () => 150);
    const result = computeIndicators(candles(bids));

    expect(result.volatility).toBe(0);
    expect(result.overExtension).toBeNull();
  });
});

describe("computeLongTermTrend", () => {
  it("1440件（24時間）に満たない場合はnullを返す", () => {
    const bids = Array.from({ length: 1439 }, (_, i) => 150 + i * 0.001);
    expect(computeLongTermTrend(candles(bids))).toBeNull();
  });

  it("1440件以上ある場合は始値・終値から変化率を算出する", () => {
    const bids = Array.from({ length: 1440 }, (_, i) => 150 + i * 0.001);
    const result = computeLongTermTrend(candles(bids));

    expect(result).not.toBeNull();
    expect(result!.changeRate).toBeCloseTo(((bids[bids.length - 1] - bids[0]) / bids[0]) * 100);
  });
});
