// Tells Bing, Yandex, Seznam, Naver and other IndexNow search engines that the website's pages changed,
// so they visit them again soon instead of waiting for their next crawl. Runs after each deploy (deploy.yml).
//
// IndexNow (https://www.indexnow.org) checks that we own the site through the key file in public/:
//   public/ee96c4a73c3e9b15c65753aefe54d5dc.txt  (its content is the key itself; the key is public by design)
// Because the site lives in a sub-folder on GitHub Pages, the key file sits in the same sub-folder and only
// addresses under it are submitted. The list of addresses is read from dist/sitemap.xml.
//
// A failure here never stops the deploy: the pages are already published, search engines just find them later.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_SITE_URL } from '../src/seo-pages.js'

export const INDEXNOW_KEY = 'ee96c4a73c3e9b15c65753aefe54d5dc'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const siteUrl = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/*$/, '/')
const host = new URL(siteUrl).host

const sitemap = readFileSync(join(root, 'dist', 'sitemap.xml'), 'utf8')
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
  .filter(url => url.startsWith(siteUrl))

if (!urlList.length) {
  console.log('indexnow: no addresses in dist/sitemap.xml, nothing to send')
  process.exit(0)
}

try {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${siteUrl}${INDEXNOW_KEY}.txt`, urlList }),
    signal: AbortSignal.timeout(20000)
  })
  // 200 = accepted, 202 = accepted (key still being checked); anything else is reported but not fatal
  console.log(`indexnow: sent ${urlList.length} addresses for ${host} — HTTP ${response.status}`)
  if (response.status >= 400) console.log(await response.text())
} catch (error) {
  console.log(`indexnow: could not reach the IndexNow service (${error.message})`)
}
