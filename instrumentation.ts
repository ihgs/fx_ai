const COLLECTION_INTERVAL_MS = 60_000; // 1分（Design: 定期実行）
const ANALYSIS_INTERVAL_MS = 60 * 60_000; // 1時間（Design: AI分析の定期実行）
const ANALYSIS_JST_START_HOUR = 7;
const ANALYSIS_JST_END_HOUR = 22;

function currentJstHour(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hourCycle: "h23",
  });
  return Number(formatter.format(new Date()));
}

export async function register() {
  // Edge runtime でも register() は呼ばれるため、Node.js ランタイムでのみ実行する
  // （node:sqlite / setInterval を使うため）。
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initDb } = await import("@/lib/db");
  const { collectRate } = await import("@/lib/collectRate");
  const { runAnalysis } = await import("@/lib/analyzeRate");

  initDb();
  setInterval(collectRate, COLLECTION_INTERVAL_MS);

  setInterval(() => {
    const hour = currentJstHour();
    if (hour < ANALYSIS_JST_START_HOUR || hour > ANALYSIS_JST_END_HOUR) return;
    runAnalysis("scheduled").catch((error) => {
      console.error("[runAnalysis] scheduled analysis failed:", error);
    });
  }, ANALYSIS_INTERVAL_MS);
}
