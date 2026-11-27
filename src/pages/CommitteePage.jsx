import { useEffect, useMemo, useState } from 'react'
import { Mail, Phone, Users } from 'lucide-react'
import SubPageShell, { pickText, useSubPage, samitiPhotoHero } from '../components/SubPageShell'
import { localDigits } from '../components/StambhaPillar'
import { supabase } from '../lib/supabaseClient'
import { initials } from '../lib/smriti'
import { LEADER_POSITIONS, positionById } from '../lib/officials'
import '../visits.css'
import '../honours.css'

const rankOf = person => positionById(person.position)?.order ?? 200
const byRank = (a, b) => rankOf(a) - rankOf(b) || a.sort_order - b.sort_order || a.name_en.localeCompare(b.name_en)
const telHref = phone => `tel:${String(phone).replace(/[^\d+]/g, '')}`

// Public page: the Samiti's officials (/committee) — the current committee first, earlier ones below
export default function CommitteePage() {
  const page = useSubPage('cm_title')
  const { language, t, locale } = page
  const [people, setPeople] = useState(undefined)

  useEffect(() => {
    supabase.from('samiti_officials').select('*').eq('is_published', true).order('sort_order').order('name_en')
      .then(({ data }) => setPeople(data || []))
  }, [])

  const current = useMemo(() => (people || []).filter(p => p.is_current).sort(byRank), [people])
  const leaders = current.filter(p => LEADER_POSITIONS.includes(p.position))
  const others = current.filter(p => !LEADER_POSITIONS.includes(p.position))
  const termNow = [...new Set(current.map(p => p.term).filter(Boolean))].join(', ')
  const former = useMemo(() => {
    const map = new Map()
    for (const p of (people || []).filter(x => !x.is_current)) map.set(p.term || '—', [...(map.get(p.term || '—') || []), p])
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([term, list]) => [term, list.sort(byRank)])
  }, [people])

  const role = person => pickText(person, 'role', language) || (language === 'bn' ? positionById(person.position)?.bn : positionById(person.position)?.en) || ''
  const card = (person, big) => {
    const name = pickText(person, 'name', language)
    const about = pickText(person, 'about', language)
    return <li key={person.id} className={big ? 'cm-card cm-leader' : 'cm-card'}>
      <div className="dn-photo cm-photo">{person.photo_url ? <img src={person.photo_url} alt={name} loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>}</div>
      <p className="cm-role">{role(person)}</p>
      <h3>{name}</h3>
      {language !== 'bn' && person.name_bn && <p className="hv-name-bn" lang="bn">{person.name_bn}</p>}
      {about && <p className="cm-about">{about}</p>}
      {(person.phone || person.email) && <ul className="cm-contacts">
        {person.phone && <li><a href={telHref(person.phone)}><Phone size={14} /> {person.phone}</a></li>}
        {person.email && <li><a href={`mailto:${person.email}`}><Mail size={14} /> {person.email}</a></li>}
      </ul>}
    </li>
  }

  return <SubPageShell page={page} className="cm-page">
    <section className="hv-hero hv-hero-photo cm-hero" style={samitiPhotoHero('linear-gradient(160deg,rgba(20,52,40,.88) 0%,rgba(40,80,64,.60) 50%,rgba(122,36,48,.80) 100%)')}>
      <div className="hv-hero-text">
        <span className="hv-kicker">{t('cm_kicker')}</span>
        <h1>{t('cm_title')}</h1>
        <p>{t('cm_intro')}</p>
      </div>
    </section>

    <main className="dn-main">
      {people === undefined && <p className="hv-empty">{t('hv_loading')}</p>}
      {people && current.length === 0 && former.length === 0 && <p className="hv-empty">{t('cm_empty')}</p>}
      {current.length > 0 && <section aria-labelledby="cm-now">
        <h2 id="cm-now" className="cm-heading"><Users size={22} /> {t('cm_current')}{termNow && <small> · {t('cm_term')} {localDigits(termNow, locale)}</small>}</h2>
        {leaders.length > 0 && <ul className="cm-grid cm-grid-leaders">{leaders.map(p => card(p, true))}</ul>}
        {others.length > 0 && <ul className="cm-grid">{others.map(p => card(p, false))}</ul>}
      </section>}
      {former.length > 0 && <section className="cm-former" aria-labelledby="cm-former">
        <h2 id="cm-former" className="cm-heading">{t('cm_former')}</h2>
        {former.map(([term, list], i) => <details key={term} open={current.length === 0 && i === 0}>
          <summary>{t('cm_term')} {localDigits(term, locale)} <small>({localDigits(list.length, locale)})</small></summary>
          <ul className="cm-grid">{list.map(p => card(p, false))}</ul>
        </details>)}
      </section>}
    </main>
  </SubPageShell>
}
