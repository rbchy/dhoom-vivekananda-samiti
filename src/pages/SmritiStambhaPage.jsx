import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { StambhaMonument, localDigits } from '../components/StambhaPillar'
import { getInitialLanguage, getLanguage, saveLanguage, translate } from '../i18n'
import { initials, loadSmritiNames, pickText } from '../lib/smriti'
import '../smriti.css'

// Public page: /smriti-stambha
export default function SmritiStambhaPage() {
  const [language, setLanguage] = useState(getInitialLanguage)
  const [people, setPeople] = useState(null)
  const t = key => translate(language, key)
  const current = getLanguage(language)

  useEffect(() => { loadSmritiNames().then(setPeople) }, [])
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = current.rtl ? 'rtl' : 'ltr'
    document.title = `${t('smriti_title')} · ${t('brand_name')}`
    saveLanguage(language)
    window.scrollTo(0, 0)
  }, [language])

  return <div className="smriti-page">
    <header className="smriti-bar">
      <Link to="/" className="smriti-brand"><img src={`${import.meta.env.BASE_URL}emblem.svg`} alt="" /><span>{t('brand_name')}</span></Link>
      <div className="smriti-bar-actions">
        <LanguageSwitcher language={language} onChange={setLanguage} label={t('choose_language')} />
        <Link to="/" className="smriti-back"><ArrowLeft size={17} /> {t('smriti_back')}</Link>
      </div>
    </header>

    <section className="smriti-hero">
      <StambhaMonument title={t('smriti_title')} dedication={t('smriti_engraving')} locale={current.locale} lateLabel={t('smriti_late')}
        people={(people || []).map(person => ({ id: person.id, name: pickText(person, 'name', language), role: pickText(person, 'role', language), years: person.years, is_late: person.is_late }))} />
      <div className="smriti-hero-text">
        <span className="smriti-eyebrow">{t('smriti_eyebrow')}</span>
        <h1>{t('smriti_title')}</h1>
        <p>{t('smriti_p')}</p>
        {people?.length > 0 && <p className="smriti-count"><Flame size={18} /> {localDigits(people.length, current.locale)}</p>}
      </div>
    </section>

    <main className="smriti-wall">
      {people === null ? <p className="smriti-empty">…</p> : people.length === 0 ? <p className="smriti-empty">{t('smriti_none')}</p> :
        <ol className="smriti-grid">{people.map(person => {
          const name = pickText(person, 'name', language)
          return <li className={person.is_late ? 'smriti-plaque late' : 'smriti-plaque'} key={person.id}>
            <div className="smriti-medallion">{person.photo_url ? <img src={person.photo_url} alt={name} loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>}</div>
            {person.is_late && <span className="smriti-late"><Flame size={13} /> {t('smriti_late')}</span>}
            <h2>{name}</h2>
            {pickText(person, 'role', language) && <p className="smriti-role">{pickText(person, 'role', language)}</p>}
            {person.years && <p className="smriti-years">{localDigits(person.years, current.locale)}</p>}
            {pickText(person, 'tribute', language) && <p className="smriti-tribute">{pickText(person, 'tribute', language)}</p>}
          </li>
        })}</ol>}
    </main>

    <footer className="smriti-footer">
      <p>{t('visit_blessing')}</p>
      <Link to="/" className="smriti-back"><ArrowLeft size={17} /> {t('smriti_back')}</Link>
    </footer>
  </div>
}
