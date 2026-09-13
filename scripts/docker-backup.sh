#!/usr/bin/env bash
# fx_ai_data ボリューム内のSQLiteファイル（data/fx.db）をバックアップする。
# Node組み込みの node:sqlite backup API（sqlite3_backup_* のラッパー）を使ったオンラインバックアップのため、
# 稼働中のコンテナを止めずに実行できる。
#
# Usage:
#   ./scripts/docker-backup.sh
#   BACKUP_DIR=/path/to/backups ./scripts/docker-backup.sh
set -euo pipefail

VOLUME_NAME="fx_ai_data"

cd "$(dirname "${BASH_SOURCE[0]}")/.."
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="fx-${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v "${VOLUME_NAME}:/data:ro" \
  -v "${BACKUP_DIR}:/backup" \
  node:24-slim \
  node -e "
const { backup, DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('/data/fx.db', { readOnly: true });
backup(db, '/backup/${BACKUP_FILE}').then((pages) => {
  console.log(\`backed up \${pages} pages\`);
  db.close();
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
"

echo "バックアップ完了: ${BACKUP_DIR}/${BACKUP_FILE}"
