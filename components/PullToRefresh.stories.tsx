import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PullToRefresh } from "./PullToRefresh";

const meta = {
  component: PullToRefresh,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PullToRefresh>;

export default meta;
type Story = StoryObj<typeof meta>;

// 実タッチジェスチャーはStorybookのプレビューでは再現しないため、
// SwipeContainer.stories.tsx と同様にidle状態（子要素をそのまま表示）の1storyのみ用意する。
export const Idle: Story = {
  args: {
    onRefresh: fn(async () => {}),
    disabled: false,
    children: (
      <div className="flex h-full w-full flex-col items-center gap-4 p-6">
        <p className="text-lg font-medium text-zinc-400">分析</p>
        <p className="text-base text-zinc-500">下に引っ張ると更新されます</p>
      </div>
    ),
  },
  globals: { viewport: { value: "mobilePortrait" } },
};
