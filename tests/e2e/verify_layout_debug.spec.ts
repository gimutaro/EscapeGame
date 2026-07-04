import { test } from '@playwright/test'

test.use({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
})

test('レイアウト崩れのデバッグ(回転後のDOM重複チェック)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる' }).tap()
  await page.getByRole('button', { name: 'とばす ≫' }).tap()
  await page.waitForFunction(() => window.__game?.getState().phase === 'playing')
  await page.waitForTimeout(400)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  const info = await page.evaluate(() => {
    const rect = (el: Element | null) => (el ? el.getBoundingClientRect() : null)
    return {
      hudBtnCount: document.querySelectorAll('.hud-btn').length,
      hudTopCount: document.querySelectorAll('.hud-top').length,
      canvasCount: document.querySelectorAll('canvas').length,
      hudTop: rect(document.querySelector('.hud-top')),
      inventory: rect(document.querySelector('.inventory')),
      slotCount: document.querySelectorAll('.slot').length,
      allHudBtnRects: [...document.querySelectorAll('.hud-btn')].map((s) => ({
        text: s.textContent,
        rect: rect(s),
      })),
      bodyChildCount: document.body.children.length,
      appHTML: document.getElementById('app')?.innerHTML.length,
    }
  })
  console.log(JSON.stringify(info, null, 2))
  await page.screenshot({ path: '/tmp/layout-debug.png' })
})
