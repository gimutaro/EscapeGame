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

test('画面の何もない場所をクリックしてもメッセージが閉じる', async ({ page }) => {
  await startNewGame(page)
  await settle(page, 300)
  const message = page.locator('.message')

  await dispatch(page, { type: 'EXAMINE', target: 'fireplace' })
  await waitTyped(page, FIREPLACE_TEXT)
  await expect(message).toBeVisible()

  // 画面左上の何もない壁紙部分をクリック
  await page.mouse.click(80, 80)
  await settle(page, 200)
  await expect(message).toBeHidden()
})
