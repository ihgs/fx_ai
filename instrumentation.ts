const COLLECTION_INTERVAL_MS = 60_000; // 1分（Design: 定期実行）
const ANALYSIS_INTERVAL_MS = 60 * 60_000; // 1時間（Design: AI分析の定期実行。市場が開いている間は終日実行する）
// 為替市場の休場（土曜朝〜月曜朝）に合わせたスキップ境界時刻
const WEEKEND_CLOSURE_BOUNDARY_HOUR = 7;

function isJstWeekendMarketClosed(): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date());
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);

  if (weekday === "Sun") return true;
  if (weekday === "Sat") return hour >= WEEKEND_CLOSURE_BOUNDARY_HOUR;
  if (weekday === "Mon") return hour < WEEKEND_CLOSURE_BOUNDARY_HOUR;
  return false;
}

export async function register() {
  // Edge runtime でも register() は呼ばれるため、Node.js ランタイムでのみ実行する
  // （node:sqlite / setInterval を使うため）。
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initDb } = await import("@/lib/db");
  const { collectRate } = await import("@/lib/collectRate");
  const { runAnalysis } = await import("@/lib/analyzeRate");
  const { logger } = await import("@/lib/logger");

  initDb();
  setInterval(() => {
    if (isJstWeekendMarketClosed()) {
      logger.info("[collectRate] skipped: weekend market closure");
      return;
    }
    collectRate();
  }, COLLECTION_INTERVAL_MS);

  setInterval(() => {
    if (isJstWeekendMarketClosed()) {
      logger.info("[runAnalysis] skipped: weekend market closure");
      return;
    }
    runAnalysis("scheduled").catch((error) => {
      console.error("[runAnalysis] scheduled analysis failed:", error);
    });
  }, ANALYSIS_INTERVAL_MS);
}
