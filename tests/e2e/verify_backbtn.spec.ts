import { test } from '@playwright/test'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('通常メッセージ表示時の重なり確認', async ({ page }) => {
  await startNewGame(page)
  await page.evaluate(() => window.__game?.focus?.('fv-fireplace'))
  await waitCameraSettled(page)
  await dispatch(page, { type: 'EXAMINE', target: 'fireplace' })
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/backbtn-plain-message.png' })
})
