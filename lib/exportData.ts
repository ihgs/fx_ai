import {
  getAnalysisResultsInRange,
  getCandlesInRange,
  type AnalysisResult,
  type RateHistoryPoint,
} from "@/lib/db";
import { addDaysToDateString, jstWallClockToUtcIso } from "@/lib/jst";
import { judgeOutcomeDetailed, type AnalysisOutcome } from "@/lib/judgeAnalysis";

export { validateExportRange, type ExportRangeError } from "@/lib/exportRange";

export type ExportAnalysisResult = AnalysisResult & {
  outcome: AnalysisOutcome;
  /** 分析時点（inputTo）のレート。判定待ちでDBにまだ無ければnull。 */
  baselineBid: number | null;
  /** 判定対象時刻（targetAt）以降の実レート。判定待ちでDBにまだ無ければnull。 */
  actualBid: number | null;
};

export type ExportData = {
  range: { from: string; to: string };
  analysisResults: ExportAnalysisResult[];
  rateHistory: RateHistoryPoint[];
};

/** 1分足の配列から、毎時0,10,20,30,40,50分の行のみを間引いて返す。 */
export function sampleEvery10Minutes(candles: RateHistoryPoint[]): RateHistoryPoint[] {
  return candles.filter((candle) => new Date(candle.timestamp).getUTCMinutes() % 10 === 0);
}

/**
 * 指定期間（開始日〜終了日、両端含む・JST日付）のダウンロード用データを組み立てる。
 * 呼び出し元で validateExportRange による事前検証を行っていることを前提とする。
 */
export function buildExportData(fromDateStr: string, toDateStr: string): ExportData {
  const fromIso = jstWallClockToUtcIso(fromDateStr, 0, 0);
  const toIso = jstWallClockToUtcIso(addDaysToDateString(toDateStr, 1), 0, 0);

  const analysisResults: ExportAnalysisResult[] = getAnalysisResultsInRange(fromIso, toIso).map((result) => {
    const judged = judgeOutcomeDetailed(result);
    return {
      ...result,
      outcome: judged.outcome,
      baselineBid: judged.baselineBid,
      actualBid: judged.actualBid,
    };
  });

  const rateHistory = sampleEvery10Minutes(getCandlesInRange(fromIso, toIso));

  return { range: { from: fromDateStr, to: toDateStr }, analysisResults, rateHistory };
}
