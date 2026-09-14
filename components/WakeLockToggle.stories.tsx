import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { WakeLockToggle } from "./WakeLockToggle";

const meta = {
  component: WakeLockToggle,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WakeLockToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { supported: true, enabled: false, onToggle: fn() },
};

export const On: Story = {
  args: { supported: true, enabled: true, onToggle: fn() },
};

export const Unsupported: Story = {
  name: "Unsupported (renders nothing)",
  args: { supported: false, enabled: false, onToggle: fn() },
};
