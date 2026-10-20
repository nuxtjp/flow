# @nuxtjp/flow

[English](README.md)

[Vue Flow](https://vueflow.dev/) を Nuxt に組み込むための小さなモジュールです。
グラフだけをクライアントで描画し、ページのほかの部分では Nuxt の SSR と
静的生成を利用できます。

コミュニティが保守する統合モジュールです。Nuxt の公式モジュールではなく、
Nuxt および Vue Flow のチームによる承認・推奨を示すものではありません。

## インストール

Nuxt アプリに公開済みのモジュールを追加します。

```sh
npm install @nuxtjp/flow
```

対応する Node・Nuxt・Vue の範囲と Vue Flow の依存設定は
[package.json](package.json) を参照してください。CI は宣言した互換範囲を検証し、
Nuxt 3/4 のすべての版への対応を保証するものではありません。
アプリ側の lockfile と Dependabot の方針に沿って依存を更新してください。

開発用のローカルアーカイブは `npm ci`、`npm run dev:prepare`、
`npm run check`、`npm pack` で作成できます。正式な公開版は
[npm](https://www.npmjs.com/package/@nuxtjp/flow) で確認できます。

## クイックスタート

`nuxt.config.ts` にモジュールを登録します。

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjp/flow'],
  flow: {
    css: true,
    defaultTheme: true,
    components: true,
  },
})
```

高さを明示したコンテナ内にグラフを配置します。

```vue
<script setup lang="ts">
import type { Edge, Node } from '@nuxtjp/flow/runtime'

type GraphNode = Node<{ label: string }, Record<never, never>>

const nodes = ref<GraphNode[]>([
  { id: 'start', position: { x: 60, y: 60 }, data: { label: '開始' } },
  { id: 'next', position: { x: 260, y: 160 }, data: { label: '次へ' } },
])
const edges = ref<Edge<Record<never, never>, Record<never, never>>[]>([
  { id: 'start-next', source: 'start', target: 'next' },
])
</script>

<template>
  <section style="height: 480px">
    <NuxtFlow v-model:nodes="nodes" v-model:edges="edges">
      <template #fallback>
        <p>グラフを読み込んでいます…</p>
      </template>
    </NuxtFlow>
  </section>
</template>
```

`components` が有効なら `NuxtFlow` が自動 import されます。
グラフはブラウザで描画し、SSR とプリレンダリングではフォールバックを表示します。
アプリ全体の SSR を無効にする必要はありません。

## 設定

モジュールの設定値は、いずれも既定で `true` です。

- `css`: Vue Flow の必須構造スタイルを登録します。
- `defaultTheme`: Vue Flow の任意の標準テーマを登録します。
- `components`: `NuxtFlow` コンポーネントを登録します。

スタイルの自動登録を無効にした場合は、必要な CSS をアプリ側で読み込んでください。
独自テーマを使う場合も、Vue Flow の構造スタイルは必要です。

## コンポーネントとライフサイクル

`v-model:nodes` と `v-model:edges` には Vue Flow の型を使用します。
グラフの設定は `options` で渡します。`id` は任意で、省略時はラッパーが
スコープ付き ID を生成します。`fallbackText` の既定値は `Loading graph…` です。
`fallback` スロットを指定すると、その内容を優先します。

グラフの再マウント後も保持したいデータは、親側で管理してください。
`@ready`、命令的な操作、KeepAlive の動作は
[ライフサイクルガイド（英語）](docs/lifecycle.md) を参照してください。

## 担当範囲と拡張

グラフ操作、ノード・エッジの基本機能、型は Vue Flow が提供します。
詳細は [Vue Flow ガイド](https://vueflow.dev/guide/) を参照してください。
このモジュールは Nuxt への登録とグラフのライフサイクル統合を担当します。

背景、コントロール、ミニマップは任意の拡張です。必要なパッケージを追加し、
コンポーネントと必要な CSS を import してグラフ内に配置してください。
このモジュールは拡張パッケージのインストールや自動 import を行いません。

## コントリビューションとライセンス

[CONTRIBUTING.md](CONTRIBUTING.md) と [SECURITY.md](SECURITY.md) を参照してください。
本プロジェクトは [MIT ライセンス](LICENSE) です。Vue Flow には独立した
[ライセンスと著作権表記](https://github.com/bcakmakoglu/vue-flow/blob/master/LICENSE) が適用されます。
