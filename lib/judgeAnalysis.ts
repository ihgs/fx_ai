import { getCandleAtOrAfter, type AnalysisResult } from "@/lib/db";

const FLAT_THRESHOLD_JPY = 0.05; // 5銭（Design: 横ばい判定の閾値）

export type AnalysisOutcome = "correct" | "incorrect" | "pending";

export type AccuracyStat = {
  method: string;
  correct: number;
  incorrect: number;
  pending: number;
  accuracyRate: number | null;
};

function classifyMovement(diff: number): "up" | "down" | "flat" {
  if (diff > FLAT_THRESHOLD_JPY) return "up";
  if (diff < -FLAT_THRESHOLD_JPY) return "down";
  return "flat";
}

export type JudgedOutcome = {
  outcome: AnalysisOutcome;
  /** 分析時点（inputTo）のレート。DBにまだ無ければnull。 */
  baselineBid: number | null;
  /** 判定対象時刻（targetAt）以降の実レート。DBにまだ無ければnull。 */
  actualBid: number | null;
  /** 上昇/下落予想が外れ、実際は横ばいだった場合はtrue。正答率の集計対象から除外する（一覧表示は対象外にしない）。 */
  excludedFromStats: boolean;
};

/**
 * 分析実行時点（inputTo）と対象時刻（targetAt）以降の実レートを比較し、予測の正解/不正解/判定待ちを判定する。
 * どちらかの時点のレートがまだDBに無い場合は判定待ちとする（Req 1.2）。
 * 判定に使った実レート（baselineBid/actualBid）も併せて返す（分析結果画面での表示用）。
 */
export function judgeOutcomeDetailed(result: AnalysisResult): JudgedOutcome {
  const baseline = getCandleAtOrAfter(result.inputTo);
  const actual = getCandleAtOrAfter(result.targetAt);
  const baselineBid = baseline?.bid ?? null;
  const actualBid = actual?.bid ?? null;

  if (baselineBid === null || actualBid === null) {
    return { outcome: "pending", baselineBid, actualBid, excludedFromStats: false };
  }

  const actualDirection = classifyMovement(actualBid - baselineBid);
  const outcome = actualDirection === result.direction ? "correct" : "incorrect";
  const excludedFromStats =
    outcome === "incorrect" && (result.direction === "up" || result.direction === "down") && actualDirection === "flat";
  return { outcome, baselineBid, actualBid, excludedFromStats };
}

export function judgeOutcome(result: AnalysisResult): AnalysisOutcome {
  return judgeOutcomeDetailed(result).outcome;
}

export function buildAccuracyStats(
  resultsWithOutcome: Array<{ method: string; outcome: AnalysisOutcome; excludedFromStats?: boolean }>,
): AccuracyStat[] {
  const stats = new Map<string, AccuracyStat>();

  for (const { method, outcome, excludedFromStats } of resultsWithOutcome) {
    if (excludedFromStats) continue;
    const stat = stats.get(method) ?? { method, correct: 0, incorrect: 0, pending: 0, accuracyRate: null };
    stat[outcome] += 1;
    stats.set(method, stat);
  }

  for (const stat of stats.values()) {
    const judged = stat.correct + stat.incorrect;
    stat.accuracyRate = judged > 0 ? stat.correct / judged : null;
  }

  return Array.from(stats.values());
}
