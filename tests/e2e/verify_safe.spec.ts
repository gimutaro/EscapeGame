import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('肖像画の裏の金庫がはみ出ていないか確認', async ({ page }) => {
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    await dispatch(page, action)
    if (action.type === 'MOVE_TO_ROOM' && action.room === 'study') break
  }
  await settle(page, 400)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.evaluate(() => window.__game?.focus?.('fv-safe'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/safe-closed.png' })

  // 肖像画をクリックして開く
  await page.evaluate(() => window.__game?.dispatch({ type: 'EXAMINE', target: 'portrait' } as never))
  await settle(page, 2500)
  await page.screenshot({ path: '/tmp/safe-open.png' })
})
