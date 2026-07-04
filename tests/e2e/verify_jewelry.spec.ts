import { expect, test, type Page } from '@playwright/test'
import { dispatch, getState, settle, startNewGame, waitCameraSettled } from './shots'

type Snapshot = { jewelryDials: number[]; flags: Record<string, boolean> }

const snap = async (page: Page): Promise<Snapshot> => (await getState(page)) as Snapshot

/** ワールド座標を画面座標へ投影してクリックする */
const clickWorld = async (page: Page, x: number, y: number, z: number, times = 1): Promise<void> => {
  const pt = await page.evaluate(
    ([wx, wy, wz]) => window.__game?.project?.(wx!, wy!, wz!) ?? null,
    [x, y, z],
  )
  if (!pt) throw new Error('project() が使えません')
  for (let i = 0; i < times; i++) {
    await page.mouse.click(pt.x, pt.y)
    await settle(page, 120)
  }
}

// 宝石箱: ワールド座標(寝室 CX=7、鏡台の上。JEWEL_Z=1.2)
const DIAL_X = 9.66 // ダイヤル当たり判定の前面付近
const JEWEL_Z = 1.3
const LATCH = { x: 9.66, y: 0.916, z: JEWEL_Z } // 蓋の「開ける」留め金の中心
const dialPos = (i: number) => ({ x: DIAL_X, y: 0.808, z: JEWEL_Z + (i - 1) * 0.1 })

test('宝石箱を実クリックだけで解錠できる', async ({ page }) => {
  await startNewGame(page)
  await dispatch(page, { type: 'MOVE_TO_ROOM', room: 'bedroom' })
  await settle(page, 300)
  await page.evaluate(() => window.__game?.focus?.('fv-jewelry'))
  await waitCameraSettled(page)
  await settle(page, 300)
  await page.screenshot({ path: '/tmp/jewelry-design.png' })

  // 桜5・梅3・菊7(正解値)をクリックで合わせる
  const answer = [5, 3, 7] as const
  for (const [i, count] of answer.entries()) {
    const p = dialPos(i)
    await clickWorld(page, p.x, p.y, p.z, count)
  }
  expect((await snap(page)).jewelryDials).toEqual([5, 3, 7])
  await page.screenshot({ path: '/tmp/jewelry-set.png' })

  // 「開ける」の銘板を押す
  await clickWorld(page, LATCH.x, LATCH.y, LATCH.z)
  await settle(page, 900)
  const after = await snap(page)
  expect(after.jewelryDials).toEqual([5, 3, 7])
  expect(after.flags['jewelrySolved']).toBe(true)
  await page.screenshot({ path: '/tmp/jewelry-solved.png' })
})
