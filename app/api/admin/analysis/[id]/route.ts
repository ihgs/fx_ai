import { NextResponse } from "next/server";
import { deleteAnalysisResult } from "@/lib/db";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/analysis/[id]">) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "idが不正です" }, { status: 400 });
  }

  try {
    const deleted = deleteAnalysisResult(id);
    if (!deleted) {
      return NextResponse.json({ error: "指定された分析結果が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "削除に失敗しました" },
      { status: 500 },
    );
  }
}
