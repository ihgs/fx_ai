import { describe, expect, it } from "vitest";
import { buildAccuracyStats } from "@/lib/judgeAnalysis";

describe("buildAccuracyStats", () => {
  it("上昇/下落予想が外れて横ばいだった結果は集計から除外する", () => {
    const stats = buildAccuracyStats([
      { method: "v1", outcome: "correct" },
      { method: "v1", outcome: "incorrect", excludedFromStats: true },
      { method: "v1", outcome: "incorrect" },
    ]);
    expect(stats).toEqual([{ method: "v1", correct: 1, incorrect: 1, pending: 0, accuracyRate: 0.5 }]);
  });

  it("除外フラグが無い場合は従来通り全件集計する", () => {
    const stats = buildAccuracyStats([
      { method: "v1", outcome: "correct" },
      { method: "v1", outcome: "incorrect" },
    ]);
    expect(stats).toEqual([{ method: "v1", correct: 1, incorrect: 1, pending: 0, accuracyRate: 0.5 }]);
  });
});
