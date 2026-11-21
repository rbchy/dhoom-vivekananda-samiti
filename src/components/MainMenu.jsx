import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ACTIVITIES, ORGANISATIONS } from '../i18n-org'
import './main-menu.css'

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'
const isLatin = text => /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}&'’]+$/u.test(text)

// Gives every item of one dropdown its own single-key shortcut, shown underlined:
// a letter of the name for English-type names, otherwise a number 1, 2, 3 … in front of the name.
function withAccessKeys(items) {
  const used = new Set()
  const latin = items.every(item => isLatin(item.label))
  let number = 0
  return items.map(item => {
    if (latin) {
      const label = item.label
      const lower = label.toLowerCase()
      // prefer the first letter of a word, then any letter
      const starts = [...lower.matchAll(/(^|[\s(—-])([a-z])/g)].map(m => m.index + m[1].length)
      const anyLetters = [...lower].map((ch, i) => (/[a-z]/.test(ch) ? i : -1)).filter(i => i >= 0)
      const at = [...starts, ...anyLetters].find(i => !used.has(lower[i]))
      if (at !== undefined) { used.add(lower[at]); return { ...item, access: lower[at], accessAt: at } }
    }
    number += 1
    return { ...item, access: String(number), accessNumber: number }
  })
}

function AccessLabel({ item }) {
  if (item.accessNumber) return <><u className="mn-num" aria-hidden="true">{item.accessNumber}</u>{item.label}</>
  const i = item.accessAt
  return <>{item.label.slice(0, i)}<u className="mn-key">{item.label[i]}</u>{item.label.slice(i + 1)}</>
}

// Main menu with dropdowns. On computers a group opens on hover or click;
// on phones (inside the ☰ menu) each group opens and closes like an accordion.
export default function MainMenu({ t, language, onNavigate, has = {} }) {
  const [openKey, setOpenKey] = useState(null)
  const navRef = useRef(null)
  const hoverTimer = useRef(null)
  const name = org => (language === 'bn' ? org.name_bn : org.name_en)

  const groups = [
    { key: 'about', label: t('nav_about'), items: [
      { href: '#about', label: t('menu_intro') },
      has.story && { href: '#story', label: t('menu_story') },
      has.mission && { href: '#mission', label: t('mission_title') },
      { to: '/smriti-stambha', label: t('smriti_title') }
    ] },
    { key: 'orgs', label: t('nav_institutions'), items: [
      ...ORGANISATIONS.map(org => ({ to: `/org/${org.id}`, label: name(org) })),
      { href: '#organisations', label: t('menu_all_orgs'), divider: true }
    ] },
    { key: 'puja', label: t('nav_puja'), items: [
      { href: '#worship', label: t('hours_title') },
      { href: '#events', label: t('events_title') },
      { to: '/calendar', label: t('cal_title') },
      has.deities && { href: '#deities', label: t('deities_title') },
      has.notices && { href: '#notices', label: t('notices_title') }
    ] },
    { key: 'service', label: t('nav_service'), items: [
      ...ACTIVITIES.filter(act => act.icon !== 'temple' && act.icon !== 'cremation').map(act => {
        const org = ORGANISATIONS.find(o => o.id === act.id)
        return { href: `#act-${act.id}`, label: org ? name(org) : t(`act_${act.id}_t`) }
      }),
      { href: '#services', label: t('menu_all_services'), divider: true }
    ] },
    { key: 'gallery', label: t('nav_gallery'), items: [
      { href: '#gallery', label: t('gallery_title') },
      has.slideshow && { href: '#slideshow', label: t('slides_title') }
    ] }
  ].map(group => ({ ...group, items: withAccessKeys(group.items.filter(Boolean)) }))

  // Close on a click outside the menu or on Escape
  useEffect(() => {
    if (!openKey) return
    function outside(event) { if (navRef.current && !navRef.current.contains(event.target)) setOpenKey(null) }
    function escape(event) {
      if (event.key === 'Escape') {
        const button = navRef.current?.querySelector(`[data-group="${openKey}"]`)
        setOpenKey(null); button?.focus()
        return
      }
      // A single key opens the option whose letter or number is underlined
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return
      if (/^(input|textarea|select)$/i.test(event.target.tagName) || event.target.isContentEditable) return
      const digit = BANGLA_DIGITS.indexOf(event.key)
      const key = digit >= 0 ? String(digit) : event.key.toLowerCase()
      const target = navRef.current?.querySelector(`#menu-${openKey} [data-access="${CSS.escape(key)}"]`)
      if (target) { event.preventDefault(); target.click() }
    }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape) }
  }, [openKey])

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  const canHover = () => window.matchMedia('(hover: hover) and (min-width: 851px)').matches
  function enter(key) { if (!canHover()) return; clearTimeout(hoverTimer.current); setOpenKey(key) }
  function leave() { if (!canHover()) return; clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setOpenKey(null), 180) }
  function pick() { setOpenKey(null); onNavigate?.() }

  return <div className="main-menu" ref={navRef}>
    <a className="active" href="#home" onClick={pick}>{t('nav_home')}</a>
    {groups.map(group => {
      const open = openKey === group.key
      return <div className={open ? 'nav-dd open' : 'nav-dd'} key={group.key} onMouseEnter={() => enter(group.key)} onMouseLeave={leave}>
        <button type="button" className="nav-dd-btn" data-group={group.key} aria-expanded={open} aria-controls={`menu-${group.key}`} onClick={() => setOpenKey(open ? null : group.key)}>
          {group.label}<ChevronDown size={15} aria-hidden="true" />
        </button>
        <ul className="nav-dd-menu" id={`menu-${group.key}`} hidden={!open}>
          {group.items.map(item => <li key={item.href || item.to} className={item.divider ? 'divider' : undefined}>
            {item.to
              ? <Link to={item.to} onClick={pick} data-access={item.access} aria-keyshortcuts={item.access}><AccessLabel item={item} /></Link>
              : <a href={item.href} onClick={pick} data-access={item.access} aria-keyshortcuts={item.access}><AccessLabel item={item} /></a>}
          </li>)}
          <li className="mn-hint" aria-hidden="true">⌨ {t('menu_key_hint')}</li>
        </ul>
      </div>
    })}
    <a href="#donate" onClick={pick}>{t('nav_donate')}</a>
    <a href="#contact" onClick={pick}>{t('nav_contact')}</a>
  </div>
}
