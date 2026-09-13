"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export type RateChartPoint = {
  timestamp: string;
  bid: number;
};

export type RateChartProps =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "data"; points: RateChartPoint[] };

// dataviz スキルの categorical slot 1 (dark, blue)。カード背景 bg-zinc-900 (#18181b) に対して検証済み。
const LINE_COLOR = "#3987e5";
const GRID_COLOR = "#3f3f46"; // zinc-700
const AXIS_COLOR = "#71717a"; // zinc-500

function formatTick(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RateChart(props: RateChartProps) {
  return (
    <div className="w-full rounded-2xl bg-zinc-900 p-6 shadow-sm ring-1 ring-white/10 landscape:mx-auto landscape:max-w-2xl landscape:p-4">
      <p className="text-lg font-medium text-zinc-400">USD/JPY</p>

      {props.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 h-64 animate-pulse rounded bg-zinc-800 portrait:h-72 landscape:mt-2 landscape:h-44"
        />
      )}

      {props.status === "empty" && (
        <div
          role="status"
          className="mt-4 flex h-64 items-center justify-center text-base text-zinc-500 portrait:h-72 landscape:mt-2 landscape:h-44"
        >
          この期間のデータがありません
        </div>
      )}

      {props.status === "data" && (
        <div className="mt-4 h-64 portrait:h-72 landscape:mt-2 landscape:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={props.points} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTick}
                stroke={AXIS_COLOR}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                minTickGap={32}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke={AXIS_COLOR}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                width={56}
              />
              <Tooltip
                contentStyle={{ background: "#18181b", border: `1px solid ${GRID_COLOR}`, borderRadius: 8 }}
                labelStyle={{ color: AXIS_COLOR }}
                itemStyle={{ color: "#ffffff" }}
                labelFormatter={(label) => formatTick(String(label))}
                formatter={(value) => [typeof value === "number" ? value.toFixed(3) : String(value), "Bid"]}
              />
              <Line
                type="linear"
                dataKey="bid"
                stroke={LINE_COLOR}
                strokeWidth={2}
                strokeLinecap="butt"
                strokeLinejoin="miter"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
