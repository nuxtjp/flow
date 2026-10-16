import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { chromium, expect as browserExpect } from '@playwright/test'
import { beforeAll, expect, it } from 'vitest'
import { serveStatic } from './static-server'

const root = fileURLToPath(new URL('../../', import.meta.url))
const fixture = fileURLToPath(new URL('../fixtures/basic/', import.meta.url))
beforeAll(async () => {
  await promisify(execFile)(process.execPath, [
    `${root}node_modules/@nuxt/cli/bin/nuxi.mjs`, 'generate', fixture,
  ], { cwd: root, timeout: 180000, maxBuffer: 10 * 1024 * 1024 })
}, 240000)

it('prerenders graph pages as static HTML with accessible fallbacks', async () => {
  for (const route of ['', 'keepalive/', 'controlled/', 'multiple/']) {
    const html = await readFile(`${fixture}.output/public/${route}index.html`, 'utf8')
    expect(html).toContain('SSR graph fixture')
    expect(html).toContain('Graph is loading for')
    expect(html).toContain('role="status"')
    expect(html).not.toMatch(/class="vue-flow(?: |"|__)/)
    expect(html).not.toContain('data-id="start"')
  }
})

it('hydrates generated static HTML and supports graph interactions', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
  const server = await serveStatic(`${fixture}.output/public`)
  try {
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' || /hydration.*mismatch/i.test(message.text())) errors.push(message.text())
    })
    await page.goto(server.url)
    await browserExpect(page.locator('.vue-flow__node')).toHaveCount(4)
    await browserExpect(page.locator('.nuxt-flow__fallback')).toHaveCount(0)
    await page.getByRole('button', { name: 'Add node', exact: true }).click()
    await browserExpect(page.getByTestId('node-count')).toHaveText('5')
    await page.getByRole('link', { name: 'Other', exact: true }).click()
    await browserExpect(page.getByTestId('aborted-count')).toHaveText('1')
    await page.getByRole('link', { name: 'Editor', exact: true }).click()
    await browserExpect(page.getByTestId('session-count')).toHaveText('2')
    expect(errors).toEqual([])
  }
  finally {
    await server.close()
    await browser.close()
  }
})
