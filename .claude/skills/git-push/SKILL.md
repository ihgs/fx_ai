---
name: git-push
description: Push the current branch to origin (setting upstream if needed). Use when the user asks to push commits. Never force-pushes unless explicitly requested.
---

# git-push

現在のブランチを `origin` に push する。コミット作成は `git-commit`、PR作成は `git-pr` の担当なのでここではやらない。

## 手順

1. `git status` で未コミットの変更が無いか確認する。あればユーザーに伝え、`git-commit` を先に使うか聞く（勝手にコミットしない）。
2. `git branch --show-current` で現在のブランチを確認する。
3. `git log @{u}.. 2>&1` 等でリモート追跡ブランチの有無とローカルが何コミット先行しているかを確認する。追跡ブランチが無ければ新規ブランチとして扱う。
4. push 内容を簡潔に提示する（ブランチ名、push されるコミット一覧）。
5. push を実行する:
   - 追跡ブランチが既にある場合: `git push`
   - 新規ブランチの場合: `git push -u origin <branch>`
6. push 後、結果（成功したか、リモートにどのブランチができたか）を報告する。PR がまだ無ければ `git-pr` の利用を提案する。

## してはいけないこと
- `git push --force` / `--force-with-lease`（ユーザーが明示的に force push を依頼した場合を除く。依頼された場合でも、共有ブランチ（`main`/`master` 等）への force push は一度警告してから進める）
- 現在のブランチが `main` / `master` の場合、そのまま直接 push して良いか一度確認する（他の作業者と衝突しうるため）
- コミットされていない変更を巻き込んでの push（そもそも push はコミット済みの内容のみ）
