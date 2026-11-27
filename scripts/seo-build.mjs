// Runs after `vite build` (see "build" in package.json).
//
// The website is a single-page React app: on its own, every address serves the same index.html with
// the same title, and Facebook / WhatsApp previews (which do not run JavaScript) look identical.
// This script gives each public page its own static HTML file with the right <head>:
//   dist/index.html, dist/calendar.html, dist/org/clinic.html, …   (GitHub Pages serves /calendar from calendar.html)
//   - title, description, canonical link
//   - Open Graph + Twitter tags (share previews)
//   - JSON-LD structured data (organisation, temples, clinic) for Google
// It also writes dist/sitemap.xml, dist/robots.txt and dist/404.html (fallback for /admin/... links, not indexed).
//
// The public address comes from VITE_SITE_URL (same variable the QR code uses).
// The Samiti's social media links (Facebook, YouTube, …) are read from the site settings in Supabase, as the
// admin dashboard saves them, and added to the structured data ("sameAs") so Google links the profiles to the site.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_SITE_URL, NOINDEX_PREFIXES, OG_IMAGE, ORG_ADDRESS, ORG_GEO, SEO_PAGES, SITE_NAME
} from '../src/seo-pages.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const siteUrl = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/*$/, '/')
const today = new Date().toISOString().slice(0, 10)

const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const pageUrl = path => path === '/' ? siteUrl : siteUrl + path.replace(/^\//, '')
const imageUrl = siteUrl + OG_IMAGE
// Photo of the Samiti office and Community Clinic building, for Google's organisation and clinic details
const officePhotoUrl = siteUrl + 'images/samiti-office-clinic.webp'

function fullTitle(page) {
  if (page.path === '/') return `${page.title.en} | ${SITE_NAME.bn}`
  const suffix = page.title.en.includes(SITE_NAME.en) ? '' : ` · ${SITE_NAME.en}`
  return `${page.title.en} | ${page.title.bn}${suffix}`
}

// Social media links from the admin dashboard (site_settings, publicly readable); skipped without Supabase
const SOCIAL_KEYS = ['facebook_url', 'youtube_url', 'instagram_url', 'tiktok_url']
async function readSocialLinks() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key || url.includes('example')) return []
  try {
    const query = `${url.replace(/\/$/, '')}/rest/v1/site_settings?select=key,value_en,value_bn&key=in.(${SOCIAL_KEYS.join(',')})`
    const response = await fetch(query, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const rows = await response.json()
    return rows.map(row => (row.value_en || row.value_bn || '').trim()).filter(link => /^https:\/\//.test(link))
  } catch (error) {
    console.warn(`seo-build: social links not added (${error.message})`)
    return []
  }
}
const socialLinks = await readSocialLinks()

const organisation = {
  '@type': 'NGO',
  '@id': siteUrl + '#organisation',
  name: SITE_NAME.en,
  alternateName: SITE_NAME.bn,
  url: siteUrl,
  logo: siteUrl + 'app-icon-512.png',
  image: officePhotoUrl,
  foundingDate: '1923',
  description: SEO_PAGES[0].description.en,
  address: { '@type': 'PostalAddress', ...ORG_ADDRESS },
  geo: { '@type': 'GeoCoordinates', ...ORG_GEO },
  ...(socialLinks.length ? { sameAs: socialLinks } : {})
}

function structuredData(page) {
  if (page.path === '/') {
    const subOrganization = SEO_PAGES.filter(p => p.schemaType).map(p => ({
      '@type': p.schemaType, name: p.title.en, alternateName: p.title.bn, url: pageUrl(p.path)
    }))
    return [
      { '@context': 'https://schema.org', ...organisation, subOrganization },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME.en, alternateName: SITE_NAME.bn, url: siteUrl, inLanguage: ['en', 'bn'] }
    ]
  }
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: SITE_NAME.en, item: siteUrl },
    { '@type': 'ListItem', position: 2, name: page.title.en, item: pageUrl(page.path) }
  ] }
  if (!page.schemaType) return [crumbs]
  return [crumbs, {
    '@context': 'https://schema.org',
    '@type': page.schemaType,
    name: page.title.en,
    alternateName: page.title.bn,
    description: page.description.en,
    url: pageUrl(page.path),
    image: page.path === '/org/clinic' ? officePhotoUrl : imageUrl,
    address: { '@type': 'PostalAddress', ...ORG_ADDRESS },
    geo: { '@type': 'GeoCoordinates', ...ORG_GEO },
    parentOrganization: { '@id': siteUrl + '#organisation', name: SITE_NAME.en }
  }]
}

function headTags(page, { noindex = false } = {}) {
  const title = fullTitle(page)
  const url = pageUrl(page.path)
  const description = `${page.description.en} ${page.description.bn}`
  const tags = [
    `<meta name="description" content="${esc(description)}" />`,
    noindex ? '<meta name="robots" content="noindex, nofollow" />' : `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME.en)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(page.description.bn)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(imageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(SITE_NAME.en)}" />`,
    `<meta property="og:locale" content="bn_BD" />`,
    `<meta property="og:locale:alternate" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description.en)}" />`,
    `<meta name="twitter:image" content="${esc(imageUrl)}" />`,
    `<meta name="geo.region" content="BD-B" />`,
    `<meta name="geo.placename" content="Dhoom, Mirsharai, Chattogram" />`,
    `<meta name="geo.position" content="${ORG_GEO.latitude};${ORG_GEO.longitude}" />`
  ]
  if (!noindex) for (const data of structuredData(page)) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
  }
  return { title, tags }
}

function renderPage(template, page, options) {
  const { title, tags } = headTags(page, options)
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
  html = html.replace(/\s*<\/head>/, `\n    ${tags.join('\n    ')}\n  </head>`)
  return html
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')
if (template.includes('property="og:title"')) {
  console.log('seo-build: dist/index.html already processed, skipping')
  process.exit(0)
}

for (const page of SEO_PAGES) {
  const file = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path.replace(/^\//, '') + '.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, renderPage(template, page))
}

// Fallback for every other address (e.g. /admin/dashboard): loads the app, but is never indexed
writeFileSync(join(dist, '404.html'), renderPage(template, SEO_PAGES[0], { noindex: true }))

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SEO_PAGES.map(page => `  <url>
    <loc>${esc(pageUrl(page.path))}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

const basePath = new URL(siteUrl).pathname
const robots = `User-agent: *
Allow: /
${NOINDEX_PREFIXES.map(prefix => `Disallow: ${basePath.replace(/\/$/, '')}${prefix}`).join('\n')}

Sitemap: ${siteUrl}sitemap.xml
`
writeFileSync(join(dist, 'robots.txt'), robots)

console.log(`seo-build: ${SEO_PAGES.length} pages, sitemap.xml and robots.txt written for ${siteUrl} (${socialLinks.length} social links)`)
