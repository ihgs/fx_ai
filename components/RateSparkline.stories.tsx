import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RateSparkline } from "./RateSparkline";

const meta = {
  component: RateSparkline,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RateSparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

// 決定的な疑似乱数（毎回同じstoryになるようseed固定。RateChart.stories.tsxと同じ手法）。
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePoints(count: number) {
  const now = Date.now();
  const random = mulberry32(42);
  let bid = 149.5;
  return Array.from({ length: count }, (_, i) => {
    bid += (random() - 0.5) * 0.1;
    return {
      timestamp: new Date(now - (count - i) * 60_000).toISOString(),
      bid: Number(bid.toFixed(3)),
    };
  });
}

export const Loading: Story = {
  args: { status: "loading" },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Empty: Story = {
  args: { status: "empty" },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const DataPortrait: Story = {
  name: "Data (Portrait)",
  args: { status: "data", points: samplePoints(30) },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const DataLandscape: Story = {
  name: "Data (Landscape)",
  args: { status: "data", points: samplePoints(30) },
  globals: { viewport: { value: "mobileLandscape" } },
};
