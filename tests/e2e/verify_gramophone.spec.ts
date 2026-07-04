import { test } from '@playwright/test'
import { dispatch, getState, settle, startNewGame } from './shots'

test('蓄音機の位置と向きを確認', async ({ page }) => {
  test.setTimeout(120_000)
  await startNewGame(page)
  await settle(page, 500)

  await dispatch(page, { type: 'EXAMINE', target: 'gramophone' })
  await settle(page, 300)
  const state = (await getState(page)) as { flags: Record<string, unknown> }
  console.log('examine result ok, flags keys:', Object.keys(state.flags).length)

  for (let i = 0; i < 10; i++) {
    await page.screenshot({ path: `/tmp/gsweep-${i}.png` })
    await page.mouse.move(640, 400)
    await page.mouse.down()
    await page.mouse.move(640 + 350, 400, { steps: 15 })
    await page.mouse.up()
    await settle(page, 350)
  }
})
