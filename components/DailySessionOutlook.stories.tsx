import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DailySessionOutlook, type DailySessionOutlookItem } from "./DailySessionOutlook";

const meta = {
  component: DailySessionOutlook,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DailySessionOutlook>;

export default meta;
type Story = StoryObj<typeof meta>;

const tokyoItem: DailySessionOutlookItem = {
  direction: "up",
  rationale: "前営業日は終始堅調に推移しており、東京市場でも上昇継続を見込む。",
  outcome: "correct",
  targetAt: "2026-09-15T09:00:00.000Z",
};

const londonItem: DailySessionOutlookItem = {
  direction: "flat",
  rationale: "前営業日ロンドン時間はレンジ内推移で方向感に乏しく、横ばいを見込む。",
  outcome: "pending",
  targetAt: "2026-09-15T17:00:00.000Z",
};

const nyItem: DailySessionOutlookItem = {
  direction: "down",
  rationale: "前営業日NY時間は上値が重く、本日も上値の重さが続くと見込む。",
  outcome: "incorrect",
  targetAt: "2026-09-15T22:00:00.000Z",
};

export const Empty: Story = {
  args: { tokyo: null, london: null, ny: null },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const AllGenerated: Story = {
  name: "All Generated",
  args: { tokyo: tokyoItem, london: londonItem, ny: nyItem },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Partial: Story = {
  args: { tokyo: tokyoItem, london: null, ny: null },
  globals: { viewport: { value: "mobilePortrait" } },
};
