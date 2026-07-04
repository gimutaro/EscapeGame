import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('肖像画スライド後の金庫ズームビュー確認', async ({ page }) => {
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    await dispatch(page, action)
    if (action.type === 'EXAMINE' && action.target === 'portrait') break
  }
  await settle(page, 300)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await settle(page, 1000)
  await page.evaluate(() => window.__game?.focus?.('fv-safe'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/portrait-safe-zoom.png' })
})
