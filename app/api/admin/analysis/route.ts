import { NextRequest, NextResponse } from "next/server";
import { countAnalysisResults, getAnalysisResultsPage } from "@/lib/db";
import { judgeOutcome } from "@/lib/judgeAnalysis";

const ADMIN_ANALYSIS_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam === null ? 1 : Number(pageParam);

  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "pageは1以上の整数である必要があります" }, { status: 400 });
  }

  try {
    const offset = (page - 1) * ADMIN_ANALYSIS_PAGE_SIZE;
    const results = getAnalysisResultsPage(offset, ADMIN_ANALYSIS_PAGE_SIZE).map((result) => ({
      ...result,
      outcome: judgeOutcome(result),
    }));
    const total = countAnalysisResults();

    return NextResponse.json({ results, total, page, pageSize: ADMIN_ANALYSIS_PAGE_SIZE });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析結果の取得に失敗しました" },
      { status: 500 },
    );
  }
}
