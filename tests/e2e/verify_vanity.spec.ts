import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame } from './shots'

test('鏡台の上の宝石箱の位置を確認', async ({ page }) => {
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
  await page.mouse.move(640, 400)
  await page.mouse.down()
  await page.mouse.move(1550, 400, { steps: 30 })
  await page.mouse.up()
  await settle(page, 600)
  await page.screenshot({ path: '/tmp/vanity-full.png' })
})
