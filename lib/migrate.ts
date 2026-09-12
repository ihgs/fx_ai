import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";

const MIGRATIONS_DIR = join(process.cwd(), "migrations");

/**
 * 自作の軽量マイグレーションランナー。
 * `migrations/*.sql` をファイル名順に適用し、適用済みのファイル名を
 * `schema_migrations` テーブルに記録して再適用を防ぐ。
 * 依存パッケージなしで動かせるよう `node:sqlite` の DatabaseSync に直接実行する。
 */
export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare("SELECT name FROM schema_migrations").all() as Array<{
    name: string;
  }>;
  const applied = new Set(appliedRows.map((row) => row.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
        file,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(
        `Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
