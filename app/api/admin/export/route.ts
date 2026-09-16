import { NextRequest, NextResponse } from "next/server";
import { buildExportData, validateExportRange, type ExportRangeError } from "@/lib/exportData";

const ERROR_MESSAGE: Record<ExportRangeError, string> = {
  missing: "from, toは必須です",
  invalid_date: "from, toはYYYY-MM-DD形式で指定してください",
  start_after_end: "開始日は終了日以前を指定してください",
  range_too_long: "指定できる期間は最大7日間です",
};

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";

  const rangeError = validateExportRange(from, to);
  if (rangeError) {
    return NextResponse.json({ error: ERROR_MESSAGE[rangeError] }, { status: 400 });
  }

  try {
    const data = buildExportData(from, to);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[admin/export] failed:", error);
    return NextResponse.json({ error: "エクスポートデータの取得に失敗しました" }, { status: 500 });
  }
}
