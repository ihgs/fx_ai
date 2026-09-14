export type PullPhase = "pulling" | "ready" | "refreshing";

export type PullIndicatorProps = {
  phase: PullPhase;
  /** 0〜1。pulling/readyの矢印の回転・不透明度に使う。 */
  progress: number;
};

export function PullIndicator({ phase, progress }: PullIndicatorProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {phase === "refreshing" ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="更新中"
          className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white"
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className={`h-6 w-6 ${phase === "ready" ? "text-white" : "text-zinc-500"}`}
          style={{ transform: `rotate(${progress * 180}deg)`, opacity: Math.min(1, progress + 0.3) }}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      )}
    </div>
  );
}
