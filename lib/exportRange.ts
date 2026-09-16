import { parseDateString } from "@/lib/jst";

// DBに依存しない純粋な日付ロジックのみを置く（クライアントコンポーネントからも
// 直接importして事前バリデーションに使うため。lib/exportData.ts はDBに依存するので分離する）。

const MAX_RANGE_DAYS = 7;
const DATE_STR_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ExportRangeError = "missing" | "invalid_date" | "start_after_end" | "range_too_long";

function isValidDateString(dateStr: string): boolean {
  if (!DATE_STR_RE.test(dateStr)) return false;
  const { y, m, d } = parseDateString(dateStr);
  const dt = new Date(Date.UTC(y, m, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m && dt.getUTCDate() === d;
}

function daysBetweenInclusive(fromDateStr: string, toDateStr: string): number {
  const { y: y1, m: m1, d: d1 } = parseDateString(fromDateStr);
  const { y: y2, m: m2, d: d2 } = parseDateString(toDateStr);
  const diffMs = Date.UTC(y2, m2, d2) - Date.UTC(y1, m1, d1);
  return diffMs / (24 * 60 * 60 * 1000) + 1;
}

/** ダウンロード対象期間（開始日〜終了日、両端含む・JST日付）を検証する。問題無ければnull。 */
export function validateExportRange(fromDateStr: string, toDateStr: string): ExportRangeError | null {
  if (!fromDateStr || !toDateStr) return "missing";
  if (!isValidDateString(fromDateStr) || !isValidDateString(toDateStr)) return "invalid_date";
  if (fromDateStr > toDateStr) return "start_after_end";
  if (daysBetweenInclusive(fromDateStr, toDateStr) > MAX_RANGE_DAYS) return "range_too_long";
  return null;
}
