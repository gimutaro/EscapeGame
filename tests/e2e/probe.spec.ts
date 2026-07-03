import { test, type Page } from '@playwright/test'
import { JEWELRY_ANSWER, SAFE_ANSWER } from '../../src/core/constants'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

const SHOT_DIR = process.env.SHOT_DIR ?? 'test-results/probe'

const closeModals = async (page: Page) => {
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(100)
  }
}

/** ダイヤル表示値と地球儀の向きを画で検証するための採取 */
test('装置の目盛り較正プローブ', async ({ page }) => {
  test.setTimeout(180_000)
  await startNewGame(page)
  // 寝室まで進める
  for (const action of SOLUTION_STEPS) {
    if (action.type === 'NEW_GAME' || action.type === 'PROLOGUE_DONE') continue
    await dispatch(page, action)
    if (action.type === 'MOVE_TO_ROOM' && action.room === 'bedroom') break
  }
  // 宝石箱を正解値(5・3・7)に合わせて表示を確認
  await dispatch(page, { type: 'SET_JEWELRY_DIAL', index: 0, value: JEWELRY_ANSWER[0] })
  await dispatch(page, { type: 'SET_JEWELRY_DIAL', index: 1, value: JEWELRY_ANSWER[1] })
  await dispatch(page, { type: 'SET_JEWELRY_DIAL', index: 2, value: JEWELRY_ANSWER[2] })
  await closeModals(page)
  await page.evaluate(() => window.__game?.focus?.('fv-jewelry'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: `${SHOT_DIR}/jewelry-537.png` })

  // 箪笥(開いた状態の見え方)
  await dispatch(page, { type: 'EXAMINE', target: 'wardrobe' })
  await closeModals(page)
  await page.evaluate(() => window.__game?.focus?.('fv-wardrobe'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: `${SHOT_DIR}/wardrobe-open.png` })

  // 書斎へ進めて金庫(4・5・4)と地球儀(yaw=0)を確認
  for (const action of SOLUTION_STEPS) {
    if (action.type === 'NEW_GAME' || action.type === 'PROLOGUE_DONE') continue
    await dispatch(page, action)
    if (action.type === 'USE_ITEM' && action.item === 'safeKey') break
  }
  await dispatch(page, { type: 'SET_SAFE_DIAL', index: 0, value: SAFE_ANSWER[0] })
  await dispatch(page, { type: 'SET_SAFE_DIAL', index: 1, value: SAFE_ANSWER[1] })
  await dispatch(page, { type: 'SET_SAFE_DIAL', index: 2, value: SAFE_ANSWER[2] })
  await closeModals(page)
  await page.evaluate(() => window.__game?.focus?.('fv-safe'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: `${SHOT_DIR}/safe-454.png` })

  await page.evaluate(() => window.__game?.back?.())
  await waitCameraSettled(page)
  await dispatch(page, { type: 'ROTATE_GLOBE', yaw: 0 })
  await closeModals(page)
  await page.evaluate(() => window.__game?.focus?.('fv-globe'))
  await waitCameraSettled(page)
  await settle(page, 400)
  await page.screenshot({ path: `${SHOT_DIR}/globe-yaw0.png` })
})
