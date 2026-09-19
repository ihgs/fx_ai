const COLLECTION_INTERVAL_MS = 60_000; // 1分（Design: 定期実行）
const ANALYSIS_INTERVAL_MS = 60 * 60_000; // 1時間（Design: AI分析の定期実行。市場が開いている間は終日実行する）
const DAILY_OUTLOOK_CHECK_INTERVAL_MS = 60_000; // 1分毎にJST 6:30到達をチェックする
const DAILY_OUTLOOK_JST_HOUR = 6;
const DAILY_OUTLOOK_JST_MINUTE = 30;
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

/**
 * デイリー見通し用のJST日付・時・分・曜日をまとめて返す。
 * 月曜6:30の生成を止めないよう、isJstWeekendMarketClosedとは別に単純な曜日だけの判定を使う
 * （isJstWeekendMarketClosedは月曜7時未満をまだ休場中として扱ってしまうため）。
 */
function currentJstDateHourMinute(): { dateStr: string; hour: number; minute: number; weekday: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: get("weekday"),
  };
}

function isJstSaturdayOrSunday(weekday: string): boolean {
  return weekday === "Sat" || weekday === "Sun";
}

export async function register() {
  // Edge runtime でも register() は呼ばれるため、Node.js ランタイムでのみ実行する
  // （node:sqlite / setInterval を使うため）。
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initDb } = await import("@/lib/db");
  const { collectRate } = await import("@/lib/collectRate");
  const { runAnalysis, runAnalysisV2 } = await import("@/lib/analyzeRate");
  const { runDailyOutlook } = await import("@/lib/dailyOutlook");
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
    // v3との精度比較のため、同一期間にv2（旧プロンプト）も並行実行する（比較完了後に削除する）。
    runAnalysisV2("scheduled").catch((error) => {
      console.error("[runAnalysisV2] scheduled analysis failed:", error);
    });
  }, ANALYSIS_INTERVAL_MS);

  setInterval(() => {
    const { dateStr, hour, minute, weekday } = currentJstDateHourMinute();
    if (isJstSaturdayOrSunday(weekday)) return;
    if (hour !== DAILY_OUTLOOK_JST_HOUR || minute !== DAILY_OUTLOOK_JST_MINUTE) return;
    runDailyOutlook(dateStr).catch((error) => {
      console.error("[dailyOutlook] failed:", error);
    });
  }, DAILY_OUTLOOK_CHECK_INTERVAL_MS);
}
