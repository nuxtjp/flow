// @vitest-environment happy-dom
import { defineComponent, h, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import NuxtFlow from '../../src/runtime/components/NuxtFlow.vue'

vi.mock('../../src/runtime/composables/useCanvas', () => ({
  useCanvas: () => shallowRef({
    component: defineComponent({
      setup(_, { slots }) {
        return () => h('div', [slots.default?.(), slots['node-custom']?.({ data: { label: 'Custom' } })])
      },
    }),
    key: 1,
    signal: new AbortController().signal,
    onInit() {},
  }),
}))

it('passes default and named slots through the actual renderer and updates conditional slots', async () => {
  const visible = ref(true)
  const wrapper = mount(defineComponent({
    setup() {
      return () => h(NuxtFlow, {}, visible.value ? {
        default: () => h('span', 'Default content'),
        'node-custom': () => h('strong', 'Custom content'),
      } : {})
    },
  }))
  expect(wrapper.text()).toContain('Default content')
  expect(wrapper.text()).toContain('Custom content')
  visible.value = false
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toBe('')
  visible.value = true
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('Default content')
  wrapper.unmount()
})
