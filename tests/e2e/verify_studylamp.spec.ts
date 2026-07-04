import { test } from '@playwright/test'
import { settle, startNewGame, waitCameraSettled } from './shots'

test('書斎のバンカーズランプ確認', async ({ page }) => {
  await startNewGame(page)
  await page.evaluate(() => window.__game?.focus?.('fv-desk'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/studylamp-check.png' })
})
