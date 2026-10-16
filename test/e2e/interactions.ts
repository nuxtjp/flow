import { browserTest, expect } from './browser'

export function interactionTests() {
  browserTest('forwards slots and synchronizes node and edge models', '/', async (page) => {
    await expect(page.getByTestId('graph-slot')).toBeVisible()
    await page.getByRole('button', { name: 'Add node', exact: true }).click()
    await expect(page.getByTestId('node-count')).toHaveText('5')
    await expect(page.locator('[data-id="added"] .node-label')).toHaveText('Added')
    const source = page.locator('[data-id="start"] .source')
    const target = page.locator('[data-id="end"] .target')
    await source.dragTo(target)
    await expect(page.getByTestId('connect-count')).toHaveText('1')
    await expect(page.getByTestId('edge-count')).toHaveText('1')
    await expect(page.locator('.vue-flow__edge')).toHaveCount(1)
    await page.getByRole('button', { name: 'Remove start', exact: true }).click()
    await expect(page.getByTestId('node-count')).toHaveText('4')
    await expect(page.getByTestId('edge-count')).toHaveText('0')
  })

  browserTest('updates conditional upstream slots without restarting the session', '/', async (page) => {
    await expect(page.locator('.conditional-slot')).toBeVisible()
    await page.getByRole('button', { name: 'Toggle custom slot' }).click()
    await expect(page.locator('.conditional-slot')).toHaveCount(0)
    await page.getByRole('button', { name: 'Toggle custom slot' }).click()
    await expect(page.locator('.conditional-slot')).toBeVisible()
    await expect(page.getByTestId('session-count')).toHaveText('1')
  })

  browserTest('preserves explicit false options and controlled changes', '/controlled', async (page) => {
    await expect(page.getByTestId('options')).toHaveText(JSON.stringify({
      applyDefault: false, nodesDraggable: false, zoomOnScroll: false, panOnDrag: false,
    }))
    const before = Number(await page.getByTestId('change-count').innerText())
    await page.getByRole('button', { name: 'Remove start', exact: true }).click()
    await expect.poll(async () => Number(await page.getByTestId('change-count').innerText())).toBeGreaterThan(before)
    await expect(page.getByTestId('node-count')).toHaveText('4')
    await expect(page.locator('[data-id="start"]')).toBeVisible()
  })

  browserTest('keeps nested nodes within the parent bounds while dragging', '/', async (page) => {
    const child = page.locator('.vue-flow__node[data-id="child"]')
    const parent = page.locator('.vue-flow__node[data-id="group"]')
    const initial = await child.boundingBox()
    const bounds = await parent.boundingBox()
    expect(initial).not.toBeNull()
    expect(bounds).not.toBeNull()
    if (!initial || !bounds) throw new Error('Node geometry is unavailable')
    await page.mouse.move(initial.x + 45, initial.y + 20)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width + 100, bounds.y + bounds.height + 100, { steps: 12 })
    await page.mouse.up()
    const moved = await child.boundingBox()
    if (!moved) throw new Error('Dragged child disappeared')
    expect(moved.x).toBeGreaterThan(initial.x)
    expect(moved.x).toBeGreaterThanOrEqual(bounds.x - 1)
    expect(moved.y).toBeGreaterThanOrEqual(bounds.y - 1)
    expect(moved.x + moved.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
    expect(moved.y + moved.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1)
  })

  browserTest('retains upstream focus and keyboard movement', '/', async (page) => {
    const node = page.locator('.vue-flow__node[data-id="start"]')
    await expect(node).toHaveAttribute('tabindex', '0')
    await node.focus()
    await expect(node).toBeFocused()
    await page.keyboard.press('Enter')
    const before = await node.boundingBox()
    await page.keyboard.press('ArrowRight')
    await expect.poll(async () => (await node.boundingBox())?.x).toBeGreaterThan(before?.x ?? 0)
    await page.keyboard.press('Backspace')
    await expect(node).toHaveCount(0)
    await expect(page.getByTestId('node-count')).toHaveText('3')
  })
}
