import { expect, test } from '@playwright/test'
import { dispatch, settle, startNewGame } from './shots'

const FIREPLACE_TEXT = '大理石の暖炉。薪が組んであるが、火は入っていない。'

const waitTyped = async (page: import('@playwright/test').Page, text: string): Promise<void> => {
  await page.waitForFunction(
    (t) => document.querySelector('.message')?.textContent === t,
    text,
    { timeout: 20_000 },
  )
}

test('メッセージは自動で消えず、同じ操作の再実行かクリックで閉じる', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 300)
  const message = page.locator('.message')

  // 1回目: 全文表示された後、3秒待っても消えない
  await dispatch(page, { type: 'EXAMINE', target: 'fireplace' })
  await waitTyped(page, FIREPLACE_TEXT)
  await settle(page, 3000)
  await expect(message).toBeVisible()

  // 同じ操作をもう一度 → 消える
  await dispatch(page, { type: 'EXAMINE', target: 'fireplace' })
  await settle(page, 300)
  await expect(message).toBeHidden()

  // もう一度表示して全文まで待ち、ウィンドウ自体のクリックでも消える
  await dispatch(page, { type: 'EXAMINE', target: 'fireplace' })
  await waitTyped(page, FIREPLACE_TEXT)
  await message.click()
  await settle(page, 200)
  await expect(message).toBeHidden()

  // 違う内容が来たら置き換えて表示される
  await dispatch(page, { type: 'EXAMINE', target: 'clock' })
  await settle(page, 300)
  await expect(message).toBeVisible()
})
