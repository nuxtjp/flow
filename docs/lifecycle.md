# Component API and lifecycle

## Public surface

Import module types from `@nuxtjp/flow/runtime`. `Node` and `Edge` are
re-exported upstream types; `FlowOptions` and `FlowSession` describe the
integration. The module does not introduce a different graph data format.

`NuxtFlow` accepts:

- `nodes` / `v-model:nodes`: a typed array of Vue Flow nodes.
- `edges` / `v-model:edges`: a typed array of Vue Flow edges.
- `options`: `FlowOptions`, defined as
  `Omit<FlowProps, 'id' | 'nodes' | 'edges' | 'modelValue'>`.
- `id`: an optional unique Vue Flow store ID, scoped automatically if omitted.
- `fallbackText`: text displayed before the client graph is available;
  defaults to `Loading graph…`.

Use the dedicated props for IDs and graph data, rather than placing them
in `options`. If you supply IDs, keep them unique among active graphs.

The `fallback` slot replaces the fallback text. Other slots are forwarded
to Vue Flow, including its custom node and edge slots. The wrapper supports
`ready`, `error`, `connect`, `nodesChange`, and `edgesChange` events, plus
the model-update events. `error` can contain an upstream graph error or an
`Error` from loading the client graph chunk. Handle these in your application.

## Readiness and scoped work

`@ready` receives a new `FlowSession` when a mounted or reactivated canvas
emits the upstream `init` event:

```ts
interface FlowSession {
  instance: VueFlowStore
  signal: AbortSignal
  run<T>(callback: (instance: VueFlowStore) => T): T | undefined
}
```

The session belongs to one canvas lifetime. Deactivation, unmounting, or
an `id` change aborts its signal. `run` skips the callback for an expired
session and returns `undefined`; otherwise it returns the callback's result.

For work that waits before accessing the graph, use the session that started
the work and check it again before applying changes:

```vue
<script setup lang="ts">
import { nextTick } from 'vue'
import type { FlowSession } from '@nuxtjp/flow/runtime'

async function onReady(session: FlowSession) {
  await nextTick()
  session.run((instance) => {
    void instance.fitView()
  })
}
</script>

<template>
  <div style="height: 480px">
    <NuxtFlow @ready="onReady" />
  </div>
</template>
```

`run` checks validity at invocation only. An `await` inside its callback
does not gain another automatic validity check. Await first, then use `run`,
or check `session.signal.aborted` immediately before each later mutation.

Pass `session.signal` to APIs that support cancellation, such as `fetch`.
Handle aborts and other failures in your own asynchronous code. The module
does not cancel arbitrary promises, application timers, or work already
started inside an upstream method. Do not cache a raw instance globally
and use it after its session has ended.

## KeepAlive and persistent data

The inner canvas is released on deactivation and rebuilt on reactivation.
A cached outer page therefore receives a new session when its graph returns.
Keep nodes and edges in parent-owned state and bind both models when edits
must survive a canvas remount. If the parent itself is removed, choose an
appropriate application store or persistence layer.

The module does not automatically persist viewport, selection, application
history, or custom node state. Save and restore any required state explicitly
using the upstream API and a current session. Register per-session work in
the new `ready` handler rather than reusing an old session.

See [Vue's KeepAlive guide](https://vuejs.org/guide/built-ins/keep-alive.html)
for the distinction between deactivation and unmounting.

## SSR, SSG, and extensions

Only the graph is client rendered. Keep page headings, descriptive content,
and an accessible graph summary outside it so they remain available in
server-rendered and prerendered HTML. Give the graph's container a usable
height and reserve fallback space to avoid layout movement.

Use serializable parent state when transferring graph data in a Nuxt payload.
Browser objects, stores, session instances, and abort signals do not belong
in that payload. Keep browser-dependent setup in client-side components or
lifecycle handlers.

For optional Vue Flow extensions, add their packages directly to the app,
import their components, and include each extension's required CSS. A child
component that accesses Vue Flow state should live inside the active graph
tree. Avoid creating a separate global store just to reach the canvas.

Vue Flow's [state guide](https://vueflow.dev/guide/vue-flow/state.html) and
[controls guide](https://vueflow.dev/guide/components/controls.html) describe
the upstream state and extension APIs.
