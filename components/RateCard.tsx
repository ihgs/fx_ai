import type { UsdJpyRate } from "@/lib/types";

export type RateCardProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; rate: UsdJpyRate };

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString("ja-JP", { hour12: false });
}

export function RateCard(props: RateCardProps) {
  return (
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5
                 portrait:mx-auto portrait:text-center
                 landscape:flex landscape:max-w-2xl landscape:items-center landscape:justify-between landscape:gap-6 landscape:text-left"
    >
      {props.status === "loading" && (
        <div role="status" aria-live="polite" className="animate-pulse space-y-3 landscape:flex-1">
          <div className="h-4 w-24 rounded bg-zinc-200 portrait:mx-auto" />
          <div className="h-10 w-40 rounded bg-zinc-200 portrait:mx-auto" />
          <div className="h-3 w-32 rounded bg-zinc-200 portrait:mx-auto" />
        </div>
      )}

      {props.status === "error" && (
        <div role="alert" className="landscape:flex-1">
          <p className="text-sm font-medium text-red-600">
            レートを取得できませんでした
          </p>
          <p className="mt-1 text-xs text-zinc-500">{props.message}</p>
        </div>
      )}

      {props.status === "loaded" && (
        <div className="landscape:flex-1">
          <p className="text-sm font-medium text-zinc-500">USD/JPY</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-zinc-900">
            {props.rate.bid.toFixed(3)}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Bid {props.rate.bid.toFixed(3)} / Ask {props.rate.ask.toFixed(3)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            取得時刻: {formatTimestamp(props.rate.timestamp)}
          </p>
        </div>
      )}
    </div>
  );
}
