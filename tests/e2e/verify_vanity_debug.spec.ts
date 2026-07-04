import { test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
})

test('鏡台ビューのカメラ状態をデバッグ', async ({ page }) => {
  await startNewGame(page)
  for (const action of SOLUTION_STEPS) {
    if (action.type === 'NEW_GAME' || action.type === 'PROLOGUE_DONE') continue
    await dispatch(page, action)
    if (action.type === 'OPEN_SAFE') break
  }
  await settle(page, 300)
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
  await page.evaluate(() => window.__game?.focus?.('fv-vanity'))
  await waitCameraSettled(page)
  await settle(page, 300)
  const info = await page.evaluate(() => {
    const c = window.__game?.camera?.()
    return c
  })
  console.log('CAMERA INFO', JSON.stringify(info))
})
