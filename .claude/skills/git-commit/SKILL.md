---
name: git-commit
description: Stage relevant changes and create a well-formed git commit for this repo, following the existing commit message style. Use when the user asks to commit changes (not push, not open a PR — those are separate skills).
---

# git-commit

このリポジトリで変更をコミットする。**push や PR 作成はしない**（それぞれ `git-push` / `git-pr` の役割）。

## 手順

1. 状況確認（並列実行可）:
   - `git status` — 未追跡ファイルも含めて確認（`-uall` は使わない）
   - `git diff` と `git diff --staged` — 未コミットの変更内容
   - `git log --oneline -10` — 既存のコミットメッセージのスタイルに合わせるため
2. コミット対象が無い（差分も未追跡ファイルも無い）場合は何もせずその旨を報告する。
3. どのファイルをステージするか判断する:
   - ユーザーが対象を指定していればそれに従う。指定が無ければ、直前の作業に関連する変更一式をステージする（無関係な変更を巻き込まない）。
   - `git add -A` や `git add .` は使わず、ファイルを明示して `git add` する。
   - `.env` や認証情報らしきファイルが含まれていないか確認する。ファイル名が無害でも中身に秘密情報が無いか一度目を通してから追加する。
4. ステージ後、`git status` で最終的に何がコミットされるか確認する。
5. コミットメッセージを作成する:
   - 「何を」ではなく「なぜ」に焦点を当てた1〜2文程度の簡潔な本文。
   - 既存のログのスタイル（言語・体裁）に合わせる。
   - このセッションの system reminder が commit メッセージの attribution 行を指定している場合はそれをメッセージ末尾に付ける（内容はセッションごとに変わりうるため、都度その指示に従う。指定が無ければ何も付けない）。
   - 必ずヒアドキュメント経由で `git commit -m "$(cat <<'EOF' ... EOF)"` の形式で渡す。
6. コミット後 `git status` で成功を確認する。
7. pre-commit hook 等で失敗した場合は原因を直し、再度ステージしてから**新しいコミット**を作る（`--amend` や `--no-verify` は使わない）。

## してはいけないこと
- `git push` や `gh pr create` の実行（別スキルの担当）
- `--amend`（ユーザーが明示的に amend を指示した場合を除く）
- `-uall` での `git status`、`git add -A` / `git add .`
- ユーザーから明示的に依頼されていない限りコミットしない
