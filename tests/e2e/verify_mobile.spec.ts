import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 844, height: 390 }, // iPhone 13 横向き
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
})

test('スマホ(横向き)でタップ操作できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).tap()
  await page.getByRole('button', { name: 'とばす ≫' }).tap()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
  await page.waitForTimeout(600)
  await page.screenshot({ path: '/tmp/mobile-landscape.png' })

  // タッチドラッグで視点が回る(固定点の画面座標が動く)
  const before = await page.evaluate(() => window.__game?.project?.(0, 1.5, -3.4))
  await page.touchscreen.tap(420, 195) // 音声アンロック相当のタッチ
  const canvas = page.locator('#app canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas が見つからない')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.evaluate(() => {
    const c = document.querySelector('#app canvas')
    if (!c) return
    const opts = { bubbles: true, pointerType: 'touch', isPrimary: true, pointerId: 7 }
    c.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientX: 400, clientY: 200 }))
    for (let i = 1; i <= 10; i++) {
      c.dispatchEvent(
        new PointerEvent('pointermove', { ...opts, clientX: 400 + i * 20, clientY: 200 }),
      )
    }
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, clientX: 600, clientY: 200 }))
  })
  await page.waitForTimeout(400)
  const after = await page.evaluate(() => window.__game?.project?.(0, 1.5, -3.4))
  expect(before && after && Math.abs(after.x - before.x) > 10, '視点ドラッグが効いていない').toBe(
    true,
  )
  void cx
  void cy
})

test('スマホ(縦向き)では横向き推奨が出る', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).tap()
  await page.getByRole('button', { name: 'とばす ≫' }).tap()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
  await expect(page.locator('.rotate-hint')).toBeVisible()
  await page.screenshot({ path: '/tmp/mobile-portrait.png' })
})
