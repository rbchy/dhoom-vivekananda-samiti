import { chromium } from '@playwright/test'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' })
for (const w of [320, 360, 390, 412, 540]) {
  const p = await b.newPage({ viewport: { width: w, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await p.route('https://example.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await p.goto('http://localhost:4199/'); await p.waitForTimeout(1200)
  const box = await p.locator('.menu-toggle').boundingBox()
  const sw = await p.evaluate(() => document.documentElement.scrollWidth)
  console.log(w, 'toggle right edge', Math.round(box.x + box.width), 'page width', sw)
  await p.locator('.header').screenshot({ path: `/tmp/h${w}.png` })
  if (w === 390) { await p.locator('.menu-toggle').tap(); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/m390.png' }) }
  await p.close()
}
await b.close()
