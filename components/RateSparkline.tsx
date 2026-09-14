"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export type RateSparklinePoint = {
  timestamp: string;
  bid: number;
};

export type RateSparklineProps =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "data"; points: RateSparklinePoint[] };

// dataviz スキルの categorical slot 1（RateChart.tsxと同じ色）。
const LINE_COLOR = "#3987e5";

export function RateSparkline(props: RateSparklineProps) {
  return (
    <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-zinc-900 p-4 shadow-sm ring-1 ring-white/10 landscape:min-w-0 landscape:flex-1">
      {props.status === "loading" && (
        <div role="status" aria-live="polite" className="h-full w-full animate-pulse rounded bg-zinc-800" />
      )}

      {props.status === "empty" && (
        <p role="status" className="text-sm text-zinc-500">
          データなし
        </p>
      )}

      {props.status === "data" && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={props.points} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            {/* hideで見た目には何も出さないが、実データのレンジに合わせて線を自動スケールさせるために必要（Req 1.2: ラベル自体は非表示のまま）。 */}
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Line
              type="linear"
              dataKey="bid"
              stroke={LINE_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
