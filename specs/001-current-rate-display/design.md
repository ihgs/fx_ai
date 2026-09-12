# 現在レート表示 — Design

## Tech Stack Versions
2026-09時点の最新安定版を採用する（以降のspecでも特に理由が無ければこのバージョン系列を踏襲する）。

| ライブラリ | バージョン | 備考 |
|---|---|---|
| Next.js | `16.x`（scaffold時点の最新パッチ、目安 `16.3.4`） | App Router, TypeScript。Active LTS。 |
| Tailwind CSS | `4.x`（目安 `4.3.3`） | v4系。`create-next-app` の Tailwind オプションでセットアップ。 |
| Storybook | `10.x`（目安 `10.6.0`） | フレームワークは **`@storybook/nextjs-vite`** を使う（Webpack版 `@storybook/nextjs` はNext.js 16との組み合わせで既知の不具合報告があるため避ける）。`@storybook/*` パッケージは全て同一バージョンに揃える。 |

## Architecture
- Next.js（App Router + TypeScript, v16系）を新規 scaffold する。
- スタイリングは Tailwind CSS v4系を使用する（`create-next-app` の Tailwind オプションでセットアップ）。
- `app/page.tsx` — Client Component。現在レート表示画面（今回は1画面のみ。spec 003 でスワイプ導線に組み込む前提の作り）。
- `app/api/rate/usd-jpy/route.ts` — `sample/route.ts` のパターンを踏襲した Route Handler（外部API `forex-api.coin.z.com` を叩く）。
- `components/RateCard.tsx` — レート表示のプレゼンテーション用コンポーネント。ローディング/エラー/成功の状態、縦向き/横向きのレイアウトを Tailwind の `portrait:` / `landscape:` バリアントで出し分ける（JSでの向き判定は行わずCSSのみで切り替える）。

## Data Model / Types
```ts
type UsdJpyRate = {
  symbol: "USD_JPY";
  bid: number;
  ask: number;
  timestamp: string; // 取得元APIのtimestamp
};
```

## API Contract
- `GET /api/rate/usd-jpy`
  - 200: `UsdJpyRate`
  - 502: `{ error: string }`（上流API失敗時）

## UI Components (Storybook)
- `RateCard`: 以下の状態を story で再現する
  - `loading`
  - `loaded`（縦向きレイアウト）
  - `loaded`（横向きレイアウト）
  - `error`

## Key Files
- `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`（Tailwind ディレクティブ）（scaffold）
- `app/layout.tsx`, `app/page.tsx`
- `app/api/rate/usd-jpy/route.ts`
- `components/RateCard.tsx`, `components/RateCard.stories.tsx`

## Error Handling / Edge Cases
- 上流APIが `status != 0`（サンプルの `5` 等）を返した場合はエラー扱いにして 502 を返す。
- クライアント側で fetch 失敗・非200レスポンスの場合はエラー状態を表示し、リトライ導線（更新ボタン）を出す。

## Testing Approach
- `tsc --noEmit` / `next build`
- `RateCard` は Storybook story で縦横・各状態を再現し、`ui-check` で目視確認する。
- 向き切替（Req 2.2〜2.4）は Tailwind の `portrait:` / `landscape:` バリアントによる CSS のみで実装し、レート情報は React state を保持したまま切り替わることを確認する（再フェッチしないこと）。
