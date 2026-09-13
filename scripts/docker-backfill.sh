#!/usr/bin/env bash
# 稼働中のDockerサービスと同じ fx_ai_data ボリュームに対して scripts/backfillHistory.ts を実行する。
# 実行用の本番イメージ（runnerステージ）には scripts/ や devDependencies が含まれないため、
# フルソース・devDependenciesを含む builder ステージを一時的にビルドして使う。
#
# Usage:
#   ./scripts/docker-backfill.sh --from=2024-01-01 --to=2024-01-31
set -euo pipefail

IMAGE_NAME="fx_ai"
BUILDER_TAG="${IMAGE_NAME}:builder"
VOLUME_NAME="fx_ai_data"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker build --target builder -t "$BUILDER_TAG" .

docker run --rm \
  -v "${VOLUME_NAME}:/app/data" \
  "$BUILDER_TAG" \
  npm run backfill -- "$@"
