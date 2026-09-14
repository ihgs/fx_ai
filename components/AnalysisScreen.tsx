"use client";

import { useEffect, useState } from "react";
import {
  AnalysisResults,
  type AccuracyStat,
  type AnalysisResultsProps,
  type AnalysisResultItem,
} from "@/components/AnalysisResults";
import { PullToRefresh } from "@/components/PullToRefresh";

type ListState = AnalysisResultsProps["listState"];

function withPendingIncremented(accuracy: AccuracyStat[], method: string): AccuracyStat[] {
  const existing = accuracy.find((stat) => stat.method === method);
  if (!existing) {
    return [...accuracy, { method, correct: 0, incorrect: 0, pending: 1, accuracyRate: null }];
  }
  return accuracy.map((stat) =>
    stat.method === method ? { ...stat, pending: stat.pending + 1 } : stat,
  );
}

async function loadResults(): Promise<ListState> {
  try {
    const res = await fetch("/api/analysis");
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body = (await res.json()) as { results: AnalysisResultItem[]; accuracy: AccuracyStat[] };
    return { status: "loaded", results: body.results, accuracy: body.accuracy };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function AnalysisScreen() {
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadResults().then((result) => {
      if (!cancelled) setListState(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ボタンのクリックハンドラ（イベントリスナー）なので、setStateを直接呼んでよい。
  async function handleRunAnalysis() {
    setIsRunning(true);
    setRunError(null);
    try {
      const res = await fetch("/api/analysis", { method: "POST" });
      const body = (await res.json()) as { result?: Omit<AnalysisResultItem, "outcome">; error?: string };
      if (!res.ok || !body.result) {
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
      // 実行直後は答え合わせの対象時刻がまだ来ていないため、必ず判定待ちになる。
      const newResult: AnalysisResultItem = { ...body.result, outcome: "pending" };
      setListState((prev) =>
        prev.status === "loaded"
          ? {
              status: "loaded",
              results: [newResult, ...prev.results],
              accuracy: withPendingIncremented(prev.accuracy, newResult.method),
            }
          : {
              status: "loaded",
              results: [newResult],
              accuracy: withPendingIncremented([], newResult.method),
            },
      );
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }

  // プル更新のジェスチャーハンドラ（イベントリスナー）なので、setStateを直接呼んでよい。
  // 例外は投げない（loadResults自体が内部でcatchする）。失敗時はlistStateを直前の値のまま維持する。
  async function handlePullRefresh() {
    const result = await loadResults();
    if (result.status === "error") {
      setRefreshError(result.message);
      return;
    }
    setRefreshError(null);
    setListState(result);
  }

  return (
    <PullToRefresh onRefresh={handlePullRefresh} disabled={isRunning}>
      <AnalysisResults
        listState={listState}
        isRunning={isRunning}
        runError={runError}
        onRunAnalysis={handleRunAnalysis}
        refreshError={refreshError}
      />
    </PullToRefresh>
  );
}
