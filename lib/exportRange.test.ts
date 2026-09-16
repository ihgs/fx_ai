import { describe, expect, it } from "vitest";
import { validateExportRange } from "@/lib/exportRange";

describe("validateExportRange", () => {
  it("開始日・終了日が揃っていて7日以内なら問題無い（null）", () => {
    expect(validateExportRange("2026-09-01", "2026-09-07")).toBeNull();
  });

  it("開始日・終了日が同じ日でも問題無い", () => {
    expect(validateExportRange("2026-09-01", "2026-09-01")).toBeNull();
  });

  it("開始日・終了日のいずれかが未入力ならmissing", () => {
    expect(validateExportRange("", "2026-09-07")).toBe("missing");
    expect(validateExportRange("2026-09-01", "")).toBe("missing");
  });

  it("日付形式が不正ならinvalid_date", () => {
    expect(validateExportRange("2026/09/01", "2026-09-07")).toBe("invalid_date");
    expect(validateExportRange("2026-09-01", "2026-13-40")).toBe("invalid_date");
  });

  it("開始日が終了日より後ならstart_after_end", () => {
    expect(validateExportRange("2026-09-07", "2026-09-01")).toBe("start_after_end");
  });

  it("期間が7日間ちょうどなら問題無く、8日間ならrange_too_long", () => {
    expect(validateExportRange("2026-09-01", "2026-09-07")).toBeNull(); // 7日間
    expect(validateExportRange("2026-09-01", "2026-09-08")).toBe("range_too_long"); // 8日間
  });
});
