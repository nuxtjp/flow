# @nuxtjp/flow

[日本語](README.ja.md)

A small Nuxt module for [Vue Flow](https://vueflow.dev/). It adds a
client-rendered graph boundary while keeping the surrounding page available
to Nuxt SSR and static generation.

This is a community-maintained integration. It is not an official Nuxt
module and is not endorsed by the Nuxt or Vue Flow teams.

## Status and installation

This project is in pre-release development. The instructions below build
a local package and do not assume an npm release is available.

From a [source checkout](https://github.com/nuxtjp/flow), build and pack it:

```sh
npm ci
npm run dev:prepare
npm run check
npm pack
```

In your Nuxt application, install the resulting `.tgz` file. Replace the
example path with the actual filename printed by `npm pack`:

```sh
npm install /absolute/path/to/package.tgz
```

Requires Node.js ≥ 22.12, Nuxt `~4.6.1`, and Vue `~3.5.44`.
Vue Flow Core is pinned to `1.48.2`; see [package.json](package.json).
These narrow ranges do not claim compatibility with every Nuxt 3/4 release.

## Quick start

Register the module in `nuxt.config.ts`:

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

Create a graph with an explicit container height:

```vue
<script setup lang="ts">
import type { Edge, Node } from '@nuxtjp/flow/runtime'

type GraphNode = Node<{ label: string }, Record<never, never>>

const nodes = ref<GraphNode[]>([
  { id: 'start', position: { x: 60, y: 60 }, data: { label: 'Start' } },
  { id: 'next', position: { x: 260, y: 160 }, data: { label: 'Next' } },
])
const edges = ref<Edge<Record<never, never>, Record<never, never>>[]>([
  { id: 'start-next', source: 'start', target: 'next' },
])
</script>

<template>
  <section style="height: 480px">
    <NuxtFlow v-model:nodes="nodes" v-model:edges="edges">
      <template #fallback>
        <p>Loading graph…</p>
      </template>
    </NuxtFlow>
  </section>
</template>
```

`NuxtFlow` is auto-imported when `components` is enabled. The graph renders
in the browser; its fallback is available during SSR and prerendering.
The module does not require disabling SSR for the application.

## Configuration

All three module options default to `true`:

- `css`: register Vue Flow's required structural stylesheet.
- `defaultTheme`: register Vue Flow's optional default theme stylesheet.
- `components`: register the namespaced `NuxtFlow` component.

If you opt out of styles, supply the corresponding CSS yourself. A custom
theme still needs Vue Flow's structural styles.

## Component and lifecycle

Use `v-model:nodes` and `v-model:edges` with Vue Flow's upstream types.
Pass graph configuration through `options`. An optional `id` identifies
the graph; otherwise the wrapper scopes an ID automatically.
`fallbackText` defaults to `Loading graph…`; a `fallback` slot overrides it.

Keep graph data in parent-owned state when it must survive graph remounts.
For `@ready`, imperative work, and KeepAlive behavior, read the
[lifecycle guide](docs/lifecycle.md).

## Scope and extensions

Vue Flow provides graph interactions, node and edge primitives, and its
TypeScript API. See the [Vue Flow guide](https://vueflow.dev/guide/) for those
features. The module focuses on Nuxt setup and graph lifecycle integration.

Background, controls, and minimap packages are optional. Install extensions
you need, import their components and required styles, and compose them
inside the graph. They are not installed or auto-imported by this module.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
This project is [MIT licensed](LICENSE). Vue Flow retains its separate
[upstream license and notices](https://github.com/bcakmakoglu/vue-flow/blob/master/LICENSE).
