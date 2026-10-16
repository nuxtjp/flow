import type { FlowProps, VueFlowStore } from '@vue-flow/core'

/** Graph options preserve upstream defaults, including explicit false values. */
export type FlowOptions = Omit<FlowProps, 'id' | 'nodes' | 'edges' | 'modelValue'>

/** A single canvas lifetime. Never retain an instance across an aborted session. */
export interface FlowSession {
  readonly instance: VueFlowStore
  readonly signal: AbortSignal
  /** Run synchronous work only while this canvas is current. */
  run<T>(callback: (instance: VueFlowStore) => T): T | undefined
}
