import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SwipeContainer } from "./SwipeContainer";

const meta = {
  component: SwipeContainer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SwipeContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

function DummySlide({ color, label }: { color: string; label: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center ${color}`}>
      <p className="text-2xl font-medium text-white">{label}</p>
    </div>
  );
}

export const ThreeSlides: Story = {
  args: {
    // Fragment (<>...</>) だと SwipeContainer 内の Children.toArray() が
    // 中身まで展開せず「1個の子」として数えてしまうため、配列で渡す。
    children: [
      <DummySlide key="1" color="bg-red-900" label="1" />,
      <DummySlide key="2" color="bg-green-900" label="2" />,
      <DummySlide key="3" color="bg-blue-900" label="3" />,
    ],
  },
  globals: { viewport: { value: "mobilePortrait" } },
};
