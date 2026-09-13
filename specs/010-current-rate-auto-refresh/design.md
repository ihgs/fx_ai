# 現在レートの自動更新 — Design

## Architecture
- `components/CurrentRateScreen.tsx` のみを変更する。`RateCard`（プレゼンテーション層）・`app/api/rate/usd-jpy/route.ts`は変更しない。
- マウント時の`useEffect`内で、既存の初回`loadRate()`呼び出しに加えて以下を行う:
  1. `setInterval`で60秒ごとに`loadRate()`を呼び、結果が`status === "loaded"`の場合のみ`setState`する（Req 1.1, 1.2）。取得失敗時は`setState`せず直前の表示を維持する。
  2. `document.visibilitychange`イベントを監視し、タブが非表示になったら`clearInterval`、前面に戻ったら即座に`loadRate()`を1回実行してから`setInterval`を再開する（Req 1.4）。
  3. クリーンアップ関数で`clearInterval`とイベントリスナー解除を行う（Req 1.3）。
- 判定ロジック（「取得成功時のみ状態を差し替える」）は`nextStateAfterPoll(current, polled)`という純粋関数として切り出し、単体テスト可能にする。

## Data Model / Types
新規の型は無し。既存の`RateCardProps`（`components/RateCard.tsx`）をそのまま使う。

```ts
function nextStateAfterPoll(current: RateCardProps, polled: RateCardProps): RateCardProps {
  return polled.status === "loaded" ? polled : current;
}
```

## Key Files
- `components/CurrentRateScreen.tsx`: ポーリング・可視性監視ロジックを追加。
- `components/CurrentRateScreen.test.ts`（新規）: `nextStateAfterPoll()`の単体テスト。

## UI Components (Storybook)
変更なし。`RateCard`自体のprops・見た目は変わらず、既存のstoryでカバー済みのため新規storyは不要（spec 004の`AnalysisScreen`と同様、`CurrentRateScreen`自体にstoryは作らない）。

## Error Handling / Edge Cases
- 自動ポーリング中の取得失敗（502・ネットワークエラー等）は無視して直前の表示を維持する。エラーをユーザーに通知しない（Req 1.2）。連続失敗してもエラー表示への遷移や特別なリトライ処理は行わない（次回のポーリングタイミングで再試行されるのみ）。
- 初回マウント時の取得失敗は既存どおり`error`状態を表示する（変更なし）。
- タブ非表示中はポーリングを止めるため、その間は表示が古くなり得る（意図した挙動。Req 1.4）。
- アンマウント時にタイマー・イベントリスナーが残らないようにする（`cancelled`フラグと`clearInterval`/`removeEventListener`を既存の`cancelled`パターンに揃えて実装）。

## Testing Approach
- `npx tsc --noEmit` / `npx eslint .`
- `components/CurrentRateScreen.test.ts`で`nextStateAfterPoll()`をテストする（`loaded`→`loaded`で置き換わる、`loaded`→`error`で現状維持、`error`→`loaded`で置き換わる）。
- タイマー・可視性イベントの結線自体はブラウザ動作に依存するため自動テストはせず、`npm run dev`で実機確認する: DevToolsのNetworkタブで60秒おきに`/api/rate/usd-jpy`が呼ばれること、タブを非表示にすると呼ばれなくなり、前面に戻すと即座に1回呼ばれ再開することを確認する。
