"use client";

import { useEffect, useState } from "react";
import { RateChart, type RateChartProps, type RateChartPoint } from "@/components/RateChart";

type Range = "1d" | "1w" | "1m";

const RANGE_LABELS: Record<Range, string> = {
  "1d": "1日",
  "1w": "1週間",
  "1m": "1ヶ月",
};

const RANGES = Object.keys(RANGE_LABELS) as Range[];

/**
 * データ取得のみ行い、setState はしない（呼び出し元が .then(setState) する）。
 * fetch失敗時もReq 2.3の空状態表示に倒す（design.mdはRateChartにerror状態を定義していないため）。
 */
async function loadHistory(range: Range): Promise<RateChartProps> {
  try {
    const res = await fetch(`/api/rate/usd-jpy/history?range=${range}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body = (await res.json()) as { data: RateChartPoint[] };
    return body.data.length === 0 ? { status: "empty" } : { status: "data", points: body.data };
  } catch {
    return { status: "empty" };
  }
}

export function ChartScreen() {
  const [range, setRange] = useState<Range>("1d");
  const [chartProps, setChartProps] = useState<RateChartProps>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadHistory(range).then((result) => {
      if (!cancelled) setChartProps(result);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  function handleRangeChange(next: Range) {
    // ここはボタンのクリックハンドラ（イベントリスナー）なので、setStateを直接呼んでよい
    // （useEffect内で直接呼ぶとreact-hooks/set-state-in-effectに引っかかる）。
    setChartProps({ status: "loading" });
    setRange(next);
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRangeChange(r)}
            className={`rounded-full px-5 py-2 text-base font-medium transition-colors ${
              range === r ? "bg-white text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
      <RateChart {...chartProps} />
    </div>
  );
}
