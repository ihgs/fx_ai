# 画面スワイプによる切り替え — Tasks

- [ ] 1. `components/CurrentRateScreen.tsx` を作成し、`app/page.tsx` の中身（`RateCard`+fetchロジック）を移設する（外側の`<main>`ラッパーは外す）（Design: Architecture, Key Files）
- [ ] 2. `components/ChartScreen.tsx` を作成し、`app/chart/page.tsx` の中身（期間セレクター+`RateChart`+fetchロジック）を移設する（Design: Architecture, Key Files）
- [ ] 3. `components/AnalysisPlaceholder.tsx` を実装する（「準備中」の静的表示、ダークテーマを踏襲）（Req: 1.3）
- [ ] 4. `components/SwipeIndicator.tsx` を実装し、3ドット中0/1/2番目がアクティブの3状態の story を作成する（Req: 1.2, 2.1 / Design: UI Components）
- [ ] 5. `components/SwipeContainer.tsx` を実装する（`scroll-snap`コンテナ、`onScroll`からインデックス算出、`SwipeIndicator`のタップで対象スライドへ`scrollTo`）（Req: 1.1, 2.1 / Design: Architecture, Error Handling）
- [ ] 6. `app/page.tsx` を書き換えて `SwipeContainer` に3画面（現在値→チャート→分析プレースホルダー）を組み込み、`app/chart/page.tsx` を削除する（Req: 1.1, 1.3 / Design: Architecture, Key Files）
- [ ] 7. `next dev` を起動し、実際のスワイプ／インジケータータップでの画面切り替え、およびチャートの選択期間がスワイプ後も保持される（再フェッチされない）ことを手動確認する（Req: 1.4 / Design: Testing Approach）
