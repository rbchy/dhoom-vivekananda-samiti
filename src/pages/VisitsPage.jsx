import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, MessageSquareQuote, PenLine, Quote } from 'lucide-react'
import Modal from '../components/Modal'
import SubPageShell, { newId, pickText, useSubPage, samitiPhotoHero } from '../components/SubPageShell'
import { supabase } from '../lib/supabaseClient'
import { checkPhone, EMAIL_PATTERN } from '../lib/validation'
import { ORGANISATIONS } from '../i18n-org'
import '../forms.css'
import '../visits.css'

const home = `${import.meta.env.BASE_URL}`

function formatDate(value, locale) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

// Public page: visits of senior monks of the Ramakrishna Order, with the memories of disciples (/visits)
export default function VisitsPage() {
  const page = useSubPage('hv_title')
  const { language, t, locale } = page
  const [visits, setVisits] = useState(undefined)
  const [memories, setMemories] = useState([])
  const [writingFor, setWritingFor] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('maharaj_visits').select('*').eq('is_published', true).order('visit_date', { ascending: false, nullsFirst: false }).order('sort_order'),
      supabase.from('visit_memories').select('id,visit_id,author_name,relation,place,memory,created_at').eq('status', 'approved').order('created_at')
    ]).then(([v, m]) => { setVisits(v.data || []); setMemories(m.data || []) })
  }, [])

  // Open the visit named in the address (#visit-<id>) once the list is loaded
  useEffect(() => {
    if (!visits?.length || !window.location.hash) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [visits])

  return <SubPageShell page={page} className="hv-page">
    <section className="hv-hero hv-hero-photo" style={samitiPhotoHero('linear-gradient(160deg,rgba(78,23,32,.88) 0%,rgba(122,36,48,.62) 50%,rgba(168,69,31,.80) 100%)')}>
      <div className="hv-hero-text">
        <span className="hv-kicker">{t('hv_kicker')}</span>
        <h1>{t('hv_title')}</h1>
        <p>{t('hv_intro')}</p>
      </div>
    </section>

    <main className="hv-main">
      {visits === undefined && <p className="hv-empty">{t('hv_loading')}</p>}
      {visits?.length === 0 && <p className="hv-empty">{t('hv_empty')}</p>}
      {visits?.map(visit => {
        const name = pickText(visit, 'monk_name', language)
        const title = pickText(visit, 'monk_title', language)
        const occasion = pickText(visit, 'occasion', language)
        const summary = pickText(visit, 'summary', language)
        const blessing = pickText(visit, 'blessing', language)
        const own = memories.filter(m => m.visit_id === visit.id)
        const places = ORGANISATIONS.filter(o => (visit.places || []).includes(o.id))
        const photos = (visit.photos || []).filter(Boolean)
        return <article key={visit.id} id={`visit-${visit.id}`} className="hv-visit">
          <div className="hv-visit-head">
            {visit.photo_url ? <img className="hv-portrait" src={visit.photo_url} alt={name} loading="lazy" /> : <div className="hv-portrait hv-portrait-blank" aria-hidden="true"><img src={`${home}emblem.svg`} alt="" /></div>}
            <div>
              {visit.visit_date && <p className="hv-date"><CalendarDays size={16} /> {formatDate(visit.visit_date, locale)}{visit.visit_date_end && visit.visit_date_end !== visit.visit_date && <> – {formatDate(visit.visit_date_end, locale)}</>}</p>}
              <h2>{name}</h2>
              {language !== 'bn' && visit.monk_name_bn && <p className="hv-name-bn" lang="bn">{visit.monk_name_bn}</p>}
              {title && <p className="hv-monk-title">{title}</p>}
              {occasion && <p className="hv-occasion">{occasion}</p>}
            </div>
          </div>

          {places.length > 0 && <div className="hv-places"><h3><MapPin size={16} /> {t('hv_places')}</h3>
            <ul>{places.map(o => <li key={o.id}><Link to={`/org/${o.id}`}>{language === 'bn' ? o.name_bn : o.name_en}</Link></li>)}</ul>
          </div>}

          {summary && <div className="hv-summary">{summary.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>}

          {blessing && <blockquote className="hv-blessing"><Quote size={22} aria-hidden="true" /><span className="hv-blessing-label">{t('hv_blessing')}</span><p>{blessing}</p><cite>— {name}</cite></blockquote>}

          {photos.length > 0 && <div className="hv-photos"><h3>{t('hv_photos')}</h3>
            <div className="hv-photo-grid">{photos.map((url, i) => <button type="button" key={url + i} onClick={() => setLightbox({ url, name })}><img src={url} alt={`${name} ${i + 1}`} loading="lazy" /></button>)}</div>
          </div>}

          <section className="hv-memories" aria-label={t('hv_memories')}>
            <h3><MessageSquareQuote size={18} /> {t('hv_memories')}</h3>
            {own.length === 0 && <p className="hv-muted">{t('hv_no_memories')}</p>}
            {own.map(m => <figure key={m.id} className="hv-memory">
              <blockquote>{m.memory}</blockquote>
              <figcaption><strong>{m.author_name}</strong>{[m.relation, m.place].filter(Boolean).map(x => <span key={x}> · {x}</span>)}</figcaption>
            </figure>)}
            {writingFor === visit.id
              ? <MemoryForm visitId={visit.id} t={t} onClose={() => setWritingFor(null)} />
              : <button type="button" className="hv-share-btn" onClick={() => setWritingFor(visit.id)}><PenLine size={16} /> {t('hv_share')}</button>}
          </section>
        </article>
      })}
    </main>

    {lightbox && <Modal title={lightbox.name} closeLabel={t('close')} onClose={() => setLightbox(null)}>
      <img className="hv-lightbox-img" src={lightbox.url} alt={lightbox.name} />
    </Modal>}
  </SubPageShell>
}

const emptyMemory = { author_name: '', relation: '', place: '', memory: '', contact: '', website: '' }

function MemoryForm({ visitId, t, onClose }) {
  const [form, setForm] = useState(emptyMemory)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  const id = name => `mem-${visitId}-${name}`

  function change(event) {
    const { name, value } = event.target
    setForm(p => ({ ...p, [name]: value })); setErrors(p => ({ ...p, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (form.website) { setStatus('sent'); return } // filled only by spam robots
    const contact = form.contact.trim()
    const contactIsEmail = contact.includes('@')
    const found = {
      author_name: form.author_name.trim().length < 2 || form.author_name.trim().length > 100 ? t('err_name') : '',
      memory: form.memory.trim().length < 20 || form.memory.trim().length > 3000 ? t('hv_err_memory') : '',
      contact: !contact ? '' : contactIsEmail ? (EMAIL_PATTERN.test(contact) ? '' : t('bd_err_email')) : (checkPhone(contact) ? t('bd_err_phone') : '')
    }
    setErrors(found)
    if (Object.values(found).some(Boolean)) { setStatus('fix'); return }
    setSending(true); setStatus('')
    const memoryId = newId()
    const clean = v => v.trim() || null
    const { error } = await supabase.from('visit_memories').insert({ id: memoryId, visit_id: visitId, author_name: form.author_name.trim(), relation: clean(form.relation), place: clean(form.place), memory: form.memory.trim(), status: 'pending' })
    if (!error && contact) await supabase.from('submission_contacts').insert({ kind: 'memory', ref_id: memoryId, name: form.author_name.trim(), email: contactIsEmail ? contact : null, phone: contactIsEmail ? null : contact })
    setSending(false)
    setStatus(error ? 'failed' : 'sent')
    if (!error) setForm(emptyMemory)
  }

  if (status === 'sent') return <p className="form-success" role="status">{t('hv_thanks')}</p>

  const field = (name, label, props = {}) => <div>
    <label htmlFor={id(name)}>{label}</label>
    {props.rows ? <textarea id={id(name)} name={name} value={form[name]} onChange={change} aria-invalid={Boolean(errors[name])} {...props} /> : <input id={id(name)} name={name} value={form[name]} onChange={change} aria-invalid={Boolean(errors[name])} {...props} />}
    {errors[name] && <small className="field-error">{errors[name]}</small>}
  </div>

  return <form className="public-form hv-form" onSubmit={submit} noValidate>
    <h4>{t('hv_form_title')}</h4>
    <p className="hv-muted">{t('hv_form_note')}</p>
    {status === 'fix' && <p className="form-error-summary" role="alert">{t('fix_fields')}</p>}
    {status === 'failed' && <p className="form-error-summary" role="alert">{t('hv_send_failed')}</p>}
    <div className="form-row">{field('author_name', `${t('f_name')} *`, { maxLength: 100, autoComplete: 'name' })}{field('relation', t('hv_f_relation'), { maxLength: 100, placeholder: t('hv_f_relation_ph') })}</div>
    <div className="form-row">{field('place', t('hv_f_place'), { maxLength: 100 })}{field('contact', t('hv_f_contact'), { maxLength: 254 })}</div>
    {field('memory', `${t('hv_f_memory')} *`, { rows: 6, maxLength: 3000, placeholder: t('hv_f_memory_ph') })}
    <div className="hv-trap" aria-hidden="true"><label htmlFor={id('website')}>Website</label><input id={id('website')} name="website" value={form.website} onChange={change} tabIndex={-1} autoComplete="off" /></div>
    <div className="hv-form-actions">
      <button type="submit" disabled={sending}>{sending ? t('hv_sending') : t('hv_send')}</button>
      <button type="button" className="hv-cancel" onClick={onClose}>{t('hv_cancel')}</button>
    </div>
  </form>
}
