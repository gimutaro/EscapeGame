import { test } from '@playwright/test'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
})

test('縦向きで柱時計の未解決時UIを確認', async ({ page }) => {
  await startNewGame(page)
  await dispatch(page, { type: 'EXAMINE', target: 'lowTable' })
  await dispatch(page, { type: 'EXAMINE', target: 'sofa' })
  await dispatch(page, { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' })
  await dispatch(page, { type: 'EXAMINE', target: 'painting' })
  await dispatch(page, { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' })
  await dispatch(page, { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' })
  await settle(page, 300)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.evaluate(() => window.__game?.focus?.('fv-clock'))
  await waitCameraSettled(page)
  await settle(page, 300)
  await page.screenshot({ path: '/tmp/portrait-clock-unsolved.png' })
})
