import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ACTIVITIES, ORGANISATIONS } from '../i18n-org'
import './main-menu.css'

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
  ].map(group => ({ ...group, items: group.items.filter(Boolean) }))

  // Close on a click outside the menu or on Escape
  useEffect(() => {
    if (!openKey) return
    function outside(event) { if (navRef.current && !navRef.current.contains(event.target)) setOpenKey(null) }
    function escape(event) {
      if (event.key !== 'Escape') return
      const button = navRef.current?.querySelector(`[data-group="${openKey}"]`)
      setOpenKey(null); button?.focus()
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
            {item.to ? <Link to={item.to} onClick={pick}>{item.label}</Link> : <a href={item.href} onClick={pick}>{item.label}</a>}
          </li>)}
        </ul>
      </div>
    })}
    <a href="#donate" onClick={pick}>{t('nav_donate')}</a>
    <a href="#contact" onClick={pick}>{t('nav_contact')}</a>
  </div>
}
