import { computed, ref, shallowRef } from 'vue'
import type { Connection, Edge, Node } from '@vue-flow/core'
import type { FlowOptions, FlowSession } from '../../../../../src/runtime/types'
import { useFixtureSessions } from './fixtureSessions'

export function useGraphFixture(controlled: boolean) {
  const registry = useFixtureSessions()
  const session = shallowRef<FlowSession>()
  const explicitId = ref<string>()
  const nodes = ref<Node[]>([
    { id: 'start', position: { x: 40, y: 40 }, data: { label: 'Start' } },
    { id: 'end', position: { x: 340, y: 40 }, data: { label: 'End' } },
    { id: 'group', type: 'group', position: { x: 40, y: 170 }, data: {},
      style: { width: '300px', height: '180px' } },
    { id: 'child', parentNode: 'group', extent: 'parent', position: { x: 30, y: 30 },
      data: { label: 'Child' }, style: { width: '100px', height: '40px' } },
  ])
  const edges = ref<Edge[]>([])
  const changes = ref(0)
  const connects = ref(0)
  const errors = ref<string[]>([])
  const options: FlowOptions = controlled
    ? { applyDefault: false, nodesDraggable: false, zoomOnScroll: false, panOnDrag: false }
    : { autoPanOnNodeDrag: false }
  const optionState = computed(() => {
    const instance = session.value?.instance
    return instance ? JSON.stringify({
      applyDefault: instance.applyDefault.value,
      nodesDraggable: instance.nodesDraggable.value,
      zoomOnScroll: instance.zoomOnScroll.value,
      panOnDrag: instance.panOnDrag.value,
    }) : ''
  })
  function ready(value: FlowSession) {
    session.value = value
    registry.ready(value)
  }
  function add() {
    session.value?.run(instance => instance.addNodes({
      id: 'added', type: 'custom', position: { x: 530, y: 40 }, data: { label: 'Added' },
    }))
  }
  function remove() { session.value?.run(instance => instance.removeNodes('start')) }
  function connect(value: Connection) {
    connects.value++
    session.value?.run(instance => instance.addEdges({ ...value, id: 'connected' }))
  }
  return { session, explicitId, nodes, edges, options, optionState, ready, add, remove,
    connect, changes, connects, errors }
}
