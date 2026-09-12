import { NextResponse } from "next/server";
import { getAnalysisResults } from "@/lib/db";
import { runAnalysis } from "@/lib/analyzeRate";

const LIST_LIMIT = 20;

export async function GET() {
  return NextResponse.json({ results: getAnalysisResults(LIST_LIMIT) });
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
