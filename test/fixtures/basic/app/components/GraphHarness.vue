<script setup lang="ts">
import { ref } from 'vue'
import { useGraphFixture } from '../composables/useGraphFixture'

const props = withDefaults(defineProps<{ name?: string, controlled?: boolean }>(), {
  name: 'editor', controlled: false,
})
const graph = useGraphFixture(props.controlled)
const customSlot = ref(true)
const { explicitId, nodes, edges, options, optionState, changes, connects, errors } = graph
</script>

<template>
  <section :data-testid="name">
    <h2>{{ name }}</h2>
    <button @click="graph.add">
      Add node
    </button>
    <button @click="graph.remove">
      Remove start
    </button>
    <button @click="explicitId = `${name}-replacement`">
      Change ID
    </button>
    <button @click="customSlot = !customSlot">
      Toggle custom slot
    </button>
    <output data-testid="node-count">{{ nodes.length }}</output>
    <output data-testid="edge-count">{{ edges.length }}</output>
    <output data-testid="change-count">{{ changes }}</output>
    <output data-testid="connect-count">{{ connects }}</output>
    <output data-testid="options">{{ optionState }}</output>
    <output data-testid="errors">{{ JSON.stringify(errors) }}</output>
    <div class="graph-frame">
      <NuxtFlow
        :id="explicitId"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :options="options"
        @ready="graph.ready"
        @connect="graph.connect"
        @nodes-change="changes++"
        @error="errors.push($event.message)"
      >
        <template #fallback>
          <p>Graph is loading for {{ name }}</p>
        </template>
        <template
          v-if="customSlot"
          #node-custom="{ data }"
        >
          <span class="node-label">{{ data.label }}</span>
        </template>
        <template
          v-if="customSlot"
          #node-group
        >
          <span class="conditional-slot">Conditional group slot</span>
        </template>
        <template #default>
          <span data-testid="graph-slot">Graph slot rendered</span>
        </template>
      </NuxtFlow>
    </div>
  </section>
</template>
