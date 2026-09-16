export type AdminExportFormProps = {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onDownload: () => void;
  isDownloading: boolean;
  /** クライアント側バリデーション（開始日>終了日、7日超）のエラーメッセージ。 */
  validationError: string | null;
  /** サーバーエラー等、ダウンロード実行時に発生したエラーメッセージ。 */
  downloadError: string | null;
};

export function AdminExportForm({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onDownload,
  isDownloading,
  validationError,
  downloadError,
}: AdminExportFormProps) {
  const isDisabled = isDownloading || !fromDate || !toDate || validationError !== null;

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">データダウンロード</h1>

      <div className="flex flex-col gap-4 rounded-2xl bg-zinc-900 p-5 ring-1 ring-white/10">
        <p className="text-sm text-zinc-400">
          期間を指定して、分析結果（正誤判定付き）とレートヒストリー（10分間隔）をJSON形式でダウンロードします。指定できる期間は最大7日間です。
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            開始日
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            終了日
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-white"
            />
          </label>

          <button
            type="button"
            onClick={onDownload}
            disabled={isDisabled}
            className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? "ダウンロード中..." : "ダウンロード"}
          </button>
        </div>

        {validationError && (
          <p role="alert" className="text-sm text-red-400">
            {validationError}
          </p>
        )}
        {downloadError && (
          <p role="alert" className="text-sm text-red-400">
            {downloadError}
          </p>
        )}
      </div>
    </div>
  );
}
