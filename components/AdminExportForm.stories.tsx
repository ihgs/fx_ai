import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AdminExportForm } from "./AdminExportForm";

const meta = {
  component: AdminExportForm,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onFromDateChange: fn(),
    onToDateChange: fn(),
    onDownload: fn(),
    isDownloading: false,
    validationError: null,
    downloadError: null,
  },
} satisfies Meta<typeof AdminExportForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fromDate: "",
    toDate: "",
  },
};

export const ValidRange: Story = {
  args: {
    fromDate: "2026-09-01",
    toDate: "2026-09-07",
  },
};

export const Downloading: Story = {
  args: {
    fromDate: "2026-09-01",
    toDate: "2026-09-07",
    isDownloading: true,
  },
};

export const ValidationError: Story = {
  args: {
    fromDate: "2026-09-10",
    toDate: "2026-09-01",
    validationError: "開始日は終了日以前を指定してください",
  },
};

export const RangeTooLongError: Story = {
  args: {
    fromDate: "2026-09-01",
    toDate: "2026-09-10",
    validationError: "指定できる期間は最大7日間です",
  },
};

export const DownloadError: Story = {
  args: {
    fromDate: "2026-09-01",
    toDate: "2026-09-07",
    downloadError: "エクスポートデータの取得に失敗しました",
  },
};
