---
name: spec-review
description: Verify implemented code against a feature's spec (requirements.md acceptance criteria and design.md) to confirm it was built to spec — read-only, distinct from /code-review's bug-hunting. Use after spec-implement finishes a feature's tasks, before considering the feature done.
---

# spec-review

「仕様通りに作られているか」を確認する読み取り専用のレビュー。バグ探しは `/code-review` の役割であり、
このスキルは requirements/design との整合性チェックに専念する。**コードは変更しない**（直すべき点が
見つかったら報告し、修正は `/spec-implement` に差し戻す）。

引数 (`args`) には対象スペックのスラッグ/番号が渡される想定。

## 手順

### 0. 対象の特定
- `spec-implement` と同様の方法でスペックを特定する（引数 → 単一候補 → 会話文脈 → ユーザーに確認の順）。
- `requirements.md` / `design.md` / `tasks.md` を全文読む。

### 1. 実装コードの確認
- リポジトリが git 管理下であれば、そのスペックのタスク着手以降の差分（該当ファイル群）を確認する。無ければ `design.md` の `Key Files` に挙がっているファイルを直接読む。

### 2. 受け入れ基準の判定
- `requirements.md` の各受け入れ基準ID（例: 1.1, 1.2）について、実装コード・挙動を照らして次のいずれかを判定する:
  - **Pass**: 満たしていることをコードから確認できる（`file:line` を添える）
  - **Fail**: 満たしていない、または矛盾する実装になっている
  - **Unverifiable**: 静的な確認だけでは判断できない（実ブラウザ動作確認や外部API疎通が必要等）— その場合は必要な確認手段を明記する
- `design.md` との乖離（設計から意図的/非意図的に外れた実装）があれば別途指摘する。意図的な改善であっても、設計書を更新せず黙って乖離させない。

### 3. タスク完了状況の確認
- `tasks.md` の全項目がチェック済みか確認する。チェック済みだが実際には未実装/不完全なものがあれば指摘する。

### 4. 報告
- Pass/Fail/Unverifiable を基準IDごとに一覧化し、Fail・Unverifiable があればその理由と次のアクション（`spec-implement` への差し戻し、または手動確認手順）を明記する。
- 全て Pass かつタスク完了済みであれば、その旨を簡潔に報告して完了とする。
