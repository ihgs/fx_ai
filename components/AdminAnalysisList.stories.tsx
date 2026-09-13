import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AdminAnalysisList, type AdminAnalysisResultItem } from "./AdminAnalysisList";

const meta = {
  component: AdminAnalysisList,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminAnalysisList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleResults: AdminAnalysisResultItem[] = [
  {
    id: 2,
    executedAt: "2026-09-12T10:00:00.000Z",
    method: "v2",
    direction: "up",
    rationale: "直近30分で緩やかな上昇トレンドが続いており、押し目も浅いため上昇継続を見込む。",
    targetAt: "2026-09-12T11:00:00.000Z",
    inputTo: "2026-09-12T10:00:00.000Z",
    trigger: "scheduled",
    outcome: "correct",
  },
  {
    id: 1,
    executedAt: "2026-09-12T09:00:00.000Z",
    method: "v1",
    direction: "flat",
    rationale: "値動きが小さくレンジ内で推移しており、方向感に乏しい。",
    targetAt: "2026-09-12T10:00:00.000Z",
    inputTo: "2026-09-12T09:00:00.000Z",
    trigger: "manual",
    outcome: "incorrect",
  },
  {
    id: 3,
    executedAt: "2026-09-12T11:00:00.000Z",
    method: "v2",
    direction: "down",
    rationale: "短期移動平均が長期移動平均を下抜けており、下落方向を見込む。",
    targetAt: "2026-09-12T12:00:00.000Z",
    inputTo: "2026-09-12T11:00:00.000Z",
    trigger: "scheduled",
    outcome: "pending",
  },
];

export const Loading: Story = {
  args: {
    listState: { status: "loading" },
    deletingId: null,
    deleteError: null,
    onDelete: fn(),
    onPageChange: fn(),
  },
};

export const ListError: Story = {
  name: "List Error",
  args: {
    listState: { status: "error", message: "分析結果の取得に失敗しました" },
    deletingId: null,
    deleteError: null,
    onDelete: fn(),
    onPageChange: fn(),
  },
};

export const Empty: Story = {
  args: {
    listState: { status: "loaded", results: [], total: 0, page: 1, pageSize: 20 },
    deletingId: null,
    deleteError: null,
    onDelete: fn(),
    onPageChange: fn(),
  },
};

export const WithResults: Story = {
  name: "With Results",
  args: {
    listState: { status: "loaded", results: sampleResults, total: 45, page: 2, pageSize: 20 },
    deletingId: null,
    deleteError: null,
    onDelete: fn(),
    onPageChange: fn(),
  },
};

export const Deleting: Story = {
  args: {
    listState: { status: "loaded", results: sampleResults, total: 3, page: 1, pageSize: 20 },
    deletingId: 2,
    deleteError: null,
    onDelete: fn(),
    onPageChange: fn(),
  },
};

export const DeleteError: Story = {
  name: "Delete Error",
  args: {
    listState: { status: "loaded", results: sampleResults, total: 3, page: 1, pageSize: 20 },
    deletingId: null,
    deleteError: "指定された分析結果が見つかりません",
    onDelete: fn(),
    onPageChange: fn(),
  },
};
