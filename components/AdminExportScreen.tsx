"use client";

import { useState } from "react";
import { AdminExportForm } from "@/components/AdminExportForm";
import { validateExportRange, type ExportRangeError } from "@/lib/exportRange";

const VALIDATION_MESSAGE: Partial<Record<ExportRangeError, string>> = {
  invalid_date: "日付の形式が不正です",
  start_after_end: "開始日は終了日以前を指定してください",
  range_too_long: "指定できる期間は最大7日間です",
};

function computeValidationError(fromDate: string, toDate: string): string | null {
  if (!fromDate || !toDate) return null; // 未入力はボタン無効化のみで、エラー表示はしない
  const error = validateExportRange(fromDate, toDate);
  return error ? (VALIDATION_MESSAGE[error] ?? null) : null;
}

export function AdminExportScreen() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // ダウンロードボタンのクリックハンドラ（イベントリスナー）なので、setStateを直接呼んでよい。
  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/admin/export?from=${fromDate}&to=${toDate}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed with status ${res.status}`);

      const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fx_export_${fromDate}_${toDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <AdminExportForm
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      onDownload={handleDownload}
      isDownloading={isDownloading}
      validationError={computeValidationError(fromDate, toDate)}
      downloadError={downloadError}
    />
  );
}
