// @vitest-environment happy-dom
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useVueFlow } from '@vue-flow/core'
import { describe, expect, it, vi } from 'vitest'
import { createFlowSession } from '../../src/runtime/session'
import type { FlowSession } from '../../src/runtime/types'

describe('canvas sessions', () => {
  it('allows current work and blocks it after abort, including late continuations', async () => {
    const controller = new AbortController()
    let session: FlowSession | undefined
    const wrapper = mount(defineComponent({
      setup() {
        session = createFlowSession(useVueFlow('session-unit'), controller.signal)
        return () => h('div')
      },
    }))
    if (!session) throw new Error('Session was not initialized')
    const current = session
    expect(current.run(instance => instance.id)).toBe('session-unit')
    const callback = vi.fn()
    const pending = Promise.resolve().then(() => current.run(callback))
    controller.abort()
    expect(await pending).toBeUndefined()
    expect(callback).not.toHaveBeenCalled()
    expect(current.signal.aborted).toBe(true)
    wrapper.unmount()
  })
})
