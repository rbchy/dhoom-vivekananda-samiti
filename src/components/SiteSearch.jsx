import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, CalendarDays, Clock, HeartHandshake, Images, Landmark, Megaphone, Search, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITIES, ORGANISATIONS } from '../i18n-org'
import { translate } from '../i18n'
import './site-search.css'

// Lower-case, and ignore accents in English text, so "Sree", "sree" and "SREE" all match
const normalize = text => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const MAX_PER_GROUP = 6

// Search across the whole home page: institutions, service work, events, photos, worship times, notices and sections.
// Both the English and the Bangla text of every item are searched, whatever language the visitor has chosen.
export default function SiteSearch({ t, language, data, pick, orgName, scheduleLabel, onOpenPhoto, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const bn = language === 'bn'
  const both = (item, field) => [item[`${field}_en`], item[`${field}_bn`]].filter(Boolean).join(' ')
  // a fixed text of the site in English and Bangla, so either language finds it
  const enBn = key => `${translate('en', key)} ${translate('bn', key)}`

  // Everything that can be found, built once per data change
  const index = useMemo(() => {
    const entries = []
    const add = (group, entry) => entries.push({ group, ...entry, haystackTitle: normalize(entry.searchTitle), haystack: normalize(`${entry.searchTitle} ${entry.searchText || ''}`) })

    ORGANISATIONS.forEach(org => add('orgs', {
      key: `org-${org.id}`, title: bn ? org.name_bn : org.name_en, sub: t(`org_type_${org.type}`),
      searchTitle: `${org.name_en} ${org.name_bn}`, searchText: `${org.desc_en || ''} ${org.desc_bn || ''} ${enBn(`org_type_${org.type}`)}`, href: `#org-${org.id}`
    }))
    ACTIVITIES.filter(act => !ORGANISATIONS.some(org => org.id === act.id)).forEach(act => add('service', {
      key: `act-${act.id}`, title: t(`act_${act.id}_t`), sub: t(`act_${act.id}_d`),
      searchTitle: enBn(`act_${act.id}_t`), searchText: enBn(`act_${act.id}_d`), href: `#act-${act.id}`
    }))
    data.events.forEach(event => add('events', {
      key: `event-${event.id}`, title: pick(event, 'title', language), sub: event.event_date ? String(event.event_date).slice(0, 10) : t('date_tba'),
      searchTitle: both(event, 'title'), searchText: `${both(event, 'description')} ${event.location || ''}`, href: `#event-${event.id}`
    }))
    data.gallery.forEach(photo => add('gallery', {
      key: `photo-${photo.id}`, title: pick(photo, 'title', language) || t('gallery_title'), sub: photo.organisation ? orgName(photo.organisation) : '',
      searchTitle: both(photo, 'title'), searchText: `${both(photo, 'description')} ${photo.organisation ? orgName(photo.organisation) : ''}`, photo, thumb: photo.image_url
    }))
    data.schedule.forEach(row => add('worship', {
      key: `hours-${row.id}`, title: pick(row, 'title', language) || t('hours_title'), sub: scheduleLabel(row),
      searchTitle: both(row, 'title'), searchText: both(row, 'note'), href: '#worship'
    }))
    data.highlights.forEach(item => add('pages', {
      key: `hl-${item.id}`, title: pick(item, 'title', language), sub: item.kind === 'deity' ? t('deities_title') : t('mission_title'),
      searchTitle: both(item, 'title'), searchText: `${both(item, 'subtitle')} ${both(item, 'body')}`, href: item.kind === 'deity' ? '#deities' : '#mission'
    }))
    data.announcements.forEach(item => add('notices', {
      key: `notice-${item.id}`, title: pick(item, 'title', language), sub: t('notices_title'),
      searchTitle: both(item, 'title'), searchText: both(item, 'message'), href: `#notice-${item.id}`
    }))
    // Sections of the page, so words such as "donate", "contact" or "দান" lead somewhere
    ;[['about', 'menu_intro'], ['worship', 'hours_title'], ['events', 'events_title'], ['gallery', 'gallery_title'], ['donate', 'donate_title'], ['contact', 'visit_title'], ['organisations', 'orgs_title'], ['services', 'acts_title']]
      .forEach(([id, key]) => add('pages', { key: `sec-${id}`, title: t(key), sub: '', searchTitle: `${enBn(key)} ${id}`, searchText: '', href: `#${id}` }))
    // Stand-alone pages
    ;[['/visits', 'menu_visits', 'hv_intro', 'maharaj swami monk visit'], ['/bhavadhara', 'menu_bhavadhara', 'bd_intro', 'vedanta math mission ashram world directory']]
      .forEach(([to, key, text, extra]) => add('pages', { key: `page-${to}`, title: t(key), sub: '', searchTitle: enBn(key), searchText: `${enBn(text)} ${extra}`, to }))
    return entries
  }, [data, language])

  const words = normalize(query).split(/\s+/).filter(Boolean)
  const results = useMemo(() => {
    if (!words.length) return []
    const found = index
      .filter(entry => words.every(word => entry.haystack.includes(word)))
      .map(entry => ({ ...entry, score: words.reduce((sum, word) => sum + (entry.haystackTitle.includes(word) ? 3 : 1) + (entry.haystackTitle.startsWith(word) ? 2 : 0), 0) }))
      .sort((a, b) => b.score - a.score)
    const groups = {}
    for (const entry of found) { (groups[entry.group] ||= []); if (groups[entry.group].length < MAX_PER_GROUP) groups[entry.group].push(entry) }
    return ['orgs', 'service', 'events', 'worship', 'gallery', 'notices', 'pages'].filter(g => groups[g]).map(g => ({ group: g, items: groups[g] }))
  }, [index, query])
  const flat = results.flatMap(group => group.items)

  useEffect(() => { inputRef.current?.focus(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old } }, [])
  useEffect(() => { setActive(0) }, [query])
  useEffect(() => { listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active])

  function choose(entry) {
    onClose()
    if (entry.photo) { onOpenPhoto(entry.photo); return }
    if (entry.to) { navigate(entry.to); return }
    setTimeout(() => {
      const target = document.querySelector(entry.href)
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); target.classList.add('search-flash'); setTimeout(() => target.classList.remove('search-flash'), 2200) }
      history.replaceState(null, '', entry.href)
    }, 30)
  }

  function onKey(event) {
    if (event.key === 'Escape') { onClose(); return }
    if (!flat.length) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => (i + 1) % flat.length) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => (i - 1 + flat.length) % flat.length) }
    if (event.key === 'Enter') { event.preventDefault(); choose(flat[active]) }
  }

  const ICONS = { orgs: Landmark, service: HeartHandshake, events: CalendarDays, worship: Clock, gallery: Images, notices: Megaphone, pages: BookOpen }
  const LABELS = { orgs: t('nav_institutions'), service: t('nav_service'), events: t('events_title'), worship: t('hours_title'), gallery: t('gallery_title'), notices: t('notices_title'), pages: t('search_pages') }
  const mark = text => {
    const value = String(text || '')
    const word = words[0]
    if (!word) return value
    const at = normalize(value).indexOf(word)
    if (at < 0) return value
    return <>{value.slice(0, at)}<mark>{value.slice(at, at + word.length)}</mark>{value.slice(at + word.length)}</>
  }
  const quick = [['#worship', 'hours_title', Clock], ['#events', 'events_title', CalendarDays], ['#organisations', 'nav_institutions', Landmark], ['#gallery', 'gallery_title', Images], ['#donate', 'nav_donate', HeartHandshake], ['#contact', 'visit_btn', Sparkles]]
  let position = -1

  return <div className="search-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="search-panel" role="dialog" aria-modal="true" aria-label={t('search_label')}>
      <div className="search-input-row">
        <Search size={20} aria-hidden="true" />
        <input ref={inputRef} type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onKey} placeholder={t('search_placeholder')} aria-label={t('search_label')} aria-controls="search-results" aria-activedescendant={flat[active] ? `sr-${flat[active].key}` : undefined} maxLength={80} autoComplete="off" />
        <button type="button" className="search-close" onClick={onClose} aria-label={t('close')}><X size={20} /></button>
      </div>
      <div className="search-results" id="search-results" ref={listRef} role="listbox">
        {!words.length && <div className="search-quick">
          <p>{t('search_tip')}</p>
          <div>{quick.map(([href, key, Icon]) => <button type="button" key={href} onClick={() => choose({ href })}><Icon size={16} /> {t(key)}</button>)}</div>
        </div>}
        {words.length > 0 && !flat.length && <p className="search-none">{t('search_none')} “{query}”</p>}
        {results.map(({ group, items }) => { const Icon = ICONS[group]; return <section key={group} className="search-group">
          <h3><Icon size={15} aria-hidden="true" /> {LABELS[group]}</h3>
          <ul>{items.map(entry => { position += 1; const mine = position; return <li key={entry.key} id={`sr-${entry.key}`} role="option" aria-selected={mine === active} data-active={mine === active}>
            <button type="button" onClick={() => choose(entry)} onMouseEnter={() => setActive(mine)}>
              {entry.thumb ? <img src={entry.thumb} alt="" loading="lazy" /> : <span className="search-dot"><Icon size={16} /></span>}
              <span><strong>{mark(entry.title)}</strong>{entry.sub && <small>{entry.sub}</small>}</span>
            </button>
          </li> })}</ul>
        </section> })}
      </div>
      <div className="search-foot"><kbd>↑</kbd><kbd>↓</kbd> {t('search_keys_move')} · <kbd>Enter</kbd> {t('search_keys_open')} · <kbd>Esc</kbd> {t('close')}</div>
    </div>
  </div>
}
