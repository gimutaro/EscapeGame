import { test } from '@playwright/test'
import { settle, startNewGame } from './shots'

test('暖炉まわりのライト確認', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 600)
  await page.screenshot({ path: '/tmp/fireplace.png' })
})
