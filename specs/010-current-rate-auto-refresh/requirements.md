# 現在レートの自動更新 — Requirements

## Overview
`CurrentRateScreen`（`RateCard`）は現状、画面マウント時に1回`/api/rate/usd-jpy`を取得するだけで、以降はユーザーが手動更新ボタンを押さない限り表示が更新されない。画面を開いている間は自動的に最新レートへ更新されるようにし、手間なく最新の相場を見られるようにする。

## User Stories

### 1. 自動更新
As a ユーザー, I want 現在レート画面を開いている間、自動的に最新のレートに更新されてほしい, So that 手動で更新ボタンを押さなくても最新の相場を把握できる。

- 1.1 WHEN `CurrentRateScreen`が表示されている間 THE SYSTEM SHALL 一定間隔（既定60秒。バックエンドのレート収集間隔に合わせる）で`/api/rate/usd-jpy`を再取得し、表示を最新化する。
- 1.2 WHEN 自動更新の取得が失敗した THEN THE SYSTEM SHALL 直前に表示されていたレートの表示をそのまま維持し、エラー画面には遷移しない（初回ロード時の失敗表示・手動更新ボタンの挙動は既存のまま変更しない）。
- 1.3 WHEN ユーザーが`CurrentRateScreen`から離れる（アンマウントされる） THE SYSTEM SHALL 定期更新のタイマーを停止する。
- 1.4 WHEN ブラウザタブが非表示（バックグラウンド）になった THEN THE SYSTEM SHALL 自動更新を一時停止し、再度前面に戻った時点で直ちに1回取得してから定期更新を再開する（`/api/rate/usd-jpy`は外部APIを都度呼び出す実装のため、無駄な呼び出しを避ける）。

## Out of Scope
- サーバー側でのキャッシュ・レート制限・呼び出し頻度の抑制（本specはフロント側の取得タイミングのみを扱う）
- ポーリング間隔をユーザーが変更できるUI
- WebSocket/SSEなどプッシュ型の更新方式への変更
- `RateChart`（履歴グラフ）や`AnalysisScreen`の自動更新（対象は`CurrentRateScreen`/`RateCard`のみ）
