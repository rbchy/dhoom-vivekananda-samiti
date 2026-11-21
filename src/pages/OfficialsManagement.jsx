import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkPhone, checkText, checkUrl, cleanErrors, EMAIL_PATTERN } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'
import { OFFICIAL_POSITIONS, positionById } from '../lib/officials'
import '../admin-directory.css'

// Admin → Samiti Committee: the officials shown at /committee, ordered President → Members
const emptyForm = { position: 'president', name_en: '', name_bn: '', role_en: 'President', role_bn: 'সভাপতি', term: '', is_current: true, phone: '', email: '', about_en: '', about_bn: '', photo_url: '', sort_order: '10', is_published: true }
const notSetUp = 'The Samiti Committee table is not set up yet — run supabase/donors-and-officials.sql once in Supabase → SQL Editor.'
const rank = item => positionById(item.position)?.order ?? 200

export default function OfficialsManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  async function loadItems() {
    const { data, error } = await supabase.from('samiti_officials').select('*').order('sort_order').order('name_en')
    if (error) setMessage(/relation|does not exist|schema cache/i.test(error.message || '') ? notSetUp : describeDbError(error))
    else setItems((data || []).sort((a, b) => Number(b.is_current) - Number(a.is_current) || rank(a) - rank(b) || a.sort_order - b.sort_order))
  }

  useEffect(() => { loadItems() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    if (name === 'position') {
      // The position fills the title and the display order; "other" lets you type them
      const position = positionById(value)
      setForm(previous => position ? { ...previous, position: value, role_en: position.en, role_bn: position.bn, sort_order: String(position.order) } : { ...previous, position: value, role_en: '', role_bn: '', sort_order: '150' })
      setErrors(previous => ({ ...previous, role_en: '', role_bn: '', sort_order: '' }))
      return
    }
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function resetForm() { setForm(previous => ({ ...emptyForm, term: previous.term })); setEditingId(null); setErrors({}); setPhotoFile(null) }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    const found = cleanErrors({
      name_en: checkText(form.name_en, { label: 'Name (English)', required: true, min: 2, max: 150 }),
      name_bn: checkText(form.name_bn, { label: 'Name (Bangla)', max: 150, bengali: true }),
      role_en: checkText(form.role_en, { label: 'Title (English)', required: form.position === 'other', max: 120 }),
      role_bn: checkText(form.role_bn, { label: 'Title (Bangla)', max: 120, bengali: true }),
      term: form.term.trim().length > 40 ? 'Term can be at most 40 characters.' : '',
      phone: checkPhone(form.phone),
      email: form.email.trim() && !EMAIL_PATTERN.test(form.email.trim()) ? 'Enter a valid email address.' : '',
      about_en: checkText(form.about_en, { label: 'About (English)', max: 600 }),
      about_bn: checkText(form.about_bn, { label: 'About (Bangla)', max: 600, bengali: true }),
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
      if (photoFile) { setMessage('Uploading photo...'); uploaded = await uploadImage(photoFile, 'committee'); photoUrl = uploaded.url }
      const previous = items.find(i => i.id === editingId)
      const payload = { position: form.position, name_en: form.name_en.trim(), name_bn: clean(form.name_bn), role_en: clean(form.role_en), role_bn: clean(form.role_bn), term: clean(form.term), is_current: form.is_current, phone: clean(form.phone), email: clean(form.email), about_en: clean(form.about_en), about_bn: clean(form.about_bn), photo_url: photoUrl, sort_order: Number(form.sort_order), is_published: form.is_published }
      const result = editingId ? await db('samiti_officials').update(payload).eq('id', editingId) : await db('samiti_officials').insert(payload)
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

  async function handleDelete(item) {
    if (!window.confirm(`Remove ${item.name_en} from the committee list? To keep them as a former official, edit and untick "Current committee" instead.`)) return
    const result = await db('samiti_officials').delete().eq('id', item.id)
    if (result.error) { setMessage('Error: ' + describeDbError(result.error)); return }
    if (!result.pendingApproval && storagePathFromUrl(item.photo_url)) await removeImage(item.photo_url)
    setMessage(result.pendingApproval ? 'Delete request sent for approval.' : 'Removed.'); if (editingId === item.id) resetForm(); await loadItems()
  }

  async function endTerm() {
    const current = items.filter(i => i.is_current)
    if (!current.length || !window.confirm(`Move all ${current.length} current officials to "Earlier committees"? Do this when a new committee takes over; then add the new committee.`)) return
    const result = await db('samiti_officials').update({ is_current: false }).eq('is_current', true)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(result.pendingApproval ? 'Sent to the main admin for approval.' : 'The committee was moved to Earlier committees.'); await loadItems() }
  }

  function startEdit(item) {
    setEditingId(item.id); setErrors({}); setPhotoFile(null)
    const keep = Object.fromEntries(Object.keys(emptyForm).map(k => [k, item[k] ?? emptyForm[k]]))
    setForm({ ...keep, sort_order: String(item.sort_order) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dirty = Boolean(photoFile) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const input = (name, label, props = {}) => <div>
    <label htmlFor={`of-${name}`}>{label}</label>
    {props.rows ? <textarea id={`of-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'of')} /> : <input id={`of-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'of')} />}
    <FieldError id={`of-${name}-error`} message={errors[name]} />
  </div>

  return <div className="events-management">
    <p className="field-hint">The Samiti's officials and executive members, shown at /committee. Choose each person's position: the website lists them President → Vice President → General Secretary → … → Members. Phone and email are shown on the website — leave them empty to keep them private. When a new committee is elected, press "Move current committee to earlier committees", then add the new one.</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit official / সম্পাদনা' : 'Add an official / কর্মকর্তা যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">{input('name_en', 'Full name (English) *', { maxLength: 150 })}{input('name_bn', 'পুরো নাম (বাংলা)', { maxLength: 150 })}</div>
      <div className="form-row">
        <div>
          <label htmlFor="of-position">Position / পদ *</label>
          <select id="of-position" name="position" value={form.position} onChange={handleChange}>
            {OFFICIAL_POSITIONS.map(p => <option key={p.id} value={p.id}>{p.en} / {p.bn}</option>)}
            <option value="other">Other (type below) / অন্য</option>
          </select>
        </div>
        {input('term', 'Term / মেয়াদ', { maxLength: 40, placeholder: 'e.g. 2025 – 2027' })}
      </div>
      <div className="form-row">{input('role_en', `Title shown (English)${form.position === 'other' ? ' *' : ''}`, { maxLength: 120 })}{input('role_bn', 'যে পদবি দেখাবে (বাংলা)', { maxLength: 120 })}</div>
      <div className="form-row">{input('phone', 'Phone (shown on the website)', { type: 'tel', maxLength: 30 })}{input('email', 'Email (shown on the website)', { type: 'email', maxLength: 254 })}</div>
      <div className="form-row">{input('about_en', 'A line about them (English)', { rows: 2, maxLength: 600 })}{input('about_bn', 'পরিচিতি (বাংলা)', { rows: 2, maxLength: 600 })}</div>
      <ImagePicker id="of-photo" label="Photo (optional) / ছবি" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', photo_url: '' })) }} currentUrl={!photoFile && form.photo_url && !checkUrl(form.photo_url, { label: 'x' }) ? form.photo_url : ''} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />
      <details className="link-option" open={Boolean(form.photo_url) && !photoFile}>
        <summary>…or paste a photo link instead / অথবা ছবির লিংক দিন</summary>
        {input('photo_url', 'Photo link', { type: 'url', placeholder: 'https://…', disabled: Boolean(photoFile) })}
      </details>
      {input('sort_order', 'Display order (set by the position)', { inputMode: 'numeric', maxLength: 4 })}
      <label className="publish-option"><input type="checkbox" name="is_current" checked={form.is_current} onChange={handleChange} /> Current committee / বর্তমান কমিটি</label>
      <label className="publish-option"><input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} /> Show on website</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list">
      {items.some(i => i.is_current) && <p><button type="button" onClick={endTerm}>Move current committee to earlier committees</button></p>}
      {items.length === 0 ? <p>No officials yet.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Name</th><th>Position</th><th>Term</th><th>Committee</th><th>Show</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className={item.is_published ? '' : 'row-muted'}>
          <td>{item.name_en}{item.name_bn && <small className="cell-sub">{item.name_bn}</small>}</td>
          <td>{item.role_en || positionById(item.position)?.en}</td>
          <td>{item.term}</td>
          <td>{item.is_current ? 'Current' : 'Earlier'}</td>
          <td>{item.is_published ? 'Yes' : 'Hidden'}</td>
          <td className="row-actions"><button type="button" onClick={() => startEdit(item)}>Edit</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </div>
}
