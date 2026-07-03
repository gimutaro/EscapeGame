import type { Page } from '@playwright/test'
import type { Action } from '../../src/core/actions'

/** E2E 共通ヘルパー: ゲーム内フックを通じて操作する */

export const dispatch = async (page: Page, action: Action): Promise<void> => {
  await page.evaluate((a) => {
    window.__game?.dispatch(a as never)
  }, action as never)
}

export const getState = async (page: Page): Promise<Record<string, unknown>> =>
  page.evaluate(() => window.__game?.getState() as unknown as Record<string, unknown>)

export const startNewGame = async (page: Page): Promise<void> => {
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).click()
  await page.getByRole('button', { name: 'とばす ≫' }).click()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
}

/** 描画が落ち着くまで数フレーム待つ */
export const settle = async (page: Page, ms = 900): Promise<void> => {
  await page.waitForTimeout(ms)
}

/** カメラ遷移の完了を待つ(ヘッドレスの低フレームレートでも確実) */
export const waitCameraSettled = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => window.__game?.camera?.().mode !== 'transition', undefined, {
    timeout: 15_000,
  })
}
