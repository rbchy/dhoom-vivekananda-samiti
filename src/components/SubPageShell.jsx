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

// The photo of the Samiti office and Community Clinic behind a page title (class "hv-hero-photo").
// tint: the page's own colours laid over the photo so the white title stays readable.
export const SAMITI_PHOTO = 'images/samiti-office-clinic.webp'
export const samitiPhotoHero = tint => ({ backgroundImage: `${tint},url("${home}${SAMITI_PHOTO}")` })

// Bangla text for Bangla, English for every other language (falls back to the other one)
export const pickText = (item, field, language) => (language === 'bn' ? item?.[`${field}_bn`] || item?.[`${field}_en`] : item?.[`${field}_en`] || item?.[`${field}_bn`]) || ''

// A new id made in the browser, so a visitor's submission and its private contact can be linked
// without reading the row back (visitors are not allowed to read pending rows)
export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16))
}
