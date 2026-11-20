import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabaseClient'
import { getInitialLanguage, getLanguage, saveLanguage, translate } from '../i18n'
import '../org-page.css'
import '../calendar.css'

const home = `${import.meta.env.BASE_URL}`
const pick = (item, field, language) => (language === 'bn' ? item?.[`${field}_bn`] || item?.[`${field}_en`] : item?.[`${field}_en`] || item?.[`${field}_bn`]) || ''
const pad = n => String(n).padStart(2, '0')
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayKey = () => { const n = new Date(); return dateKey(n.getFullYear(), n.getMonth(), n.getDate()) }

function formatTime(value, locale) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m))
}

// One event as an .ics file, so a visitor can add it to the calendar on their phone or computer
function downloadIcs(event, title, description) {
  const day = String(event.event_date).slice(0, 10).replace(/-/g, '')
  const time = (event.puja_starts_at || event.opens_at || '').slice(0, 5).replace(':', '')
  const next = new Date(`${String(event.event_date).slice(0, 10)}T00:00:00`); next.setDate(next.getDate() + 1)
  const nextDay = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`
  const escape = text => String(text || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => `\\${m}`)
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dhoom Vivekananda Samiti//Calendar//EN', 'BEGIN:VEVENT',
    `UID:${event.id}@dhoom-vivekananda-samiti`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    time ? `DTSTART:${day}T${time}00` : `DTSTART;VALUE=DATE:${day}`, time ? `DURATION:PT3H` : `DTEND;VALUE=DATE:${nextDay}`,
    `SUMMARY:${escape(title)}`, `DESCRIPTION:${escape(description)}`, `LOCATION:${escape(event.location || 'Dhoom Vivekananda Samiti, Dhoom, Mirsharai, Chattogram')}`,
    'END:VEVENT', 'END:VCALENDAR']
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }))
  link.download = `${title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'event'}.ics`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// Public page: /calendar  (a month can be linked as /calendar?month=2027-02)
export default function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const [language, setLanguage] = useState(getInitialLanguage)
  const [events, setEvents] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [open, setOpen] = useState(null)
  const t = key => translate(language, key)
  const current = getLanguage(language)
  const locale = current.locale

  const now = new Date()
  const match = /^(\d{4})-(\d{2})$/.exec(params.get('month') || '')
  const year = match ? Number(match[1]) : now.getFullYear()
  const month = match ? Math.min(11, Math.max(0, Number(match[2]) - 1)) : now.getMonth()
  const goTo = (y, m) => { const d = new Date(y, m, 1); setParams({ month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }, { replace: true }) }

  useEffect(() => {
    window.scrollTo(0, 0)
    Promise.all([
      supabase.from('events').select('*').eq('is_published', true).order('event_date'),
      supabase.from('event_catalog').select('id, name_en, name_bn, usual_month, sort_order').eq('is_active', true).order('usual_month').order('sort_order')
    ]).then(([ev, cat]) => { setEvents(ev.data || []); setCatalog(cat.data || []) })
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = current.rtl ? 'rtl' : 'ltr'
    document.title = `${t('cal_title')} · ${t('brand_name')}`
    saveLanguage(language)
  }, [language])

  const num = n => new Intl.NumberFormat(locale, { useGrouping: false }).format(n)
  const monthName = (y, m) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(y, m, 1))
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i)))
  const longDate = value => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`))

  // Events by day
  const byDay = useMemo(() => {
    const map = {}
    for (const event of events || []) if (event.event_date) (map[String(event.event_date).slice(0, 10)] ||= []).push(event)
    return map
  }, [events])

  // Yearly festivals of a month that do not have a dated event in that month yet
  const usualFor = (y, m) => {
    const prefix = `${y}-${pad(m + 1)}`
    const dated = (events || []).filter(e => String(e.event_date || '').startsWith(prefix))
    const norm = text => String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
    return catalog.filter(item => item.usual_month === m + 1 && !dated.some(e => [e.title_en, e.title_bn].some(title => norm(title).includes(norm(item.name_en)) || norm(title).includes(norm(item.name_bn)))))
  }

  // The month grid, Sunday first
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  const today = todayKey()
  const monthEvents = (events || []).filter(e => String(e.event_date || '').startsWith(`${year}-${pad(month + 1)}`))
  const monthUsual = usualFor(year, month)

  return <div className="org-page cal-page">
    <header className="org-bar">
      <Link to="/" className="org-bar-brand"><img src={`${home}emblem.svg`} alt="" /><span>{t('brand_name')}</span></Link>
      <div className="org-bar-actions">
        <LanguageSwitcher language={language} onChange={setLanguage} label={t('choose_language')} />
        <Link to="/" className="org-back"><ArrowLeft size={17} /> {t('smriti_back')}</Link>
      </div>
    </header>

    <section className="cal-hero">
      <span className="section-eyebrow">{t('nav_puja')}</span>
      <h1><CalendarDays size={34} /> {t('cal_title')}</h1>
      <p>{t('cal_p')}</p>
    </section>

    <main className="cal-main">
      <section className="cal-month" aria-label={`${monthName(year, month)} ${num(year)}`}>
        <div className="cal-toolbar">
          <button type="button" onClick={() => goTo(year, month - 1)} aria-label={t('cal_prev')}><ChevronLeft size={22} /></button>
          <h2>{monthName(year, month)} {num(year)}</h2>
          <button type="button" onClick={() => goTo(year, month + 1)} aria-label={t('cal_next')}><ChevronRight size={22} /></button>
          <button type="button" className="cal-today-btn" onClick={() => goTo(now.getFullYear(), now.getMonth())}>{t('cal_today')}</button>
        </div>
        <div className="cal-grid" role="grid">
          {weekdays.map(w => <div className="cal-wd" role="columnheader" key={w}>{w}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div className="cal-cell empty" key={`e${i}`} />
            const key = dateKey(year, month, day)
            const list = byDay[key] || []
            return <div key={key} role="gridcell" className={`cal-cell${key === today ? ' today' : ''}${list.length ? ' has-event' : ''}${key < today ? ' past' : ''}`}>
              <span className="cal-day">{num(day)}</span>
              {list.map(event => <button type="button" key={event.id} className="cal-chip" onClick={() => setOpen(event)}>{pick(event, 'title', language)}</button>)}
            </div>
          })}
        </div>
      </section>

      <aside className="cal-side">
        <div className="org-card-box">
          <h3>{t('cal_month_events')}</h3>
          {events === null ? <p className="org-loading">…</p> : <>
            {monthEvents.length === 0 && monthUsual.length === 0 && <p className="cal-empty">{t('cal_none_month')}</p>}
            <ul className="cal-list">
              {monthEvents.map(event => <li key={event.id}><button type="button" onClick={() => setOpen(event)}>
                <span className="cal-date-badge"><b>{num(Number(String(event.event_date).slice(8, 10)))}</b><small>{new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(`${String(event.event_date).slice(0, 10)}T00:00:00`))}</small></span>
                <span><strong>{pick(event, 'title', language)}</strong>{(event.puja_starts_at || event.opens_at) && <small><Clock size={13} /> {formatTime(event.puja_starts_at || event.opens_at, locale)}</small>}</span>
              </button></li>)}
              {monthUsual.map(item => <li key={item.id} className="usual"><div>
                <span className="cal-date-badge tba"><CalendarDays size={18} /></span>
                <span><strong>{pick(item, 'name', language)}</strong><small>{t('cal_usual')} · {t('date_tba')}</small></span>
              </div></li>)}
            </ul>
          </>}
        </div>
      </aside>

      <section className="cal-year">
        <h2>{t('cal_year')} {num(year)}</h2>
        <div className="cal-year-grid">{Array.from({ length: 12 }, (_, m) => {
          const dated = (events || []).filter(e => String(e.event_date || '').startsWith(`${year}-${pad(m + 1)}`))
          const usual = usualFor(year, m)
          return <button type="button" key={m} className={`cal-year-month${m === month ? ' active' : ''}`} onClick={() => { goTo(year, m); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <strong>{monthName(year, m)}</strong>
            {dated.length + usual.length === 0 ? <small className="cal-year-none">—</small> : <ul>
              {dated.map(e => <li key={e.id} className="dated"><b>{num(Number(String(e.event_date).slice(8, 10)))}</b> {pick(e, 'title', language)}</li>)}
              {usual.map(item => <li key={item.id}>{pick(item, 'name', language)}</li>)}
            </ul>}
          </button>
        })}</div>
        <p className="cal-legend"><span className="dot dated" /> {t('cal_legend_dated')} <span className="dot" /> {t('cal_usual')}</p>
      </section>
    </main>

    <footer className="org-foot">© {new Date().getFullYear()} RbcTcsWorld <span>·</span> {t('rights')}</footer>

    {open && <Modal title={pick(open, 'title', language)} closeLabel={t('close')} onClose={() => setOpen(null)}>
      <div className="cal-detail">
        {open.image_url && <img src={open.image_url} alt="" />}
        <p className="cal-detail-date"><CalendarDays size={17} /> {longDate(open.event_date)}</p>
        {pick(open, 'subtitle', language) && <p className="cal-detail-sub">{pick(open, 'subtitle', language)}</p>}
        {(open.opens_at || open.puja_starts_at || open.closes_at) && <ul className="event-times">
          {open.opens_at && <li><span>{t('ev_opens')}</span><b>{formatTime(open.opens_at, locale)}</b></li>}
          {open.puja_starts_at && <li><span>{t('ev_puja')}</span><b>{formatTime(open.puja_starts_at, locale)}</b></li>}
          {open.closes_at && <li><span>{t('ev_closes')}</span><b>{formatTime(open.closes_at, locale)}</b></li>}
        </ul>}
        {open.location && <p className="cal-detail-loc"><MapPin size={16} /> {open.location}</p>}
        {pick(open, 'description', language) && <p>{pick(open, 'description', language)}</p>}
        {(open.mantra_bn || open.mantra_en) && <figure className="org-mantra"><figcaption>🙏 {t('mantra_label')}</figcaption><blockquote>{(language === 'bn' ? open.mantra_bn || open.mantra_en : open.mantra_en || open.mantra_bn).split('\n').map((line, i) => <span key={i}>{line}</span>)}</blockquote></figure>}
        <button type="button" className="cal-add" onClick={() => downloadIcs(open, pick(open, 'title', language), pick(open, 'description', language))}><CalendarPlus size={18} /> {t('cal_add')}</button>
      </div>
    </Modal>}
  </div>
}
