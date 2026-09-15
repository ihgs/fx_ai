import {
  addDaysToDateString,
  dowOfDateString,
  jstDateAndDow,
  jstWallClockToUtcIso,
  pad2,
  parseDateString,
} from "@/lib/jst";

const SESSION_START_MINUTES = 6 * 60 + 30; // 06:30
const SLOT_MINUTES = 30;
const SLOT_COUNT = 47; // 06:30始まり30分刻みで翌5:30まで（両端含む）
const COLUMN_COUNT = 5; // 月〜金

const WEEKDAY_LABEL_JA = ["日", "月", "火", "水", "木", "金", "土"];

export type WeeklyHistoryColumn = { date: string; label: string };
export type WeeklyHistoryRow = { time: string; values: (number | null)[] };
export type WeeklyHistory = {
  weekStartDate: string;
  columns: WeeklyHistoryColumn[];
  rows: WeeklyHistoryRow[];
};
export type WeeklyHistoryCandle = { timestamp: string; bid: number };

/** `now`が属するJST週（月曜始まり）の月曜日付を返す。 */
export function currentWeekStartJst(now: Date = new Date()): string {
  const { dateStr, dow } = jstDateAndDow(now);
  const daysSinceMonday = (dow + 6) % 7; // 月=1->0, 日=0->6
  return addDaysToDateString(dateStr, -daysSinceMonday);
}

/** weekStartDateをweeks週分前後にずらした月曜日付を返す（weeks=-1で前週、+1で次週）。 */
export function shiftWeek(weekStartDate: string, weeks: number): string {
  return addDaysToDateString(weekStartDate, weeks * 7);
}

/** weekStartDateが "YYYY-MM-DD" 形式の実在する月曜日付かを検証する。 */
export function isMonday(weekStartDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) return false;
  const { y, m, d } = parseDateString(weekStartDate);
  const dt = new Date(Date.UTC(y, m, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return false;
  return dt.getUTCDay() === 1;
}

function slotTimeLabel(slotIndex: number): string {
  const minutesFromMidnight = (SESSION_START_MINUTES + slotIndex * SLOT_MINUTES) % (24 * 60);
  return `${pad2(Math.floor(minutesFromMidnight / 60))}:${pad2(minutesFromMidnight % 60)}`;
}

/** セッション開始日からのオフセット（日跨ぎの有無・時・分）を返す。 */
function slotOffset(slotIndex: number): { dayCarry: 0 | 1; hour: number; minute: number } {
  const totalMinutes = SESSION_START_MINUTES + slotIndex * SLOT_MINUTES;
  const dayCarry = totalMinutes >= 24 * 60 ? 1 : 0;
  const timeOfDay = totalMinutes % (24 * 60);
  return { dayCarry, hour: Math.floor(timeOfDay / 60), minute: timeOfDay % 60 };
}

function buildColumns(weekStartDate: string): WeeklyHistoryColumn[] {
  return Array.from({ length: COLUMN_COUNT }, (_, c) => {
    const date = addDaysToDateString(weekStartDate, c);
    const { m, d } = parseDateString(date);
    return { date, label: `${m + 1}/${d}(${WEEKDAY_LABEL_JA[dowOfDateString(date)]})` };
  });
}

/** 各セル（5列 x 47行）のUTC ISOタイムスタンプを計算する（列内・列間とも時系列順になる）。 */
function buildCellIso(columns: WeeklyHistoryColumn[]): string[][] {
  return columns.map((col) =>
    Array.from({ length: SLOT_COUNT }, (_, i) => {
      const { dayCarry, hour, minute } = slotOffset(i);
      const cellDate = dayCarry ? addDaysToDateString(col.date, 1) : col.date;
      return jstWallClockToUtcIso(cellDate, hour, minute);
    }),
  );
}

/**
 * 週次表を構築するために取得すべき1分足の範囲（[fromIso, toIso)）を返す。
 * DBアクセスはAPIルート側の責務とし、この関数・`buildWeeklyHistory`はDBに依存しない（クライアントからも安全に利用できる）。
 */
export function weeklyHistoryQueryRange(weekStartDate: string): { fromIso: string; toIso: string } {
  const flatIso = buildCellIso(buildColumns(weekStartDate)).flat();
  return {
    fromIso: flatIso[0],
    toIso: new Date(new Date(flatIso[flatIso.length - 1]).getTime() + 60_000).toISOString(),
  };
}

/**
 * 週次表のグリッドを構築する（純粋関数。DBアクセスは呼び出し元が`candles`として渡す）。
 * weekStartDateはJSTの月曜日付（"YYYY-MM-DD"）。
 * 列は月〜金（各列は当日6:30始まり〜翌日5:30終わりのセッション）、行は30分刻み47スロット。
 */
export function buildWeeklyHistory(weekStartDate: string, candles: WeeklyHistoryCandle[]): WeeklyHistory {
  const columns = buildColumns(weekStartDate);
  const cellIso = buildCellIso(columns);
  const bidByIso = new Map(candles.map((c) => [c.timestamp, c.bid]));

  const rows: WeeklyHistoryRow[] = Array.from({ length: SLOT_COUNT }, (_, i) => ({
    time: slotTimeLabel(i),
    values: cellIso.map((colIso) => bidByIso.get(colIso[i]) ?? null),
  }));

  return { weekStartDate, columns, rows };
}
