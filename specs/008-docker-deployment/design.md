# 運用のためのDockerfile — Design

## Architecture
- `next.config.ts` に `output: "standalone"` を追加する。ビルド時に `.next/standalone` へ
  実行に必要なファイル（トレース済みの `node_modules` を含む）が出力され、`node_modules` 全体を
  最終イメージに含めずに済む（Req 1.3）。
- `Dockerfile`（新規、3ステージ）:
  1. `deps`: `package.json` / `package-lock.json` をコピーし `npm ci`
  2. `builder`: `deps` の `node_modules` とソース一式をコピーし `npm run build`
  3. `runner`: `builder` から以下のみをコピーする最終イメージ
     - `.next/standalone/`（`server.js` と最小限の `node_modules` を含む）→ `/app` 直下
     - `.next/static/` → `/app/.next/static`（standalone出力に含まれないため手動コピーが必要。
       Next.js公式ドキュメント記載の既知の挙動）
     - `public/` → `/app/public`
     - `migrations/` → `/app/migrations`（`lib/migrate.ts` が `process.cwd()/migrations` を
       実行時に `readdirSync` するため、ビルドトレースの対象外＝手動コピーが必須。
       ここを忘れるとコンテナ起動時にDB初期化が失敗する）
  - ベースイメージは devcontainer と揃えて `node:24-slim`（Debian系, glibc）を使う。
    `node:sqlite` はNode本体組み込みのためAlpine(musl)でも動作しうるが、検証コストを避けて
    既知の動作環境に合わせる。
  - `CMD ["node", "server.js"]` でstandaloneサーバーを起動する（`next start` は使わない。
    standalone出力の流儀に従う）。
  - `EXPOSE 3000`。ポート/ホストを変える場合は `PORT` / `HOSTNAME` 環境変数で上書き可能
    （Next.js標準機能、コード変更不要）。
- `.dockerignore`（新規）: `node_modules`, `.next`, `data`, `storybook-static`, `.git`,
  `.devcontainer`, `.env*` を除外する（Req 3.2。ビルドコンテキストに秘密情報を含む可能性のある
  ファイルを持ち込まない）。
- DBファイル (`data/fx.db`) は `lib/db.ts` の `DB_PATH = join(process.cwd(), "data", "fx.db")` が
  そのまま使えるよう、コンテナの `WORKDIR` を `/app` に統一する。運用時は
  `docker run -v <volume>:/app/data ...` でホスト/named volumeをマウントする
  （`instrumentation.ts` の `initDb()` が起動時にマイグレーションを自動適用するため、
  空の `data/` からでもスキーマが作成される。コード変更不要、Req 2.2）。
- シークレット（`ANTHROPIC_API_KEY` 等）はビルド引数(ARG)にはせず、`docker run -e ANTHROPIC_API_KEY=...`
  のように実行時環境変数として渡す前提とする（Dockerfileには `ARG`/`ENV` でのデフォルト値を書かない）。

## Data Model / Types
変更無し。

## API Contract
変更無し。

## Error Handling / Edge Cases
- `.next/static` や `migrations/` のコピー漏れは「起動はするが機能しない」形の壊れ方をするため
  （静的アセット404、DB初期化失敗）、Testing Approachで実際にコンテナを起動して確認する。
- **実装時の発見**: `migrations/*.sql` は実際には Next.js のビルドトレースによって
  `.next/standalone/migrations/` に自動的に含まれることを確認した（想定と異なり手動コピー不要
  だった）。ただしトレース挙動はNext.jsのバージョンに依存し得るため、Dockerfileでは
  引き続き明示的に `COPY migrations` を行い、将来トレース挙動が変わっても壊れないようにする。
- **実装時の発見**: ビルド実行時（`npm run build`）のカレントディレクトリに `data/fx.db` が
  存在すると、そのファイルがそのまま `.next/standalone/data/fx.db` としてビルド出力に
  含まれてしまう（実測で確認、ホストで直接 `npm run build` した場合に再現）。
  Dockerビルドでは `.dockerignore` に `data` を含めているためビルドコンテキスト自体に
  `data/` が渡らず、この問題は発生しない。つまり `.dockerignore` の `data` 除外は
  Req 3.2（秘密情報対策）だけでなく、開発中のDBスナップショットが非決定的に
  イメージへ焼き込まれることを防ぐ役割も兼ねている。
- 必須環境変数（`ANTHROPIC_API_KEY`）が未設定でも起動自体は成功する。AI分析実行時に
  既存のエラーハンドリング（`POST /api/analysis` が502を返す、または定期実行が
  `console.error` を出す）に従う（Dockerfile側での事前チェックはしない、Out of Scope）。
- `data/` ボリュームが未マウントの場合、コンテナ再作成のたびにDBが消える
  （volume運用の周知はドキュメント／コメントで行うのみで、Dockerfile側での強制はしない）。

## Key Files
- 変更: `next.config.ts`（`output: "standalone"` 追加）, `Dockerfile`（volumeマウントに関するコメント追加）
- 新規: `.dockerignore`, `scripts/docker-run.sh`（Req 2.1: `data/` のvolumeマウントを含む起動手順をスクリプト化）

## Testing Approach
- `npm run build` がローカルで成功し、`.next/standalone/server.js` が生成されることを確認する。
- `docker build` でイメージが作成できることを確認する。
- `docker run -p 3000:3000 -e ANTHROPIC_API_KEY=<key> -v fx_ai_data:/app/data <image>` で起動し:
  - `http://localhost:3000` の画面表示、`/api/rate/usd-jpy` 等の既存APIが動くことを確認する
  - spec 006 で追加される `[collectRate]` のinfoログがコンテナログに出続けること
    （＝ `instrumentation.ts` の定期処理がstandalone環境でも動作していること）を確認する
  - コンテナを再作成（volumeは維持）した後もDBの内容が保持されていることを確認する
