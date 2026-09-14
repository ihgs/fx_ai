import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PullIndicator } from "./PullIndicator";

const meta = {
  component: PullIndicator,
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => (
    <div className="flex h-16 w-full items-center justify-center bg-black">
      <PullIndicator {...args} />
    </div>
  ),
} satisfies Meta<typeof PullIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pulling: Story = {
  args: { phase: "pulling", progress: 0.5 },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Ready: Story = {
  args: { phase: "ready", progress: 1 },
  globals: { viewport: { value: "mobilePortrait" } },
};

export const Refreshing: Story = {
  args: { phase: "refreshing", progress: 1 },
  globals: { viewport: { value: "mobilePortrait" } },
};
