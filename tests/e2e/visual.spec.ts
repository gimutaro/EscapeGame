import { test, type Page } from '@playwright/test'
import { SOLUTION_STEPS } from '../../src/core/solution'
import { dispatch, settle, startNewGame, waitCameraSettled } from './shots'

const SHOT_DIR = process.env.SHOT_DIR ?? 'test-results/shots'

const closeModals = async (page: Page) => {
  const close = page.getByRole('button', { name: '閉じる' })
  while (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(120)
  }
}

const focusView = async (page: Page, view: string) => {
  await page.evaluate((v) => window.__game?.focus?.(v), view)
  await waitCameraSettled(page)
  await settle(page, 300)
}

const backToRoom = async (page: Page) => {
  await page.evaluate(() => window.__game?.back?.())
  await waitCameraSettled(page)
  await settle(page, 200)
}

const shot = async (page: Page, name: string) => {
  await closeModals(page)
  await settle(page, 300)
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png` })
}

/** 視覚検証用のスクリーンショット採取 */
test('全景・全ギミックのスクリーンショット採取', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await settle(page, 1500)
  await page.screenshot({ path: `${SHOT_DIR}/00-title.png` })

  await startNewGame(page)
  await settle(page, 1200)
  await shot(page, '01-living-north')

  const upto = async (predicate: (a: (typeof SOLUTION_STEPS)[number]) => boolean) => {
    for (const action of SOLUTION_STEPS) {
      if (action.type === 'NEW_GAME' || action.type === 'PROLOGUE_DONE') continue
      await dispatch(page, action)
      if (predicate(action)) break
    }
  }

  // 火の入った暖炉と注視ビュー
  await upto((a) => a.type === 'USE_ITEM' && a.item === 'matchbox')
  await closeModals(page)
  await focusView(page, 'fv-fireplace')
  await shot(page, '02-fv-fireplace')
  await focusView(page, 'fv-clock')
  await shot(page, '03-fv-clock')
  await focusView(page, 'fv-cabinet')
  await shot(page, '04-fv-cabinet')
  await focusView(page, 'fv-piano')
  await shot(page, '05-fv-piano')
  await focusView(page, 'fv-table')
  await shot(page, '06-fv-table')
  await backToRoom(page)

  // 南側(玄関・欄間)
  await page.mouse.move(640, 400)
  await page.mouse.down()
  await page.mouse.move(1400, 420, { steps: 18 })
  await page.mouse.up()
  await page.mouse.down()
  await page.mouse.move(1400, 400, { steps: 18 })
  await page.mouse.up()
  await settle(page, 700)
  await shot(page, '07-living-south')

  // 寝室
  await upto((a) => a.type === 'MOVE_TO_ROOM' && a.room === 'bedroom')
  await settle(page, 700)
  await shot(page, '08-bedroom-east')
  await focusView(page, 'fv-vanity')
  await shot(page, '09-fv-vanity-mirror')
  await focusView(page, 'fv-byobu')
  await shot(page, '10-fv-byobu')
  await focusView(page, 'fv-jewelry')
  await shot(page, '11-fv-jewelry')
  await upto((a) => a.type === 'EXAMINE' && a.target === 'wardrobe')
  await closeModals(page)
  await focusView(page, 'fv-wardrobe')
  await shot(page, '12-fv-wardrobe-kimono')
  await backToRoom(page)

  // 書斎
  await upto((a) => a.type === 'MOVE_TO_ROOM' && a.room === 'study')
  await settle(page, 700)
  await shot(page, '13-study-west')
  await focusView(page, 'fv-desk')
  await shot(page, '14-fv-desk')
  await focusView(page, 'fv-bookshelf')
  await shot(page, '15-fv-bookshelf')
  await focusView(page, 'fv-globe')
  await shot(page, '16-fv-globe')
  await backToRoom(page)

  // 消灯(夜光文字が机上の壁に見える向きで)
  await dispatch(page, { type: 'TOGGLE_STUDY_LIGHT' })
  await closeModals(page)
  await page.mouse.move(640, 400)
  await page.mouse.down()
  await page.mouse.move(900, 430, { steps: 10 })
  await page.mouse.up()
  await settle(page, 900)
  await shot(page, '17-study-dark-glow')
  await dispatch(page, { type: 'TOGGLE_STUDY_LIGHT' })

  // 金庫(肖像画を開けてから)
  await upto((a) => a.type === 'EXAMINE' && a.target === 'portrait')
  await closeModals(page)
  await focusView(page, 'fv-safe')
  await shot(page, '18-fv-safe')
  await backToRoom(page)
})
