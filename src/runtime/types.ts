import type { ConnectionLineProps, CustomEvent, EdgeProps, FlowProps, NodeProps, VueFlowStore } from '@vue-flow/core'
import type { VNode } from 'vue'

/** Graph options preserve upstream defaults, including explicit false values. */
export type FlowOptions = Omit<FlowProps, 'id' | 'nodes' | 'edges' | 'modelValue'>

/** A single canvas lifetime. Never retain an instance across an aborted session. */
export interface FlowSession {
  readonly instance: VueFlowStore
  readonly signal: AbortSignal
  /** Run synchronous work only while this canvas is current. */
  run<T>(callback: (instance: VueFlowStore) => T): T | undefined
}

/** Slot data follows the same upstream generics as the graph models. */
export type NuxtFlowSlots<
  NodeData, EdgeData,
  NodeEvents extends Record<string, CustomEvent>, EdgeEvents extends Record<string, CustomEvent>,
  NodeType extends string, EdgeType extends string,
> = Partial<{
  [Name in `node-${string}`]: (props: NodeProps<NodeData, NodeEvents, NodeType>) => VNode[]
} & {
  [Name in `edge-${string}`]: (props: EdgeProps<EdgeData, EdgeEvents, EdgeType>) => VNode[]
} & {
  'connection-line': (props: ConnectionLineProps) => VNode[]
  'zoom-pane': () => VNode[]
  'default': () => VNode[]
  'fallback': () => VNode[]
}>
