export type AdminHistoryColumn = { date: string; label: string };
export type AdminHistoryRow = { time: string; values: (number | null)[] };
export type AdminHistoryData = {
  weekStartDate: string;
  columns: AdminHistoryColumn[];
  rows: AdminHistoryRow[];
};

export type AdminHistoryTableProps = {
  state:
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "loaded"; data: AdminHistoryData };
  canGoNext: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

function formatWeekHeading(weekStartDate: string): string {
  const [y, m, d] = weekStartDate.split("-").map(Number);
  return `${y}年${m}月${d}日週`;
}

function formatBid(value: number | null): string {
  return value === null ? "—" : value.toFixed(3);
}

export function AdminHistoryTable({ state, canGoNext, onPrevWeek, onNextWeek }: AdminHistoryTableProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">レートヒストリー（週次表）</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrevWeek}
            disabled={state.status === "loading"}
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            前週
          </button>
          <span className="min-w-32 text-center text-sm text-zinc-300">
            {state.status === "loaded" ? formatWeekHeading(state.data.weekStartDate) : ""}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            disabled={state.status === "loading" || !canGoNext}
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            次週
          </button>
        </div>
      </div>

      {state.status === "loading" && (
        <div role="status" aria-live="polite" className="h-96 w-full animate-pulse rounded-2xl bg-zinc-900" />
      )}

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}

      {state.status === "loaded" && (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
          <table className="w-full min-w-[640px] border-collapse text-right text-sm tabular-nums">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900 text-xs text-zinc-400">
                <th className="px-3 py-2 text-left font-medium">時刻</th>
                {state.data.columns.map((column) => (
                  <th key={column.date} className="px-3 py-2 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.data.rows.map((row) => (
                <tr key={row.time} className="border-b border-white/5 last:border-b-0">
                  <td className="px-3 py-1.5 text-left text-zinc-400">{row.time}</td>
                  {row.values.map((value, i) => (
                    <td
                      key={state.data.columns[i].date}
                      className={value === null ? "px-3 py-1.5 text-zinc-600" : "px-3 py-1.5 text-zinc-200"}
                    >
                      {formatBid(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
