# 現在レートの自動更新 — Tasks

- [x] 1. `components/CurrentRateScreen.tsx` に `nextStateAfterPoll(current, polled)` を実装する（Design: Data Model / Types）
- [x] 2. `components/CurrentRateScreen.test.ts` を作成し、`nextStateAfterPoll()` を「loaded→loaded」「loaded→error」「error→loaded」のケースでテストする（Design: Testing Approach）
- [x] 3. `CurrentRateScreen` に60秒間隔のポーリング（`setInterval` + `nextStateAfterPoll`によるsetState）と、`visibilitychange`による一時停止・即時再取得・再開、アンマウント時のクリーンアップを実装する（Req: 1.1, 1.2, 1.3, 1.4 / Design: Architecture, Error Handling）
- [x] 4. `npx tsc --noEmit` / `npx eslint .` / `npm test` を実行して確認する（すべてパス）。`npm run dev`＋Playwrightでの実機確認を試みたが、このサンドボックス環境にheadless Chromium実行に必要なOSライブラリ（`libatk-1.0.so.0`等）が無く自動化検証は断念。ロジックはコードレビューと単体テストで確認済み（Design: Testing Approach）
