import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { VisitQr } from './components/QrCodeButton'
import StambhaPillar, { localDigits } from './components/StambhaPillar'
import WelcomeBhajan from './components/WelcomeBhajan'
import HeroSlides, { HeroQuote, quoteText, useHeroQuote, useHeroSlide } from './components/HeroSlides'
import { loadSmritiNames, pickText as pickSmriti } from './lib/smriti'
import './smriti.css'
import { BrowserRouter, Link, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { findSeoPage, NOINDEX_PREFIXES } from './seo-pages'
import { CalendarDays, Church, Clock, ExternalLink, Flame, HeartHandshake, Images, Landmark, Mail, MapPin, Menu, Pause, Phone, Play, Repeat, Search, Stethoscope, X, Shirt, BookOpen, MapPinHouse, Sunrise, Sunset, ArrowRight } from 'lucide-react'
import './styles.css'
import './language.css'
import './organisations.css'
// Needed by the home page itself (hero buttons, forms in pop-ups, the phone search button), so they load with it
import './forms.css'
import './components/site-search.css'
import ProtectedRoute from './components/ProtectedRoute'
import LanguageSwitcher from './components/LanguageSwitcher'
import Modal from './components/Modal'
import BackToTopButton from './components/BackToTopButton'
import MainMenu from './components/MainMenu'
import PhotoSlideshow from './components/PhotoSlideshow'
import SocialLinks from './components/SocialLinks'
import PostShare from './components/PostShare'
import { supabase } from './lib/supabaseClient'
import { getInitialLanguage, getLanguage, saveLanguage, translate, TRANSLATIONS } from './i18n'
import { MAP_LOCATION, ORGANISATIONS, locationFromMapsLink, ACTIVITIES } from './i18n-org'
import PageLoading from './components/PageLoading'

// Code splitting: the home page loads first; every other page, the admin, the search box and the
// forms come in their own small files, downloaded only when a visitor opens them.
const SmritiStambhaPage = lazy(() => import('./pages/SmritiStambhaPage'))
const VisitsPage = lazy(() => import('./pages/VisitsPage'))
const BhavadharaPage = lazy(() => import('./pages/BhavadharaPage'))
const DonorsPage = lazy(() => import('./pages/DonorsPage'))
const CommitteePage = lazy(() => import('./pages/CommitteePage'))
const OrgPage = lazy(() => import('./pages/OrgPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const SiteSearch = lazy(() => import('./components/SiteSearch'))
const PublicContactForm = lazy(() => import('./components/PublicContactForm'))
const OnlineDonationForm = lazy(() => import('./components/PublicDonationForms').then(m => ({ default: m.OnlineDonationForm })))
const SubscriptionForm = lazy(() => import('./components/PublicDonationForms').then(m => ({ default: m.SubscriptionForm })))

const ORG_ICONS = { temple: Landmark, clinic: Stethoscope, cremation: Flame, clothes: Shirt, gita: BookOpen }

const navigation = [['nav_home', 'home'], ['nav_about', 'about'], ['nav_worship', 'worship'], ['nav_events', 'events'], ['nav_gallery', 'gallery'], ['nav_donate', 'donate'], ['nav_contact', 'contact']]
const featureCards = [
  { key: 'f_about', href: '#about', Icon: Landmark },
  { key: 'f_worship', href: '#worship', Icon: Church },
  { key: 'f_events', href: '#events', Icon: CalendarDays },
  { key: 'f_gallery', href: '#gallery', Icon: Images },
  { key: 'f_donate', href: '#donate', Icon: HeartHandshake },
]

// Weekday name in the visitor's language (2024-01-07 was a Sunday)
function weekdayName(day, locale, style = 'long') {
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(new Date(2024, 0, 7 + day))
}

function formatTime(value, locale) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m))
}

// Compact time for the footer table: the Morning / Evening column already says AM or PM
function shortTime(value, locale) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(new Date(2000, 0, 1, h, m))
    .filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim()
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const GALLERY_FILTERS = ['all', 'festivals', 'worship', 'community', 'temple', 'clinic']

// Scrolling message over the top of the banner photo, with an optional song recording
function HeroTicker({ text, audioUrl, t }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean)
  if (!lines.length) return null
  // Repeat the lines so the scrolling band stays full and long
  const sequence = Array.from({ length: 4 }, () => lines.join('   🪔   ')).join('   🪔   ')

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    else { audio.pause(); setPlaying(false) }
  }

  return <div className="hero-ticker" role="marquee" aria-label={lines.join(' — ')}>
    {audioUrl && <>
      <audio ref={audioRef} src={audioUrl} preload="none" loop onEnded={() => setPlaying(false)} />
      <button type="button" className="ticker-audio" onClick={toggle} aria-label={playing ? t('ticker_pause') : t('ticker_play')} title={playing ? t('ticker_pause') : t('ticker_play')}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
    </>}
    <div className="ticker-viewport"><div className="ticker-track" aria-hidden="true"><span>🙏 {sequence}   ✦   </span><span>🙏 {sequence}   ✦   </span></div></div>
  </div>
}
const telHref = phone => `tel:${String(phone).replace(/[^\d+]/g, '')}`

function formatEventDate(value, locale, fallback) {
  if (!value) return fallback
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

// Database records have English and Bangla fields: show Bangla for Bangla, English for every other language
function pick(item, field, language) {
  const english = item[`${field}_en`]
  const bangla = item[`${field}_bn`]
  return language === 'bn' ? (bangla || english) : (english || bangla)
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openForm, setOpenForm] = useState(null)
  const [language, setLanguage] = useState(getInitialLanguage)
  const [events, setEvents] = useState([])
  const [eventsStatus, setEventsStatus] = useState('loading')
  const [gallery, setGallery] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [schedule, setSchedule] = useState([])
  const [settings, setSettings] = useState({})
  const [committee, setCommittee] = useState([])
  const [story, setStory] = useState(null)
  const [highlights, setHighlights] = useState([])
  const [galleryFilter, setGalleryFilter] = useState('all')
  const [galleryOrg, setGalleryOrg] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash.length < 2) return
    const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ block: 'start' }), 700)
    return () => clearTimeout(timer)
  }, [])
  // Open the search with "/" or Ctrl+K (⌘K on Mac), unless the visitor is typing in a form
  useEffect(() => {
    function shortcut(event) {
      const typing = /^(input|textarea|select)$/i.test(event.target.tagName) || event.target.isContentEditable
      if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) { event.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])
  const [mapOpen, setMapOpen] = useState(false)
  const [smriti, setSmriti] = useState([])
  useEffect(() => { loadSmritiNames().then(setSmriti) }, [])

  const t = key => translate(language, key)

  // Banner slideshow: Thakur, Ma, Swamiji (the caption under the banner follows the slide)
  const [heroSlide, setHeroSlide] = useHeroSlide()
  const heroQuote = useHeroQuote(heroSlide)
  const heroCaption = language === 'en' ? null : quoteText(heroQuote, language)
  // A shared link (?event=<id> or ?notice=<id>) scrolls to that post and highlights it once
  const [sharedPostDone, setSharedPostDone] = useState(false)
  useEffect(() => {
    if (sharedPostDone) return
    const params = new URLSearchParams(window.location.search)
    const target = params.get('event') ? `event-${params.get('event')}` : params.get('notice') ? `notice-${params.get('notice')}` : null
    if (!target) { setSharedPostDone(true); return }
    const element = document.getElementById(target)
    if (!element) return
    setSharedPostDone(true)
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('post-highlight')
  }, [events, announcements, sharedPostDone])
  const currentLanguage = getLanguage(language)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = currentLanguage.rtl ? 'rtl' : 'ltr'
    document.title = t('brand_name')
    saveLanguage(language)
  }, [language])

  useEffect(() => {
    let active = true
    async function loadPublishedEvents() {
      const [{ data, error }, { data: galleryData }, { data: announcementData }] = await Promise.all([
        supabase.from('events').select('*').eq('is_published', true).order('event_date', { ascending: true }),
        supabase.from('gallery').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('announcements').select('id, title_en, title_bn, message_en, message_bn').eq('is_published', true).order('created_at', { ascending: false })
      ])
      if (!active) return
      if (error) { setEventsStatus('unavailable'); return }
      // Hide events whose date has passed (events without a date stay visible)
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      setEvents((data || []).filter(event => !event.event_date || String(event.event_date).slice(0, 10) >= today))
      setGallery(galleryData || [])
      setAnnouncements(announcementData || [])
      setEventsStatus('ready')
    }
    loadPublishedEvents()
    return () => { active = false }
  }, [])

  // Temple hours, contact details and committee (empty until the admin fills them in)
  useEffect(() => {
    Promise.all([
      supabase.from('worship_schedule').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('site_settings').select('*'),
      supabase.from('committee_contacts').select('id, name, role_en, role_bn, phone, email, sort_order').eq('is_public', true).order('sort_order'),
      supabase.from('temple_content').select('*').eq('slug', 'about-temple').eq('is_published', true).maybeSingle(),
      supabase.from('temple_highlights').select('*').eq('is_active', true).order('sort_order')
    ]).then(([scheduleResult, settingsResult, committeeResult, storyResult, highlightResult]) => {
      setStory(storyResult.data || null)
      setHighlights(highlightResult.data || [])
      setSchedule(scheduleResult.data || [])
      setSettings(Object.fromEntries((settingsResult.data || []).map(row => [row.key, row])))
      setCommittee(committeeResult.data || [])
    })
  }, [])

  const setting = key => (settings[key] ? (language === 'bn' ? settings[key].value_bn || settings[key].value_en : settings[key].value_en || settings[key].value_bn) : '')
  // Admin → Temple info: "play the song when the website opens"
  const bhajanAutoplay = settings.bhajan_autoplay?.value_en === 'on' && Boolean(setting('ticker_audio_url'))
  // Bangla digits in the address on the Bangla page (মহাজনহাট-৪৩২৮)
  const address = language === 'bn' ? localDigits(setting('address'), 'bn-BD') : setting('address')
  const socialLinks = Object.fromEntries(['facebook', 'youtube', 'instagram', 'whatsapp', 'tiktok'].map(name => [name, setting(`${name}_url`)]))
  const missions = highlights.filter(h => h.kind === 'mission')
  const deities = highlights.filter(h => h.kind === 'deity')
  // Photos of one organisation (or of the Samiti in general when organisation is empty)
  const orgPhotos = id => gallery.filter(item => (item.organisation || 'general') === id)
  const inOrg = gallery.filter(item => galleryOrg === 'all' || (item.organisation || 'general') === galleryOrg)
  const shownGallery = inOrg.filter(item => galleryFilter === 'all' || (item.category || 'temple') === galleryFilter)
  const usedGalleryFilters = GALLERY_FILTERS.filter(f => f === 'all' || inOrg.some(item => (item.category || 'temple') === f))
  const usedOrgFilters = ['all', 'general', ...ORGANISATIONS.map(org => org.id)].filter(id => id === 'all' || orgPhotos(id).length > 0)
  const orgName = id => { const org = ORGANISATIONS.find(o => o.id === id); return org ? (language === 'bn' ? org.name_bn : org.name_en) : id === 'general' ? t('gallery_general') : t('gallery_org_all') }
  function showOrgPhotos(id) {
    setGalleryOrg(id); setGalleryFilter('all')
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
  }
  // Map uses the saved address; before it is filled in, it searches for the temple name
  // One exact pin for everything: the Google Maps link saved in Admin if it has one, otherwise MAP_LOCATION
  const pin = locationFromMapsLink(setting('map_url')) || MAP_LOCATION
  const mapQuery = `${pin.lat},${pin.lng}`
  // Embedded map ("Open in Maps" inside it goes to the same pin)
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&z=17&output=embed`
  // "Get directions": the saved Google Maps link, or a route from the visitor to the pin
  const mapUrl = setting('map_url') || `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`
  const scheduleRows = [...schedule].sort((a, b) =>
    (a.day_of_week === null ? -1 : DAY_ORDER.indexOf(a.day_of_week)) - (b.day_of_week === null ? -1 : DAY_ORDER.indexOf(b.day_of_week)) ||
    String(a.start_time || '').localeCompare(String(b.start_time || '')))

  // Temple hours grouped per day: every day first, then Monday … Sunday; morning = before 12:00
  const hoursByDay = []
  for (const row of scheduleRows) {
    const key = row.day_of_week === null ? 'daily' : row.day_of_week
    let group = hoursByDay.find(g => g.key === key)
    if (!group) { group = { key, morning: [], evening: [], closed: false }; hoursByDay.push(group) }
    if (row.is_closed) { group.closed = true; continue }
    const hour = Number(String(row.start_time || '0').split(':')[0])
    group[hour < 12 ? 'morning' : 'evening'].push(row)
  }
  hoursByDay.forEach(g => { if (g.morning.length || g.evening.length) g.closed = false })
  const todayKey = new Date().getDay()
  // A title every slot shares (e.g. "Temple open") adds nothing in the table, so it is only shown when it differs
  const sharedTitle = scheduleRows.length > 1 && scheduleRows.every(row => row.title_en === scheduleRows[0].title_en) ? scheduleRows[0].title_en : null

  const closeMenu = () => setMenuOpen(false)
  return <div className="site">
    <header className="header">
      <a className="brand" href="#home" onClick={closeMenu} aria-label={t('brand_name')}><span className="brand-seal"><img src={`${import.meta.env.BASE_URL}emblem.svg`} alt="" /></span><span><strong>{t('brand_name')}</strong><em>{t('tag_worship')} <b>•</b> {t('tag_service')} <b>•</b> {t('tag_harmony')}</em></span></a>
      <LanguageSwitcher language={language} onChange={code => { setLanguage(code); closeMenu() }} label={t('choose_language')} />
      <button type="button" className="search-link search-mobile" onClick={() => { closeMenu(); setSearchOpen(true) }} aria-label={t('search_label')}><Search size={22} /></button>
      <button className="menu-toggle" type="button" onClick={() => setMenuOpen(open => !open)} aria-label={t('toggle_nav')} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
        <MainMenu t={t} language={language} onNavigate={closeMenu} has={{ story: Boolean(story && (pick(story, 'body', language) || pick(story, 'title', language))), mission: missions.length > 0, deities: deities.length > 0, notices: announcements.length > 0, slideshow: gallery.length > 0 }} />
        <Link className="admin-link" to="/admin/login" onClick={closeMenu}>{t('admin_login')}</Link><button type="button" className="search-link" onClick={() => { closeMenu(); setSearchOpen(true) }} aria-label={t('search_label')} title={`${t('search_label')} ( / )`}><Search size={20} /></button>
      </nav>
    </header>
    <main>
      <section className="hero" id="home"><HeroTicker text={[settings.ticker_message?.value_en, settings.ticker_message?.value_bn].filter(Boolean).join('\n')} audioUrl={bhajanAutoplay ? '' : setting('ticker_audio_url')} t={t} /><HeroSlides index={heroSlide} setIndex={setHeroSlide} t={t} /><HeroQuote quote={heroQuote} /></section>
      {heroCaption && <p className="hero-caption" key={`${heroQuote.slide.id}-${heroQuote.position}`}>{heroCaption[0]} {heroCaption[1]}<span>{heroCaption[2]}</span></p>}
      <div className="hero-orgs" aria-label={t('nav_orgs')}>
        <div className="hero-orgs-track">{[0, 1].map(copy => <ul key={copy} aria-hidden={copy === 1 ? true : undefined}>{ORGANISATIONS.map(org => <li key={org.id}><Link to={`/org/${org.id}`} tabIndex={copy === 1 ? -1 : undefined}>{language === 'bn' ? org.name_bn : org.name_en}</Link></li>)}</ul>)}</div>
      </div>
      <div className="hero-actions">
        <a className="hero-btn primary" href="#worship"><Clock size={18} /> {t('hero_btn_hours')}</a>
        <a className="hero-btn" href="#events">{t('hero_btn_events')} →</a>
        <a className="hero-btn hero-visit-btn" href="#contact"><MapPinHouse size={18} /> {t('visit_btn')}</a>
        <div className="hero-connect">
          <SocialLinks links={socialLinks} t={t} variant="dark" />
          <button type="button" className="hero-btn hero-message-btn" onClick={() => setOpenForm('contact')}><Mail size={18} /> {t('contact_form_btn')}</button>
        </div>
      </div>
      <section className="feature-grid" aria-label={t('nav_about')}>{featureCards.map(({ key, href, Icon }) => <a href={href} className="feature-card" key={key}><span className="feature-icon"><Icon size={33} strokeWidth={1.55} /></span><h2>{t(`${key}_t`)}</h2><p>{t(`${key}_c`)}</p><span className="feature-action">{t(`${key}_a`)} <b>→</b></span></a>)}</section>
      <section className="content-section welcome-section" id="about"><div><span className="section-eyebrow">{t('welcome_eyebrow')}</span><h1>{t('welcome_title')}</h1><p>{t('welcome_p1')}</p>
        {TRANSLATIONS[language]?.welcome_history && <p>{TRANSLATIONS[language].welcome_history}</p>}
        {TRANSLATIONS[language]?.welcome_heritage && <p>{TRANSLATIONS[language].welcome_heritage}</p>}
        <h3 className="acts-title">{t('acts_title')}</h3>
        <ul className="acts-grid" id="services">{ACTIVITIES.map(act => { const Icon = ORG_ICONS[act.icon] || Landmark; const org = ORGANISATIONS.find(o => o.id === act.id); const name = org ? (language === 'bn' ? org.name_bn : org.name_en) : t(`act_${act.id}_t`); return <li key={act.id} id={`act-${act.id}`} className={`act-item act-${act.icon}`}><span className="act-icon"><Icon size={20} strokeWidth={1.8} /></span><div><strong>{name}</strong><small>{t(`act_${act.id}_d`)}</small></div></li> })}</ul>
        <p>{t('welcome_p2')}</p>
        <a className="donate-btn welcome-visit-btn" href="#contact"><MapPinHouse size={18} /> {t('visit_btn')}</a><img className="welcome-emblem" src={`${import.meta.env.BASE_URL}emblem.svg`} alt={t('brand_name')} loading="lazy" /><blockquote>{t('blessing')}</blockquote></div><figure className="welcome-photo"><picture><source srcSet={`${import.meta.env.BASE_URL}images/belur-math-front.webp`} type="image/webp" /><img src={`${import.meta.env.BASE_URL}images/belur-math-front.jpg`} alt={t('belur_alt')} width="820" height="1016" loading="lazy" /></picture><figcaption>{t('belur_caption')}</figcaption></figure></section>
      {smriti.length > 0 && <section className="smriti-teaser" id="smriti" aria-labelledby="smriti-title">
        <StambhaPillar compact label={t('smriti_title')} />
        <div className="smriti-teaser-text">
          <span className="section-eyebrow">{t('smriti_engraving')}</span>
          <h2 id="smriti-title">{t('smriti_title')}</h2>
          <p>{t('smriti_p')}</p>
          <ul className="smriti-chips">{smriti.slice(0, 6).map(person => <li key={person.id} className={person.is_late ? 'late' : undefined}>{pickSmriti(person, 'name', language)}</li>)}{smriti.length > 6 && <li>+{smriti.length - 6}</li>}</ul>
          <Link to="/smriti-stambha" className="smriti-back">{t('smriti_btn')} <ArrowRight size={17} /></Link>
        </div>
      </section>}
      <PhotoSlideshow photos={gallery} t={t} getTitle={item => pick(item, 'title', language) || t('gallery_title')} getOrg={item => (item.organisation ? orgName(item.organisation) : '')} />
      <section className="org-section" id="organisations">
        <span className="section-eyebrow">{t('orgs_eyebrow')}</span><h2>{t('orgs_title')}</h2><p className="org-intro">{t('orgs_p')}</p>
        <div className="org-grid">{ORGANISATIONS.map(org => { const Icon = ORG_ICONS[org.type] || Landmark; const photos = orgPhotos(org.id); return <article className={`org-card org-${org.type}`} id={`org-${org.id}`} key={org.id}>
          {photos[0] && <button type="button" className="org-cover" onClick={() => showOrgPhotos(org.id)} aria-label={`${t('org_view_photos')} — ${org.name_en}`}><img src={photos[0].image_url} alt={pick(photos[0], 'title', language) || org.name_en} loading="lazy" /></button>}
          <div className="org-card-body">
            <span className="org-icon"><Icon size={30} strokeWidth={1.5} /></span>
            <div><span className="org-type">{t(`org_type_${org.type}`)}</span><h3 lang={language === 'bn' ? 'bn' : undefined}>{language === 'bn' ? org.name_bn : org.name_en}</h3>{language !== 'bn' && <p className="org-bengali" lang="bn">{org.name_bn}</p>}
              {(org.desc_en || org.desc_bn) && <p className="org-desc">{language === 'bn' ? org.desc_bn || org.desc_en : org.desc_en || org.desc_bn}</p>}
              <div className="org-card-actions"><Link className="org-page-link" to={`/org/${org.id}`}>{t('org_details')} →</Link>
              {photos.length > 0 ? <button type="button" className="org-photos-link" onClick={() => showOrgPhotos(org.id)}><Images size={15} /> {t('org_view_photos')} ({photos.length})</button> : <p className="org-no-photos">{t('org_no_photos')}</p>}</div>
            </div>
          </div>
        </article> })}</div>
      </section>
      {story && (pick(story, 'body', language) || pick(story, 'title', language)) && <section className="content-section story-section" id="story">
        <span className="section-eyebrow">{t('story_eyebrow')}</span>
        <h2>{pick(story, 'title', language)}</h2>
        <div className="story-body">{pick(story, 'body', language)}</div>
      </section>}
      {missions.length > 0 && <section className="highlight-section mission-section" id="mission">
        <span className="section-eyebrow">{t('mission_eyebrow')}</span><h2>{t('mission_title')}</h2>
        <div className="mission-grid">{missions.map(item => <article className="mission-card" key={item.id}><h3>{pick(item, 'title', language)}</h3><p>{pick(item, 'body', language)}</p></article>)}</div>
      </section>}
      {deities.length > 0 && <section className="highlight-section deity-section" id="deities">
        <span className="section-eyebrow">{t('deities_eyebrow')}</span><h2>{t('deities_title')}</h2>
        <div className="deity-grid">{deities.map(item => <article className="deity-card" key={item.id}>
          {item.image_url ? <img src={item.image_url} alt={pick(item, 'title', language)} loading="lazy" /> : <div className="deity-placeholder"><Landmark size={34} /></div>}
          <div>{pick(item, 'subtitle', language) && <span className="deity-subtitle">{pick(item, 'subtitle', language)}</span>}<h3>{pick(item, 'title', language)}</h3>{(item.pranam_bn || item.pranam_en) && <figure className="pranam"><figcaption>🙏 {t('pranam_label')}</figcaption><blockquote lang={language === 'bn' || !item.pranam_en ? 'bn' : 'sa-Latn'}>{(language === 'bn' ? item.pranam_bn || item.pranam_en : item.pranam_en || item.pranam_bn).split('\n').map((line, i) => <span key={i}>{line}</span>)}</blockquote></figure>}<p>{pick(item, 'body', language)}</p></div>
        </article>)}</div>
        <div className="join-box"><h3>{t('join_title')}</h3><p>{t('join_p')}</p><button type="button" className="donate-btn" onClick={() => setOpenForm('contact')}>{t('join_btn')}</button></div>
      </section>}
      <section className="worship-section" id="worship"><span className="section-eyebrow">{t('worship_eyebrow')}</span><h2>{t('hours_title')}</h2><p>{t('worship_p')}</p>
        {scheduleRows.length === 0 ? <p className="hours-empty">{t('hours_none')}</p> : <div className="hours-table-wrap">
          <table className="hours-table">
            <thead><tr><th scope="col">{t('hours_day')}</th><th scope="col"><Sunrise size={18} aria-hidden="true" /> {t('hours_morning')}</th><th scope="col"><Sunset size={18} aria-hidden="true" /> {t('hours_evening')}</th></tr></thead>
            <tbody>{hoursByDay.map(group => <tr key={group.key} className={[group.key === 'daily' ? 'daily' : '', group.key === todayKey ? 'today' : ''].join(' ').trim() || undefined}>
              <th scope="row">{group.key === 'daily' ? t('hours_daily') : weekdayName(group.key, currentLanguage.locale)}{group.key === todayKey && <span className="hours-today">{t('hours_today')}</span>}</th>
              {group.closed ? <td colSpan="2" className="hours-closed-cell">{t('hours_closed')}</td> : ['morning', 'evening'].map(part => <td key={part} data-label={t(part === 'morning' ? 'hours_morning' : 'hours_evening')}>
                {group[part].length === 0 ? <span className="hours-none">—</span> : group[part].map(row => <div className="hours-slot" key={row.id}>
                  <span className="hours-time">{formatTime(row.start_time, currentLanguage.locale)}{row.end_time ? ` – ${formatTime(row.end_time, currentLanguage.locale)}` : ''}</span>
                  {(row.title_en || row.title_bn) && row.title_en !== sharedTitle && <span className="hours-title">{language === 'bn' ? row.title_bn || row.title_en : row.title_en || row.title_bn}</span>}
                  {(row.note_en || row.note_bn) && <span className="hours-note">{language === 'bn' ? row.note_bn || row.note_en : row.note_en || row.note_bn}</span>}
                </div>)}
              </td>)}
            </tr>)}</tbody>
          </table>
        </div>}
        {setting('festival_hours_note') && <p className="hours-festival">{setting('festival_hours_note')}</p>}
        {setting('panjika_url') && <a className="panjika-link" href={setting('panjika_url')} target="_blank" rel="noopener noreferrer">{t('panjika_btn')} <ExternalLink size={16} /></a>}
      </section>
      <section className="events-section" id="events"><div className="section-heading"><div><span className="section-eyebrow">{t('events_eyebrow')}</span><h2>{t('events_title')}</h2></div><p>{t('events_p')}<Link className="events-cal-link" to="/calendar"><CalendarDays size={17} /> {t('cal_open')} →</Link></p></div>{eventsStatus === 'loading' && <p className="events-message">{t('events_loading')}</p>}{eventsStatus === 'unavailable' && <p className="events-message">{t('events_unavailable')}</p>}{eventsStatus === 'ready' && events.length === 0 && <p className="events-message">{t('events_none')}</p>}{events.length > 0 && <div className="events-grid">{events.map(event => { const title = pick(event, 'title', language); return <article className="event-card" id={`event-${event.id}`} key={event.id}>{event.image_url ? <img src={event.image_url} alt={title || t('events_title')} /> : <div className="event-photo-fallback"><CalendarDays size={34} /></div>}<div><time dateTime={event.event_date ? String(event.event_date).slice(0, 10) : undefined}>{formatEventDate(event.event_date, currentLanguage.locale, t('date_tba'))}</time><h3>{title}</h3>{language !== 'bn' && event.title_bn && event.title_bn !== event.title_en && <p className="event-bengali" lang="bn">{event.title_bn}</p>}{pick(event, 'subtitle', language) && <p className="event-subtitle">{pick(event, 'subtitle', language)}</p>}
              {(event.opens_at || event.puja_starts_at || event.closes_at) && <ul className="event-times">
                {event.opens_at && <li><span>{t('ev_opens')}</span><b>{formatTime(event.opens_at, currentLanguage.locale)}</b></li>}
                {event.puja_starts_at && <li><span>{t('ev_puja')}</span><b>{formatTime(event.puja_starts_at, currentLanguage.locale)}</b></li>}
                {event.closes_at && <li><span>{t('ev_closes')}</span><b>{formatTime(event.closes_at, currentLanguage.locale)}</b></li>}
              </ul>}
              {event.location && <p className="event-location"><MapPin size={14} /> {event.location}</p>}
              {(event.mantra_bn || event.mantra_en) && <figure className="pranam event-mantra"><figcaption>🙏 {t('mantra_label')}</figcaption><blockquote lang={language === 'bn' || !event.mantra_en ? 'bn' : 'sa-Latn'}>{(language === 'bn' ? event.mantra_bn || event.mantra_en : event.mantra_en || event.mantra_bn).split('\n').map((line, i) => <span key={i} className={line.startsWith('—') ? 'mantra-source' : undefined}>{line}</span>)}</blockquote></figure>}
              {pick(event, 'description', language) && <p className="event-description">{pick(event, 'description', language)}</p>}
              <PostShare kind="event" item={event} language={language} t={t} />
            </div></article> })}</div>}</section>
      <section className="content-section gallery-section" id="gallery"><div><span className="section-eyebrow">{t('gallery_eyebrow')}</span><h2>{galleryOrg === 'all' ? t('gallery_title') : orgName(galleryOrg)}</h2><p>{t('gallery_p')}</p>
        {usedOrgFilters.length > 2 && <div className="gallery-filters org-filters" role="group" aria-label={t('nav_orgs')}>{usedOrgFilters.map(id => <button type="button" key={id} className={galleryOrg === id ? 'active' : ''} aria-pressed={galleryOrg === id} onClick={() => { setGalleryOrg(id); setGalleryFilter('all') }}>{orgName(id)}</button>)}</div>}
        {usedGalleryFilters.length > 2 && <div className="gallery-filters" role="group" aria-label={t('gallery_title')}>{usedGalleryFilters.map(f => <button type="button" key={f} className={galleryFilter === f ? 'active' : ''} aria-pressed={galleryFilter === f} onClick={() => setGalleryFilter(f)}>{t(`gallery_${f}`)}</button>)}</div>}</div>
        {gallery.length > 0 ? <div className="gallery-grid">{shownGallery.map(item => { const title = pick(item, 'title', language); return <figure className="gallery-item" key={item.id}><button type="button" className="gallery-open" onClick={() => setLightbox(item)} aria-label={title || t('gallery_title')}><img src={item.image_url} alt={title || t('gallery_title')} loading="lazy" /></button><figcaption>{title}{item.organisation && galleryOrg === 'all' && <small>{orgName(item.organisation)}</small>}</figcaption></figure> })}</div> : <img src={`${import.meta.env.BASE_URL}temple-photo.webp`} alt={t('welcome_img_alt')} />}</section>
      {searchOpen && <Suspense fallback={null}><SiteSearch t={t} language={language} pick={pick} orgName={orgName}
        data={{ events, gallery, schedule, highlights, announcements }}
        scheduleLabel={row => [row.day_of_week === null || row.day_of_week === undefined ? t('hours_daily') : weekdayName(row.day_of_week, currentLanguage.locale), row.is_closed ? t('hours_closed') : [formatTime(row.start_time, currentLanguage.locale), formatTime(row.end_time, currentLanguage.locale)].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
        onOpenPhoto={photo => setLightbox(photo)} onClose={() => setSearchOpen(false)} /></Suspense>}
      {lightbox && <Modal title={pick(lightbox, 'title', language) || t('gallery_title')} closeLabel={t('close')} onClose={() => setLightbox(null)}><figure className="lightbox"><img src={lightbox.image_url} alt={pick(lightbox, 'title', language) || t('gallery_title')} />{(lightbox.organisation || pick(lightbox, 'description', language)) && <figcaption>{lightbox.organisation && <b>{orgName(lightbox.organisation)}</b>}{pick(lightbox, 'description', language) && <span>{pick(lightbox, 'description', language)}</span>}</figcaption>}</figure></Modal>}
      {announcements.length > 0 && <section className="announcements-section" id="notices"><span className="section-eyebrow">{t('notices_eyebrow')}</span><h2>{t('notices_title')}</h2><div className="announcements-grid">{announcements.map(item => <article className="announcement-card" id={`notice-${item.id}`} key={item.id}><h3>{pick(item, 'title', language)}</h3><p>{pick(item, 'message', language)}</p><PostShare kind="notice" item={item} language={language} t={t} /></article>)}</div></section>}
      <section className="donate-section" id="donate"><HeartHandshake size={34} /><h2>{t('donate_title')}</h2><p>{t('donate_p')}</p>
        <div className="donate-actions">
          <button type="button" className="donate-btn" onClick={() => setOpenForm('donate')}><HeartHandshake size={18} /> {t('donate_online_btn')}</button>
          <button type="button" className="donate-btn secondary" onClick={() => setOpenForm('monthly')}><Repeat size={18} /> {t('donate_monthly_btn')}</button>
        </div>
        <p className="donate-office-note">{t('donate_office_note')}</p>
      </section>
      {openForm === 'donate' && <Modal title={t('donate_online_btn')} closeLabel={t('close')} onClose={() => setOpenForm(null)}><Suspense fallback={<PageLoading inline />}><OnlineDonationForm t={t} language={language} /></Suspense></Modal>}
      {openForm === 'monthly' && <Modal title={t('donate_monthly_btn')} closeLabel={t('close')} onClose={() => setOpenForm(null)}><Suspense fallback={<PageLoading inline />}><SubscriptionForm t={t} /></Suspense></Modal>}      <section className="contact-section" id="contact"><span className="section-eyebrow visit-eyebrow">{t('visit_eyebrow')}</span><h2>{t('visit_title')}</h2><p className="visit-text">{t('visit_p')}</p><p className="visit-blessing">{t('visit_blessing')}</p><VisitQr t={t} /><p>{t('contact_p')}</p>
        <div className="contact-grid">
          {address && <div className="contact-item"><span className="contact-icon"><MapPin size={20} /></span><div><small>{t('contact_address')}</small><p>{address}</p>{mapUrl && <a className="contact-link" href={mapUrl} target="_blank" rel="noopener noreferrer">{t('directions')} <ExternalLink size={14} /></a>}</div></div>}
          {(setting('temple_phone') || committee.some(c => c.phone)) && <div className="contact-item"><span className="contact-icon"><Phone size={20} /></span><div><small>{t('contact_phone')}</small>
            {setting('temple_phone') && <p><a href={telHref(setting('temple_phone'))}>{setting('temple_phone')}</a></p>}
            {committee.filter(c => c.phone).map(c => <p key={c.id}>{c.name}{(c.role_en || c.role_bn) && <span className="contact-role"> ({language === 'bn' ? c.role_bn || c.role_en : c.role_en || c.role_bn})</span>} — <a href={telHref(c.phone)}>{c.phone}</a></p>)}
          </div></div>}
          {setting('email') && <div className="contact-item"><span className="contact-icon"><Mail size={20} /></span><div><small>{t('contact_email')}</small><p><a href={`mailto:${setting('email')}`}>{setting('email')}</a></p></div></div>}
        </div>
        {address && <iframe className="contact-map" title={t('map_title')} src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
      </section>
      {openForm === 'contact' && <Modal title={t('contact_form_title')} closeLabel={t('close')} onClose={() => setOpenForm(null)}><Suspense fallback={<PageLoading inline />}><PublicContactForm t={t} /></Suspense></Modal>}
    </main><footer className="site-footer">
      <div className="footer-grid">
        <div><img className="footer-emblem" src={`${import.meta.env.BASE_URL}emblem.svg`} alt={t('brand_name')} loading="lazy" /><strong className="footer-brand">{t('brand_name')}</strong><p>{t('footer_about')}</p><p className="footer-address"><MapPin size={14} aria-hidden="true" /> {address || t('footer_address')}</p><SocialLinks links={socialLinks} t={t} variant="dark" /></div>
        <div><h4>{t('footer_links')}</h4><ul>{navigation.map(([key, section]) => <li key={section}><a href={`#${section}`}>{t(key)}</a></li>)}<li><Link to="/smriti-stambha">{t('smriti_title')}</Link></li><li><Link to="/visits">{t('menu_visits')}</Link></li><li><Link to="/bhavadhara">{t('menu_bhavadhara')}</Link></li><li><Link to="/committee">{t('menu_committee')}</Link></li><li><Link to="/donors">{t('menu_donors')}</Link></li></ul></div>
        <div className="footer-hours"><h4>{t('footer_hours')}</h4>{hoursByDay.length === 0 ? <p>{t('hours_none')}</p> : <table className="footer-hours-table">
          <thead><tr><th scope="col">{t('hours_day')}</th><th scope="col"><Sunrise size={14} aria-hidden="true" /> {t('hours_morning')}</th><th scope="col"><Sunset size={14} aria-hidden="true" /> {t('hours_evening')}</th></tr></thead>
          <tbody>{hoursByDay.map(group => <tr key={group.key} className={group.key === todayKey ? 'today' : undefined}>
            <th scope="row">{group.key === 'daily' ? t('hours_daily') : weekdayName(group.key, currentLanguage.locale, 'short')}</th>
            {group.closed ? <td colSpan="2">{t('hours_closed')}</td> : ['morning', 'evening'].map(part => <td key={part}>
              {group[part].length === 0 ? '—' : group[part].map(row => <span key={row.id}>{shortTime(row.start_time, currentLanguage.locale)}{row.end_time ? `–${shortTime(row.end_time, currentLanguage.locale)}` : ''}</span>)}
            </td>)}
          </tr>)}</tbody>
        </table>}</div>
        <div><h4>{t('footer_contact')}</h4><ul>{setting('temple_phone') && <li><a href={telHref(setting('temple_phone'))}>{setting('temple_phone')}</a></li>}{committee.filter(c => c.phone).slice(0, 3).map(c => <li key={c.id}>{c.name} — <a href={telHref(c.phone)}>{c.phone}</a></li>)}{setting('email') && <li><a href={`mailto:${setting('email')}`}>{setting('email')}</a></li>}</ul></div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} RbcTcsWorld <span>·</span> {t('rights')}</p>
    </footer>
    <BackToTopButton label={t('back_home')} />
    {bhajanAutoplay && <WelcomeBhajan url={setting('ticker_audio_url')} title={setting('bhajan_title')} t={t} />}
    <div className={mapOpen ? 'location-float open' : 'location-float'}>
      {mapOpen && <div className="location-panel" role="dialog" aria-label={t('map_title')}>
        <div className="location-panel-head"><strong><MapPin size={16} /> {t('map_title')}</strong><button type="button" onClick={() => setMapOpen(false)} aria-label={t('close')}><X size={18} /></button></div>
        <iframe title={t('map_title')} src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        {address && <p className="location-address">{address}</p>}
        <a className="location-directions" href={mapUrl} target="_blank" rel="noopener noreferrer">{t('directions')} <ExternalLink size={14} /></a>
      </div>}
      <button type="button" className="location-btn" onClick={() => setMapOpen(open => !open)} aria-expanded={mapOpen}><MapPin size={20} /> <span>{t('location_btn')}</span></button>
    </div>
  </div>
}

// The demo build (npm run build:demo) is one HTML file opened from disk, so it keeps the route in memory
// Keeps the search-engine tags right while visitors move between pages without reloading
// (the static versions are written by scripts/seo-build.mjs at build time)
function setHeadTag(selector, create, attr, value) {
  let el = document.head.querySelector(selector)
  if (!value) { el?.remove(); return }
  if (!el) { el = create(); document.head.appendChild(el) }
  el.setAttribute(attr, value)
}
function RouteSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const page = findSeoPage(pathname)
    const lang = document.documentElement.lang === 'bn' ? 'bn' : 'en'
    const meta = (key, name) => () => { const el = document.createElement('meta'); el.setAttribute(key, name); return el }
    const site = (import.meta.env.VITE_SITE_URL || `${window.location.origin}${import.meta.env.BASE_URL}`).replace(/\/*$/, '/')
    const url = page ? (page.path === '/' ? site : site + page.path.slice(1)) : ''
    const hidden = NOINDEX_PREFIXES.some(prefix => pathname.startsWith(prefix))
    if (page) setHeadTag('meta[name="description"]', meta('name', 'description'), 'content', page.description[lang])
    setHeadTag('link[rel="canonical"]', () => { const el = document.createElement('link'); el.rel = 'canonical'; return el }, 'href', hidden ? '' : url)
    if (url) setHeadTag('meta[property="og:url"]', meta('property', 'og:url'), 'content', url)
    setHeadTag('meta[name="robots"]', meta('name', 'robots'), 'content', hidden ? 'noindex, nofollow' : '')
  }, [pathname])
  return null
}

const Router = import.meta.env.MODE === 'demo' ? MemoryRouter : BrowserRouter
createRoot(document.getElementById('root')).render(<Router basename={import.meta.env.MODE === 'demo' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}><Suspense fallback={<PageLoading />}><Routes><Route path="/" element={<App />} /><Route path="/smriti-stambha" element={<SmritiStambhaPage />} /><Route path="/org/:orgId" element={<OrgPage />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/visits" element={<VisitsPage />} /><Route path="/bhavadhara" element={<BhavadharaPage />} /><Route path="/donors" element={<DonorsPage />} /><Route path="/committee" element={<CommitteePage />} /><Route path="/admin" element={<Navigate to="/admin/login" replace />} /><Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes><RouteSeo /></Suspense></Router>)
