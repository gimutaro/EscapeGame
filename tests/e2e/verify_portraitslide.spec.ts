import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('肖像画のスライド開閉確認', async ({ page }) => {
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    await dispatch(page, action)
    if (action.type === 'MOVE_TO_ROOM' && action.room === 'study') break
  }
  await settle(page, 300)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.evaluate(() => window.__game?.back?.())
  await waitCameraSettled(page)
  // 部屋ビューを南壁(肖像画・金庫)側へドラッグして向ける
  await page.mouse.move(640, 400)
  await page.mouse.down()
  await page.mouse.move(640 + 1250, 400, { steps: 20 })
  await page.mouse.up()
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/portrait-closed.png' })

  await dispatch(page, { type: 'EXAMINE', target: 'portrait' })
  await settle(page, 900)
  await page.screenshot({ path: '/tmp/portrait-open.png' })

  await page.evaluate(() => window.__game?.focus?.('fv-safe'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/portrait-safe-zoom.png' })
})
