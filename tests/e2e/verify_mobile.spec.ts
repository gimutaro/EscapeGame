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
  await page.evaluate(() => {
    const c = document.querySelector('canvas[data-engine]')
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
})

test('スマホ(縦向き)でも部屋いっぱいに表示され、HUD が操作できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).tap()
  await page.getByRole('button', { name: 'とばす ≫' }).tap()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
  await page.waitForTimeout(400)
  // 縦持ち専用の案内は出さず、通常の HUD がそのまま操作できる
  await expect(page.locator('.rotate-hint')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '？ ヒント' })).toBeVisible()
  await page.screenshot({ path: '/tmp/mobile-portrait.png' })
})
