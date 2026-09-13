#!/usr/bin/env bash
# 本番Dockerイメージをビルドし、data/ を named volume でマウントして起動する（spec 008 / Req 2.1）。
# GEMINI_API_KEY はビルドに焼き込まず、実行時の環境変数として渡す（Req 3.1）。
#
# Usage:
#   GEMINI_API_KEY=... ./scripts/docker-run.sh
#   PORT=8080 GEMINI_API_KEY=... ./scripts/docker-run.sh
set -euo pipefail

IMAGE_NAME="fx_ai"
VOLUME_NAME="fx_ai_data"
PORT="${PORT:-3000}"
: "${GEMINI_API_KEY:?GEMINI_API_KEY environment variable is required}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker build -t "$IMAGE_NAME" .

docker run --rm \
  -p "${PORT}:3000" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
  -v "${VOLUME_NAME}:/app/data" \
  "$IMAGE_NAME"
