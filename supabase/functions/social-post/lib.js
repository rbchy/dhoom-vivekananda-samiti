// Pure logic for the social-post Edge Function (no Deno APIs, so Node can test it).
// Everything that talks to the outside world (Graph API, database) is passed in.

export const DEFAULT_GRAPH_VERSION = 'v25.0'
export const TARGETS = ['facebook', 'instagram']

const LABELS = {
  en: { date: 'Date', opens: 'Temple opens', puja: 'Puja starts', closes: 'Closes', place: 'Place' },
  bn: { date: 'তারিখ', opens: 'মন্দির খোলা', puja: 'পূজা শুরু', closes: 'বন্ধ', place: 'স্থান' }
}

function pick(item, field, lang) {
  return lang === 'bn' ? (item[`${field}_bn`] || item[`${field}_en`]) : (item[`${field}_en`] || item[`${field}_bn`])
}

function formatDate(value, locale) {
  if (!value) return ''
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.valueOf())) return String(value)
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function formatTime(value) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  if (Number.isNaN(h)) return ''
  const hour = ((h + 11) % 12) + 1
  return `${hour}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function block(kind, item, lang) {
  const L = LABELS[lang]
  const lines = []
  const title = pick(item, 'title', lang)
  if (title) lines.push(`🪔 ${title}`)
  if (kind === 'event') {
    if (item.event_date) lines.push(`📅 ${L.date}: ${formatDate(item.event_date, lang === 'bn' ? 'bn-BD' : 'en-GB')}`)
    if (item.opens_at) lines.push(`🕉️ ${L.opens}: ${formatTime(item.opens_at)}`)
    if (item.puja_starts_at) lines.push(`🔔 ${L.puja}: ${formatTime(item.puja_starts_at)}`)
    if (item.closes_at) lines.push(`🌙 ${L.closes}: ${formatTime(item.closes_at)}`)
    if (item.location) lines.push(`📍 ${L.place}: ${item.location}`)
    const description = pick(item, 'description', lang)
    if (description) lines.push('', description)
  } else {
    const message = pick(item, 'message', lang)
    if (message) lines.push('', message)
  }
  return lines.join('\n')
}

export function postLink(siteUrl, kind, id) {
  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
  return kind === 'event' ? `${base}?event=${encodeURIComponent(id)}#events` : `${base}?notice=${encodeURIComponent(id)}#notices`
}

// Caption for Facebook / Instagram. language: 'both' | 'bn' | 'en'
export function buildCaption(kind, item, { language = 'both', siteUrl = '', hashtags = '' } = {}) {
  const parts = language === 'both' ? [block(kind, item, 'bn'), block(kind, item, 'en')] : [block(kind, item, language === 'bn' ? 'bn' : 'en')]
  let text = [...new Set(parts.filter(Boolean))].join('\n\n— — —\n\n')
  if (siteUrl) text += `\n\n🔗 ${postLink(siteUrl, kind, item.id)}`
  if (hashtags) text += `\n\n${hashtags.trim()}`
  return text.slice(0, 2200) // Instagram caption limit
}

export function isJpegUrl(url) {
  if (!url) return false
  try {
    const path = new URL(url).pathname.toLowerCase()
    return path.endsWith('.jpg') || path.endsWith('.jpeg')
  } catch {
    return false
  }
}

// Instagram needs a public JPEG. Use the post's own photo when it is one, otherwise the fallback.
export function instagramImage(item, fallbackImageUrl) {
  return isJpegUrl(item.image_url) ? item.image_url : fallbackImageUrl
}

async function graph(fetchFn, version, path, params) {
  const response = await fetchFn(`https://graph.facebook.com/${version}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  })
  let data = {}
  try { data = await response.json() } catch { /* empty body */ }
  if (!response.ok || data.error) {
    const message = data.error?.message || `Graph API HTTP ${response.status}`
    throw new Error(message)
  }
  return data
}

// Facebook Page: a photo post when there is an image, otherwise a text post with the link.
export async function postToFacebook({ fetchFn, version, pageId, pageToken, caption, imageUrl, link }) {
  if (imageUrl) {
    const data = await graph(fetchFn, version, `${pageId}/photos`, { url: imageUrl, caption, access_token: pageToken })
    return data.post_id || data.id
  }
  const data = await graph(fetchFn, version, `${pageId}/feed`, { message: caption, link, access_token: pageToken })
  return data.id
}

// Instagram: create a media container, wait until it is ready, then publish it.
export async function postToInstagram({ fetchFn, version, igUserId, pageToken, caption, imageUrl, sleep = ms => new Promise(r => setTimeout(r, ms)) }) {
  if (!imageUrl) throw new Error('Instagram needs a JPEG image')
  const container = await graph(fetchFn, version, `${igUserId}/media`, { image_url: imageUrl, caption, access_token: pageToken })
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetchFn(`https://graph.facebook.com/${version}/${container.id}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`)
    const status = await response.json().catch(() => ({}))
    if (status.status_code === 'FINISHED' || status.status_code === undefined) break
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') throw new Error(`Instagram could not process the image (${status.status_code})`)
    await sleep(1500)
  }
  const published = await graph(fetchFn, version, `${igUserId}/media_publish`, { creation_id: container.id, access_token: pageToken })
  return published.id
}

export function validateRequest(body) {
  const errors = []
  if (!body || typeof body !== 'object') return ['Missing request body']
  if (!['event', 'notice'].includes(body.kind)) errors.push('kind must be "event" or "notice"')
  if (!body.id || typeof body.id !== 'string') errors.push('id is required')
  const targets = Array.isArray(body.targets) ? body.targets : []
  if (targets.length === 0 || targets.some(t => !TARGETS.includes(t))) errors.push('targets must be ["facebook"], ["instagram"] or both')
  if (body.language && !['both', 'bn', 'en'].includes(body.language)) errors.push('language must be both, bn or en')
  return errors
}

// The whole job, with every outside dependency injected.
//   deps.getRole()                → 'admin' | 'accounts_admin' | 'secretary' | null
//   deps.loadItem(kind, id)       → row or null
//   deps.alreadyPosted(kind, id, target) → boolean
//   deps.log(entry)               → stores one result row
//   deps.fetchFn, deps.config     → Graph API access
export async function handleSocialPost(body, deps) {
  const errors = validateRequest(body)
  if (errors.length) return { status: 400, body: { error: errors.join('; ') } }

  const role = await deps.getRole()
  if (role !== 'admin') return { status: 403, body: { error: 'Only the main admin can post to social media' } }

  const item = await deps.loadItem(body.kind, body.id)
  if (!item) return { status: 404, body: { error: 'Post not found' } }
  if (item.is_published === false) return { status: 409, body: { error: 'Publish the post on the website first' } }

  const { config } = deps
  const caption = buildCaption(body.kind, item, { language: body.language || 'both', siteUrl: config.siteUrl, hashtags: config.hashtags })
  const link = config.siteUrl ? postLink(config.siteUrl, body.kind, item.id) : undefined
  const results = []

  for (const target of body.targets) {
    if (!body.force && await deps.alreadyPosted(body.kind, item.id, target)) {
      results.push({ target, status: 'skipped', error: 'Already posted (tick "post again" to repeat)' })
      continue
    }
    try {
      let remoteId
      if (target === 'facebook') {
        if (!config.pageId || !config.pageToken) throw new Error('Facebook Page is not set up (META_PAGE_ID / META_PAGE_TOKEN)')
        remoteId = await postToFacebook({ fetchFn: deps.fetchFn, version: config.version, pageId: config.pageId, pageToken: config.pageToken, caption, imageUrl: item.image_url || null, link })
      } else {
        if (!config.igUserId || !config.pageToken) throw new Error('Instagram is not set up (META_IG_USER_ID / META_PAGE_TOKEN)')
        remoteId = await postToInstagram({ fetchFn: deps.fetchFn, version: config.version, igUserId: config.igUserId, pageToken: config.pageToken, caption, imageUrl: instagramImage(item, config.fallbackImageUrl), sleep: deps.sleep })
      }
      results.push({ target, status: 'posted', remote_id: String(remoteId) })
    } catch (error) {
      results.push({ target, status: 'failed', error: String(error.message || error).slice(0, 500) })
    }
  }

  for (const r of results) {
    if (r.status !== 'skipped') await deps.log({ kind: body.kind, item_id: item.id, target: r.target, status: r.status, remote_id: r.remote_id || null, error: r.error || null })
  }
  const anyFailed = results.some(r => r.status === 'failed')
  return { status: anyFailed ? 207 : 200, body: { results } }
}
