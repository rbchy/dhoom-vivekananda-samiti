import { useState } from 'react'
import { Share2 } from 'lucide-react'
import './social-links.css'
import QrCodeButton, { siteAddress } from './QrCodeButton'
import SharePanel from './SharePanel'
import { isPhone } from '../lib/share'

// Simple brand glyphs (24×24) for the follow buttons
const ICONS = {
  facebook: <path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8V12h2.2v10H14V12h2.9l.4-3.5H14z" />,
  youtube: <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8zM9.8 15.1V8.9l5.8 3.1-5.8 3.1z" />,
  instagram: <path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.1 1.4-.1 4.1-.1zM12 2c-2.7 0-3.1 0-4.2.1C4.2 2.2 2.2 4.2 2.1 7.8 2 8.9 2 9.3 2 12s0 3.1.1 4.2c.1 3.6 2.1 5.6 5.7 5.7 1.1.1 1.5.1 4.2.1s3.1 0 4.2-.1c3.6-.1 5.6-2.1 5.7-5.7.1-1.1.1-1.5.1-4.2s0-3.1-.1-4.2c-.1-3.6-2.1-5.6-5.7-5.7C15.1 2 14.7 2 12 2z" />,
  whatsapp: <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 .5a11.5 11.5 0 0 0-9.9 17.3L.5 23.5l5.9-1.5A11.5 11.5 0 1 0 12 .5z" />,
  tiktok: <path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.7 1.5V6.7a4.8 4.8 0 0 1-4.7-4.7z" />
}

const LABELS = { facebook: 'Facebook', youtube: 'YouTube', instagram: 'Instagram', whatsapp: 'WhatsApp', tiktok: 'TikTok' }

// Turns a saved setting into a link; WhatsApp is saved as a phone number
function linkFor(name, value) {
  if (!value) return ''
  if (name === 'whatsapp') {
    const digits = String(value).replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}` : ''
  }
  return value
}

// Follow buttons (only for links the admin has filled in) plus a Share button for this page
export default function SocialLinks({ links, t, variant = 'light', showTitle = true }) {
  const [panel, setPanel] = useState(null) // null, or { upward } while the share panel is open
  const items = Object.keys(LABELS).map(name => [name, linkFor(name, links[name])]).filter(([, url]) => url)
  // Inside the phone app the page address is a local one, so the public website address is shared instead (set VITE_SITE_URL in .env)
  const shareData = () => ({ title: document.title, url: siteAddress() || window.location.href })

  async function share(event) {
    if (panel) { setPanel(null); return }
    const upward = event.currentTarget.getBoundingClientRect().top > window.innerHeight * 0.55
    // Phones with a share window use it; everything else (and a share window that fails) gets our own panel
    if (isPhone() && navigator.share) {
      try { await navigator.share(shareData()); return } catch (error) { if (error?.name === 'AbortError') return }
    }
    setPanel({ upward })
  }

  return <div className={`social-links social-${variant}`}>
    {showTitle && items.length > 0 && <span className="social-title">{t('social_follow')}</span>}
    <ul>
      {items.map(([name, url]) => <li key={name}><a className={`social-btn social-${name}`} href={url} target="_blank" rel="noopener noreferrer" aria-label={LABELS[name]} title={LABELS[name]}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">{ICONS[name]}</svg></a></li>)}
      <li><QrCodeButton t={t} /></li>
      <li className="social-share-wrap">
        <button type="button" className="social-btn social-share" onClick={share} aria-label={t('social_share')} title={t('social_share')} aria-expanded={Boolean(panel)} aria-haspopup="dialog"><Share2 size={19} /></button>
        {panel && <SharePanel {...shareData()} t={t} upward={panel.upward} onClose={() => setPanel(null)} />}
      </li>
    </ul>
  </div>
}
