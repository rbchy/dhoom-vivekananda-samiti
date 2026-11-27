import { useEffect, useMemo, useState } from 'react'
import { Globe2, Mail, MapPin, Phone, Plus, Search } from 'lucide-react'
import SubPageShell, { newId, pickText, useSubPage, PageBanner } from '../components/SubPageShell'
import { supabase } from '../lib/supabaseClient'
import { checkPhone, EMAIL_PATTERN } from '../lib/validation'
import { BHAVADHARA_TYPES } from '../i18n-visits'
import '../forms.css'
import '../visits.css'

const norm = s => (s || '').toLocaleLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim()

// Public directory of Ramakrishna–Vivekananda organisations in the world (/bhavadhara)
export default function BhavadharaPage() {
  const page = useSubPage('bd_title')
  const { language, t } = page
  const [orgs, setOrgs] = useState(undefined)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [type, setType] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    supabase.from('bhavadhara_orgs').select('id,name_en,name_bn,org_type,country,city,address,website,email,phone,founded_year,about_en,about_bn,photo_url,sort_order')
      .eq('status', 'approved').order('country').order('sort_order').order('name_en')
      .then(({ data }) => setOrgs(data || []))
  }, [])

  const countries = useMemo(() => [...new Set((orgs || []).map(o => o.country.trim()))].sort((a, b) => a.localeCompare(b)), [orgs])
  const shown = useMemo(() => {
    const q = norm(query)
    return (orgs || []).filter(o => (!country || o.country.trim() === country) && (!type || o.org_type === type)
      && (!q || [o.name_en, o.name_bn, o.city, o.country, o.address].some(v => norm(v).includes(q))))
  }, [orgs, query, country, type])
  const groups = useMemo(() => {
    const map = new Map()
    for (const o of shown) { const k = o.country.trim(); map.set(k, [...(map.get(k) || []), o]) }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [shown])

  function openForm() {
    setAdding(true)
    setTimeout(() => document.getElementById('bd-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return <SubPageShell page={page} className="bd-page">
    <PageBanner src="images/holy-trio.webp" alt="Sri Ramakrishna, Holy Mother Sri Sarada Devi and Swami Vivekananda" framed fill="#a62f35" />
    <section className="hv-hero bd-hero">
      <div className="hv-hero-text">
        <span className="hv-kicker">{t('bd_kicker')}</span>
        <h1>{t('bd_title')}</h1>
        <p>{t('bd_intro')}</p>
        <button type="button" className="bd-add-btn" onClick={openForm}><Plus size={18} /> {t('bd_add')}</button>
      </div>
    </section>

    <main className="bd-main">
      {orgs?.length > 0 && <div className="bd-filters" role="search">
        <label className="bd-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t('bd_search')}</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('bd_search')} />
        </label>
        <select value={country} onChange={e => setCountry(e.target.value)} aria-label={t('bd_f_country')}>
          <option value="">{t('bd_all_countries')}</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} aria-label={t('bd_f_type')}>
          <option value="">{t('bd_all_types')}</option>
          {BHAVADHARA_TYPES.map(k => <option key={k} value={k}>{t(`bd_type_${k}`)}</option>)}
        </select>
        <p className="bd-count" aria-live="polite">{shown.length} {t('bd_count')}</p>
      </div>}

      {orgs === undefined && <p className="hv-empty">{t('hv_loading')}</p>}
      {orgs?.length === 0 && <p className="hv-empty">{t('bd_empty')}</p>}
      {orgs?.length > 0 && shown.length === 0 && <p className="hv-empty">{t('bd_no_match')}</p>}

      {groups.map(([name, list]) => <section key={name} className="bd-country">
        <h2><Globe2 size={20} /> {name} <small>({list.length})</small></h2>
        <div className="bd-grid">{list.map(o => {
          const about = pickText(o, 'about', language)
          return <article key={o.id} className="bd-card">
            {o.photo_url && <img src={o.photo_url} alt="" loading="lazy" />}
            <span className="bd-type">{t(`bd_type_${o.org_type}`)}</span>
            <h3>{pickText(o, 'name', language)}</h3>
            {language !== 'bn' && o.name_bn && <p className="hv-name-bn" lang="bn">{o.name_bn}</p>}
            {(o.address || o.city) && <p className="bd-line"><MapPin size={15} /> {[o.address, o.city].filter(Boolean).join(', ')}</p>}
            {about && <p className="bd-about">{about}</p>}
            <ul className="bd-contacts">
              {o.website && <li><a href={o.website} target="_blank" rel="noopener noreferrer"><Globe2 size={15} /> {t('bd_website')}</a></li>}
              {o.email && <li><a href={`mailto:${o.email}`}><Mail size={15} /> {o.email}</a></li>}
              {o.phone && <li><a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}><Phone size={15} /> {o.phone}</a></li>}
            </ul>
            {o.founded_year && <p className="bd-founded">{t('bd_founded')}: {o.founded_year}</p>}
          </article>
        })}</div>
      </section>)}

      {adding ? <AddOrgForm t={t} existing={orgs || []} onClose={() => setAdding(false)} />
        : orgs !== undefined && <div className="bd-add-again"><button type="button" className="bd-add-btn" onClick={openForm}><Plus size={18} /> {t('bd_add')}</button></div>}
    </main>
  </SubPageShell>
}

const emptyOrg = { name_en: '', name_bn: '', org_type: 'rkm_branch', country: '', city: '', address: '', website: '', email: '', phone: '', founded_year: '', about_en: '', about_bn: '', your_name: '', your_email: '', confirm: false, homepage: '' }

function AddOrgForm({ t, existing, onClose }) {
  const [form, setForm] = useState(emptyOrg)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  function change(event) {
    const { name, value, type, checked } = event.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); setErrors(p => ({ ...p, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (form.homepage) { setStatus('sent'); return } // filled only by spam robots
    const year = form.founded_year.trim()
    const thisYear = new Date().getFullYear()
    const website = form.website.trim()
    const name = form.name_en.trim()
    const found = {
      name_en: name.length < 3 || name.length > 200 ? t('bd_err_name')
        : existing.some(o => norm(o.name_en) === norm(name) && norm(o.country) === norm(form.country)) ? t('bd_err_duplicate') : '',
      country: form.country.trim().length < 2 ? t('bd_err_country') : '',
      website: website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(website) ? t('bd_err_website') : '',
      email: form.email.trim() && !EMAIL_PATTERN.test(form.email.trim()) ? t('bd_err_email') : '',
      phone: form.phone.trim() && checkPhone(form.phone) ? t('bd_err_phone') : '',
      founded_year: year && (!/^\d{4}$/.test(year) || +year < 1850 || +year > thisYear) ? t('bd_err_year') : '',
      your_name: form.your_name.trim().length < 2 || form.your_name.trim().length > 100 ? t('err_name') : '',
      your_email: !EMAIL_PATTERN.test(form.your_email.trim()) ? t('bd_err_email') : '',
      confirm: form.confirm ? '' : t('bd_err_confirm')
    }
    setErrors(found)
    if (Object.values(found).some(Boolean)) { setStatus('fix'); return }
    setSending(true); setStatus('')
    const id = newId()
    const clean = v => v.trim() || null
    const { error } = await supabase.from('bhavadhara_orgs').insert({
      id, name_en: name, name_bn: clean(form.name_bn), org_type: form.org_type, country: form.country.trim(), city: clean(form.city), address: clean(form.address),
      website: website || null, email: clean(form.email), phone: clean(form.phone), founded_year: year ? Number(year) : null,
      about_en: clean(form.about_en), about_bn: clean(form.about_bn), status: 'pending'
    })
    if (!error) await supabase.from('submission_contacts').insert({ kind: 'bhavadhara', ref_id: id, name: form.your_name.trim(), email: form.your_email.trim() })
    setSending(false)
    setStatus(error ? 'failed' : 'sent')
    if (!error) setForm(emptyOrg)
  }

  if (status === 'sent') return <div id="bd-form" className="bd-form-box"><p className="form-success" role="status">{t('bd_thanks')}</p></div>

  const field = (name, label, props = {}) => <div>
    <label htmlFor={`bd-${name}`}>{label}</label>
    {props.rows ? <textarea id={`bd-${name}`} name={name} value={form[name]} onChange={change} aria-invalid={Boolean(errors[name])} {...props} /> : <input id={`bd-${name}`} name={name} value={form[name]} onChange={change} aria-invalid={Boolean(errors[name])} {...props} />}
    {errors[name] && <small className="field-error">{errors[name]}</small>}
  </div>

  return <div id="bd-form" className="bd-form-box">
    <form className="public-form" onSubmit={submit} noValidate>
      <h2>{t('bd_form_title')}</h2>
      <p className="hv-muted">{t('bd_form_note')}</p>
      {status === 'fix' && <p className="form-error-summary" role="alert">{t('fix_fields')}</p>}
      {status === 'failed' && <p className="form-error-summary" role="alert">{t('hv_send_failed')}</p>}
      <div className="form-row">{field('name_en', `${t('bd_f_name_en')} *`, { maxLength: 200 })}{field('name_bn', t('bd_f_name_bn'), { maxLength: 200, lang: 'bn' })}</div>
      <div className="form-row">
        <div><label htmlFor="bd-org_type">{t('bd_f_type')} *</label>
          <select id="bd-org_type" name="org_type" value={form.org_type} onChange={change}>{BHAVADHARA_TYPES.map(k => <option key={k} value={k}>{t(`bd_type_${k}`)}</option>)}</select></div>
        {field('founded_year', t('bd_f_founded'), { inputMode: 'numeric', maxLength: 4 })}
      </div>
      <div className="form-row">{field('country', `${t('bd_f_country')} *`, { maxLength: 80, autoComplete: 'country-name' })}{field('city', t('bd_f_city'), { maxLength: 100 })}</div>
      {field('address', t('bd_f_address'), { maxLength: 300 })}
      <div className="form-row">{field('website', t('bd_f_website'), { type: 'url', maxLength: 300, placeholder: 'https://' })}{field('email', t('bd_f_org_email'), { type: 'email', maxLength: 254 })}</div>
      <div className="form-row">{field('phone', t('bd_f_org_phone'), { type: 'tel', maxLength: 30 })}<div /></div>
      <div className="form-row">{field('about_en', `${t('bd_f_about')} — English`, { rows: 3, maxLength: 3000 })}{field('about_bn', `${t('bd_f_about')} — বাংলা`, { rows: 3, maxLength: 3000, lang: 'bn' })}</div>
      <fieldset className="bd-you"><legend>{t('bd_f_you')}</legend>
        <div className="form-row">{field('your_name', `${t('bd_f_your_name')} *`, { maxLength: 100, autoComplete: 'name' })}{field('your_email', `${t('bd_f_your_email')} *`, { type: 'email', maxLength: 254, autoComplete: 'email' })}</div>
      </fieldset>
      <div className="hv-trap" aria-hidden="true"><label htmlFor="bd-homepage">Homepage</label><input id="bd-homepage" name="homepage" value={form.homepage} onChange={change} tabIndex={-1} autoComplete="off" /></div>
      <label className="bd-confirm"><input type="checkbox" name="confirm" checked={form.confirm} onChange={change} aria-invalid={Boolean(errors.confirm)} /> {t('bd_f_confirm')}</label>
      {errors.confirm && <small className="field-error">{errors.confirm}</small>}
      <div className="hv-form-actions">
        <button type="submit" disabled={sending}>{sending ? t('hv_sending') : t('bd_send')}</button>
        <button type="button" className="hv-cancel" onClick={onClose}>{t('hv_cancel')}</button>
      </div>
    </form>
  </div>
}
