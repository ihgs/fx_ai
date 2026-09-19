import {
  ANALYSIS_JUDGMENT_GUIDANCE,
  AnalysisOutputSchema,
  analysisOutputJsonSchema,
  generateContentWithRetry,
  MODEL,
  tryParseJson,
} from "@/lib/analyzeRate";
import {
  getCandlesInRange,
  hasAnalysisResultForDateAndMethod,
  insertAnalysisResult,
  type RateHistoryPoint,
} from "@/lib/db";
import { addDaysToDateString, dowOfDateString, jstWallClockToUtcIso } from "@/lib/jst";
import { logger } from "@/lib/logger";

export type Session = "tokyo" | "london" | "ny";

type SessionDef = { startHour: number; endHour: number; crossesMidnight: boolean };

const SESSION_DEFS: Record<Session, SessionDef> = {
  tokyo: { startHour: 9, endHour: 18, crossesMidnight: false },
  london: { startHour: 17, endHour: 2, crossesMidnight: true },
  ny: { startHour: 22, endHour: 7, crossesMidnight: true },
};

const METHOD_BY_SESSION: Record<Session, string> = {
  tokyo: "daily-tokyo",
  london: "daily-london",
  ny: "daily-ny",
};

const SESSION_LABEL_JA: Record<Session, string> = {
  tokyo: "東京",
  london: "ロンドン",
  ny: "NY",
};

const SESSIONS: Session[] = ["tokyo", "london", "ny"];
const OUTLOOK_GENERATION_JST_HOUR = 6;
const OUTLOOK_GENERATION_JST_MINUTE = 30;

/** todayDateStr（JST、"YYYY-MM-DD"）の直近営業日（土日を除く前日）を返す。 */
export function previousBusinessDayJst(todayDateStr: string): string {
  let d = addDaysToDateString(todayDateStr, -1);
  while (dowOfDateString(d) === 0 || dowOfDateString(d) === 6) {
    d = addDaysToDateString(d, -1);
  }
  return d;
}

/** dateStr（JST日付）におけるsessionのUTC ISO範囲（[fromIso, toIso)）を返す。 */
function sessionRangeIso(dateStr: string, session: Session): { fromIso: string; toIso: string } {
  const def = SESSION_DEFS[session];
  const fromIso = jstWallClockToUtcIso(dateStr, def.startHour, 0);
  const endDateStr = def.crossesMidnight ? addDaysToDateString(dateStr, 1) : dateStr;
  const toIso = jstWallClockToUtcIso(endDateStr, def.endHour, 0);
  return { fromIso, toIso };
}

export type SessionStats = { open: number; high: number; low: number; close: number };

/** 1分足の配列からセッション統計（始値・高値・安値・終値）を計算する。空ならnull。 */
export function computeSessionStats(candles: RateHistoryPoint[]): SessionStats | null {
  if (candles.length === 0) return null;
  const bids = candles.map((c) => c.bid);
  return {
    open: bids[0],
    high: Math.max(...bids),
    low: Math.min(...bids),
    close: bids[bids.length - 1],
  };
}

function formatStats(stats: SessionStats | null): string {
  if (!stats) return "データなし";
  return `始値 ${stats.open.toFixed(3)} / 高値 ${stats.high.toFixed(3)} / 安値 ${stats.low.toFixed(3)} / 終値 ${stats.close.toFixed(3)}`;
}

function buildDailyOutlookPrompt(
  session: Session,
  prevDayDateStr: string,
  sessionStats: Record<Session, SessionStats | null>,
  overallStats: SessionStats,
): string {
  const label = SESSION_LABEL_JA[session];
  const def = SESSION_DEFS[session];
  const endLabel = def.crossesMidnight ? `翌${def.endHour}:00` : `${def.endHour}:00`;

  return `以下は前営業日（${prevDayDateStr}、日本時間）のUSD/JPYの値動きです。

【前営業日全体】
${formatStats(overallStats)}

【前営業日 東京市場（9:00〜18:00）】
${formatStats(sessionStats.tokyo)}

【前営業日 ロンドン市場（17:00〜翌2:00）】
${formatStats(sessionStats.london)}

【前営業日 NY市場（22:00〜翌7:00）】
${formatStats(sessionStats.ny)}

この情報をもとに、本日の${label}市場（${def.startHour}:00〜${endLabel}、日本時間）のUSD/JPYの見通しを
up（上昇） / down（下落） / flat（横ばい） のいずれかで判定してください。

${ANALYSIS_JUDGMENT_GUIDANCE}

判定結果はup/down/flatのいずれかとし、その根拠を日本語で2〜3文程度で簡潔に説明してください。`;
}

function getSessionCandles(dateStr: string, session: Session): RateHistoryPoint[] {
  const { fromIso, toIso } = sessionRangeIso(dateStr, session);
  return getCandlesInRange(fromIso, toIso);
}

/**
 * 指定セッション1件分の見通しを生成しDBに保存する。
 * 当日分が既に存在する場合は何もしない（Req 1.5）。失敗時は例外を投げる（呼び出し元が個別にcatchする、Req 1.6）。
 */
export async function runDailyOutlookForSession(
  session: Session,
  todayDateStr: string,
  sessionStats: Record<Session, SessionStats | null>,
  overallStats: SessionStats,
): Promise<void> {
  const method = METHOD_BY_SESSION[session];
  const todayStartIso = jstWallClockToUtcIso(todayDateStr, 0, 0);
  const tomorrowStartIso = jstWallClockToUtcIso(addDaysToDateString(todayDateStr, 1), 0, 0);

  if (hasAnalysisResultForDateAndMethod(method, todayStartIso, tomorrowStartIso)) {
    logger.info(`[dailyOutlook] skipped: already generated session=${session} date=${todayDateStr}`);
    return;
  }

  const prevDayDateStr = previousBusinessDayJst(todayDateStr);
  const prompt = buildDailyOutlookPrompt(session, prevDayDateStr, sessionStats, overallStats);

  const response = await generateContentWithRetry({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: analysisOutputJsonSchema,
    },
  });

  const parsed = response.text ? AnalysisOutputSchema.safeParse(tryParseJson(response.text)) : null;
  if (!parsed || !parsed.success) {
    throw new Error(`AI分析の出力を解析できませんでした（session=${session}）`);
  }

  const executedAt = jstWallClockToUtcIso(todayDateStr, OUTLOOK_GENERATION_JST_HOUR, OUTLOOK_GENERATION_JST_MINUTE);
  const { toIso: targetAt } = sessionRangeIso(todayDateStr, session);

  const result = insertAnalysisResult({
    executedAt,
    method,
    direction: parsed.data.direction,
    rationale: parsed.data.rationale,
    targetAt,
    inputFrom: jstWallClockToUtcIso(prevDayDateStr, 0, 0),
    inputTo: executedAt,
    trigger: "scheduled",
  });

  logger.info(`[dailyOutlook] completed session=${session} direction=${result.direction}`);
}

/**
 * 当日（todayDateStr, JST）の東京/ロンドン/NY見通しをまとめて生成する。
 * 前営業日のレートデータが無ければ全体をスキップする（Req 1.4）。
 * 1セッションの失敗は他のセッションの生成に影響させない（Req 1.6）。
 */
export async function runDailyOutlook(todayDateStr: string): Promise<void> {
  const prevDayDateStr = previousBusinessDayJst(todayDateStr);
  const overallStats = computeSessionStats(
    getCandlesInRange(jstWallClockToUtcIso(prevDayDateStr, 0, 0), jstWallClockToUtcIso(todayDateStr, 0, 0)),
  );

  if (!overallStats) {
    logger.info(`[dailyOutlook] skipped: no candle data for previous business day (${prevDayDateStr})`);
    return;
  }

  const sessionStats: Record<Session, SessionStats | null> = {
    tokyo: computeSessionStats(getSessionCandles(prevDayDateStr, "tokyo")),
    london: computeSessionStats(getSessionCandles(prevDayDateStr, "london")),
    ny: computeSessionStats(getSessionCandles(prevDayDateStr, "ny")),
  };

  for (const session of SESSIONS) {
    try {
      await runDailyOutlookForSession(session, todayDateStr, sessionStats, overallStats);
    } catch (error) {
      console.error(`[dailyOutlook] session=${session} failed:`, error);
    }
  }
}
