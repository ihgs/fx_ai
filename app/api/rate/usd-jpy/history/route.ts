import { NextRequest, NextResponse } from "next/server";
import { getHistory, isValidRange } from "@/lib/db";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range");

  if (!range || !isValidRange(range)) {
    return NextResponse.json({ error: "range must be one of: 30m, 1d, 1w, 1m" }, { status: 400 });
  }

  const data = getHistory(range);
  return NextResponse.json({ range, data });
}
