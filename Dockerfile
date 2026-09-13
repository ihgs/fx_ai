# deps: 依存パッケージのインストールのみ（レイヤーキャッシュを効かせるため分離）
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# builder: 本番ビルドを実行する
FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# runner: 実行に必要な最小限のファイルだけを含む最終イメージ
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# next.config.ts の output: "standalone" により、server.js と実行に必要な
# node_modules だけがトレースされて .next/standalone に出力される。
COPY --from=builder /app/.next/standalone ./
# standalone出力には .next/static は含まれない（Next.js公式ドキュメント記載の既知の挙動）。
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# lib/migrate.ts が起動時に process.cwd()/migrations を読むため明示的にコピーする。
COPY --from=builder /app/migrations ./migrations

# data/ (SQLiteファイル) は再作成のたびに消えないよう volume をマウントして運用する。
# 例: docker run -v fx_ai_data:/app/data -e GEMINI_API_KEY=... -p 3000:3000 <image>
# （scripts/docker-run.sh も参照）
EXPOSE 3000
CMD ["node", "server.js"]
