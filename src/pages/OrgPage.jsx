import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CalendarDays, Clock, Flame, HeartHandshake, Images, Landmark, MapPin, Stethoscope } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabaseClient'
import { getInitialLanguage, getLanguage, saveLanguage, translate } from '../i18n'
import { ACTIVITIES, ORGANISATIONS, pageOf, pagePath } from '../i18n-org'
import '../org-page.css'

const ICONS = { temple: Landmark, clinic: Stethoscope, cremation: Flame, service: HeartHandshake }
const home = `${import.meta.env.BASE_URL}`

// Bangla text for Bangla, English text for every other language (falls back to the other one)
const pick = (item, field, language) => (language === 'bn' ? item?.[`${field}_bn`] || item?.[`${field}_en`] : item?.[`${field}_en`] || item?.[`${field}_bn`]) || ''

// Public page of one institution: /org/<id>
export default function OrgPage() {
  const { orgId } = useParams()
  // an institution (/org/…) or a service work with its own page (/service/…)
  const org = pageOf(orgId)
  const isService = org?.type === 'service'
  const [language, setLanguage] = useState(getInitialLanguage)
  const [content, setContent] = useState(undefined) // undefined = loading, null = no published page yet
  const [photos, setPhotos] = useState([])
  const [deities, setDeities] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const t = key => translate(language, key)
  const current = getLanguage(language)
  const name = org ? (language === 'bn' ? org.name_bn : org.name_en) : ''

  useEffect(() => {
    if (!org) return
    setContent(undefined); setPhotos([]); setDeities([])
    window.scrollTo(0, 0)
    Promise.all([
      supabase.from('temple_content').select('*').eq('slug', `org-${org.id}`).eq('is_published', true).maybeSingle(),
      supabase.from('gallery').select('*').eq('is_published', true).eq('organisation', org.id).order('created_at', { ascending: false }),
      org.deities ? supabase.from('temple_highlights').select('*').eq('kind', 'deity').eq('is_active', true).order('sort_order') : Promise.resolve({ data: [] })
    ]).then(([page, gallery, highlights]) => {
      setContent(page.data || null)
      setPhotos(gallery.data || [])
      // the temple's own deities, in the order the words are listed (e.g. Shiva first, then Ma Ganga)
      const all = highlights.data || []
      const found = []
      ;(org.deities || []).forEach(word => all.forEach(d => { if (`${d.title_en} ${d.title_bn}`.toLowerCase().includes(word) && !found.includes(d)) found.push(d) }))
      setDeities(found)
    })
  }, [orgId])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = current.rtl ? 'rtl' : 'ltr'
    if (org) document.title = `${name} · ${t('brand_name')}`
    saveLanguage(language)
  }, [language, orgId])

  if (!org) return <Navigate to="/" replace />

  const Icon = ICONS[org.type] || Landmark
  const cover = photos[0]?.image_url || `${home}temple-photo.webp`
  const logo = `${home}logos/${org.id}.svg`
  // Text: the published page from Admin, otherwise the short description we already have
  const title = pick(content, 'title', language) || name
  const shortText = pick(org, 'desc', language) || t(`act_${org.id}_d`)
  const body = pick(content, 'body', language) || shortText
  const mantra = language === 'bn' ? content?.mantra_bn || content?.mantra_en : content?.mantra_en || content?.mantra_bn
  const others = ORGANISATIONS.filter(o => o.id !== org.id)
  // service work that is not an institution itself (institutions are listed above it)
  const serviceLinks = ACTIVITIES.filter(a => !ORGANISATIONS.some(o => o.id === a.id))

  return <div className="org-page">
    <header className="org-bar org-bar--titled">
      <Link to="/" className="org-bar-brand"><img src={`${home}emblem.svg`} alt="" width="48" height="48" /><span>{t('brand_name')}</span></Link>
      {/* The institution's own name, in the middle of the same line as the Samiti's name */}
      <p className="org-bar-title"><img className="org-bar-logo" src={logo} alt="" width="44" height="44" /><span>{title}</span></p>
      <div className="org-bar-actions">
        <LanguageSwitcher language={language} onChange={setLanguage} label={t('choose_language')} />
        <Link to="/" className="org-back"><ArrowLeft size={17} /> {t('smriti_back')}</Link>
      </div>
    </header>

    <section className="org-hero" style={{ backgroundImage: `linear-gradient(180deg,rgba(30,8,6,.15),rgba(30,8,6,.82)),url("${cover}")` }}>
      {/* The name and logo are in the top bar; the photo stays clear */}
      <h1 className="sr-only">{title}</h1>
    </section>

    <nav className="org-switch" aria-label={t('nav_institutions')}>
      {ORGANISATIONS.map(o => <Link key={o.id} to={`/org/${o.id}`} className={o.id === org.id ? 'active' : ''} aria-current={o.id === org.id ? 'page' : undefined}>{language === 'bn' ? o.name_bn : o.name_en}</Link>)}
    </nav>

    <main className="org-main">
      <article className="org-article">
        <span className="section-eyebrow">{isService ? t('org_type_service') : t('nav_institutions')}</span>
        <h2>{name}</h2>
        {content === undefined ? <p className="org-loading">…</p> : body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para.trim()}</p>)}

        {deities.length > 0 && <section className="org-deities" aria-label={t('org_deities')}>
          <h3>🙏 {t('org_deities')}</h3>
          <div className="org-deity-grid">{deities.map(d => {
            const pranam = language === 'bn' ? d.pranam_bn || d.pranam_en : d.pranam_en || d.pranam_bn
            return <article key={d.id} className="org-deity">
              {d.image_url && <button type="button" className="org-deity-img" onClick={() => setLightbox({ image_url: d.image_url, title_en: d.title_en, title_bn: d.title_bn })}><img src={d.image_url} alt={pick(d, 'title', language)} loading="lazy" /></button>}
              <h4>{pick(d, 'title', language)}</h4>
              {pick(d, 'subtitle', language) && <p className="org-deity-time">{pick(d, 'subtitle', language)}</p>}
              {pranam && <blockquote lang={language === 'bn' || !d.pranam_en ? 'bn' : 'sa-Latn'}>{pranam.split('\n').map((line, i) => <span key={i}>{line}</span>)}</blockquote>}
            </article>
          })}</div>
        </section>}

        {mantra && <figure className="org-mantra">
          <figcaption>🙏 {t('pranam_label')}</figcaption>
          <blockquote lang={language === 'bn' || !content?.mantra_en ? 'bn' : 'sa-Latn'}>{mantra.split('\n').map((line, i) => <span key={i}>{line}</span>)}</blockquote>
        </figure>}

        {org.registration && <section className="org-registration" aria-label={t('reg_title')}>
          <h3><BadgeCheck size={20} /> {t('reg_title')}</h3>
          <p className="org-reg-cert">{t('reg_cert')}</p>
          <dl className="org-reg-facts">
            <div><dt>{t('reg_no')}</dt><dd>{language === 'bn' ? org.registration.number_bn : org.registration.number_en}</dd></div>
            <div><dt>{t('reg_date')}</dt><dd>{new Intl.DateTimeFormat(current.locale || (language === 'bn' ? 'bn-BD' : 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${org.registration.date}T00:00:00`))}</dd></div>
          </dl>
          <button type="button" className="org-reg-image" onClick={() => setLightbox({ image_url: `${home}${org.registration.image}`, title_en: 'Enlistment Certificate', title_bn: 'তালিকাভুক্তির সনদ' })} aria-label={t('reg_view')}>
            <img src={`${home}${org.registration.image}`} alt={t('reg_cert')} loading="lazy" width="1600" height="1180" />
          </button>
          <small>{t('reg_view')}</small>
        </section>}

        {photos.length > 0 && <section className="org-photos" aria-label={t('gallery_title')}>
          <h3><Images size={20} /> {t('gallery_title')} <small>({photos.length})</small></h3>
          <div className="org-photo-grid">{photos.map(photo => { const caption = pick(photo, 'title', language); return <figure key={photo.id}>
            <button type="button" onClick={() => setLightbox(photo)} aria-label={caption || t('gallery_title')}><img src={photo.image_url} alt={caption || name} loading="lazy" /></button>
            {caption && <figcaption>{caption}</figcaption>}
          </figure> })}</div>
        </section>}
      </article>

      <aside className="org-side">
        <div className="org-card-box">
          <h3>{t('visit_title')}</h3>
          <a className="org-side-link" href={`${home}#worship`}><Clock size={18} /> {t('hours_title')}</a>
          <a className="org-side-link" href={`${home}#events`}><CalendarDays size={18} /> {t('events_title')}</a>
          <Link className="org-side-link" to="/calendar"><CalendarDays size={18} /> {t('cal_title')}</Link>
          <a className="org-side-link" href={`${home}#contact`}><MapPin size={18} /> {t('visit_btn')}</a>
          <a className="org-side-link donate" href={`${home}#donate`}><HeartHandshake size={18} /> {t('donate_title')}</a>
        </div>
        <div className="org-card-box">
          <h3>{t('menu_all_orgs')}</h3>
          <ul className="org-others">{others.map(o => <li key={o.id}><Link to={`/org/${o.id}`}><img className="org-others-logo" src={`${home}logos/${o.id}.svg`} alt="" width="30" height="30" loading="lazy" /> {language === 'bn' ? o.name_bn : o.name_en}</Link></li>)}</ul>
          {serviceLinks.length > 0 && <>
            <h3 className="org-sub-h">{t('nav_service')}</h3>
            <ul className="org-others">{serviceLinks.filter(a => a.id !== org.id).map(a => <li key={a.id}>{pageOf(a.id) ? <Link to={pagePath(a.id)}><img className="org-others-logo" src={`${home}logos/${a.id}.svg`} alt="" width="30" height="30" loading="lazy" /> {pick(pageOf(a.id), 'name', language)}</Link> : <a href={`${home}#act-${a.id}`}><HeartHandshake size={17} /> {t(`act_${a.id}_t`)}</a>}</li>)}</ul>
          </>}
        </div>
      </aside>
    </main>

    <footer className="org-foot">© {new Date().getFullYear()} RbcTcsWorld <span>·</span> {t('rights')}</footer>

    {lightbox && <Modal title={pick(lightbox, 'title', language) || name} closeLabel={t('close')} onClose={() => setLightbox(null)}>
      <figure className="lightbox"><img src={lightbox.image_url} alt={pick(lightbox, 'title', language) || name} />{pick(lightbox, 'description', language) && <figcaption><span>{pick(lightbox, 'description', language)}</span></figcaption>}</figure>
    </Modal>}
  </div>
}
