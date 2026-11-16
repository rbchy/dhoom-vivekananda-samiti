// Unit tests for the social-post logic — run with:  node --test supabase/functions/
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCaption, handleSocialPost, instagramImage, isJpegUrl, postLink, validateRequest } from './lib.js'

const SITE = 'https://rbchy.github.io/dhoom-vivekananda-samiti/'
const EVENT = {
  id: '11111111-1111-1111-1111-111111111111', is_published: true,
  title_en: 'Shyama Puja', title_bn: 'শ্যামা পূজা', event_date: '2026-11-08',
  opens_at: '18:00', puja_starts_at: '22:30', location: 'Dhoom, Mirsharai',
  description_en: 'Puja, anjali and prasad.', description_bn: 'পূজা, অঞ্জলি ও প্রসাদ।',
  image_url: 'https://x.supabase.co/storage/v1/object/public/event-photos/kali-enhanced.jpg'
}

// A fake Graph API that records every call
function fakeGraph({ failOn } = {}) {
  const calls = []
  const fetchFn = async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET', body: options.body ? Object.fromEntries(new URLSearchParams(options.body)) : null })
    const json = data => ({ ok: true, status: 200, json: async () => data })
    if (failOn && url.includes(failOn)) return { ok: false, status: 400, json: async () => ({ error: { message: `fake failure on ${failOn}` } }) }
    if (url.includes('/photos')) return json({ id: 'photo1', post_id: 'page_post1' })
    if (url.includes('/feed')) return json({ id: 'page_post2' })
    if (url.includes('/media_publish')) return json({ id: 'ig_media1' })
    if (url.includes('/media')) return json({ id: 'container1' })
    if (url.includes('fields=status_code')) return json({ status_code: 'FINISHED' })
    return json({})
  }
  return { calls, fetchFn }
}

function deps(overrides = {}) {
  const logged = []
  const graph = fakeGraph(overrides.graph)
  return {
    logged, graph,
    fetchFn: graph.fetchFn,
    sleep: async () => {},
    getRole: async () => ('role' in overrides ? overrides.role : 'admin'),
    loadItem: async () => (overrides.item === undefined ? EVENT : overrides.item),
    alreadyPosted: async (_k, _id, target) => (overrides.already || []).includes(target),
    log: async entry => { logged.push(entry) },
    config: { version: 'v25.0', pageId: 'PAGE', pageToken: 'TOKEN', igUserId: 'IG', siteUrl: SITE, fallbackImageUrl: `${SITE}images/belur-math.jpg`, ...(overrides.config || {}) }
  }
}

test('caption has Bangla and English, times, place and a link to the post', () => {
  const caption = buildCaption('event', EVENT, { siteUrl: SITE })
  assert.match(caption, /🪔 শ্যামা পূজা/)
  assert.match(caption, /🪔 Shyama Puja/)
  assert.match(caption, /Puja starts: 10:30 PM/)
  assert.match(caption, /📍 Place: Dhoom, Mirsharai/)
  assert.ok(caption.includes(`🔗 ${SITE}?event=${EVENT.id}#events`))
})

test('caption in one language only', () => {
  const caption = buildCaption('event', EVENT, { language: 'en', siteUrl: SITE })
  assert.doesNotMatch(caption, /শ্যামা/)
})

test('announcement caption and link', () => {
  const caption = buildCaption('notice', { id: 'n1', title_en: 'Notice', message_en: 'Temple closed on Friday.' }, { language: 'en', siteUrl: SITE })
  assert.match(caption, /Temple closed on Friday\./)
  assert.ok(caption.endsWith(`${SITE}?notice=n1#notices`))
})

test('caption never exceeds the Instagram limit', () => {
  const caption = buildCaption('notice', { id: 'n', title_en: 'x', message_en: 'a'.repeat(5000) }, { language: 'en' })
  assert.ok(caption.length <= 2200)
})

test('post link works with and without a trailing slash', () => {
  assert.equal(postLink('https://a.org', 'event', 'e1'), 'https://a.org/?event=e1#events')
  assert.equal(postLink('https://a.org/', 'notice', 'n 1'), 'https://a.org/?notice=n%201#notices')
})

test('Instagram uses the post photo only when it is a JPEG', () => {
  assert.equal(isJpegUrl('https://a.org/p/photo.JPG?x=1'), true)
  assert.equal(isJpegUrl('https://a.org/p/photo.webp'), false)
  assert.equal(isJpegUrl(''), false)
  assert.equal(instagramImage({ image_url: 'https://a.org/p.png' }, 'fallback.jpg'), 'fallback.jpg')
  assert.equal(instagramImage(EVENT, 'fallback.jpg'), EVENT.image_url)
})

test('request validation', () => {
  assert.deepEqual(validateRequest({ kind: 'event', id: 'x', targets: ['facebook'] }), [])
  assert.equal(validateRequest({ kind: 'blog', id: 'x', targets: ['facebook'] }).length, 1)
  assert.equal(validateRequest({ kind: 'event', id: 'x', targets: ['tiktok'] }).length, 1)
  assert.equal(validateRequest({ kind: 'event', id: 'x', targets: [] }).length, 1)
})

test('only the main admin can post', async () => {
  for (const role of ['accounts_admin', 'secretary', null]) {
    const d = deps({ role })
    const result = await handleSocialPost({ kind: 'event', id: EVENT.id, targets: ['facebook'] }, d)
    assert.equal(result.status, 403)
    assert.equal(d.graph.calls.length, 0)
  }
})

test('unpublished or missing posts are refused', async () => {
  assert.equal((await handleSocialPost({ kind: 'event', id: 'x', targets: ['facebook'] }, deps({ item: null }))).status, 404)
  assert.equal((await handleSocialPost({ kind: 'event', id: 'x', targets: ['facebook'] }, deps({ item: { ...EVENT, is_published: false } }))).status, 409)
})

test('posts a photo to the Facebook Page and publishes on Instagram', async () => {
  const d = deps()
  const result = await handleSocialPost({ kind: 'event', id: EVENT.id, targets: ['facebook', 'instagram'] }, d)
  assert.equal(result.status, 200)
  assert.deepEqual(result.body.results.map(r => [r.target, r.status, r.remote_id]), [['facebook', 'posted', 'page_post1'], ['instagram', 'posted', 'ig_media1']])
  const photo = d.graph.calls.find(c => c.url.endsWith('PAGE/photos'))
  assert.equal(photo.body.url, EVENT.image_url)
  assert.equal(photo.body.access_token, 'TOKEN')
  assert.ok(d.graph.calls.some(c => c.url.endsWith('IG/media') && c.body.image_url === EVENT.image_url))
  assert.ok(d.graph.calls.some(c => c.url.endsWith('IG/media_publish') && c.body.creation_id === 'container1'))
  assert.ok(d.graph.calls.every(c => c.url.startsWith('https://graph.facebook.com/v25.0/')))
  assert.equal(d.logged.length, 2)
})

test('text-only announcement goes to the Page feed with a link; Instagram gets the fallback JPEG', async () => {
  const notice = { id: 'n1', is_published: true, title_en: 'Notice', message_en: 'Hello' }
  const d = deps({ item: notice })
  await handleSocialPost({ kind: 'notice', id: 'n1', targets: ['facebook', 'instagram'] }, d)
  const feed = d.graph.calls.find(c => c.url.endsWith('PAGE/feed'))
  assert.equal(feed.body.link, `${SITE}?notice=n1#notices`)
  assert.ok(d.graph.calls.some(c => c.url.endsWith('IG/media') && c.body.image_url === `${SITE}images/belur-math.jpg`))
})

test('does not post twice unless asked', async () => {
  const d = deps({ already: ['facebook'] })
  const result = await handleSocialPost({ kind: 'event', id: EVENT.id, targets: ['facebook'] }, d)
  assert.equal(result.body.results[0].status, 'skipped')
  assert.equal(d.graph.calls.length, 0)
  const again = deps({ already: ['facebook'] })
  const forced = await handleSocialPost({ kind: 'event', id: EVENT.id, targets: ['facebook'], force: true }, again)
  assert.equal(forced.body.results[0].status, 'posted')
})

test('a failure on one network is reported and logged, the other still posts', async () => {
  const d = deps({ graph: { failOn: '/photos' } })
  const result = await handleSocialPost({ kind: 'event', id: EVENT.id, targets: ['facebook', 'instagram'] }, d)
  assert.equal(result.status, 207)
  assert.equal(result.body.results[0].status, 'failed')
  assert.match(result.body.results[0].error, /fake failure/)
  assert.equal(result.body.results[1].status, 'posted')
  assert.deepEqual(d.logged.map(l => l.status), ['failed', 'posted'])
})

test('clear message when Meta settings are missing', async () => {
  const d = deps({ config: { pageId: '', igUserId: '' } })
  const result = await handleSocialPost({ kind: 'event', id: EVENT.id, targets: ['facebook', 'instagram'] }, d)
  assert.match(result.body.results[0].error, /META_PAGE_ID/)
  assert.match(result.body.results[1].error, /META_IG_USER_ID/)
  assert.equal(d.graph.calls.length, 0)
})
