import { NextRequest, NextResponse } from "next/server";
import { getCandlesInRange } from "@/lib/db";
import { buildWeeklyHistory, currentWeekStartJst, isMonday, weeklyHistoryQueryRange } from "@/lib/weeklyHistory";

export async function GET(request: NextRequest) {
  const weekStartParam = request.nextUrl.searchParams.get("weekStart");
  const weekStartDate = weekStartParam ?? currentWeekStartJst();

  if (!isMonday(weekStartDate)) {
    return NextResponse.json({ error: "weekStartは月曜日のYYYY-MM-DD形式である必要があります" }, { status: 400 });
  }

  try {
    const { fromIso, toIso } = weeklyHistoryQueryRange(weekStartDate);
    const candles = getCandlesInRange(fromIso, toIso);
    const data = buildWeeklyHistory(weekStartDate, candles);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ヒストリーデータの取得に失敗しました" },
      { status: 500 },
    );
  }
}
