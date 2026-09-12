import { NextResponse } from "next/server";
import { getAnalysisResults } from "@/lib/db";
import { runAnalysis } from "@/lib/analyzeRate";
import { buildAccuracyStats, judgeOutcome } from "@/lib/judgeAnalysis";

const LIST_LIMIT = 20;

export async function GET() {
  const results = getAnalysisResults(LIST_LIMIT).map((result) => ({
    ...result,
    outcome: judgeOutcome(result),
  }));
  const accuracy = buildAccuracyStats(results);

  return NextResponse.json({ results, accuracy });
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
