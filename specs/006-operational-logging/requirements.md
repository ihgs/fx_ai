# 運用ログ強化（infoレベル） — Requirements

## Overview
現状、レート収集（`collectRate`）やAI分析（`runAnalysis`）は失敗時の `console.error` しか
出力しておらず、正常に動いているかを外形的に確認する手段が無い。運用開始初期は特に、
定期処理が想定通り動いているかをログで追えるようにしたい。infoレベルのログを追加し、
将来ログ量を絞りたくなった場合に備えて出力レベルを環境変数で制御できるようにする。

## User Stories

### 1. レート収集の状況をログで確認する
As an operator, I want info-level logs when rate collection succeeds, fails, or is skipped,
So that I can confirm the 1-minute collection job is actually running during initial rollout.

- 1.1 WHEN `collectRate()` がレート取得・DB保存に成功した THE SYSTEM SHALL infoレベルで
      symbol・bucketStart・取得したbid/askを含むログを出力する
- 1.2 IF `collectRate()` がレート取得またはDB保存に失敗した THEN THE SYSTEM SHALL
      既存通りerrorレベルでログを出力する（挙動は変更しない）
- 1.3 WHEN 週末休場によりレート収集がスキップされた（`instrumentation.ts` の判定） THE SYSTEM SHALL
      infoレベルでスキップした旨をログ出力する

### 2. AI分析の実行状況をログで確認する
As an operator, I want info-level logs for both manual and scheduled AI analysis runs,
So that I can verify the hourly scheduled analysis is actually executing.

- 2.1 WHEN `runAnalysis()` が正常に完了した THE SYSTEM SHALL infoレベルで
      trigger（manual/scheduled）・method・directionを含むログを出力する
- 2.2 IF `runAnalysis()` が失敗した THEN THE SYSTEM SHALL 既存通りerrorレベルでログを出力する
      （挙動は変更しない）
- 2.3 WHEN 定期分析が実行時間帯外（JST 7-22時外）または休場中でスキップされた THE SYSTEM SHALL
      infoレベルでスキップ理由をログ出力する

### 3. ログの出力レベルを設定で制御する
As an operator, I want to control the minimum log level via configuration,
So that I can reduce log noise later without code changes once the system is stable.

- 3.1 THE SYSTEM SHALL 環境変数 `LOG_LEVEL`（`"info" | "warn" | "error"`）で出力する
      ログの最小レベルを制御できる
- 3.2 IF `LOG_LEVEL` が未設定または不正な値 THEN THE SYSTEM SHALL デフォルトで `"info"` を使用する
      （運用開始初期はinfoを既定にしたいという要望に合わせる）
- 3.3 WHEN 設定された `LOG_LEVEL` より優先度の低いログ呼び出しが行われた THE SYSTEM SHALL
      そのログを出力しない（例: `LOG_LEVEL=warn` のとき info ログは出力されない）

## Out of Scope
- 外部ログ収集基盤（Datadog、CloudWatch等）への送信
- ログの構造化（JSON化）・ファイル永続化・ローテーション
- 既存のerrorログの文言・意味の変更（1.2, 2.2は現状維持の確認のみ）
- API Route Handler（`app/api/**`）内のリクエストログ（対象は定期処理・バックグラウンド処理のみ）
