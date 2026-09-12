---
name: spec-new
description: Start a new feature spec for this Next.js app — drafts requirements.md, design.md, and tasks.md under specs/<slug>/, pausing for approval between phases. Use when starting a new feature, page, or API route before writing any code.
---

# spec-new

軽量スペック駆動開発の起点。1機能につき `specs/<番号>-<スラッグ>/` 配下に
`requirements.md` → `design.md` → `tasks.md` の順で作成する。各フェーズの後で
ユーザーの承認を得てから次に進む（後戻りのコストが跳ね上がる前に方向性を確認するのが目的）。

引数 (`args`) には機能名・簡単な説明が渡される想定。情報が薄い場合のみ、スコープが
変わるような核心的な質問を1〜2個に絞って聞く（枝葉の質問はせず妥当なデフォルトで進める）。

## 手順

### 0. 事前準備
- `specs/` 配下を確認し、既存ディレクトリの最大番号+1をゼロ埋め3桁で採番する（例: `specs/002-usd-jpy-chart/`）。スラッグは機能名を kebab-case にしたもの。
- `package.json` / `tsconfig.json` / `app` ディレクトリの有無を確認し、実際のプロジェクト構成（App Router か Pages Router か、TypeScript 設定、既存の API route の書き方など）に合わせる。存在しない場合はこれから作る前提で Next.js App Router + TypeScript を既定とする。

### 1. requirements.md を作成
- `specs/<slug>/requirements.md` に以下の構成で書く:
  - `## Overview`: 機能の目的を2〜3文で。
  - `## User Stories`: 各ストーリーを「As a ... / I want ... / So that ...」で書き、直下に EARS 風の受け入れ基準を箇条書き（例: `- WHEN <条件> THE SYSTEM SHALL <振る舞い>`, `- IF <異常系> THEN THE SYSTEM SHALL <振る舞い>`）。各基準に `1.1`, `1.2` のようなIDを振る。
  - `## Out of Scope`: 今回やらないことを明記（スコープの曖昧さを潰す）。
- 書いたら要点を短く要約してユーザーに提示し、承認 or 修正指示を待つ。**ここで止まる。**

### 2. design.md を作成（requirements 承認後）
- `specs/<slug>/design.md`:
  - `## Architecture`: どこに何を置くか（例: `app/api/.../route.ts` の Route Handler、Server/Client Component の分担）。
  - `## Data Model / Types`: 必要な型・スキーマ。
  - `## API Contract`: エンドポイント、リクエスト/レスポンス形状（既存の `sample/route.ts` のような fetch → NextResponse.json パターンがあれば踏襲）。
  - `## UI Components (Storybook)`: 画面表示を伴う機能の場合のみ記載。追加/変更する UI コンポーネントごとに、Story として再現すべき状態（Props/データのバリエーション、ローディング・エラー・空状態など）を列挙する。API-only の機能はこのセクションごと省略してよい。
  - `## Key Files`: 追加・変更するファイルの一覧。
  - `## Error Handling / Edge Cases`
  - `## Testing Approach`: 何をどう検証するか（プロジェクトに既存のテスト基盤があればそれに合わせる、無ければ最低限 `tsc --noEmit` / `next build` レベル）。UI コンポーネントを含む場合は「Storybook story で状態を再現し `ui-check` で目視確認する」ことをここに明記する。
- プロジェクトに Storybook が未導入（`.storybook/` が無い）かつ `UI Components` セクションがある場合、その旨をユーザーに伝え、`tasks.md` の最初のタスクとして Storybook セットアップを入れる前提で進める。
- 要約を提示し、承認を待つ。**ここで止まる。**

### 3. tasks.md を作成（design 承認後）
- `specs/<slug>/tasks.md`: 実装可能な粒度のチェックリスト。各タスクは以下の形式:
  ```
  - [ ] 1. <やること>（Req: 1.1, 1.2 / Design: API Contract）
  ```
- タスクは縦切り（1タスク=1コミット相当で動作確認できる単位）にし、依存順に並べる。
- UI コンポーネントを追加/変更するタスクには、対応する `*.stories.tsx` の作成・更新も同タスクに含める（story を後回しにしない）。
- Storybook が未導入で `UI Components` セクションがある場合、`- [ ] 0. Storybook をセットアップする（npx storybook@latest init）` を最初のタスクとして入れる。
- 完了したら作成した3ファイルのパスを提示し、次は `/spec-implement <slug>` で実装を進める旨を伝える。

## 注意
- ドキュメントは軽量に保つ。1セクションが長文になりそうなら要点だけに絞る。
- requirements/design が薄すぎて実装判断ができないと後で気づいた場合は、実装側 (`spec-implement`) から差し戻して良い。
