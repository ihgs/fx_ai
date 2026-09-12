import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SwipeIndicator } from "./SwipeIndicator";

const meta = {
  component: SwipeIndicator,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="relative h-64 w-full bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SwipeIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstActive: Story = {
  args: { count: 3, activeIndex: 0, onSelect: fn() },
};

export const SecondActive: Story = {
  args: { count: 3, activeIndex: 1, onSelect: fn() },
};

export const ThirdActive: Story = {
  args: { count: 3, activeIndex: 2, onSelect: fn() },
};
