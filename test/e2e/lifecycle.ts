import { browserTest, expect } from './browser'

export function lifecycleTests() {
  browserTest('unmounts and remounts safely across repeated client navigation', '/', async (page) => {
    for (let cycle = 1; cycle <= 3; cycle++) {
      await expect(page.getByTestId('session-count')).toHaveText(String(cycle))
      await page.getByRole('link', { name: 'Other', exact: true }).click()
      await expect(page.getByTestId('other-page')).toBeVisible()
      await expect(page.getByTestId('aborted-count')).toHaveText(String(cycle))
      await expect(page.locator('.vue-flow')).toHaveCount(0)
      await page.getByRole('button', { name: 'Run stale callbacks' }).click()
      await expect(page.getByTestId('stale-runs')).toHaveText('0')
      await page.getByRole('link', { name: 'Editor', exact: true }).click()
      await expect(page.locator('.vue-flow__node')).toHaveCount(4)
    }
    await expect(page.getByTestId('session-count')).toHaveText('4')
  })

  browserTest('recreates KeepAlive sessions and preserves parent-owned models', '/keepalive', async (page) => {
    await page.getByRole('button', { name: 'Add node', exact: true }).click()
    await expect(page.getByTestId('node-count')).toHaveText('5')
    for (let cycle = 1; cycle <= 3; cycle++) {
      await page.getByRole('link', { name: 'Other', exact: true }).click()
      await expect(page.getByTestId('aborted-count')).toHaveText(String(cycle))
      await page.getByRole('button', { name: 'Run stale callbacks' }).click()
      await page.getByRole('link', { name: 'KeepAlive', exact: true }).click()
      await expect(page.getByTestId('session-count')).toHaveText(String(cycle + 1))
      await expect(page.getByTestId('node-count')).toHaveText('5')
      await expect(page.locator('.vue-flow__node')).toHaveCount(5)
    }
    await expect(page.getByTestId('stale-runs')).toHaveText('0')
  })

  browserTest('aborts the old session when an explicit graph ID changes', '/', async (page) => {
    await page.getByRole('button', { name: 'Change ID' }).click()
    await expect(page.getByTestId('session-count')).toHaveText('2')
    await expect(page.getByTestId('aborted-count')).toHaveText('1')
    const ids: unknown = JSON.parse(await page.getByTestId('session-ids').innerText())
    expect(ids).toEqual([expect.stringMatching(/^nuxt-flow-/), 'editor-replacement'])
    await page.getByRole('button', { name: 'Run stale callbacks' }).click()
    await expect(page.getByTestId('stale-runs')).toHaveText('0')
    await expect(page.locator('[data-id="stale"]')).toHaveCount(0)
  })

  browserTest('survives navigation during an active connection drag', '/', async (page) => {
    for (let cycle = 1; cycle <= 2; cycle++) {
      const handle = await page.locator('[data-id="start"] .source').boundingBox()
      if (!handle) throw new Error('Source handle is unavailable')
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
      await page.mouse.down()
      await page.mouse.move(handle.x + 60, handle.y + 80, { steps: 4 })
      await expect(page.locator('.vue-flow__connectionline')).toBeVisible()
      await page.getByRole('link', { name: 'Other', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('other-page')).toBeVisible()
      await expect(page.getByTestId('aborted-count')).toHaveText(String(cycle))
      await page.mouse.move(600, 300, { steps: 4 })
      await page.mouse.up()
      await page.getByRole('link', { name: 'Editor', exact: true }).click()
      await expect(page.getByTestId('session-count')).toHaveText(String(cycle + 1))
      await expect(page.getByTestId('edge-count')).toHaveText('0')
      await page.getByRole('button', { name: 'Run stale callbacks' }).click()
      await expect(page.getByTestId('stale-runs')).toHaveText('0')
    }
  })

  browserTest('isolates auto-generated graph IDs and graph state', '/multiple', async (page) => {
    await expect(page.getByTestId('session-count')).toHaveText('2')
    const ids: unknown = JSON.parse(await page.getByTestId('session-ids').innerText())
    expect(Array.isArray(ids) && new Set(ids).size).toBe(2)
    const first = page.getByTestId('first')
    const second = page.getByTestId('second')
    await first.getByRole('button', { name: 'Add node', exact: true }).click()
    await expect(first.getByTestId('node-count')).toHaveText('5')
    await expect(second.getByTestId('node-count')).toHaveText('4')
    await first.getByRole('button', { name: 'Remove start', exact: true }).click()
    await expect(first.locator('[data-id="start"]')).toHaveCount(0)
    await expect(second.locator('[data-id="start"]')).toBeVisible()
  })
}
