import { createPage, url } from '@nuxt/test-utils/e2e'
import type { NuxtPage } from '@nuxt/test-utils/e2e'
import { expect } from '@playwright/test'
import { it } from 'vitest'

export { expect }
export function browserTest(name: string, path: string, run: (page: NuxtPage) => Promise<void>) {
  it(name, async () => {
    const page = await createPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' || /hydration.*mismatch/i.test(message.text())) {
        errors.push(message.text())
      }
    })
    try {
      await page.goto(url(path), { waitUntil: 'hydration' })
      await expect(page.locator('.vue-flow__node').first()).toBeVisible()
      await run(page)
      for (const output of await page.getByTestId('errors').all()) await expect(output).toHaveText('[]')
      expect(errors).toEqual([])
    }
    finally { await page.close() }
  })
}
