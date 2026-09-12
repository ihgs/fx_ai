---
name: git-pr
description: Open a GitHub pull request for the current branch using the gh CLI (pushing first if needed). Use when the user asks to create/open a PR.
---

# git-pr

現在のブランチの内容で GitHub PR を作成する（`gh pr create` を使用）。

## 手順

0. 前提確認:
   - `gh auth status` で認証済みか確認する。未認証なら自分でログインしようとせず、ユーザーに `gh auth login` の実行を依頼して止まる（対話的な認証が必要なため）。
   - 現在のブランチがリポジトリのデフォルトブランチ（`main`/`master` 等）と同じ場合、そのブランチ自身への PR は作れないため、作業用ブランチを切るようユーザーに確認する。

1. 状況把握（並列実行可）:
   - `git status` — 未コミットの変更が無いか（あれば `git-commit` を先に使うよう促す）
   - リモート追跡ブランチが push 済みか確認し、未 push なら `git-push` と同じ要領で push する
   - `git log <base>..HEAD --oneline` と `git diff <base>...HEAD` — base ブランチから分岐して以降の全コミット・全差分を確認する（最新コミットだけでなく含まれる全コミットを見る）
   - base ブランチは `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` 等で確認する

2. PR のタイトルと本文を作成する:
   - タイトルは70文字以内で簡潔に
   - 本文は `## Summary`（変更点の要点を箇条書き）と `## Test plan`（確認済み/確認すべき項目のチェックリスト）を含める
   - このセッションの system reminder が PR 本文の attribution 行を指定している場合は本文末尾に付ける（内容はセッションごとに変わりうるため都度その指示に従う。指定が無ければ付けない）

3. `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"` の形式で作成する（base ブランチや draft 指定が必要なら `--base` / `--draft` を付ける。ユーザーが draft を希望していれば `--draft` を使う）。

4. 作成された PR の URL を報告する。

## してはいけないこと
- `gh auth login` の代行実行（対話操作が必要なため、依頼するに留める）
- デフォルトブランチから自分自身への PR 作成の強行
- 最新コミットのみを見て本文を書くこと（分岐以降の全コミットを踏まえる）
