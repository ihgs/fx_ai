export type AnalysisOutcome = "correct" | "incorrect" | "pending";

export type AccuracyStat = {
  method: string;
  correct: number;
  incorrect: number;
  pending: number;
  accuracyRate: number | null;
};

export type AnalysisResultItem = {
  id: number;
  executedAt: string;
  method: string;
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;
  trigger: "manual" | "scheduled";
  outcome: AnalysisOutcome;
  /** 分析時点（executedAt頃）の実レート。判定待ちでDBにまだ無ければnull。 */
  baselineBid: number | null;
  /** 判定対象時刻（targetAt）以降の実レート。判定待ちでDBにまだ無ければnull。 */
  actualBid: number | null;
};

export type AnalysisResultsProps = {
  listState:
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "loaded"; results: AnalysisResultItem[]; accuracy: AccuracyStat[] };
  isRunning: boolean;
  runError: string | null;
  onRunAnalysis: () => void;
  /** プル更新に失敗した場合のみセットされる。listState自体は直前の値を維持したまま表示する。 */
  refreshError: string | null;
};

const DIRECTION_LABEL: Record<AnalysisResultItem["direction"], string> = {
  up: "上昇 ↑",
  down: "下落 ↓",
  flat: "横ばい →",
};

const OUTCOME_LABEL: Record<AnalysisOutcome, string> = {
  correct: "正解",
  incorrect: "不正解",
  pending: "判定待ち",
};

const OUTCOME_CLASS: Record<AnalysisOutcome, string> = {
  correct: "bg-emerald-500/15 text-emerald-400",
  incorrect: "bg-red-500/15 text-red-400",
  pending: "bg-zinc-700/50 text-zinc-400",
};

function formatAccuracyRate(rate: number | null): string {
  return rate === null ? "―" : `${Math.round(rate * 100)}%`;
}

function formatBid(bid: number | null): string {
  return bid === null ? "―" : bid.toFixed(3);
}

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

export function AnalysisResults({
  listState,
  isRunning,
  runError,
  onRunAnalysis,
  refreshError,
}: AnalysisResultsProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 p-6">
      <p className="text-lg font-medium text-zinc-400">分析</p>

      {refreshError && (
        <p role="alert" className="text-sm text-red-400">
          {refreshError}
        </p>
      )}

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
          {listState.accuracy.length > 0 && (
            <ul className="flex w-full flex-col gap-2 rounded-2xl bg-zinc-900 p-4 ring-1 ring-white/10">
              {listState.accuracy.map((stat) => (
                <li key={stat.method} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    正答率（{stat.method}）
                    <span className="ml-2 text-xs text-zinc-500">判定待ち{stat.pending}件</span>
                  </span>
                  <span className="font-medium text-white">{formatAccuracyRate(stat.accuracyRate)}</span>
                </li>
              ))}
            </ul>
          )}

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
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">
                        {DIRECTION_LABEL[result.direction]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_CLASS[result.outcome]}`}
                      >
                        {OUTCOME_LABEL[result.outcome]}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">{formatDateTime(result.executedAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">判定対象: {formatDateTime(result.targetAt)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    分析時 {formatBid(result.baselineBid)} → 結果 {formatBid(result.actualBid)}
                  </p>
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
