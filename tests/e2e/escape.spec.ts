import { expect, test } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, startNewGame } from './shots'

/**
 * 実ブラウザでの自動全行程クリアテスト(AC-01 の E2E 側)。
 * タイトル → プロローグ → 正規攻略 → エンディング → リザルトまで到達することを保証する。
 * ミュート相当(音なし)でも完走できることの検証を兼ねる(R-9)。
 */
test('タイトルから脱出・リザルトまで完走できる', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))

  await startNewGame(page)

  // UI 起点の操作を一部確認(ソファ調査に相当する EXAMINE)
  await dispatch(page, { type: 'EXAMINE', target: 'lowTable' })
  await expect(page.locator('.modal')).toBeVisible()
  await page.getByRole('button', { name: '閉じる' }).click()

  // 正規攻略手順(solution.ts と同一の単一情報源)を実行
  for (const action of SOLUTION_STEPS) {
    if (action.type === 'NEW_GAME' || action.type === 'PROLOGUE_DONE') continue
    if (action.type === 'ENDING_DONE') break
    await dispatch(page, action)
  }

  // 白フェード → エピローグが始まる
  await page.waitForFunction(() => window.__game?.getState().phase === 'ending', undefined, {
    timeout: 15_000,
  })
  await page.getByRole('button', { name: 'とばす ≫' }).click()

  // リザルト表示
  await page.waitForFunction(() => window.__game?.getState().phase === 'result')
  await expect(page.locator('.result-panel')).toBeVisible()
  await expect(page.locator('.result-panel h2')).toContainText(/名探偵|推理|帰還/)

  // 実行中に JS エラーがないこと
  expect(errors, `ページエラー: ${errors.join(' / ')}`).toHaveLength(0)
})

test('ヒントとおぼえがきが機能する', async ({ page }) => {
  await startNewGame(page)
  await page.getByRole('button', { name: '？ ヒント' }).click()
  await expect(page.locator('.hint-item')).toHaveCount(1)
  await page.getByRole('button', { name: 'ヒントを見る' }).click()
  await expect(page.locator('.hint-stage').first()).toBeVisible()
  await page.getByRole('button', { name: '閉じる' }).click()

  await page.getByRole('button', { name: 'おぼえがき' }).click()
  await expect(page.locator('.modal')).toBeVisible()
})
