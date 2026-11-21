import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkPhone, checkText, checkUrl, cleanErrors, EMAIL_PATTERN } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'
import { BHAVADHARA_TYPES, VISITS_TEXT } from '../i18n-visits'
import '../admin-directory.css'

// Admin → Bhavadhara directory: Ramakrishna–Vivekananda organisations in the world (shown at /bhavadhara).
// Visitors send organisations from the website ("Waiting"); approve them here, or add one directly.
const typeLabel = key => VISITS_TEXT.en[`bd_type_${key}`] || key
const emptyForm = { name_en: '', name_bn: '', org_type: 'rkm_branch', country: '', city: '', address: '', website: '', email: '', phone: '', founded_year: '', about_en: '', about_bn: '', photo_url: '', sort_order: '100', status: 'approved' }
const notSetUp = 'The Bhavadhara directory table is not set up yet — run supabase/visits-and-bhavadhara.sql once in Supabase → SQL Editor.'
const STATUS = { pending: 'Waiting', approved: 'Shown', rejected: 'Hidden' }

export default function BhavadharaManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [contacts, setContacts] = useState({})
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  async function loadItems() {
    const [o, c] = await Promise.all([
      supabase.from('bhavadhara_orgs').select('*').order('created_at', { ascending: false }),
      supabase.from('submission_contacts').select('*').eq('kind', 'bhavadhara')
    ])
    if (o.error) { setMessage(/relation|does not exist|schema cache/i.test(o.error.message || '') ? notSetUp : describeDbError(o.error)); return }
    setItems(o.data || [])
    setContacts(Object.fromEntries((c.data || []).map(row => [row.ref_id, row])))
  }

  useEffect(() => { loadItems() }, [])
  // Open on "All" when nothing is waiting
  useEffect(() => { if (items.length && filter === 'pending' && !items.some(i => i.status === 'pending')) setFilter('all') }, [items])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setErrors({}); setPhotoFile(null) }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    const year = String(form.founded_year).trim()
    const duplicate = items.find(i => i.id !== editingId && i.name_en.trim().toLowerCase() === form.name_en.trim().toLowerCase() && i.country.trim().toLowerCase() === form.country.trim().toLowerCase())
    const found = cleanErrors({
      name_en: checkText(form.name_en, { label: 'Name (English)', required: true, min: 3, max: 200 }) || (duplicate ? 'This organisation is already in the directory for this country.' : ''),
      name_bn: checkText(form.name_bn, { label: 'Name (Bangla)', max: 200, bengali: true }),
      country: checkText(form.country, { label: 'Country', required: true, min: 2, max: 80 }),
      city: checkText(form.city, { label: 'City', max: 100 }),
      address: checkText(form.address, { label: 'Address', max: 300 }),
      website: form.website.trim() && !/^https?:\/\//i.test(form.website.trim()) ? 'Website must start with https://' : checkUrl(form.website, { label: 'Website' }),
      email: form.email.trim() && !EMAIL_PATTERN.test(form.email.trim()) ? 'Enter a valid email address.' : '',
      phone: checkPhone(form.phone),
      founded_year: year && (!/^\d{4}$/.test(year) || +year < 1850 || +year > new Date().getFullYear()) ? 'Year founded must be between 1850 and this year.' : '',
      about_en: checkText(form.about_en, { label: 'About (English)', max: 1000 }),
      about_bn: checkText(form.about_bn, { label: 'About (Bangla)', max: 1000, bengali: true }),
      photo: errors.photo || '',
      photo_url: photoFile ? '' : checkUrl(form.photo_url, { label: 'Photo link' }),
      sort_order: !/^\d{1,4}$/.test(String(form.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const clean = v => String(v || '').trim() || null
    let uploaded = null
    try {
      let photoUrl = clean(form.photo_url)
      if (photoFile) { setMessage('Uploading photo...'); uploaded = await uploadImage(photoFile, 'bhavadhara'); photoUrl = uploaded.url }
      const previous = items.find(i => i.id === editingId)
      const payload = { name_en: form.name_en.trim(), name_bn: clean(form.name_bn), org_type: form.org_type, country: form.country.trim(), city: clean(form.city), address: clean(form.address), website: clean(form.website), email: clean(form.email), phone: clean(form.phone), founded_year: year ? Number(year) : null, about_en: clean(form.about_en), about_bn: clean(form.about_bn), photo_url: photoUrl, sort_order: Number(form.sort_order), status: form.status }
      const result = editingId ? await db('bhavadhara_orgs').update(payload).eq('id', editingId) : await db('bhavadhara_orgs').insert(payload)
      if (result.error) throw result.error
      if (!result.pendingApproval && previous?.photo_url && previous.photo_url !== payload.photo_url && storagePathFromUrl(previous.photo_url)) await removeImage(previous.photo_url)
      setMessage(result.pendingApproval ? 'Sent to the main admin for approval.' : editingId ? 'Updated.' : 'Added.'); resetForm(); await loadItems()
    } catch (error) {
      if (uploaded) await removeImage(uploaded.path)
      setMessage('Error: ' + (describeDbError(error) || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(item, status) {
    const result = await db('bhavadhara_orgs').update({ status }).eq('id', item.id)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(result.pendingApproval ? 'Sent to the main admin for approval.' : status === 'approved' ? `"${item.name_en}" now shows in the directory.` : status === 'rejected' ? `"${item.name_en}" hidden.` : 'Moved back to waiting.'); await loadItems() }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name_en}" from the directory? This cannot be undone.`)) return
    const result = await db('bhavadhara_orgs').delete().eq('id', item.id)
    if (result.error) { setMessage('Error: ' + describeDbError(result.error)); return }
    if (!result.pendingApproval) {
      if (storagePathFromUrl(item.photo_url)) await removeImage(item.photo_url)
      if (contacts[item.id]) await supabase.from('submission_contacts').delete().eq('id', contacts[item.id].id)
    }
    setMessage(result.pendingApproval ? 'Delete request sent for approval.' : 'Deleted.'); if (editingId === item.id) resetForm(); await loadItems()
  }

  function startEdit(item) {
    setEditingId(item.id); setErrors({}); setPhotoFile(null)
    setForm({ name_en: item.name_en, name_bn: item.name_bn || '', org_type: item.org_type, country: item.country, city: item.city || '', address: item.address || '', website: item.website || '', email: item.email || '', phone: item.phone || '', founded_year: item.founded_year ? String(item.founded_year) : '', about_en: item.about_en || '', about_bn: item.about_bn || '', photo_url: item.photo_url || '', sort_order: String(item.sort_order), status: item.status })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dirty = Boolean(photoFile) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const input = (name, label, props = {}) => <div>
    <label htmlFor={`bdm-${name}`}>{label}</label>
    {props.rows ? <textarea id={`bdm-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'bdm')} /> : <input id={`bdm-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'bdm')} />}
    <FieldError id={`bdm-${name}-error`} message={errors[name]} />
  </div>
  const q = search.trim().toLowerCase()
  const shown = items.filter(i => (filter === 'all' || i.status === filter) && (!q || [i.name_en, i.name_bn, i.country, i.city].some(v => (v || '').toLowerCase().includes(q))))
  const pendingCount = items.filter(i => i.status === 'pending').length

  return <div className="events-management">
    <p className="field-hint">Organisations that follow the ideals of Sri Ramakrishna, Sri Sarada Devi and Swami Vivekananda, anywhere in the world. Visitors can send one from the website's Bhavadhara page (/bhavadhara): it waits here until you approve it. You can also add one directly. Only "Shown" organisations appear on the website.</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit organisation / সম্পাদনা' : 'Add an organisation / প্রতিষ্ঠান যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">{input('name_en', 'Name (English) *', { maxLength: 200, placeholder: 'e.g. Ramakrishna Mission, Dhaka' })}{input('name_bn', 'নাম (বাংলা)', { maxLength: 200 })}</div>
      <div className="form-row">
        <div><label htmlFor="bdm-org_type">Kind *</label><select id="bdm-org_type" name="org_type" value={form.org_type} onChange={handleChange}>{BHAVADHARA_TYPES.map(k => <option key={k} value={k}>{typeLabel(k)}</option>)}</select></div>
        {input('founded_year', 'Year founded', { inputMode: 'numeric', maxLength: 4 })}
      </div>
      <div className="form-row">{input('country', 'Country *', { maxLength: 80, placeholder: 'e.g. Bangladesh' })}{input('city', 'City / town', { maxLength: 100 })}</div>
      {input('address', 'Address', { maxLength: 300 })}
      <div className="form-row">{input('website', 'Website', { type: 'url', maxLength: 300, placeholder: 'https://' })}{input('email', 'Email (shown on the website)', { type: 'email', maxLength: 254 })}</div>
      <div className="form-row">{input('phone', 'Phone (shown on the website)', { type: 'tel', maxLength: 30 })}{input('sort_order', 'Order within the country', { inputMode: 'numeric', maxLength: 4 })}</div>
      <div className="form-row">{input('about_en', 'About (English)', { rows: 3, maxLength: 1000 })}{input('about_bn', 'পরিচিতি (বাংলা)', { rows: 3, maxLength: 1000 })}</div>
      <ImagePicker id="bdm-photo" label="Photo (optional) / ছবি" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', photo_url: '' })) }} currentUrl={!photoFile && form.photo_url && !checkUrl(form.photo_url, { label: 'x' }) ? form.photo_url : ''} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />
      <details className="link-option" open={Boolean(form.photo_url) && !photoFile}>
        <summary>…or paste a photo link instead / অথবা ছবির লিংক দিন</summary>
        {input('photo_url', 'Photo link', { type: 'url', placeholder: 'https://…', disabled: Boolean(photoFile) })}
      </details>
      <div><label htmlFor="bdm-status">Status</label><select id="bdm-status" name="status" value={form.status} onChange={handleChange}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}

    <div className="events-list">
      <h3>Directory / তালিকা ({items.length}) {pendingCount > 0 && <span className="badge-count">{pendingCount} waiting</span>}</h3>
      <div className="filter-tabs" role="tablist">{[...Object.entries(STATUS), ['all', 'All']].map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label} ({key === 'all' ? items.length : items.filter(i => i.status === key).length})</button>)}</div>
      <input type="search" className="admin-search" placeholder="Search name, country or city" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search the directory" />
      {shown.length === 0 ? <p>No organisations here.</p> : shown.map(item => {
        const contact = contacts[item.id]
        return <article key={item.id} className={`admin-org status-${item.status}`}>
          <header><strong>{item.name_en}</strong>{item.name_bn && <> · {item.name_bn}</>} <span className="admin-org-status">{STATUS[item.status]}</span> <small>— {typeLabel(item.org_type)}</small></header>
          <p>{[item.address, item.city, item.country].filter(Boolean).join(', ')}{item.founded_year && ` · founded ${item.founded_year}`}</p>
          {(item.website || item.email || item.phone) && <p>{item.website && <a href={item.website} target="_blank" rel="noopener noreferrer">{item.website}</a>}{item.email && ` · ${item.email}`}{item.phone && ` · ${item.phone}`}</p>}
          {item.about_en && <p>{item.about_en}</p>}
          {contact && <p>Sent by: {contact.name}{contact.email && ` <${contact.email}>`} — {new Date(item.created_at).toLocaleString()} (private)</p>}
          <div className="row-actions">
            {item.status !== 'approved' && <button type="button" onClick={() => setStatus(item, 'approved')}>Approve &amp; show</button>}
            {item.status !== 'rejected' && <button type="button" onClick={() => setStatus(item, 'rejected')}>Hide</button>}
            <button type="button" onClick={() => startEdit(item)}>Edit</button>
            <button type="button" onClick={() => handleDelete(item)}>Delete</button>
          </div>
        </article>
      })}
    </div>
  </div>
}
