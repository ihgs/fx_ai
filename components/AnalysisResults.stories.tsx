import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AnalysisResults, type AccuracyStat, type AnalysisResultItem } from "./AnalysisResults";

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
  },
];

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
    listState: { status: "loaded", results: [], accuracy: [] },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const WithResults: Story = {
  name: "With Results",
  args: {
    listState: { status: "loaded", results: sampleResults, accuracy: singleMethodAccuracy },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const MultipleMethods: Story = {
  name: "Multiple Methods",
  args: {
    listState: { status: "loaded", results: sampleResults, accuracy: multiMethodAccuracy },
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
    },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Running: Story = {
  args: {
    listState: { status: "loaded", results: sampleResults, accuracy: singleMethodAccuracy },
    isRunning: true,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const RunError: Story = {
  name: "Run Error",
  args: {
    listState: { status: "loaded", results: sampleResults, accuracy: singleMethodAccuracy },
    isRunning: false,
    runError: "AI分析の呼び出しに失敗しました",
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const RefreshError: Story = {
  name: "Refresh Error",
  args: {
    listState: { status: "loaded", results: sampleResults, accuracy: singleMethodAccuracy },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
    refreshError: "更新に失敗しました",
  },
  globals: { viewport: { value: "mobilePortrait" } },
};
