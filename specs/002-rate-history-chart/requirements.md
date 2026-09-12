# レート履歴のDB保存とチャート表示 — Requirements

## Overview
USD/JPY レートを定期的に取得して DB に蓄積し、その履歴をチャートで表示する。
spec 001 の現在レート表示とは別画面（チャート画面）として提供する。

## User Stories

### 1. レート履歴の保存
As a システム, I want to 定期的に USD/JPY レートを取得して DB に保存する, So that 後からチャートや分析に使える履歴データが蓄積される。

- 1.1 WHEN 定期実行のタイミングが来た THE SYSTEM SHALL USD/JPY の現在レートを取得し DB に保存する。
- 1.2 IF レート取得または保存に失敗した THEN THE SYSTEM SHALL エラーを記録し、次回の定期実行に影響を与えない（1回の失敗でスケジュール自体を止めない）。
- 1.3 IF 直近の保存済みレコードと近接した時間帯に重複して保存されそうになった THEN THE SYSTEM SHALL 重複保存を避ける。

### 2. チャート表示
As a ユーザー, I want to 過去のレート推移をチャートで見る, So that 相場の動きを把握できる。

- 2.1 WHEN ユーザーがチャート画面を開いた THE SYSTEM SHALL 保存済みのレート履歴を時系列チャートで表示する。
- 2.2 WHEN ユーザーが期間（例: 1日/1週間/1ヶ月）を選択した THE SYSTEM SHALL 選択した期間のデータでチャートを再描画する。
- 2.3 IF 選択期間内にデータが無い THEN THE SYSTEM SHALL データが無い旨を表示する（空のグラフを黙って出さない）。
- 2.4 WHEN チャート画面をスマートフォンで表示する THE SYSTEM SHALL 縦向き・横向きそれぞれに最適化されたレイアウトで描画する。

## Out of Scope
- AI 分析・正答率（→ spec 004, 005）
- スワイプでの画面切り替えそのもの（→ spec 003）
- 過去データの一括インポート（`sample/get_usd_jp.py` 相当のヒストリカルデータ取り込み）。本specは定期収集による蓄積のみ。必要になれば別途スペック化する。
- 定期実行の具体的な実装方式（cron / Vercel Cron / Edge Function 等）の選定は design.md で決定する。
