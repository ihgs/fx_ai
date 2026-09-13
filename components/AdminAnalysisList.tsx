export type AdminAnalysisOutcome = "correct" | "incorrect" | "pending";

export type AdminAnalysisResultItem = {
  id: number;
  executedAt: string;
  method: string;
  direction: "up" | "down" | "flat";
  rationale: string;
  targetAt: string;
  inputTo: string;
  trigger: "manual" | "scheduled";
  outcome: AdminAnalysisOutcome;
};

export type AdminAnalysisListProps = {
  listState:
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "loaded"; results: AdminAnalysisResultItem[]; total: number; page: number; pageSize: number };
  deletingId: number | null;
  deleteError: string | null;
  onDelete: (id: number) => void;
  onPageChange: (page: number) => void;
};

const DIRECTION_LABEL: Record<AdminAnalysisResultItem["direction"], string> = {
  up: "上昇 ↑",
  down: "下落 ↓",
  flat: "横ばい →",
};

const OUTCOME_LABEL: Record<AdminAnalysisOutcome, string> = {
  correct: "正解",
  incorrect: "不正解",
  pending: "判定待ち",
};

const OUTCOME_CLASS: Record<AdminAnalysisOutcome, string> = {
  correct: "bg-emerald-500/15 text-emerald-400",
  incorrect: "bg-red-500/15 text-red-400",
  pending: "bg-zinc-700/50 text-zinc-400",
};

const TRIGGER_LABEL: Record<AdminAnalysisResultItem["trigger"], string> = {
  manual: "手動",
  scheduled: "自動",
};

const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatJst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${jstFormatter.format(date)} JST`;
}

export function AdminAnalysisList({
  listState,
  deletingId,
  deleteError,
  onDelete,
  onPageChange,
}: AdminAnalysisListProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">AI分析結果一覧</h1>

      {listState.status === "loading" && (
        <div role="status" aria-live="polite" className="h-64 w-full animate-pulse rounded-2xl bg-zinc-900" />
      )}

      {listState.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {listState.message}
        </p>
      )}

      {listState.status === "loaded" && (
        <>
          {deleteError && (
            <p role="alert" className="text-sm text-red-400">
              {deleteError}
            </p>
          )}

          {listState.results.length === 0 ? (
            <p className="text-sm text-zinc-500">分析結果がありません</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-zinc-900 text-xs text-zinc-400">
                    <th className="px-4 py-2 font-medium">実行日時</th>
                    <th className="px-4 py-2 font-medium">手法</th>
                    <th className="px-4 py-2 font-medium">方向</th>
                    <th className="px-4 py-2 font-medium">正誤</th>
                    <th className="px-4 py-2 font-medium">対象日時</th>
                    <th className="px-4 py-2 font-medium">トリガー</th>
                    <th className="px-4 py-2 font-medium">根拠</th>
                    <th className="px-4 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {listState.results.map((result) => (
                    <tr key={result.id} className="border-b border-white/5 align-top last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{formatJst(result.executedAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{result.method}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                        {DIRECTION_LABEL[result.direction]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_CLASS[result.outcome]}`}
                        >
                          {OUTCOME_LABEL[result.outcome]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{formatJst(result.targetAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                        {TRIGGER_LABEL[result.trigger]}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-zinc-400">{result.rationale}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onDelete(result.id)}
                          disabled={deletingId === result.id}
                          className="rounded-md border border-red-400/40 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === result.id ? "削除中..." : "削除"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {listState.total > listState.pageSize && (
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <button
                type="button"
                onClick={() => onPageChange(listState.page - 1)}
                disabled={listState.page <= 1}
                className="rounded-md border border-zinc-700 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                前のページ
              </button>
              <span>
                {listState.page} / {Math.max(1, Math.ceil(listState.total / listState.pageSize))} ページ（全
                {listState.total}件）
              </span>
              <button
                type="button"
                onClick={() => onPageChange(listState.page + 1)}
                disabled={listState.page >= Math.ceil(listState.total / listState.pageSize)}
                className="rounded-md border border-zinc-700 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                次のページ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
