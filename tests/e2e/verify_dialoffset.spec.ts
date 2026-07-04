import { test } from '@playwright/test'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('ダイヤル数字の縦位置を確認', async ({ page }) => {
  await startNewGame(page)
  await dispatch(page, { type: 'MOVE_TO_ROOM', room: 'bedroom' })
  await settle(page, 300)
  await page.evaluate(() => window.__game?.focus?.('fv-jewelry'))
  await waitCameraSettled(page)
  await settle(page, 300)
  for (const v of [0, 3, 6, 9]) {
    await dispatch(page, { type: 'SET_JEWELRY_DIAL', index: 1, value: v })
    await settle(page, 250)
    await page.screenshot({ path: `/tmp/dial-offset-v${v}.png`, clip: { x: 500, y: 350, width: 120, height: 110 } })
  }
})
