import type { VueFlow, VueFlowStore } from '@vue-flow/core'
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, watch } from 'vue'
import { createFlowSession } from '../session'
import type { FlowSession } from '../types'

interface CanvasMount {
  component: typeof VueFlow
  key: number
  signal: AbortSignal
  onInit: (instance: VueFlowStore) => void
}

export function useCanvas(
  id: () => string,
  ready: (session: FlowSession) => void,
  error: (cause: Error) => void,
) {
  const canvas = shallowRef<CanvasMount>()
  let lifetime: AbortController | undefined
  let active = false
  let generation = 0

  function stop() {
    active = false
    lifetime?.abort()
    canvas.value = undefined
  }

  async function start() {
    if (active) return
    active = true
    const controller = new AbortController()
    lifetime = controller
    const key = ++generation
    try {
      const { VueFlow: component } = await import('@vue-flow/core')
      if (controller.signal.aborted) return
      let initialized = false
      canvas.value = {
        component,
        key,
        signal: controller.signal,
        onInit(instance) {
          if (controller.signal.aborted || initialized) return
          initialized = true
          ready(createFlowSession(instance, controller.signal))
        },
      }
    } catch (cause: unknown) {
      if (!controller.signal.aborted) {
        error(cause instanceof Error ? cause : new Error(String(cause)))
      }
    }
  }

  onMounted(start)
  onActivated(start)
  onDeactivated(stop)
  onBeforeUnmount(stop)
  watch(id, () => {
    if (!active) return
    stop()
    void start()
  }, { flush: 'sync' })
  return canvas
}
