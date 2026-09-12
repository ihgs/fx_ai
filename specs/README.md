# specs/

このディレクトリは軽量スペック駆動開発の仕様書置き場です。1機能につき1ディレクトリ:

```
specs/
  001-feature-slug/
    requirements.md   # ユーザーストーリー + EARS風の受け入れ基準
    design.md          # アーキテクチャ・データモデル・API contract
    tasks.md            # 実装チェックリスト（受け入れ基準/設計セクションを参照）
```

## ワークフロー

1. `/spec-new <機能名>` — requirements → design → tasks を順に作成（各フェーズ後に承認待ち）
2. `/spec-implement <slug>` — tasks.md を上から順に実装・検証・チェックオフ
3. `/spec-review <slug>` — requirements.md の受け入れ基準に対する実装の適合を読み取り専用でレビュー

詳細は `.claude/skills/spec-new/`, `.claude/skills/spec-implement/`, `.claude/skills/spec-review/` の各 `SKILL.md` を参照。
