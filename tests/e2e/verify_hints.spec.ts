import { test } from '@playwright/test'
import { settle, startNewGame } from './shots'

test('ヒントは1項目のみ・ボタンが最初から見える', async ({ page }) => {
  await startNewGame(page)
  await page.getByRole('button', { name: 'ヒント' }).click()
  await settle(page, 300)
  // 項目クリックなしで「ヒントを見る」が押せる
  await page.getByRole('button', { name: 'ヒントを見る' }).click()
  await page.getByRole('button', { name: 'もっと見る' }).click()
  await page.getByRole('button', { name: 'もっと見る' }).click()
  await settle(page, 300)
  await page.screenshot({ path: '/tmp/hints-check.png' })
})
