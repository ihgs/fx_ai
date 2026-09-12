"use client";

import { useEffect, useState } from "react";
import { AnalysisResults, type AnalysisResultsProps, type AnalysisResultItem } from "@/components/AnalysisResults";

type ListState = AnalysisResultsProps["listState"];

async function loadResults(): Promise<ListState> {
  try {
    const res = await fetch("/api/analysis");
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body = (await res.json()) as { results: AnalysisResultItem[] };
    return { status: "loaded", results: body.results };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function AnalysisScreen() {
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

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
      const body = (await res.json()) as { result?: AnalysisResultItem; error?: string };
      if (!res.ok || !body.result) {
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
      const newResult = body.result;
      setListState((prev) =>
        prev.status === "loaded"
          ? { status: "loaded", results: [newResult, ...prev.results] }
          : { status: "loaded", results: [newResult] },
      );
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <AnalysisResults
      listState={listState}
      isRunning={isRunning}
      runError={runError}
      onRunAnalysis={handleRunAnalysis}
    />
  );
}
