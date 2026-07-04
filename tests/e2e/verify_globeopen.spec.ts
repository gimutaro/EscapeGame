import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('地球儀が開いた状態の球体裏側確認', async ({ page }) => {
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    await dispatch(page, action)
    if (action.type === 'OPEN_GLOBE') break
  }
  await settle(page, 300)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.evaluate(() => window.__game?.focus?.('fv-globe'))
  await waitCameraSettled(page)
  await settle(page, 600)
  await page.screenshot({ path: '/tmp/globeopen-check.png' })
})
