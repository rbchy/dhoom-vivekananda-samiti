// After `vite build --mode demo`: put the files from public/ that the page uses straight into
// dist-demo/index.html, add a "demo" ribbon, and save it as dist-demo/dhoom-vivekananda-samiti-demo.html.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const dir = new URL('../dist-demo/', import.meta.url)
let html = readFileSync(new URL('index.html', dir), 'utf8')
const TYPES = { svg: 'image/svg+xml', jpg: 'image/jpeg', webp: 'image/webp', png: 'image/png', ico: 'image/x-icon' }
const dataUri = name => `data:${TYPES[name.split('.').pop()]};base64,${readFileSync(new URL(name, dir)).toString('base64')}`

// The <picture> keeps the WebP source; the JPEG fallback points at the same WebP to avoid storing the photo twice
html = html.replaceAll('./images/belur-math-front.jpg', './images/belur-math-front.webp')
html = html.replace(/<link rel="manifest"[^>]*>\s*/, '').replace(/<link rel="icon" href="\.\/favicon\.ico"[^>]*>\s*/, '')
for (const name of ['emblem.svg', 'favicon.svg', 'apple-touch-icon.png', 'hero-banner-belur.webp', 'temple-photo.webp', 'images/belur-math-front.webp']) {
  if (!existsSync(new URL(name, dir))) continue
  const uri = dataUri(name)
  html = html.replaceAll(`./${name}`, uri)
}
const leftover = html.match(/["'`(]\.\/[\w./-]+\.(svg|jpg|png|webp|ico|webmanifest)/g)
if (leftover) console.warn('Not inlined:', [...new Set(leftover)])

const ribbon = `<div style="position:fixed;z-index:9999;top:0;left:50%;transform:translateX(-50%);background:#811d29;color:#fff3dc;font:600 12px/1 system-ui,sans-serif;letter-spacing:.5px;padding:6px 14px;border-radius:0 0 10px 10px;box-shadow:0 3px 10px rgba(0,0,0,.25);pointer-events:none">DEMO · নমুনা তথ্য</div>`
html = html.replace('<body>', `<body>\n${ribbon}`)
const out = new URL('dhoom-vivekananda-samiti-demo.html', dir)
writeFileSync(out, html)
console.log(`Demo page: dist-demo/dhoom-vivekananda-samiti-demo.html (${(html.length / 1024 / 1024).toFixed(2)} MB)`)
