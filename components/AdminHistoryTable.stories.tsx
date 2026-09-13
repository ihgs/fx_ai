import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AdminHistoryTable, type AdminHistoryData } from "./AdminHistoryTable";

const meta = {
  component: AdminHistoryTable,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLUMN_LABELS = ["9/14(月)", "9/15(火)", "9/16(水)", "9/17(木)", "9/18(金)"];
const COLUMN_DATES = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"];
const SLOT_COUNT = 47;

function slotTimeLabel(i: number): string {
  const minutes = (6 * 60 + 30 + i * 30) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function buildSampleData(missingRatio: number): AdminHistoryData {
  const columns = COLUMN_DATES.map((date, i) => ({ date, label: COLUMN_LABELS[i] }));
  const rows = Array.from({ length: SLOT_COUNT }, (_, i) => ({
    time: slotTimeLabel(i),
    values: columns.map((_, c) => {
      const seed = i * 7 + c * 13;
      if (seed % 100 < missingRatio * 100) return null;
      return 149.5 + Math.sin(seed / 5) * 0.8;
    }),
  }));
  return { weekStartDate: "2026-09-14", columns, rows };
}

const sampleData = buildSampleData(0.1);
const sparseData = buildSampleData(0.7);

export const Loading: Story = {
  args: {
    state: { status: "loading" },
    canGoNext: true,
    onPrevWeek: fn(),
    onNextWeek: fn(),
  },
};

export const LoadError: Story = {
  name: "Load Error",
  args: {
    state: { status: "error", message: "ヒストリーデータの取得に失敗しました" },
    canGoNext: true,
    onPrevWeek: fn(),
    onNextWeek: fn(),
  },
};

export const Loaded: Story = {
  args: {
    state: { status: "loaded", data: sampleData },
    canGoNext: true,
    onPrevWeek: fn(),
    onNextWeek: fn(),
  },
};

export const SparseData: Story = {
  name: "Sparse Data",
  args: {
    state: { status: "loaded", data: sparseData },
    canGoNext: true,
    onPrevWeek: fn(),
    onNextWeek: fn(),
  },
};

export const AtLatestWeek: Story = {
  name: "At Latest Week",
  args: {
    state: { status: "loaded", data: sampleData },
    canGoNext: false,
    onPrevWeek: fn(),
    onNextWeek: fn(),
  },
};
