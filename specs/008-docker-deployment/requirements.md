# 運用のためのDockerfile — Requirements

## Overview
現状、アプリは devcontainer 上でしか動かせる状態が確認されていない。本番相当の環境に
デプロイできるよう、Next.js アプリをビルド・起動する Dockerfile を用意する。SQLite の
データファイルは揮発させず、シークレットはビルド時に埋め込まない構成にする。

## User Stories

### 1. コンテナイメージとしてアプリをビルド・起動する
As an operator, I want a production Dockerfile that builds and serves this Next.js app,
So that I can deploy the app consistently outside the devcontainer.

- 1.1 WHEN `docker build` を実行した THE SYSTEM SHALL `next build` による本番ビルドを含む
      イメージを生成する
- 1.2 WHEN コンテナを起動した THE SYSTEM SHALL 本番サーバーを起動する
      （`output: "standalone"` 構成の場合は `next start` ではなく `node server.js` になる。
      design.mdで確定した技術的制約のため文言を修正）
- 1.3 THE SYSTEM SHALL マルチステージビルドを用い、最終イメージに devDependencies や
      ビルド専用ファイルを含めない

### 2. DBデータをコンテナ再作成後も維持する
As an operator, I want the SQLite database file to persist across container restarts,
So that collected rate history and analysis results are not lost when the container is
recreated or redeployed.

- 2.1 THE SYSTEM SHALL `data/` ディレクトリを Docker volume としてマウントできる構成にする
      （Dockerfile中のコメント、または簡単な起動手順の記載で明示する）
- 2.2 WHEN コンテナがマイグレーション未適用のDBファイル（または空の`data/`）で起動した THE SYSTEM SHALL
      既存の起動時初期化処理（`instrumentation.ts` の `initDb()`）によってスキーマが作成される
      （コード変更不要、Dockerfile側で妨げないことを確認する）

### 3. シークレットを実行時に注入する
As an operator, I want to pass secrets like `ANTHROPIC_API_KEY` as runtime environment
variables, So that credentials are never baked into the built image.

- 3.1 THE SYSTEM SHALL `ANTHROPIC_API_KEY` 等の秘密情報をビルド引数(ARG)ではなく、
      コンテナ起動時の環境変数(`docker run -e` 等)として受け取れるようにする
- 3.2 IF `.env` 等の秘密情報を含みうるファイルが存在する THEN THE SYSTEM SHALL
      `.dockerignore` でビルドコンテキストから除外する

## Out of Scope
- docker-compose.yml の作成（必要になれば別途）
- Kubernetes マニフェスト、CI/CDでのイメージpush・レジストリ運用
- マルチアーキテクチャ（arm64/amd64）ビルド対応
- HTTPS終端・リバースプロキシ（nginx等）の設定
- 必須環境変数の未設定検知（アプリ側の既存エラーハンドリングに委ねる）
