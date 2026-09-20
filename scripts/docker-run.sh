#!/usr/bin/env bash
# 本番Dockerイメージをビルドし、data/ を named volume でマウントしてデーモン（バックグラウンド）起動する（spec 008 / Req 2.1）。
# GEMINI_API_KEY はビルドに焼き込まず、実行時の環境変数として渡す（Req 3.1）。
#
# Usage:
#   GEMINI_API_KEY=... ./scripts/docker-run.sh
#   PORT=8080 GEMINI_API_KEY=... ./scripts/docker-run.sh
#   （プロジェクトルートに .env / .env.local があれば自動で読み込むため、そちらにGEMINI_API_KEY等を書いてもよい）
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# プロジェクトルートの .env / .env.local を読み込む（.env.localが優先、Next.jsの規約に合わせる）
set -a
[ -f .env ] && source .env
[ -f .env.local ] && source .env.local
set +a

IMAGE_NAME="fx_ai"
VOLUME_NAME="fx_ai_data"
PORT="${PORT:-3000}"
: "${GEMINI_API_KEY:?GEMINI_API_KEY environment variable is required}"

docker build -t "$IMAGE_NAME" .

docker rm -f "$IMAGE_NAME" >/dev/null 2>&1 || true

docker run -d --rm \
  --name "$IMAGE_NAME" \
  -p "${PORT}:3000" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
  -v "${VOLUME_NAME}:/app/data" \
  "$IMAGE_NAME"

echo "起動しました（コンテナ名: ${IMAGE_NAME}）。ログ確認: docker logs -f ${IMAGE_NAME} / 停止: docker stop ${IMAGE_NAME}"
