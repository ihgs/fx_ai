import { describe, expect, it } from "vitest";
import { nextStateAfterPoll } from "@/components/CurrentRateScreen";
import type { RateCardProps } from "@/components/RateCard";

const loaded = (bid: number): RateCardProps => ({
  status: "loaded",
  rate: { symbol: "USD_JPY", bid, ask: bid + 0.01, timestamp: "2026-09-13T00:00:00.000Z", open: null },
});

const error: RateCardProps = { status: "error", message: "failed" };

describe("nextStateAfterPoll", () => {
  it("loaded -> loaded では新しい結果に置き換わる", () => {
    expect(nextStateAfterPoll(loaded(150), loaded(151))).toEqual(loaded(151));
  });

  it("loaded -> error では直前の表示を維持する", () => {
    expect(nextStateAfterPoll(loaded(150), error)).toEqual(loaded(150));
  });

  it("error -> loaded では新しい結果に置き換わる", () => {
    expect(nextStateAfterPoll(error, loaded(150))).toEqual(loaded(150));
  });
});
