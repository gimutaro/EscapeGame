import { test } from '@playwright/test'

test.use({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
})

test('回転リサイズ時の描画グリッチ切り分け', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).tap()
  await page.getByRole('button', { name: 'とばす ≫' }).tap()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
  await page.waitForTimeout(400)

  // backdrop-filter を全面的に無効化してから回転する
  await page.addStyleTag({ content: '* { backdrop-filter: none !important; }' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: '/tmp/rotate-no-blur.png' })
})
