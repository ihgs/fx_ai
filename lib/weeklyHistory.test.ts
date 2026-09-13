import { describe, expect, it } from "vitest";
import { currentWeekStartJst, isMonday, shiftWeek } from "@/lib/weeklyHistory";

describe("shiftWeek", () => {
  it("次週・前週にずらせる", () => {
    expect(shiftWeek("2026-09-14", 1)).toBe("2026-09-21");
    expect(shiftWeek("2026-09-14", -1)).toBe("2026-09-07");
  });

  it("年またぎでも正しくずらせる", () => {
    expect(shiftWeek("2026-12-28", 1)).toBe("2027-01-04");
  });
});

describe("isMonday", () => {
  it("月曜日付はtrue", () => {
    expect(isMonday("2026-09-14")).toBe(true);
  });

  it("月曜以外の日付はfalse", () => {
    expect(isMonday("2026-09-15")).toBe(false);
  });

  it("不正な形式・実在しない日付はfalse", () => {
    expect(isMonday("2026-9-14")).toBe(false);
    expect(isMonday("not-a-date")).toBe(false);
    expect(isMonday("2026-02-30")).toBe(false);
  });
});

describe("currentWeekStartJst", () => {
  it("JSTで木曜にあたる時刻は同じ週の月曜を返す", () => {
    // 2026-09-16T23:00:00Z = JST 2026-09-17 08:00（木）
    const now = new Date("2026-09-16T23:00:00.000Z");
    expect(currentWeekStartJst(now)).toBe("2026-09-14");
  });

  it("JSTで日曜深夜にあたる時刻は前の週の月曜を返す", () => {
    // 2026-09-13T14:00:00Z = JST 2026-09-13 23:00（日）
    const now = new Date("2026-09-13T14:00:00.000Z");
    expect(currentWeekStartJst(now)).toBe("2026-09-07");
  });

  it("JSTで月曜0時台にあたる時刻はその日を月曜として返す", () => {
    // 2026-09-13T15:30:00Z = JST 2026-09-14 00:30（月）
    const now = new Date("2026-09-13T15:30:00.000Z");
    expect(currentWeekStartJst(now)).toBe("2026-09-14");
  });
});
