"use client";

import { useEffect, useState } from "react";
import {
  AdminAnalysisList,
  type AdminAnalysisListProps,
  type AdminAnalysisResultItem,
} from "@/components/AdminAnalysisList";

type ListState = AdminAnalysisListProps["listState"];

type AdminAnalysisApiResponse = {
  results: AdminAnalysisResultItem[];
  total: number;
  page: number;
  pageSize: number;
};

async function loadResults(page: number): Promise<ListState> {
  try {
    const res = await fetch(`/api/admin/analysis?page=${page}`);
    const body = (await res.json()) as AdminAnalysisApiResponse & { error?: string };
    if (!res.ok) throw new Error(body.error ?? `Request failed with status ${res.status}`);
    return { status: "loaded", results: body.results, total: body.total, page: body.page, pageSize: body.pageSize };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function AdminAnalysisScreen() {
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadResults(page).then((result) => {
      if (!cancelled) setListState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  // ページ送りボタンのクリックハンドラ（イベントリスナー）なので、setStateを直接呼んでよい。
  function handlePageChange(newPage: number) {
    setListState({ status: "loading" });
    setPage(newPage);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("この分析結果を削除しますか？")) return;

    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/analysis/${id}`, { method: "DELETE" });
      const body = (await res.json()) as { deleted?: boolean; error?: string };
      if (!res.ok || !body.deleted) {
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setDeletingId(null);
      setListState(await loadResults(page));
    }
  }

  return (
    <AdminAnalysisList
      listState={listState}
      deletingId={deletingId}
      deleteError={deleteError}
      onDelete={handleDelete}
      onPageChange={handlePageChange}
    />
  );
}
