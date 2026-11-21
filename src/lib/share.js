// Share an event or announcement: ready-made text, a link straight to the post,
// and share links for WhatsApp, Facebook and Messenger.
import { siteAddress } from '../components/QrCodeButton'

function base() {
  const address = siteAddress() || (typeof window !== 'undefined' ? window.location.origin + '/' : '')
  return address.endsWith('/') ? address : address + '/'
}

// Link that opens the website and scrolls to this post, e.g. https://site/?event=<id>#events
export function postLink(kind, id) {
  const param = kind === 'event' ? 'event' : 'notice'
  const section = kind === 'event' ? 'events' : 'notices'
  return `${base()}?${param}=${encodeURIComponent(id)}#${section}`
}

function formatDate(value, locale) {
  if (!value) return ''
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.valueOf())) return String(value)
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatTime(value, locale) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  if (Number.isNaN(h)) return ''
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m || 0))
}

const LABELS = {
  en: { date: 'Date', opens: 'Temple opens', puja: 'Puja starts', closes: 'Closes', place: 'Place', more: 'Details' },
  bn: { date: 'তারিখ', opens: 'মন্দির খোলা', puja: 'পূজা শুরু', closes: 'বন্ধ', place: 'স্থান', more: 'বিস্তারিত' }
}

function pickField(item, field, lang) {
  return lang === 'bn' ? (item[`${field}_bn`] || item[`${field}_en`]) : (item[`${field}_en`] || item[`${field}_bn`])
}

// One language block of text (lang = 'en' | 'bn')
function block(kind, item, lang) {
  const L = LABELS[lang]
  const locale = lang === 'bn' ? 'bn-BD' : 'en-GB'
  const lines = []
  const title = pickField(item, 'title', lang)
  if (title) lines.push(`🪔 ${title}`)
  if (kind === 'event') {
    if (item.event_date) lines.push(`📅 ${L.date}: ${formatDate(item.event_date, locale)}`)
    if (item.opens_at) lines.push(`🕉️ ${L.opens}: ${formatTime(item.opens_at, locale)}`)
    if (item.puja_starts_at) lines.push(`🔔 ${L.puja}: ${formatTime(item.puja_starts_at, locale)}`)
    if (item.closes_at) lines.push(`🌙 ${L.closes}: ${formatTime(item.closes_at, locale)}`)
    if (item.location) lines.push(`📍 ${L.place}: ${item.location}`)
    const description = pickField(item, 'description', lang)
    if (description) lines.push('', description)
  } else {
    const message = pickField(item, 'message', lang)
    if (message) lines.push('', message)
  }
  return lines.join('\n')
}

// Text for sharing. language 'bn' → Bangla, 'both' → Bangla then English, anything else → English.
export function shareText(kind, item, language, { withLink = true, brand = '' } = {}) {
  const parts = []
  if (language === 'both') {
    parts.push(block(kind, item, 'bn'))
    const english = block(kind, item, 'en')
    if (english && english !== parts[0]) parts.push(english)
  } else {
    parts.push(block(kind, item, language === 'bn' ? 'bn' : 'en'))
  }
  let text = parts.filter(Boolean).join('\n\n— — —\n\n')
  if (brand) text += `\n\n${brand}`
  if (withLink) text += `\n🔗 ${postLink(kind, item.id)}`
  return text
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function facebookUrl(link) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
}

// Messenger has no web share link without a Facebook app id, so it opens the Messenger app (phones only).
export function messengerUrl(link) {
  return `fb-messenger://share/?link=${encodeURIComponent(link)}`
}

export function isPhone() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* blocked by the browser: try the older way below */ }
  // Older browsers, http:// test addresses on a phone, and browsers that refuse the clipboard
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
