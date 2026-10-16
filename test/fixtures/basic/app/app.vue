<script setup lang="ts">
import { provide } from 'vue'
import { createFixtureSessions } from './composables/fixtureSessions'

const registry = createFixtureSessions()
provide('fixture-sessions', registry)
</script>

<template>
  <main>
    <h1>SSR graph fixture</h1>
    <nav>
      <NuxtLink to="/">
        Editor
      </NuxtLink>
      <NuxtLink to="/other">
        Other
      </NuxtLink>
      <NuxtLink to="/keepalive">
        KeepAlive
      </NuxtLink>
      <NuxtLink to="/multiple">
        Multiple
      </NuxtLink>
      <NuxtLink to="/controlled">
        Controlled
      </NuxtLink>
    </nav>
    <output data-testid="session-count">{{ registry.sessions.value.length }}</output>
    <output data-testid="aborted-count">{{ registry.aborted.value }}</output>
    <output data-testid="session-ids">{{ JSON.stringify(registry.ids.value) }}</output>
    <output data-testid="stale-runs">{{ registry.staleRuns.value }}</output>
    <button @click="registry.runStale">
      Run stale callbacks
    </button>
    <NuxtPage />
  </main>
</template>

<style>
body { margin: 16px; font-family: sans-serif; }
nav { display: flex; gap: 16px; margin-bottom: 16px; }
output { margin-right: 8px; }
.graph-frame { width: 800px; height: 420px; border: 1px solid #999; margin-top: 12px; }
</style>
