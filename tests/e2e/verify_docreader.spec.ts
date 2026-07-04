import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame } from './shots'

test('文書リーダーの縦書き配置(短い文書)を確認', async ({ page }) => {
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    await dispatch(page, action)
    if (action.type === 'USE_ITEM' && action.item === 'blankLetter') break
  }
  await settle(page, 500)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.getByRole('button', { name: 'おぼえがき' }).click()
  await settle(page, 300)
  await page.getByText('あぶり出しの便箋').click()
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/docreader-short.png' })
})
