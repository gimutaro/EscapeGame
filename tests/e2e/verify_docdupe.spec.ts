import { expect, test } from '@playwright/test'
import { dispatch, settle, startNewGame } from './shots'

test('文書は2回目以降モーダルを再表示しない', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 300)

  await dispatch(page, { type: 'EXAMINE', target: 'lowTable' })
  await settle(page, 400)
  await expect(page.locator('.modal')).toBeVisible()
  await page.getByRole('button', { name: '閉じる' }).click()
  await settle(page, 200)

  await dispatch(page, { type: 'EXAMINE', target: 'lowTable' })
  await settle(page, 400)
  await expect(page.locator('.modal')).toHaveCount(0)
})
