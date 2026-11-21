import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Mail, X } from 'lucide-react'
import { copyText, facebookUrl, isPhone, messengerUrl, whatsappUrl } from '../lib/share'
import './share-panel.css'

const GLYPHS = {
  whatsapp: <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />,
  facebook: <path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8V12h2.2v10H14V12h2.9l.4-3.5H14z" />,
  messenger: <path d="M12 2C6.5 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7L13 14.4z" />
}

// Share a page when the browser has no share window of its own (most computers, and phones on an http:// test address):
// WhatsApp, Facebook, Messenger (phones), Email and Copy link. If even copying is blocked, the link is shown selected.
export default function SharePanel({ title, url, t, onClose, upward = false }) {
  const [copyState, setCopyState] = useState('') // '' | 'copied' | 'failed'
  const box = useRef(null)
  const linkInput = useRef(null)
  const message = `${title}\n${url}`

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    const onDown = event => { if (box.current && !box.current.contains(event.target) && !event.target.closest?.('.social-share')) onClose() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    box.current?.querySelector('a,button')?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown) }
  }, [onClose])

  useEffect(() => { if (copyState === 'failed') linkInput.current?.select() }, [copyState])

  async function copy() {
    if (await copyText(url)) { setCopyState('copied'); setTimeout(() => setCopyState(''), 2500) }
    else setCopyState('failed')
  }

  const link = (name, href, label) => <a className={`share-panel-item share-${name}`} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(onClose, 0)}>
    <span className="share-panel-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{GLYPHS[name]}</svg></span>{label}
  </a>

  return <div ref={box} className={upward ? 'share-panel share-panel-up' : 'share-panel'} role="dialog" aria-label={t('social_share')}>
    <div className="share-panel-head"><strong>{t('social_share')}</strong><button type="button" className="share-panel-close" onClick={onClose} aria-label={t('close')}><X size={16} /></button></div>
    {link('whatsapp', whatsappUrl(message), 'WhatsApp')}
    {link('facebook', facebookUrl(url), 'Facebook')}
    {isPhone() && link('messenger', messengerUrl(url), 'Messenger')}
    <a className="share-panel-item share-email" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`} onClick={() => setTimeout(onClose, 0)}>
      <span className="share-panel-icon"><Mail size={17} /></span>{t('share_email')}
    </a>
    <button type="button" className="share-panel-item share-copy" onClick={copy}>
      <span className="share-panel-icon">{copyState === 'copied' ? <Check size={17} /> : <Copy size={17} />}</span>{copyState === 'copied' ? t('social_copied') : t('qr_copy')}
    </button>
    {copyState === 'failed' && <label className="share-panel-manual">{t('share_copy_manual')}
      <input ref={linkInput} readOnly value={url} onFocus={event => event.target.select()} />
    </label>}
    <span className="sr-only" role="status">{copyState === 'copied' ? t('social_copied') : ''}</span>
  </div>
}
