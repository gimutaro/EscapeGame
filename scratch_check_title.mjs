import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['iPhone 12'] })
const page = await context.newPage()
await page.goto('http://localhost:5183/')
await page.waitForTimeout(600)
await page.screenshot({ path: '/private/tmp/claude-501/-Users-ryo-EscapeGame/635fd1cc-b80a-4ee1-b48d-858e96e423b5/scratchpad/title-mobile.png' })
await browser.close()
