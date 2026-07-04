import { test } from '@playwright/test'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('飾り棚のガラス扉を確認', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 300)
  await page.evaluate(() => window.__game?.focus?.('fv-cabinet'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/cabinet-closed.png' })

  // ソファの鍵を取って棚を開ける
  await dispatch(page, { type: 'EXAMINE', target: 'sofa' })
  await settle(page, 200)
  await dispatch(page, { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' })
  await settle(page, 1500)
  await page.screenshot({ path: '/tmp/cabinet-open.png' })
})
