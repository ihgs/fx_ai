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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export function RateCard(props: RateCardProps) {
  return (
    <div
      className="w-full rounded-2xl bg-zinc-900 p-6 shadow-sm ring-1 ring-white/10
                 portrait:text-center
                 landscape:mx-auto landscape:flex landscape:max-w-2xl landscape:items-center landscape:justify-between landscape:gap-6 landscape:text-left"
    >
      {props.status === "loading" && (
        <div role="status" aria-live="polite" className="animate-pulse space-y-4 landscape:flex-1">
          <div className="h-5 w-28 rounded bg-zinc-700 portrait:mx-auto" />
          <div className="h-16 w-64 rounded bg-zinc-700 portrait:mx-auto" />
          <div className="h-4 w-48 rounded bg-zinc-700 portrait:mx-auto" />
        </div>
      )}

      {props.status === "error" && (
        <div role="alert" className="landscape:flex-1">
          <p className="text-lg font-medium text-red-400">
            レートを取得できませんでした
          </p>
          <p className="mt-1 text-base text-zinc-400">{props.message}</p>
        </div>
      )}

      {props.status === "loaded" && (
        <div className="landscape:flex-1">
          <p className="text-lg font-medium text-zinc-400">USD/JPY</p>
          <p className="mt-1 text-7xl font-semibold tabular-nums text-white">
            {props.rate.bid.toFixed(3)}
          </p>
          <p className="mt-3 text-lg text-zinc-400">
            Bid {props.rate.bid.toFixed(3)} / Ask {props.rate.ask.toFixed(3)}
          </p>
          {props.rate.open && (
            <p className="mt-1 text-lg text-zinc-400">
              始値（{formatDate(props.rate.open.date)}）: {props.rate.open.price.toFixed(3)}
            </p>
          )}
          <p className="mt-3 text-base text-zinc-500">
            取得時刻: {formatTimestamp(props.rate.timestamp)}
          </p>
        </div>
      )}
    </div>
  );
}
