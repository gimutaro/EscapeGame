import { test } from '@playwright/test'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test('デスクトップ(横長)での鏡台ビュー確認', async ({ page }) => {
  await startNewGame(page)
  await dispatch(page, { type: 'EXAMINE', target: 'lowTable' })
  await dispatch(page, { type: 'EXAMINE', target: 'sofa' })
  await dispatch(page, { type: 'USE_ITEM', item: 'brassKey', target: 'cabinet' })
  await dispatch(page, { type: 'EXAMINE', target: 'painting' })
  await dispatch(page, { type: 'USE_ITEM', item: 'matchbox', target: 'fireplace' })
  await dispatch(page, { type: 'USE_ITEM', item: 'blankLetter', target: 'fireplace' })
  await dispatch(page, { type: 'SET_CLOCK', hour: 4, minute: 10 })
  await dispatch(page, { type: 'USE_ITEM', item: 'bedroomKey', target: 'doorBedroom' })
  await dispatch(page, { type: 'MOVE_TO_ROOM', room: 'bedroom' })
  await settle(page, 300)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.evaluate(() => window.__game?.focus?.('fv-vanity'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: '/tmp/desktop-vanity.png' })
})
