import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { copyText, facebookUrl, isPhone, messengerUrl, postLink, shareText, whatsappUrl } from '../lib/share'
import './post-share.css'

const GLYPHS = {
  whatsapp: <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />,
  facebook: <path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8V12h2.2v10H14V12h2.9l.4-3.5H14z" />,
  messenger: <path d="M12 2C6.5 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7L13 14.4z" />
}

// Share buttons under one event or announcement on the public website.
// kind: 'event' | 'notice'
export default function PostShare({ kind, item, language, t }) {
  const [copied, setCopied] = useState(false)
  const textLanguage = language === 'bn' ? 'bn' : 'en'
  const text = shareText(kind, item, textLanguage)
  const link = postLink(kind, item.id)
  const phone = isPhone()

  async function copy() {
    if (await copyText(text)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  async function nativeShare() {
    try { await navigator.share({ title: item[`title_${textLanguage}`] || item.title_en || document.title, text, url: link }) } catch { /* closed */ }
  }

  const button = (name, href, label) => <a className={`post-share-btn post-share-${name}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">{GLYPHS[name]}</svg>
  </a>

  return <div className="post-share" role="group" aria-label={t('share_post')}>
    <span className="post-share-label">{t('share_post')}</span>
    {button('whatsapp', whatsappUrl(text), 'WhatsApp')}
    {button('facebook', facebookUrl(link), 'Facebook')}
    {phone && button('messenger', messengerUrl(link), 'Messenger')}
    <button type="button" className="post-share-btn post-share-copy" onClick={copy} aria-label={t('share_copy_text')} title={t('share_copy_text')}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
    {phone && typeof navigator !== 'undefined' && navigator.share && <button type="button" className="post-share-btn post-share-more" onClick={nativeShare} aria-label={t('share_more')} title={t('share_more')}><Share2 size={16} /></button>}
    {copied && <span className="post-share-copied" role="status">{t('share_text_copied')}</span>}
  </div>
}
