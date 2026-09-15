import { NextResponse } from "next/server";
import { getLatestAnalysisResultByMethod, getRecentAnalysisResults, type AnalysisResult } from "@/lib/db";
import { runAnalysis } from "@/lib/analyzeRate";
import { buildAccuracyStats, judgeOutcome, judgeOutcomeDetailed, type AnalysisOutcome } from "@/lib/judgeAnalysis";

const RESULTS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 直近1週間

type AnalysisResultWithOutcome = AnalysisResult & { outcome: AnalysisOutcome };
type AnalysisResultWithBids = AnalysisResultWithOutcome & { baselineBid: number | null; actualBid: number | null };

/** 判定に使った実レート（baselineBid/actualBid）も含める（分析結果一覧での表示用）。 */
function withOutcomeAndBids(result: AnalysisResult): AnalysisResultWithBids {
  return { ...result, ...judgeOutcomeDetailed(result) };
}

/** dailyOutlookの各セッションカードはレート値を表示しないため、判定結果のみで十分。 */
function withOutcomeOnly(result: AnalysisResult | null): AnalysisResultWithOutcome | null {
  return result ? { ...result, outcome: judgeOutcome(result) } : null;
}

export async function GET() {
  const sinceIso = new Date(Date.now() - RESULTS_WINDOW_MS).toISOString();
  const results = getRecentAnalysisResults(sinceIso).map(withOutcomeAndBids);
  const accuracy = buildAccuracyStats(results);

  const dailyOutlook = {
    tokyo: withOutcomeOnly(getLatestAnalysisResultByMethod("daily-tokyo")),
    london: withOutcomeOnly(getLatestAnalysisResultByMethod("daily-london")),
    ny: withOutcomeOnly(getLatestAnalysisResultByMethod("daily-ny")),
  };

  return NextResponse.json({ results, accuracy, dailyOutlook });
}

export async function POST() {
  try {
    const result = await runAnalysis("manual");
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 502 },
    );
  }
}
