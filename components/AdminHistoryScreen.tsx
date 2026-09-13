"use client";

import { useEffect, useState } from "react";
import { AdminHistoryTable, type AdminHistoryData, type AdminHistoryTableProps } from "@/components/AdminHistoryTable";
import { currentWeekStartJst, shiftWeek } from "@/lib/weeklyHistory";

type HistoryState = AdminHistoryTableProps["state"];

async function loadWeek(weekStartDate: string): Promise<HistoryState> {
  try {
    const res = await fetch(`/api/admin/history?weekStart=${weekStartDate}`);
    const body = (await res.json()) as AdminHistoryData & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Request failed with status ${res.status}`);
    return { status: "loaded", data: body };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function AdminHistoryScreen() {
  const [weekStartDate, setWeekStartDate] = useState(() => currentWeekStartJst());
  const [state, setState] = useState<HistoryState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadWeek(weekStartDate).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [weekStartDate]);

  // 前週/次週ボタンのクリックハンドラ（イベントリスナー）なので、setStateを直接呼んでよい。
  function goToWeek(newWeekStartDate: string) {
    setState({ status: "loading" });
    setWeekStartDate(newWeekStartDate);
  }

  return (
    <AdminHistoryTable
      state={state}
      canGoNext={weekStartDate < currentWeekStartJst()}
      onPrevWeek={() => goToWeek(shiftWeek(weekStartDate, -1))}
      onNextWeek={() => goToWeek(shiftWeek(weekStartDate, 1))}
    />
  );
}
