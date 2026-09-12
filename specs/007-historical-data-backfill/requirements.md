# 過去データの取得・保存（バックフィル） — Requirements

## Overview
現在のレートデータはライブ収集（`collectRate`、1分毎）でしか蓄積されず、アプリ起動前や
サーバー停止中の期間は `rate_candles` に欠損が生じる。GMOコインの klines API から過去の
USD/JPY 1分足を取得し、`rate_candles` に `source: "backfill"` として保存できるようにする
（spec 002 の設計で想定済みの拡張ポイント）。

## User Stories

### 1. 指定期間の過去1分足を取得・保存する
As an operator, I want to backfill historical 1-minute USD/JPY candles for a date range,
So that rate history and AI analysis have real data even for periods before live collection
started or during past downtime.

- 1.1 WHEN バックフィル処理が開始日・終了日（日単位）を受け取った THE SYSTEM SHALL
      対象範囲の各日について GMOコイン klines API（`interval=1min`, `date=YYYYMMDD`）を呼び出し、
      返された1分足を `rate_candles` に `source: "backfill"` として保存する
- 1.2 WHEN 保存対象のレコードが既存レコード（同一 symbol/interval/bucket_start）と重複する THE SYSTEM SHALL
      既存レコードを上書きしない（`INSERT OR IGNORE`、spec 002 の重複無害化方針を踏襲）
- 1.3 IF 指定範囲に本日以降の日付が含まれる THEN THE SYSTEM SHALL 未来日をスキップする
      （取得できるのは確定した過去の取引日のみ）
- 1.4 IF ある日付について klines API がエラーまたは空データを返した THEN THE SYSTEM SHALL
      その日をスキップしてログに記録し、範囲全体の処理は継続する

### 2. バックフィルを手動で実行する
As an operator, I want to trigger the backfill on demand rather than automatically,
So that I control when historical data is fetched and avoid unnecessary upstream API calls
on every server start.

- 2.1 THE SYSTEM SHALL バックフィルを手動トリガー（CLIスクリプト）として提供し、
      `instrumentation.ts` の自動処理（`setInterval`）には組み込まない
- 2.2 WHEN バックフィル実行が完了した THE SYSTEM SHALL 処理結果のサマリー
      （成功日数・スキップ日数・挿入件数）を標準出力に表示する

## Out of Scope
- USD/JPY以外の通貨ペアへの対応
- 1分足以外の足（5分足・1時間足等）のバックフィル
- 管理画面・UIからのバックフィル実行トリガー（CLIのみ）
- 定期的な自動バックフィル（欠損の自動検知・自動補完）
- klines APIのレート制限・過去データ保持期間の仕様調査（実装時に実際のAPI挙動を確認しながら対応する）
