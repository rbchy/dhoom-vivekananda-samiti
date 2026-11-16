import { useMemo, useState } from 'react'
import { Download, QrCode, Copy, Check } from 'lucide-react'
import qrcode from '../lib/qrcode-generator'
import Modal from './Modal'
import './qr-code.css'

/* global __DEV_LAN_URL__ */
// Which address the QR code opens:
// 1. VITE_SITE_URL from .env (the published website)
// 2. while testing on this computer: its Wi-Fi address, so a phone on the same Wi-Fi can open it
// 3. otherwise the address in the browser bar
export function siteAddress() {
  const published = import.meta.env.VITE_SITE_URL
  if (published) return published
  const onThisComputer = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
  const lan = typeof __DEV_LAN_URL__ !== 'undefined' ? __DEV_LAN_URL__ : ''
  if (onThisComputer && lan) return lan + import.meta.env.BASE_URL
  if (window.location.protocol.startsWith('http')) return window.location.origin + import.meta.env.BASE_URL
  return ''
}

function makeSvg(text) {
  const qr = qrcode(0, 'M')
  qr.addData(text, 'Byte')
  qr.make()
  return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true })
}

export default function QrCodeButton({ t, className = 'social-btn social-qr' }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = siteAddress()
  const svg = useMemo(() => (open && url ? makeSvg(url) : ''), [open, url])
  const isLocalTest = url && /^http:\/\/(\d+\.){3}\d+:/.test(url)

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* not allowed */ }
  }

  // Save the QR code as a picture (for posters, notices, WhatsApp)
  function download() {
    const img = new Image()
    img.onload = () => {
      const size = 1024, pad = 60, canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size + 110
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
      ctx.fillStyle = '#6d1822'; ctx.font = 'bold 44px Georgia, serif'; ctx.textAlign = 'center'
      ctx.fillText(t('brand_name'), size / 2, size + 20)
      ctx.fillStyle = '#5c4a40'; ctx.font = '28px Arial, sans-serif'
      ctx.fillText(url.replace(/\/$/, ''), size / 2, size + 70)
      const link = document.createElement('a')
      link.download = 'dhoom-vivekananda-samiti-qr.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }

  if (!url) return null
  return <>
    <button type="button" className={className} onClick={() => setOpen(true)} aria-label={t('qr_title')} title={t('qr_title')}><QrCode size={20} /></button>
    {open && <Modal title={t('qr_title')} closeLabel={t('close')} onClose={() => setOpen(false)}>
      <div className="qr-box">
        <p className="qr-hint">{t('qr_hint')}</p>
        <div className="qr-image" role="img" aria-label={`QR: ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="qr-url">{url.replace(/\/$/, '')}</p>
        {isLocalTest && <p className="qr-note">{t('qr_local_note')}</p>}
        <div className="qr-actions">
          <button type="button" onClick={download}><Download size={17} /> {t('qr_download')}</button>
          <button type="button" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? t('social_copied') : t('qr_copy')}</button>
        </div>
      </div>
    </Modal>}
  </>
}
