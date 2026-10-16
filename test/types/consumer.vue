<script setup lang="ts">
import { ref } from 'vue'
import type { Edge, Node } from '../../src/runtime'
import NuxtFlow from '../../src/runtime/components/NuxtFlow.vue'

type Data = { label: string }
type Events = { selected: (id: string) => void }
const nodes = ref<Node<Data, Events, 'custom'>[]>([{
  id: 'typed-node', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Typed' },
  events: { selected: id => id.toUpperCase(), click: event => { event.node.id.toUpperCase() } },
}])
const edges = ref<Edge<Data, Events, 'custom'>[]>([])
const ordinary = ref<Node<Data, Record<never, never>>[]>([{
  id: 'ordinary', position: { x: 10, y: 10 }, data: { label: 'Ordinary' },
  events: { click: event => { event.node.id.toUpperCase() } },
}])
</script>

<template>
  <NuxtFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
  >
    <template #node-custom="{ data }">
      {{ data.label.toUpperCase() }}
    </template>
  </NuxtFlow>
  <NuxtFlow v-model:nodes="ordinary" />
</template>
