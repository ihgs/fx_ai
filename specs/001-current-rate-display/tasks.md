# 現在レート表示 — Tasks

- [x] 1. Next.js アプリの初期セットアップ（Next.js 16.x, TypeScript, Tailwind CSS 4.x で `create-next-app`）（Design: Tech Stack Versions, Architecture）
- [x] 2. Storybook のセットアップ（Storybook 10.x, フレームワークは `@storybook/nextjs-vite`）（Design: Tech Stack Versions）
- [x] 3. `GET /api/rate/usd-jpy` Route Handler を実装する（Req: 1.1, 1.2 / Design: API Contract, Error Handling）
- [x] 4. `RateCard` コンポーネントを実装し、`loading` / `loaded`（縦向き） / `loaded`（横向き） / `error` の4状態の story を作成する（Req: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3 / Design: UI Components, Architecture）
- [x] 5. トップページ (`app/page.tsx`) に `RateCard` を組み込み、`/api/rate/usd-jpy` から取得したデータをローディング/成功/エラー状態に応じて表示する（Req: 1.1, 1.2, 1.3, 1.4）
- [x] 6. 手動更新ボタンを実装し、押下でレートを再取得する（Req: 3.1）
- [x] 7. 縦向き/横向きレイアウトを Tailwind の `portrait:` / `landscape:` バリアントで実装し、向き変化時にレート情報の state が保持される（再フェッチしない）ことを確認する（Req: 2.2, 2.3, 2.4 / Design: Testing Approach）
