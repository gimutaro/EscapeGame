import { expect, test } from '@playwright/test'
import { settle, startNewGame } from './shots'

test('設定は音量2項目のみ', async ({ page }) => {
  await startNewGame(page)
  await page.getByRole('button', { name: '設 定' }).click()
  await settle(page, 300)
  await expect(page.locator('.setting-row')).toHaveCount(2)
  await page.screenshot({ path: '/tmp/settings-check.png' })
})
