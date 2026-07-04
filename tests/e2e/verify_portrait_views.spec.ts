import { expect, test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 13 縦向き
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
})

const VIEWS = [
  { id: 'fv-sidetable', room: 'bedroom' },
  { id: 'fv-vanity', room: 'bedroom' },
  { id: 'fv-jewelry', room: 'bedroom' },
  { id: 'fv-wardrobe', room: 'bedroom' },
  { id: 'fv-byobu', room: 'bedroom' },
  { id: 'fv-table', room: 'living' },
  { id: 'fv-desk', room: 'study' },
  { id: 'fv-globe', room: 'study' },
  { id: 'fv-bookshelf', room: 'study' },
  { id: 'fv-safe', room: 'study' },
  { id: 'fv-fireplace', room: 'living' },
  { id: 'fv-clock', room: 'living' },
  { id: 'fv-cabinet', room: 'living' },
  { id: 'fv-piano', room: 'living' },
] as const

test('縦向きスマホで全フォーカスビューを確認', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await startNewGame(page)
  // OPEN_SAFE まで一括実行(エンディングに入る手前)。全部屋・全装置が解放された状態にする
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

  for (const { id: view, room } of VIEWS) {
    // 部屋同士は living を経由してのみ移動できる
    await dispatch(page, { type: 'MOVE_TO_ROOM', room: 'living' })
    await waitCameraSettled(page)
    if (room !== 'living') {
      await dispatch(page, { type: 'MOVE_TO_ROOM', room })
      await waitCameraSettled(page)
    }
    await page.evaluate((v) => window.__game?.focus?.(v as never), view)
    await waitCameraSettled(page)
    await page.evaluate(() => {
      const msg = document.querySelector('.message')
      if (msg && !msg.classList.contains('hidden')) (msg as HTMLElement).click()
    })
    await settle(page, 250)
    await page.screenshot({ path: `/tmp/portrait-${view}.png` })
  }
  expect(errors, `ページエラー: ${errors.join(' / ')}`).toHaveLength(0)
})
