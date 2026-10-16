import { computed, inject, ref, shallowRef } from 'vue'
import type { FlowSession } from '../../../../../src/runtime/types'

export function createFixtureSessions() {
  const sessions = shallowRef<FlowSession[]>([])
  const aborted = ref(0)
  const staleRuns = ref(0)
  const ids = computed(() => sessions.value.map(session => session.instance.id))
  function ready(session: FlowSession) {
    sessions.value = [...sessions.value, session]
    session.signal.addEventListener('abort', () => aborted.value++, { once: true })
  }
  function runStale() {
    for (const session of sessions.value.filter(value => value.signal.aborted)) {
      session.run(instance => {
        staleRuns.value++
        instance.addNodes({ id: 'stale', position: { x: 0, y: 0 }, data: { label: 'Stale' } })
      })
    }
  }
  return { sessions, aborted, staleRuns, ids, ready, runStale }
}

export function useFixtureSessions() {
  const registry = inject<ReturnType<typeof createFixtureSessions>>('fixture-sessions')
  if (!registry) throw new Error('Fixture session registry is missing')
  return registry
}
