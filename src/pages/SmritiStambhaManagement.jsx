import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, checkUrl, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'

// Admin → Smriti Stambha: names of the people who built the Samiti (shown at /smriti-stambha)
const emptyForm = { name_en: '', name_bn: '', role_en: '', role_bn: '', years: '', tribute_en: '', tribute_bn: '', photo_url: '', is_late: false, sort_order: '100', is_published: true }

export default function SmritiStambhaManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  async function loadItems() {
    const { data, error } = await supabase.from('smriti_stambha').select('*').order('sort_order').order('created_at')
    if (error) setMessage(/relation|does not exist|schema cache/i.test(error.message || '') ? 'The Smriti Stambha table is not set up yet — run supabase/smriti-stambha.sql once in Supabase → SQL Editor.' : describeDbError(error))
    else setItems(data || [])
  }

  useEffect(() => { loadItems() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setErrors({}); setPhotoFile(null) }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    const duplicate = items.find(i => i.id !== editingId && i.name_en.trim().toLowerCase() === form.name_en.trim().toLowerCase())
    const found = cleanErrors({
      name_en: checkText(form.name_en, { label: 'Name (English)', required: true, min: 2, max: 120 }) || (duplicate ? 'This name is already on the Smriti Stambha.' : ''),
      name_bn: checkText(form.name_bn, { label: 'Name (Bangla)', max: 120, bengali: true }),
      role_en: checkText(form.role_en, { label: 'Role (English)', max: 120 }),
      role_bn: checkText(form.role_bn, { label: 'Role (Bangla)', max: 120, bengali: true }),
      years: form.years.trim().length > 40 ? 'Years can be at most 40 characters.' : '',
      tribute_en: checkText(form.tribute_en, { label: 'Tribute (English)', max: 800 }),
      tribute_bn: checkText(form.tribute_bn, { label: 'Tribute (Bangla)', max: 800, bengali: true }),
      photo: errors.photo || '',
      photo_url: photoFile ? '' : checkUrl(form.photo_url, { label: 'Photo link' }),
      sort_order: !/^\d{1,4}$/.test(String(form.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const clean = v => v.trim() || null
    let uploaded = null
    try {
      let photoUrl = clean(form.photo_url)
      if (photoFile) { setMessage('Uploading photo...'); uploaded = await uploadImage(photoFile, 'smriti'); photoUrl = uploaded.url }
      const previous = items.find(i => i.id === editingId)
      const payload = { name_en: form.name_en.trim(), name_bn: clean(form.name_bn), role_en: clean(form.role_en), role_bn: clean(form.role_bn), years: clean(form.years), tribute_en: clean(form.tribute_en), tribute_bn: clean(form.tribute_bn), photo_url: photoUrl, is_late: form.is_late, sort_order: Number(form.sort_order), is_published: form.is_published }
      const result = editingId ? await db('smriti_stambha').update(payload).eq('id', editingId) : await db('smriti_stambha').insert(payload)
      if (result.error) throw result.error
      if (previous?.photo_url && previous.photo_url !== payload.photo_url && storagePathFromUrl(previous.photo_url)) await removeImage(previous.photo_url)
      setMessage(editingId ? 'Updated.' : 'Added.'); resetForm(); await loadItems()
    } catch (error) {
      if (uploaded) await removeImage(uploaded.path)
      setMessage('Error: ' + (describeDbError(error) || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name_en}" from the Smriti Stambha?`)) return
    const { error } = await db('smriti_stambha').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { await removeImage(item.photo_url); setMessage('Removed.'); if (editingId === item.id) resetForm(); await loadItems() }
  }

  function startEdit(item) {
    setEditingId(item.id); setErrors({}); setPhotoFile(null)
    setForm({ name_en: item.name_en, name_bn: item.name_bn || '', role_en: item.role_en || '', role_bn: item.role_bn || '', years: item.years || '', tribute_en: item.tribute_en || '', tribute_bn: item.tribute_bn || '', photo_url: item.photo_url || '', is_late: item.is_late, sort_order: String(item.sort_order), is_published: item.is_published })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dirty = Boolean(photoFile) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const input = (name, label, props = {}) => <div>
    <label htmlFor={`ss-${name}`}>{label}</label>
    {props.rows ? <textarea id={`ss-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'ss')} /> : <input id={`ss-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'ss')} />}
    <FieldError id={`ss-${name}-error`} message={errors[name]} />
  </div>

  return <div className="events-management">
    <p className="field-hint">Names added here appear on the website's Smriti Stambha page (/smriti-stambha) and in the short band above "Visit us" on the home page. Lower display order comes first. Tick "Late" for someone who has passed away — the website shows "Late / প্রয়াত" with a lamp.</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit name / নাম সম্পাদনা' : 'Add a name / নাম যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">{input('name_en', 'Full name (English) *', { maxLength: 120, placeholder: 'e.g. Sri Haripada Chowdhury' })}{input('name_bn', 'পুরো নাম (বাংলা)', { maxLength: 120, placeholder: 'যেমন শ্রী হরিপদ চৌধুরী' })}</div>
      <div className="form-row">{input('role_en', 'Role / contribution (English)', { maxLength: 120, placeholder: 'e.g. Founder President' })}{input('role_bn', 'ভূমিকা (বাংলা)', { maxLength: 120, placeholder: 'যেমন প্রতিষ্ঠাতা সভাপতি' })}</div>
      <div className="form-row">{input('years', 'Years of service / সেবাকাল', { maxLength: 40, placeholder: 'e.g. 1985 – 2004' })}{input('sort_order', 'Display order', { inputMode: 'numeric', maxLength: 4 })}</div>
      <div className="form-row">{input('tribute_en', 'Tribute (English)', { rows: 3, maxLength: 800, placeholder: 'A line or two about what they did for the Samiti' })}{input('tribute_bn', 'শ্রদ্ধাঞ্জলি (বাংলা)', { rows: 3, maxLength: 800 })}</div>
      <ImagePicker id="ss-photo" label="Photo (optional) / ছবি" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', photo_url: '' })) }} currentUrl={!photoFile && form.photo_url && !checkUrl(form.photo_url, { label: 'x' }) ? form.photo_url : ''} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />
      <details className="link-option" open={Boolean(form.photo_url) && !photoFile}>
        <summary>…or paste a photo link instead / অথবা ছবির লিংক দিন</summary>
        {input('photo_url', 'Photo link', { type: 'url', placeholder: 'https://…', disabled: Boolean(photoFile) })}
      </details>
      <label className="publish-option"><input type="checkbox" name="is_late" checked={form.is_late} onChange={handleChange} /> Late (passed away) / প্রয়াত</label>
      <label className="publish-option"><input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} /> Show on website</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list">
      {items.length === 0 ? <p>No names yet.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Years</th><th>Late</th><th>Show</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className={item.is_published ? '' : 'row-muted'}>
          <td>{item.sort_order}</td>
          <td>{item.name_en}{item.name_bn && <small className="cell-sub">{item.name_bn}</small>}</td>
          <td>{item.role_en}{item.role_bn && <small className="cell-sub">{item.role_bn}</small>}</td>
          <td>{item.years}</td>
          <td>{item.is_late ? '🪔 Yes' : ''}</td>
          <td>{item.is_published ? 'Yes' : 'Hidden'}</td>
          <td className="row-actions"><button type="button" onClick={() => startEdit(item)}>Edit</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </div>
}
