import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getRecentCandles, insertAnalysisResult, type AnalysisResult, type RateHistoryPoint } from "@/lib/db";
import { logger } from "@/lib/logger";

const HISTORY_MINUTES = 120;
const TARGET_HORIZON_MS = 60 * 60 * 1000; // 1時間（Design: target_at）
const SMA_SHORT_MINUTES = 15;
const SMA_LONG_MINUTES = 60;
const LONG_TERM_MINUTES = 24 * 60; // 長期トレンド算出用の窓幅（24時間）
const METHOD = "v3"; // spec 016で乖離幅・長期トレンド指標とプロンプト改訂を導入し v2 から変更（正答率統計を新旧で区別する）

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
  /** 現在値の短期移動平均線からの乖離幅（ボラティリティ＝標準偏差の倍数）。算出不可はnull。 */
  overExtension: number | null;
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
  const smaShort = sma(history, SMA_SHORT_MINUTES);
  const overExtension = smaShort === null || volatility === 0 ? null : (bids[bids.length - 1] - smaShort) / volatility;

  return {
    smaShort,
    smaLong: sma(history, SMA_LONG_MINUTES),
    changeRate,
    volatility,
    high: Math.max(...bids),
    low: Math.min(...bids),
    overExtension,
  };
}

export type LongTermTrend = {
  /** 長期窓（24時間）の始値・終値比較による変化率（%） */
  changeRate: number;
};

/**
 * 直近120分より長い期間（24時間）のトレンドを算出する。直近の押し目・戻りを長期トレンドの文脈で
 * 判断できるようにするため（Req 2）。窓幅（LONG_TERM_MINUTES）に満たない場合は算出不可としてnullを返す。
 */
export function computeLongTermTrend(history: RateHistoryPoint[]): LongTermTrend | null {
  if (history.length < LONG_TERM_MINUTES) return null;
  const bids = history.map((p) => p.bid);
  const changeRate = ((bids[bids.length - 1] - bids[0]) / bids[0]) * 100;
  return { changeRate };
}

function formatSma(value: number | null): string {
  return value === null ? "算出不可（データ不足）" : value.toFixed(3);
}

function formatOverExtension(value: number | null): string {
  return value === null ? "算出不可（データ不足）" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}σ`;
}

function formatLongTermTrend(trend: LongTermTrend | null): string {
  return trend === null ? "算出不可（データ不足）" : `${trend.changeRate >= 0 ? "+" : ""}${trend.changeRate.toFixed(3)}%`;
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

/**
 * AI分析（analyzeRate.ts / dailyOutlook.ts共通）の判断基準の注意書き。移動平均クロスなど遅行指標や
 * 直近高値・安値の更新のみを根拠にup/downと断定し、直後に反転するケースが多かったため追加した。
 */
export const ANALYSIS_JUDGMENT_GUIDANCE = `判定にあたっては以下の点に注意してください。
- 直近で高値または安値を更新した直後は、その反動でモメンタムが一巡し反転・伸び悩みが起きやすい点に注意し、更新直後の値動きだけで安易にその方向への継続と判断しないでください。
- 移動平均線のクロスなど単一の指標のみを根拠にせず、複数の指標が同じ方向を示している場合に限りup/downと判定してください。
- 明確な根拠がそろわない場合は、無理にup/downを判断せずflatを選択してください。`;

function buildPrompt(history: RateHistoryPoint[], indicators: Indicators, longTermTrend: LongTermTrend | null): string {
  const lines = history.map((p) => `${toJstDisplay(p.timestamp)}: ${p.bid.toFixed(3)}`).join("\n");
  return `以下はUSD/JPYの直近${history.length}分間、1分足の終値（bid）の推移です（時刻は日本時間）。

${lines}

【テクニカル指標】
- 短期移動平均（${SMA_SHORT_MINUTES}分）: ${formatSma(indicators.smaShort)}
- 長期移動平均（${SMA_LONG_MINUTES}分）: ${formatSma(indicators.smaLong)}
- 期間内変化率: ${indicators.changeRate.toFixed(3)}%
- ボラティリティ（標準偏差）: ${indicators.volatility.toFixed(3)}
- 期間内高値: ${indicators.high.toFixed(3)} / 安値: ${indicators.low.toFixed(3)}
- 短期移動平均線からの乖離幅: ${formatOverExtension(indicators.overExtension)}
- 直近24時間の変化率: ${formatLongTermTrend(longTermTrend)}

この推移とテクニカル指標をもとに、今後1時間程度のUSD/JPYの見通しを up（上昇） / down（下落） / flat（横ばい） のいずれかで判定してください。

${ANALYSIS_JUDGMENT_GUIDANCE}

判定結果はup/down/flatのいずれかとし、その根拠を日本語で2〜3文程度で簡潔に説明してください。`;
}

async function generateAndSaveAnalysis(
  method: string,
  prompt: string,
  trigger: "manual" | "scheduled",
  executedAt: Date,
  history: RateHistoryPoint[],
): Promise<AnalysisResult> {
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
    throw new Error(`AI分析の出力を解析できませんでした（method=${method}）`);
  }

  const result = insertAnalysisResult({
    executedAt: executedAt.toISOString(),
    method,
    direction: parsed.data.direction,
    rationale: parsed.data.rationale,
    targetAt: new Date(executedAt.getTime() + TARGET_HORIZON_MS).toISOString(),
    inputFrom: history[0].timestamp,
    inputTo: history[history.length - 1].timestamp,
    trigger,
  });

  logger.info(`[runAnalysis] completed trigger=${trigger} method=${method} direction=${result.direction}`);

  return result;
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
  const longTermTrend = computeLongTermTrend(getRecentCandles(LONG_TERM_MINUTES));

  return generateAndSaveAnalysis(METHOD, buildPrompt(history, indicators, longTermTrend), trigger, executedAt, history);
}

const METHOD_V2 = "v2";

function buildPromptV2(history: RateHistoryPoint[], indicators: Indicators): string {
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
 * method="v3"（乖離幅・長期トレンド指標とプロンプト改訂を導入したバージョン）との精度比較のため、
 * 同一期間に旧プロンプト（spec 016適用前、method="v2"）でも分析を実行する。
 * v3とは独立した比較用の仕組みであり、v3側の成否に関わらず単独で動作する。
 * 比較が完了したら（v2の呼び出し元ごと）削除してよい。
 */
export async function runAnalysisV2(trigger: "manual" | "scheduled"): Promise<AnalysisResult> {
  const history = getRecentCandles(HISTORY_MINUTES);
  if (history.length === 0) {
    throw new Error("レート履歴がまだありません");
  }

  const executedAt = new Date();
  const indicators = computeIndicators(history);

  return generateAndSaveAnalysis(METHOD_V2, buildPromptV2(history, indicators), trigger, executedAt, history);
}
