<script setup lang="ts" generic="NodeData = Record<string, unknown>, EdgeData = Record<string, unknown>, NodeEvents extends Record<string, CustomEvent> = Record<never, never>, EdgeEvents extends Record<string, CustomEvent> = Record<never, never>, NodeType extends string = string, EdgeType extends string = string">
import type { Connection, CustomEvent, Edge, EdgeChange, FlowSlots, Node, NodeChange, VueFlowError } from '@vue-flow/core'
import { computed, createVNode, useId } from 'vue'
import type { Slots, VNode } from 'vue'
import { useCanvas } from '../composables/useCanvas'
import type { FlowOptions, FlowSession } from '../types'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  id?: string
  nodes?: Node<NodeData, NodeEvents, NodeType>[]
  edges?: Edge<EdgeData, EdgeEvents, EdgeType>[]
  options?: FlowOptions
  fallbackText?: string
}>(), { id: undefined, nodes: undefined, edges: undefined, options: undefined, fallbackText: 'Loading graph…' })
const emit = defineEmits<{
  'update:nodes': [nodes: Node<NodeData, NodeEvents, NodeType>[]]
  'update:edges': [edges: Edge<EdgeData, EdgeEvents, EdgeType>[]]
  ready: [session: FlowSession]
  error: [error: VueFlowError | Error]
  connect: [connection: Connection]
  nodesChange: [changes: NodeChange[]]
  edgesChange: [changes: EdgeChange[]]
}>()
const slots = defineSlots<Partial<FlowSlots> & { fallback?: () => VNode[] }>()
const getGraphSlots = () => {
  const forwarded = { ...slots }
  delete forwarded.fallback
  return forwarded
}
const generatedId = `nuxt-flow-${useId()}`
const flowId = computed(() => props.id ?? generatedId)
const canvas = useCanvas(() => flowId.value, value => emit('ready', value), value => emit('error', value))
const GraphRenderer = (rendererProps: { graphSlots: Slots }) => {
  const current = canvas.value
  if (!current) return null
  const forward = (callback: () => void) => {
    if (!current.signal.aborted) callback()
  }
  return createVNode(current.component, {
    ...props.options,
    id: flowId.value,
    nodes: props.nodes,
    edges: props.edges,
    onInit: current.onInit,
    'onUpdate:nodes': (nodes: Node<NodeData, NodeEvents, NodeType>[]) => forward(() => emit('update:nodes', nodes)),
    'onUpdate:edges': (edges: Edge<EdgeData, EdgeEvents, EdgeType>[]) => forward(() => emit('update:edges', edges)),
    onError: (error: VueFlowError) => forward(() => emit('error', error)),
    onConnect: (connection: Connection) => forward(() => emit('connect', connection)),
    onNodesChange: (changes: NodeChange[]) => forward(() => emit('nodesChange', changes)),
    onEdgesChange: (changes: EdgeChange[]) => forward(() => emit('edgesChange', changes)),
  }, rendererProps.graphSlots)
}
GraphRenderer.props = ['graphSlots']
</script>

<template>
  <div
    class="nuxt-flow"
    v-bind="$attrs"
  >
    <GraphRenderer
      v-if="canvas"
      :key="canvas.key"
      :graph-slots="getGraphSlots()"
    />
    <div
      v-else
      class="nuxt-flow__fallback"
      role="status"
    >
      <slot name="fallback">
        {{ fallbackText }}
      </slot>
    </div>
  </div>
</template>

<style>
.nuxt-flow { width: 100%; height: 100%; }
.nuxt-flow__fallback { width: 100%; height: 100%; }
</style>
