import { test } from '@playwright/test'
import { settle, startNewGame } from './shots'

test('リビングの窓の桟を確認', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 300)
  await page.mouse.move(640, 400)
  await page.mouse.down()
  await page.mouse.move(1250, 400, { steps: 20 })
  await page.mouse.up()
  await settle(page, 600)
  await page.screenshot({ path: '/tmp/window-living.png' })
})
