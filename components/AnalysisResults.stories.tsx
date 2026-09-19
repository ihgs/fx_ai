import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AnalysisResults, type AccuracyStat, type AnalysisResultItem } from "./AnalysisResults";
import type { DailySessionOutlookProps } from "./DailySessionOutlook";

const meta = {
  component: AnalysisResults,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    refreshError: null,
  },
} satisfies Meta<typeof AnalysisResults>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleResults: AnalysisResultItem[] = [
  {
    id: 2,
    executedAt: "2026-09-12T10:00:00.000Z",
    method: "v1",
    direction: "up",
    rationale: "直近30分で緩やかな上昇トレンドが続いており、押し目も浅いため上昇継続を見込む。",
    targetAt: "2026-09-12T11:00:00.000Z",
    trigger: "scheduled",
    outcome: "correct",
    baselineBid: 149.802,
    actualBid: 149.955,
    excludedFromStats: false,
  },
  {
    id: 1,
    executedAt: "2026-09-12T09:00:00.000Z",
    method: "v1",
    direction: "flat",
    rationale: "値動きが小さくレンジ内で推移しており、方向感に乏しい。",
    targetAt: "2026-09-12T10:00:00.000Z",
    trigger: "manual",
    outcome: "incorrect",
    baselineBid: 149.703,
    actualBid: 149.901,
    excludedFromStats: false,
  },
];

const mixedMethodResults: AnalysisResultItem[] = [
  { ...sampleResults[0], id: 3, method: "v2" },
  ...sampleResults,
];

const emptyDailyOutlook: DailySessionOutlookProps = { tokyo: null, london: null, ny: null };

const sampleDailyOutlook: DailySessionOutlookProps = {
  tokyo: {
    direction: "up",
    rationale: "前営業日は終始堅調に推移しており、東京市場でも上昇継続を見込む。",
    outcome: "correct",
    targetAt: "2026-09-15T09:00:00.000Z",
  },
  london: {
    direction: "flat",
    rationale: "前営業日ロンドン時間はレンジ内推移で方向感に乏しく、横ばいを見込む。",
    outcome: "pending",
    targetAt: "2026-09-15T17:00:00.000Z",
  },
  ny: null,
};

const singleMethodAccuracy: AccuracyStat[] = [
  { method: "v1", correct: 8, incorrect: 3, pending: 2, accuracyRate: 8 / 11 },
];

const multiMethodAccuracy: AccuracyStat[] = [
  { method: "v1", correct: 8, incorrect: 3, pending: 2, accuracyRate: 8 / 11 },
  { method: "v2", correct: 4, incorrect: 1, pending: 5, accuracyRate: 4 / 5 },
];

export const Loading: Story = {
  args: {
    listState: { status: "loading" },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const ListError: Story = {
  name: "List Error",
  args: {
    listState: { status: "error", message: "分析結果の取得に失敗しました" },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Empty: Story = {
  args: {
    listState: { status: "loaded", results: [], accuracy: [], dailyOutlook: emptyDailyOutlook },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const WithResults: Story = {
  name: "With Results",
  args: {
    listState: {
      status: "loaded",
      results: sampleResults,
      accuracy: singleMethodAccuracy,
      dailyOutlook: emptyDailyOutlook,
    },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const WithDailyOutlook: Story = {
  name: "With Daily Outlook",
  args: {
    listState: {
      status: "loaded",
      results: sampleResults,
      accuracy: singleMethodAccuracy,
      dailyOutlook: sampleDailyOutlook,
    },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const MultipleMethods: Story = {
  name: "Multiple Methods",
  args: {
    listState: {
      status: "loaded",
      results: mixedMethodResults,
      accuracy: multiMethodAccuracy,
      dailyOutlook: emptyDailyOutlook,
    },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const PendingOnly: Story = {
  name: "Pending Only",
  args: {
    listState: {
      status: "loaded",
      results: sampleResults.map((result) => ({
        ...result,
        outcome: "pending",
        baselineBid: null,
        actualBid: null,
      })),
      accuracy: [{ method: "v1", correct: 0, incorrect: 0, pending: 2, accuracyRate: null }],
      dailyOutlook: emptyDailyOutlook,
    },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Running: Story = {
  args: {
    listState: {
      status: "loaded",
      results: sampleResults,
      accuracy: singleMethodAccuracy,
      dailyOutlook: emptyDailyOutlook,
    },
    isRunning: true,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const RunError: Story = {
  name: "Run Error",
  args: {
    listState: {
      status: "loaded",
      results: sampleResults,
      accuracy: singleMethodAccuracy,
      dailyOutlook: emptyDailyOutlook,
    },
    isRunning: false,
    runError: "AI分析の呼び出しに失敗しました",
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const RefreshError: Story = {
  name: "Refresh Error",
  args: {
    listState: {
      status: "loaded",
      results: sampleResults,
      accuracy: singleMethodAccuracy,
      dailyOutlook: emptyDailyOutlook,
    },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
    refreshError: "更新に失敗しました",
  },
  globals: { viewport: { value: "mobilePortrait" } },
};
