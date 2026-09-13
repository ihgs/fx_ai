#!/usr/bin/env bash
# 本番Dockerイメージをビルドし、data/ を named volume でマウントしてデーモン（バックグラウンド）起動する（spec 008 / Req 2.1）。
# GEMINI_API_KEY はビルドに焼き込まず、実行時の環境変数として渡す（Req 3.1）。
#
# ログはjson-fileドライバでローテーションする（デフォルト: 1ファイル最大10MB、3世代）。
#
# Usage:
#   GEMINI_API_KEY=... ./scripts/docker-run.sh
#   PORT=8080 GEMINI_API_KEY=... ./scripts/docker-run.sh
#   LOG_MAX_SIZE=50m LOG_MAX_FILE=5 GEMINI_API_KEY=... ./scripts/docker-run.sh
set -euo pipefail

IMAGE_NAME="fx_ai"
VOLUME_NAME="fx_ai_data"
PORT="${PORT:-3000}"
LOG_MAX_SIZE="${LOG_MAX_SIZE:-10m}"
LOG_MAX_FILE="${LOG_MAX_FILE:-3}"
: "${GEMINI_API_KEY:?GEMINI_API_KEY environment variable is required}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker build -t "$IMAGE_NAME" .

docker rm -f "$IMAGE_NAME" >/dev/null 2>&1 || true

docker run -d --rm \
  --name "$IMAGE_NAME" \
  --log-driver json-file \
  --log-opt "max-size=${LOG_MAX_SIZE}" \
  --log-opt "max-file=${LOG_MAX_FILE}" \
  -p "${PORT}:3000" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
  -v "${VOLUME_NAME}:/app/data" \
  "$IMAGE_NAME"

echo "起動しました（コンテナ名: ${IMAGE_NAME}）。ログ確認: docker logs -f ${IMAGE_NAME} / 停止: docker stop ${IMAGE_NAME}"
