import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getRecentCandles, insertAnalysisResult, type AnalysisResult, type RateHistoryPoint } from "@/lib/db";
import { logger } from "@/lib/logger";

const HISTORY_MINUTES = 120;
const TARGET_HORIZON_MS = 60 * 60 * 1000; // 1時間（Design: target_at）
const SMA_SHORT_MINUTES = 15;
const SMA_LONG_MINUTES = 60;
const METHOD = "v2"; // spec 009でテクニカル指標を導入し v1 から変更（正答率統計を新旧で区別する）

// dailyOutlook.ts など他のAI分析機能からも再利用する（同じGeminiクライアント・出力スキーマを使うため）。
export const AnalysisOutputSchema = z.object({
  direction: z.enum(["up", "down", "flat"]),
  rationale: z.string(),
});
export const analysisOutputJsonSchema = omitDollarSchema(z.toJSONSchema(AnalysisOutputSchema));

export const MODEL = "gemini-3.6-flash";

export const client = new GoogleGenAI({});

const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_DELAY_MS = 60_000; // Gemini APIが一時的にエラーを返すことが多いため、失敗時は60秒間隔でリトライする

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini API呼び出しの一時的な失敗に対応する。失敗時は60秒間隔で最大3回までリトライし、
 * それでも失敗した場合は最後のエラーを投げる（呼び出し元がリトライを意識する必要はない）。
 */
export async function generateContentWithRetry(
  request: Parameters<typeof client.models.generateContent>[0],
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await client.models.generateContent(request);
    } catch (error) {
      if (attempt > GEMINI_MAX_RETRIES) throw error;
      logger.warn(
        `[Gemini] API呼び出しに失敗（${attempt}/${GEMINI_MAX_RETRIES}回目）。${GEMINI_RETRY_DELAY_MS / 1000}秒後にリトライします`,
        { error: error instanceof Error ? error.message : String(error) },
      );
      await sleep(GEMINI_RETRY_DELAY_MS);
    }
  }
}

export type Indicators = {
  smaShort: number | null;
  smaLong: number | null;
  changeRate: number;
  volatility: number;
  high: number;
  low: number;
};

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sma(history: RateHistoryPoint[], windowMinutes: number): number | null {
  if (history.length < windowMinutes) return null;
  return average(history.slice(-windowMinutes).map((p) => p.bid));
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function computeIndicators(history: RateHistoryPoint[]): Indicators {
  const bids = history.map((p) => p.bid);
  const changeRate = ((bids[bids.length - 1] - bids[0]) / bids[0]) * 100;
  const volatility = sampleStdDev(bids);

  return {
    smaShort: sma(history, SMA_SHORT_MINUTES),
    smaLong: sma(history, SMA_LONG_MINUTES),
    changeRate,
    volatility,
    high: Math.max(...bids),
    low: Math.min(...bids),
  };
}

function formatSma(value: number | null): string {
  return value === null ? "算出不可（データ不足）" : value.toFixed(3);
}

const jstFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** UTC ISO文字列を「YYYY-MM-DD HH:mm JST」表記に変換する（AIが根拠説明でJSTを参照できるようにするため）。 */
export function toJstDisplay(isoTimestamp: string): string {
  const parts = jstFormatter.formatToParts(new Date(isoTimestamp));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} JST`;
}

export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function omitDollarSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema, ...rest } = schema;
  void $schema;
  return rest;
}

function buildPrompt(history: RateHistoryPoint[], indicators: Indicators): string {
  const lines = history.map((p) => `${toJstDisplay(p.timestamp)}: ${p.bid.toFixed(3)}`).join("\n");
  return `以下はUSD/JPYの直近${history.length}分間、1分足の終値（bid）の推移です（時刻は日本時間）。

${lines}

【テクニカル指標】
- 短期移動平均（${SMA_SHORT_MINUTES}分）: ${formatSma(indicators.smaShort)}
- 長期移動平均（${SMA_LONG_MINUTES}分）: ${formatSma(indicators.smaLong)}
- 期間内変化率: ${indicators.changeRate.toFixed(3)}%
- ボラティリティ（標準偏差）: ${indicators.volatility.toFixed(3)}
- 期間内高値: ${indicators.high.toFixed(3)} / 安値: ${indicators.low.toFixed(3)}

この推移とテクニカル指標をもとに、今後1時間程度のUSD/JPYの見通しを up（上昇） / down（下落） / flat（横ばい） のいずれかで判定し、
その根拠を日本語で2〜3文程度で簡潔に説明してください。`;
}

/**
 * 直近のレート履歴を入力にAI分析を実行し、結果をDBに保存する。
 * レート履歴が無い、AI API呼び出し失敗、DB保存失敗のいずれの場合も例外を投げる。
 * 呼び出し元（APIルート or スケジューラ）がそれぞれの文脈でエラーを処理する（Req 1.4）。
 */
export async function runAnalysis(trigger: "manual" | "scheduled"): Promise<AnalysisResult> {
  const history = getRecentCandles(HISTORY_MINUTES);
  if (history.length === 0) {
    throw new Error("レート履歴がまだありません");
  }

  const executedAt = new Date();
  const indicators = computeIndicators(history);

  const response = await generateContentWithRetry({
    model: MODEL,
    contents: buildPrompt(history, indicators),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: analysisOutputJsonSchema,
    },
  });

  const parsed = response.text ? AnalysisOutputSchema.safeParse(tryParseJson(response.text)) : null;
  if (!parsed || !parsed.success) {
    throw new Error("AI分析の出力を解析できませんでした");
  }

  const result = insertAnalysisResult({
    executedAt: executedAt.toISOString(),
    method: METHOD,
    direction: parsed.data.direction,
    rationale: parsed.data.rationale,
    targetAt: new Date(executedAt.getTime() + TARGET_HORIZON_MS).toISOString(),
    inputFrom: history[0].timestamp,
    inputTo: history[history.length - 1].timestamp,
    trigger,
  });

  logger.info(`[runAnalysis] completed trigger=${trigger} method=${METHOD} direction=${result.direction}`);

  return result;
}
