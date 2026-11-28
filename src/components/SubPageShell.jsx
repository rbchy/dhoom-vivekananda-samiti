import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { getInitialLanguage, getLanguage, saveLanguage, translate } from '../i18n'
import '../org-page.css'

const home = `${import.meta.env.BASE_URL}`

// Language state + top bar + footer shared by the stand-alone pages (/visits, /bhavadhara)
export function useSubPage(titleKey) {
  const [language, setLanguage] = useState(getInitialLanguage)
  const t = key => translate(language, key)
  const current = getLanguage(language)
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = current.rtl ? 'rtl' : 'ltr'
    document.title = `${t(titleKey)} · ${t('brand_name')}`
    saveLanguage(language)
  }, [language])
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return { language, setLanguage, t, locale: current.locale }
}

export default function SubPageShell({ page, className = '', children }) {
  const { language, setLanguage, t } = page
  return <div className={`org-page ${className}`}>
    <header className="org-bar">
      <Link to="/" className="org-bar-brand"><img src={`${home}emblem.svg`} alt="" /><span>{t('brand_name')}</span></Link>
      <div className="org-bar-actions">
        <LanguageSwitcher language={language} onChange={setLanguage} label={t('choose_language')} />
        <Link to="/" className="org-back"><ArrowLeft size={17} /> {t('smriti_back')}</Link>
      </div>
    </header>
    {children}
    <footer className="org-foot">© {new Date().getFullYear()} RbcTcsWorld <span>·</span> {t('rights')}</footer>
  </div>
}

// A photo across the top of a page, shown on its own; the page title and text follow below it.
// framed: a smaller picture shown whole in the middle of a band of the colour `fill` (instead of cropped to the full width)
// whole: the full photo, never cropped; on wide screens the sides are filled with a soft blurred copy of it
export const SAMITI_PHOTO = 'images/samiti-office-clinic.webp'
export function PageBanner({ src = SAMITI_PHOTO, alt, framed = false, whole = false, fill, position }) {
  const url = `${home}${src}`
  const className = whole ? 'page-banner whole' : framed ? 'page-banner framed' : 'page-banner'
  const style = whole ? { '--banner-img': `url("${url}")` } : fill ? { background: fill } : undefined
  return <figure className={className} style={style}>
    <img src={url} alt={alt} style={position ? { objectPosition: position } : undefined} />
  </figure>
}

// Several photos of the same kind taking turns across the top of a page (fade every few seconds).
// Shown whole in the middle of a band of the colour `fill`, like PageBanner framed. Stops on hover or keyboard focus,
// can be moved with the arrows or the dots, and does not move by itself for visitors who ask for reduced motion.
export function PageSlideshow({ slides, fill, interval = 5000, label = 'Photos' }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const go = step => setIndex(i => (i + step + count) % count)
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (paused || still || count < 2) return
    const timer = setInterval(() => setIndex(i => (i + 1) % count), interval)
    return () => clearInterval(timer)
  }, [paused, count, interval])
  let touchX = null
  return <figure className="page-banner framed page-slideshow" style={fill ? { background: fill } : undefined} aria-roledescription="carousel" aria-label={label}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    onTouchStart={e => { touchX = e.touches[0].clientX }} onTouchEnd={e => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touchX = null }}>
    <div className="page-slides">
      {slides.map((slide, i) => <img key={slide.src} src={`${home}${slide.src}`} alt={slide.alt} className={i === index ? 'active' : ''} aria-hidden={i !== index} loading={i === 0 ? 'eager' : 'lazy'} />)}
    </div>
    {count > 1 && <>
      <button type="button" className="page-slide-arrow prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
      <button type="button" className="page-slide-arrow next" onClick={() => go(1)} aria-label="Next photo">›</button>
      <div className="page-slide-dots">{slides.map((slide, i) => <button key={slide.src} type="button" className={i === index ? 'active' : ''} aria-label={slide.alt} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)} />)}</div>
    </>}
  </figure>
}

// Bangla text for Bangla, English for every other language (falls back to the other one)
export const pickText = (item, field, language) => (language === 'bn' ? item?.[`${field}_bn`] || item?.[`${field}_en`] : item?.[`${field}_en`] || item?.[`${field}_bn`]) || ''

// A new id made in the browser, so a visitor's submission and its private contact can be linked
// without reading the row back (visitors are not allowed to read pending rows)
export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16))
}
