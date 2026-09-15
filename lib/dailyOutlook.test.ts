import { describe, expect, it } from "vitest";
import { computeSessionStats, previousBusinessDayJst } from "@/lib/dailyOutlook";

describe("previousBusinessDayJst", () => {
  it("火〜金は前日を返す", () => {
    expect(previousBusinessDayJst("2026-09-15")).toBe("2026-09-14"); // 火 -> 月
  });

  it("月曜日は前週金曜日を返す（土日をスキップ）", () => {
    expect(previousBusinessDayJst("2026-09-14")).toBe("2026-09-11"); // 月 -> 金
  });
});

describe("computeSessionStats", () => {
  it("候補が無ければnullを返す", () => {
    expect(computeSessionStats([])).toBeNull();
  });

  it("始値・高値・安値・終値を正しく計算する", () => {
    const candles = [
      { timestamp: "2026-09-14T00:00:00.000Z", bid: 150.0 },
      { timestamp: "2026-09-14T00:01:00.000Z", bid: 150.5 },
      { timestamp: "2026-09-14T00:02:00.000Z", bid: 149.8 },
      { timestamp: "2026-09-14T00:03:00.000Z", bid: 150.2 },
    ];
    expect(computeSessionStats(candles)).toEqual({
      open: 150.0,
      high: 150.5,
      low: 149.8,
      close: 150.2,
    });
  });
});
