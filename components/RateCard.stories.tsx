import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { RateCard } from "./RateCard";

const meta = {
  component: RateCard,
  parameters: {
    // Use the full viewport (no Storybook padding/centering) so the
    // "stretches to the full screen width in portrait" behavior can
    // actually be judged from the preview.
    layout: "fullscreen",
  },
} satisfies Meta<typeof RateCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleRate = {
  symbol: "USD_JPY" as const,
  bid: 149.812,
  ask: 149.815,
  timestamp: "2026-09-12T02:00:00.000Z",
  open: { price: 149.5, date: "2026-09-12" },
};

export const Loading: Story = {
  args: { status: "loading" },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const LoadedPortrait: Story = {
  name: "Loaded (Portrait)",
  args: { status: "loaded", rate: sampleRate, onRefresh: fn() },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const LoadedLandscape: Story = {
  name: "Loaded (Landscape)",
  args: { status: "loaded", rate: sampleRate, onRefresh: fn() },
  globals: { viewport: { value: "mobileLandscape" } },
};

export const ErrorState: Story = {
  name: "Error",
  args: { status: "error", message: "Upstream rate API returned an error", onRefresh: fn() },
  globals: { viewport: { value: "mobilePortrait" } },
};
