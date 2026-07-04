import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame } from './shots'

test('寝室を一周してスクリーンショットを撮る', async ({ page }) => {
  test.setTimeout(120_000)
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    await dispatch(page, action)
    if (action.type === 'MOVE_TO_ROOM' && action.room === 'bedroom') break
  }
  await settle(page, 400)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }

  for (let i = 0; i < 8; i++) {
    while (await close.isVisible().catch(() => false)) {
      await close.click()
      await page.waitForTimeout(120)
    }
    await page.screenshot({ path: `/tmp/sweep-${i}.png` })
    await page.mouse.move(640, 400)
    await page.mouse.down()
    await page.mouse.move(640 + 400, 400, { steps: 15 })
    await page.mouse.up()
    await settle(page, 400)
  }
})
