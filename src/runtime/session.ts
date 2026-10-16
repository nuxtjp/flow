import type { VueFlowStore } from '@vue-flow/core'
import type { FlowSession } from './types'

export function createFlowSession(instance: VueFlowStore, signal: AbortSignal): FlowSession {
  return {
    instance,
    signal,
    run<T>(callback: (current: VueFlowStore) => T): T | undefined {
      if (!signal.aborted) return callback(instance)
      return undefined
    },
  }
}
