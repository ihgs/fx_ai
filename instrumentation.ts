const COLLECTION_INTERVAL_MS = 60_000; // 1分（Design: 定期実行）

export async function register() {
  // Edge runtime でも register() は呼ばれるため、Node.js ランタイムでのみ実行する
  // （node:sqlite / setInterval を使うため）。
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initDb } = await import("@/lib/db");
  const { collectRate } = await import("@/lib/collectRate");

  initDb();
  setInterval(collectRate, COLLECTION_INTERVAL_MS);
}
