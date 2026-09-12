---
name: ui-check
description: Visually verify UI components against a spec's design.md by running Storybook and reviewing the relevant stories in a browser. Read-only — use after implementing UI tasks (spec-implement) and before spec-review, or any time you want to eyeball a component's states.
---

# ui-check

Storybook を使って UI コンポーネントを実際に目視確認する。**コードは変更しない**（見つかった問題は
`spec-implement` に差し戻す）。lint/build レベルの機械的検証は `spec-implement` の担当、こちらは
「見た目・レイアウト・状態表現が design.md 通りか」を人の目の代わりに確認する。

引数 (`args`) には対象スペックのスラッグ/番号やコンポーネント名が渡される想定。

## 手順

### 0. 前提確認
- `.storybook/` ディレクトリと `package.json` の `storybook` 系依存の有無を確認する。無ければ、まず `spec-implement` で Storybook セットアップタスクを完了させるようユーザーに伝えて止まる（このスキルではセットアップしない）。
- 対象スペックを特定し（`spec-implement` と同様: 引数 → 単一候補 → 会話文脈 → ユーザーに確認）、`design.md` の `UI Components (Storybook)` セクションを読む。対象コンポーネントの story ファイル (`*.stories.tsx`) が存在するか確認する。

### 1. Storybook を起動
- `package.json` の `scripts` から Storybook 起動コマンドを確認する（例: `npm run storybook`）。
- `run_in_background` でバックグラウンド起動し、ローカルURL（通常 `http://localhost:6006`）が応答するまで待つ。

### 2. 目視確認
- ブラウザ操作が可能であれば（`claude-in-chrome` スキル等）、design.md に列挙した各状態の story を開き、レイアウト崩れ・欠落表示・意図しない見た目になっていないかを確認する。
- ブラウザ操作の手段が無い場合は、Storybook の URL をユーザーに提示し、確認してほしい state のリストを示して手動確認を依頼する。

### 3. 報告
- コンポーネント・状態ごとに OK / 要修正（理由と場所）を一覧化する。design.md に無い抜け漏れの状態に気づいた場合も指摘する。
- 全て OK であれば `spec-review` に進めて良い旨を伝える。要修正があれば `spec-implement` への差し戻しを提案する。

### 4. 後片付け
- 確認が終わったら起動した Storybook のバックグラウンドプロセスを停止する。

## してはいけないこと
- コンポーネントやコードの修正（見つけた問題は報告のみ、直すのは `spec-implement`）
- Storybook 自体のセットアップ（前提が無ければ止まる。セットアップは `spec-implement` のタスク）
