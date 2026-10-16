import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  browser: false,
})

describe('SSR boundary', () => {
  it.each(['/', '/keepalive', '/controlled', '/multiple'])(
    'renders meaningful %s HTML with SSR enabled, without graph DOM', async (route) => {
      const html = await $fetch<string>(route)
      expect(html).toContain('SSR graph fixture')
      expect(html).toContain('Graph is loading for')
      expect(html).toContain('role="status"')
      expect(html).not.toMatch(/class="vue-flow(?: |"|__)/)
      expect(html).not.toContain('data-id="start"')
    },
  )
})
