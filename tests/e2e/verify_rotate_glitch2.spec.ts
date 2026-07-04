import { test } from '@playwright/test'

test.use({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
})

test('回転後に強制リフローすればグリッチが消えるか', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).tap()
  await page.getByRole('button', { name: 'とばす ≫' }).tap()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
  await page.waitForTimeout(400)

  await page.setViewportSize({ width: 390, height: 844 })
  // 強制リフロー
  await page.evaluate(() => {
    document.body.style.display = 'none'
    void document.body.offsetHeight
    document.body.style.display = ''
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: '/tmp/rotate-forced-reflow.png' })
})
