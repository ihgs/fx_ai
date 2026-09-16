import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { client, generateContentWithRetry } from "@/lib/analyzeRate";

describe("generateContentWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("成功時はリトライせずそのまま結果を返す", async () => {
    const spy = vi
      .spyOn(client.models, "generateContent")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue({ text: "ok" } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await generateContentWithRetry({ model: "m", contents: "c" } as any);

    expect(result).toEqual({ text: "ok" });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("失敗しても60秒間隔で最大3回までリトライし、途中で成功すればその結果を返す", async () => {
    const spy = vi
      .spyOn(client.models, "generateContent")
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce({ text: "ok" } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promise = generateContentWithRetry({ model: "m", contents: "c" } as any);
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    const result = await promise;

    expect(result).toEqual({ text: "ok" });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("3回リトライしてもすべて失敗した場合は最後のエラーを投げる（合計4回まで）", async () => {
    const spy = vi.spyOn(client.models, "generateContent").mockRejectedValue(new Error("boom"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promise = generateContentWithRetry({ model: "m", contents: "c" } as any);
    const assertion = expect(promise).rejects.toThrow("boom");
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(spy).toHaveBeenCalledTimes(4);
  });
});
