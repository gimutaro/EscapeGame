import { test } from '@playwright/test'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('リビングのテーブル位置を確認', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 500)
  await page.screenshot({ path: '/tmp/table-default.png' })

  await page.evaluate(() => window.__game?.focus?.('fv-table'))
  await waitCameraSettled(page)
  await settle(page, 300)
  await page.screenshot({ path: '/tmp/table-focus.png' })
  await dispatch(page, { type: 'EXAMINE', target: 'lowTable' })
  await settle(page, 300)
  await page.screenshot({ path: '/tmp/table-focus-msg.png' })
})
