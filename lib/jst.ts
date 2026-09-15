// JSTは年間を通じてUTC+9固定（DSTなし）のため、タイムゾーンライブラリ無しで単純な引き算で成立する。
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseDateString(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function formatDateString(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

/** カレンダー日の加減算（時刻要素を持たない、Y-M-D単位の演算）。 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const { y, m, d } = parseDateString(dateStr);
  const dt = new Date(Date.UTC(y, m, d) + days * DAY_MS);
  return formatDateString(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

export function dowOfDateString(dateStr: string): number {
  const { y, m, d } = parseDateString(dateStr);
  return new Date(Date.UTC(y, m, d)).getUTCDay();
}

/** JSTの壁時計時刻（年月日時分）をUTC ISO文字列に変換する。 */
export function jstWallClockToUtcIso(dateStr: string, hour: number, minute: number): string {
  const { y, m, d } = parseDateString(dateStr);
  return new Date(Date.UTC(y, m, d, hour, minute) - JST_OFFSET_MS).toISOString();
}

/** UTC時刻が属するJSTの日付・曜日を返す（表示用のtoJstDisplayとは逆方向の変換）。 */
export function jstDateAndDow(utc: Date): { dateStr: string; dow: number } {
  const jst = new Date(utc.getTime() + JST_OFFSET_MS);
  return {
    dateStr: formatDateString(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()),
    dow: jst.getUTCDay(),
  };
}
