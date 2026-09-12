---
name: spec-implement
description: Implement tasks from an existing spec (specs/<slug>/tasks.md) for this Next.js app, one task or all remaining tasks at a time, checking off completed items and verifying with lint/typecheck/build. Use when picking up implementation work for a feature that already has a spec.
---

# spec-implement

`spec-new` で作った仕様 (`requirements.md` / `design.md` / `tasks.md`) を実装に落とし込む。

引数 (`args`) にはスラッグ・番号・タスク番号などが自由形式で渡される想定（例: `002`, `002-usd-jpy-chart 3`, 何も無しなど）。

## 手順

### 0. 対象スペックの特定
- 引数でスラッグ/番号が示されていればそれを使う。無ければ `specs/` 配下を確認し、1つしか無ければそれを使う。複数あって会話の文脈からも特定できない場合はユーザーに確認する。
- `requirements.md` / `design.md` / `tasks.md` を全て読む（実装前に必ず全文を読む。前フェーズの決定を無視した実装を避けるため）。

### 1. やるタスクの決定
- 引数でタスク番号が指定されていればそのタスクだけ実施。
- 指定が無ければ `tasks.md` の最初の未チェック (`- [ ]`) タスクから順に実施する。未完了タスクを飛ばして先のタスクに進まない（依存関係が壊れるため）。ユーザーが「まとめて」「全部」等と言えば残り全タスクを順に実施する。

### 2. 実装
- `design.md` の決定（アーキテクチャ、API contract、ファイル配置）に従う。
- 既存コードの実際の書き方（`package.json` の依存、既存の Route Handler や Component の書き方、lint/format 設定）を確認し、それに合わせる。設計に書かれていない細部は既存の慣習を優先する。
- 差分はそのタスクの範囲に留める（他タスクの先取り実装やついでのリファクタはしない）。
- **UI コンポーネントを実装/変更するタスクの場合**、design.md の `UI Components (Storybook)` セクションに挙げた状態を再現する `*.stories.tsx` を同じタスク内で作成・更新する（後回しにしない）。Storybook 未セットアップのタスクが先にある場合はそれを先に完了させる。

### 3. 検証
- `package.json` の `scripts` を確認し、該当する範囲で lint / typecheck / build を実行する（例: `npm run lint`, `npx tsc --noEmit`, `npm run build`）。テスト基盤があれば関連テストも実行する。
- UI コンポーネントを含むタスクでは、追加で Storybook のビルドが通ることを確認する（`npm run build-storybook` など、`package.json` の scripts に合わせる）。実際の見た目を目視確認したい場合は `ui-check` スキルを使う。
- 検証が通らないタスクはチェックを付けない。

### 4. 完了処理
- 検証OKなら `tasks.md` の該当行を `- [x]` にする。
- 実装中に requirements/design との矛盾や抜け（スコープ変更が必要なレベルのもの）を見つけたら、黙って独自判断で進めず一度止めてユーザーに報告する。軽微な曖昧さの解消（変数名、細かいエラーメッセージ文言など）はその場で妥当な判断をして進めて良い。

### 5. 報告
- 実施したタスク番号・変更したファイル・実行した検証コマンドの結果・残タスク数を簡潔に報告する。
- 全タスク完了時は `/spec-review <slug>` での確認を提案する。
