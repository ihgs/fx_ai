import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getRecentCandles, insertAnalysisResult, type AnalysisResult } from "@/lib/db";
import { logger } from "@/lib/logger";

const HISTORY_MINUTES = 120;
const TARGET_HORIZON_MS = 60 * 60 * 1000; // 1時間（Design: target_at）
const METHOD = "v1"; // spec 005で分析手法が複数になった場合に備えた識別子

const AnalysisOutputSchema = z.object({
  direction: z.enum(["up", "down", "flat"]),
  rationale: z.string(),
});

const client = new Anthropic();

function buildPrompt(history: { timestamp: string; bid: number }[]): string {
  const lines = history.map((p) => `${p.timestamp}: ${p.bid.toFixed(3)}`).join("\n");
  return `以下はUSD/JPYの直近${history.length}分間、1分足の終値（bid）の推移です。

${lines}

この推移をもとに、今後1時間程度のUSD/JPYの見通しを up（上昇） / down（下落） / flat（横ばい） のいずれかで判定し、
その根拠を日本語で2〜3文程度で簡潔に説明してください。`;
}

/**
 * 直近のレート履歴を入力にAI分析を実行し、結果をDBに保存する。
 * レート履歴が無い、Anthropic API呼び出し失敗、DB保存失敗のいずれの場合も例外を投げる。
 * 呼び出し元（APIルート or スケジューラ）がそれぞれの文脈でエラーを処理する（Req 1.4）。
 */
export async function runAnalysis(trigger: "manual" | "scheduled"): Promise<AnalysisResult> {
  const history = getRecentCandles(HISTORY_MINUTES);
  if (history.length === 0) {
    throw new Error("レート履歴がまだありません");
  }

  const executedAt = new Date();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: { effort: "low", format: zodOutputFormat(AnalysisOutputSchema) },
    messages: [{ role: "user", content: buildPrompt(history) }],
  });

  if (!response.parsed_output) {
    throw new Error("AI分析の出力を解析できませんでした");
  }

  const result = insertAnalysisResult({
    executedAt: executedAt.toISOString(),
    method: METHOD,
    direction: response.parsed_output.direction,
    rationale: response.parsed_output.rationale,
    targetAt: new Date(executedAt.getTime() + TARGET_HORIZON_MS).toISOString(),
    inputFrom: history[0].timestamp,
    inputTo: history[history.length - 1].timestamp,
    trigger,
  });

  logger.info(`[runAnalysis] completed trigger=${trigger} method=${METHOD} direction=${result.direction}`);

  return result;
}
