export type LogLevel = "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = { info: 0, warn: 1, error: 2 };

/** 未設定・不正値は運用開始初期の既定である"info"にフォールバックする（Req 3.2）。 */
function resolveThreshold(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  if (raw === "info" || raw === "warn" || raw === "error") return raw;
  return "info";
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[resolveThreshold()]) return;

  const consoleFn = level === "info" ? console.info : level === "warn" ? console.warn : console.error;
  if (meta) {
    consoleFn(message, meta);
  } else {
    consoleFn(message);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
