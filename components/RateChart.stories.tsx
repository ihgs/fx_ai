import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RateChart } from "./RateChart";

const meta = {
  component: RateChart,
  parameters: {
    // spec 001のRateCard同様、実機同様に余白なしで幅いっぱいの見え方を確認する
    layout: "fullscreen",
  },
} satisfies Meta<typeof RateChart>;

export default meta;
type Story = StoryObj<typeof meta>;

function samplePoints(count: number) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * 60_000).toISOString(),
    bid: 149.5 + Math.sin(i / 5) * 0.8 + i * 0.01,
  }));
}

export const Loading: Story = {
  args: { status: "loading" },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const DataPortrait: Story = {
  name: "Data (Portrait)",
  args: { status: "data", points: samplePoints(60) },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const DataLandscape: Story = {
  name: "Data (Landscape)",
  args: { status: "data", points: samplePoints(60) },
  globals: { viewport: { value: "mobileLandscape" } },
};

export const Empty: Story = {
  args: { status: "empty" },
  globals: { viewport: { value: "mobilePortrait" } },
};
