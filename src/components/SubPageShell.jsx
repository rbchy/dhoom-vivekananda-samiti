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
export const SAMITI_PHOTO = 'images/samiti-office-clinic.webp'
export function PageBanner({ src = SAMITI_PHOTO, alt, framed = false, fill, position }) {
  return <figure className={framed ? 'page-banner framed' : 'page-banner'} style={fill ? { background: fill } : undefined}>
    <img src={`${home}${src}`} alt={alt} style={position ? { objectPosition: position } : undefined} />
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
