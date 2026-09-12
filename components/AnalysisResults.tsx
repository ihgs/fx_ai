export type AnalysisResultItem = {
  id: number;
  executedAt: string;
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;
  trigger: "manual" | "scheduled";
};

export type AnalysisResultsProps = {
  listState:
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "loaded"; results: AnalysisResultItem[] };
  isRunning: boolean;
  runError: string | null;
  onRunAnalysis: () => void;
};

const DIRECTION_LABEL: Record<AnalysisResultItem["direction"], string> = {
  up: "上昇 ↑",
  down: "下落 ↓",
  flat: "横ばい →",
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function AnalysisResults({ listState, isRunning, runError, onRunAnalysis }: AnalysisResultsProps) {
  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-6">
      <p className="text-lg font-medium text-zinc-400">分析</p>

      {listState.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 h-40 w-full max-w-md animate-pulse rounded-2xl bg-zinc-800"
        />
      )}

      {listState.status === "error" && (
        <p role="alert" className="mt-4 text-base text-red-400">
          {listState.message}
        </p>
      )}

      {listState.status === "loaded" && (
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isRunning}
            className="rounded-full bg-white px-6 py-2 text-base font-medium text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "分析中..." : "分析実行"}
          </button>

          {runError && (
            <p role="alert" className="text-sm text-red-400">
              {runError}
            </p>
          )}

          {listState.results.length === 0 ? (
            <p className="text-base text-zinc-500">まだ分析結果がありません</p>
          ) : (
            <ul className="flex w-full flex-col gap-3">
              {listState.results.map((result) => (
                <li
                  key={result.id}
                  className="rounded-2xl bg-zinc-900 p-4 text-left shadow-sm ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-white">
                      {DIRECTION_LABEL[result.direction]}
                    </span>
                    <span className="text-xs text-zinc-500">{formatDateTime(result.executedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{result.rationale}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
