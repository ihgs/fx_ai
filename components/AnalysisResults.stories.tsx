import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AnalysisResults, type AnalysisResultItem } from "./AnalysisResults";

const meta = {
  component: AnalysisResults,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AnalysisResults>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleResults: AnalysisResultItem[] = [
  {
    id: 2,
    executedAt: "2026-09-12T10:00:00.000Z",
    direction: "up",
    rationale: "直近30分で緩やかな上昇トレンドが続いており、押し目も浅いため上昇継続を見込む。",
    targetAt: "2026-09-12T11:00:00.000Z",
    trigger: "scheduled",
  },
  {
    id: 1,
    executedAt: "2026-09-12T09:00:00.000Z",
    direction: "flat",
    rationale: "値動きが小さくレンジ内で推移しており、方向感に乏しい。",
    targetAt: "2026-09-12T10:00:00.000Z",
    trigger: "manual",
  },
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
    listState: { status: "loaded", results: [] },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const WithResults: Story = {
  name: "With Results",
  args: {
    listState: { status: "loaded", results: sampleResults },
    isRunning: false,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Running: Story = {
  args: {
    listState: { status: "loaded", results: sampleResults },
    isRunning: true,
    runError: null,
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const RunError: Story = {
  name: "Run Error",
  args: {
    listState: { status: "loaded", results: sampleResults },
    isRunning: false,
    runError: "AI分析の呼び出しに失敗しました",
    onRunAnalysis: fn(),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};
