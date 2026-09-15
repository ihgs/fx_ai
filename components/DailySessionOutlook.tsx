export type DailySessionOutcome = "correct" | "incorrect" | "pending";

export type DailySessionOutlookItem = {
  direction: "up" | "down" | "flat";
  rationale: string;
  outcome: DailySessionOutcome;
  targetAt: string;
};

export type DailySessionOutlookProps = {
  tokyo: DailySessionOutlookItem | null;
  london: DailySessionOutlookItem | null;
  ny: DailySessionOutlookItem | null;
};

const DIRECTION_LABEL: Record<DailySessionOutlookItem["direction"], string> = {
  up: "上昇 ↑",
  down: "下落 ↓",
  flat: "横ばい →",
};

const OUTCOME_LABEL: Record<DailySessionOutcome, string> = {
  correct: "正解",
  incorrect: "不正解",
  pending: "判定待ち",
};

const OUTCOME_CLASS: Record<DailySessionOutcome, string> = {
  correct: "bg-emerald-500/15 text-emerald-400",
  incorrect: "bg-red-500/15 text-red-400",
  pending: "bg-zinc-700/50 text-zinc-400",
};

const SESSIONS: Array<{ key: "tokyo" | "london" | "ny"; label: string }> = [
  { key: "tokyo", label: "東京市場" },
  { key: "london", label: "ロンドン市場" },
  { key: "ny", label: "NY市場" },
];

function formatTime(iso: string): string {
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

export function DailySessionOutlook({ tokyo, london, ny }: DailySessionOutlookProps) {
  const items = { tokyo, london, ny };
  const hasAny = tokyo !== null || london !== null || ny !== null;

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-base font-medium text-zinc-400">本日の見通し</p>

      {!hasAny ? (
        <p className="text-sm text-zinc-500">まだ本日の見通しはありません</p>
      ) : (
        <ul className="flex w-full flex-col gap-3">
          {SESSIONS.map(({ key, label }) => {
            const item = items[key];
            return (
              <li key={key} className="rounded-2xl bg-zinc-900 p-4 text-left shadow-sm ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">{label}</span>
                  {item && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_CLASS[item.outcome]}`}
                    >
                      {OUTCOME_LABEL[item.outcome]}
                    </span>
                  )}
                </div>
                {item ? (
                  <>
                    <p className="mt-1 text-base font-medium text-white">{DIRECTION_LABEL[item.direction]}</p>
                    <p className="mt-1 text-xs text-zinc-500">判定対象: {formatTime(item.targetAt)}</p>
                    <p className="mt-2 text-sm text-zinc-400">{item.rationale}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-zinc-500">未生成</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
