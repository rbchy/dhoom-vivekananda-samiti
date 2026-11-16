import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, checkUrl, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'

const KIND_LABEL = { mission: 'Mission value / লক্ষ্য', deity: 'Presiding deity / দেবদেবী' }
const emptyForm = { kind: 'mission', title_en: '', title_bn: '', subtitle_en: '', subtitle_bn: '', body_en: '', body_bn: '', image_url: '', sort_order: '100', is_active: true }

export default function HighlightsManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  async function loadItems() {
    const { data, error } = await supabase.from('temple_highlights').select('*').order('kind').order('sort_order')
    if (error) setMessage(describeDbError(error))
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
    const duplicate = items.find(i => i.id !== editingId && i.kind === form.kind && i.title_en.trim().toLowerCase() === form.title_en.trim().toLowerCase())
    const found = cleanErrors({
      title_en: checkText(form.title_en, { label: 'Title (English)', required: true, min: 2, max: 120 }) || (duplicate ? 'This title already exists.' : ''),
      title_bn: checkText(form.title_bn, { label: 'Title (Bangla)', max: 120, bengali: true }),
      subtitle_en: checkText(form.subtitle_en, { label: 'Subtitle (English)', max: 120 }),
      subtitle_bn: checkText(form.subtitle_bn, { label: 'Subtitle (Bangla)', max: 120, bengali: true }),
      body_en: checkText(form.body_en, { label: 'Description (English)', required: true, min: 10, max: 800 }),
      body_bn: checkText(form.body_bn, { label: 'Description (Bangla)', min: 10, max: 800, bengali: true }),
      photo: errors.photo || '',
      image_url: photoFile ? '' : checkUrl(form.image_url, { label: 'Image URL' }),
      sort_order: !/^\d{1,4}$/.test(String(form.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const clean = v => v.trim() || null
    let uploaded = null
    try {
      let imageUrl = clean(form.image_url)
      if (photoFile && form.kind === 'deity') { setMessage('Uploading photo...'); uploaded = await uploadImage(photoFile, 'deities'); imageUrl = uploaded.url }
      const previous = items.find(i => i.id === editingId)
      const payload = { kind: form.kind, title_en: form.title_en.trim(), title_bn: clean(form.title_bn), subtitle_en: clean(form.subtitle_en), subtitle_bn: clean(form.subtitle_bn), body_en: clean(form.body_en), body_bn: clean(form.body_bn), image_url: form.kind === 'deity' ? imageUrl : null, sort_order: Number(form.sort_order), is_active: form.is_active }
      const result = editingId ? await db('temple_highlights').update(payload).eq('id', editingId) : await db('temple_highlights').insert(payload)
      if (result.error) throw result.error
      if (previous?.image_url && previous.image_url !== payload.image_url && storagePathFromUrl(previous.image_url)) await removeImage(previous.image_url)
      setMessage(editingId ? 'Updated.' : 'Added.'); resetForm(); await loadItems()
    } catch (error) {
      if (uploaded) await removeImage(uploaded.path)
      setMessage('Error: ' + (describeDbError(error) || error.message) + (/row-level|policy|permission|Unauthorized/i.test(error.message || '') ? ' (Photo upload is not allowed yet — run supabase/storage-photos-policy.sql once.)' : ''))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title_en}"?`)) return
    const { error } = await db('temple_highlights').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { await removeImage(item.image_url); setMessage('Deleted.'); if (editingId === item.id) resetForm(); await loadItems() }
  }

  const dirty = Boolean(photoFile) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const input = (name, label, props = {}) => <div>
    <label htmlFor={`hl-${name}`}>{label}</label>
    {props.rows ? <textarea id={`hl-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'hl')} /> : <input id={`hl-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'hl')} />}
    <FieldError id={`hl-${name}-error`} message={errors[name]} />
  </div>

  return <div className="events-management">
    <p className="field-hint">Mission values appear as cards under "Our Mission". Deities appear under "Presiding Deities" with an optional photo and festival (e.g. "Durga Puja — annual"). The temple story itself is written in "Temple Content".</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit' : 'Add Mission Value or Deity / লক্ষ্য বা দেবদেবী যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">
        <div><label htmlFor="hl-kind">Type / ধরন *</label><select id="hl-kind" name="kind" value={form.kind} onChange={handleChange}>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {input('sort_order', 'Display Order', { inputMode: 'numeric', maxLength: 4 })}
      </div>
      <div className="form-row">{input('title_en', form.kind === 'deity' ? 'Deity name (English) *' : 'Value (English) *', { maxLength: 120, placeholder: form.kind === 'deity' ? 'e.g. Sri Ramakrishna' : 'e.g. Devotion' })}{input('title_bn', form.kind === 'deity' ? 'দেবদেবীর নাম (বাংলা)' : 'আদর্শ (বাংলা)', { maxLength: 120 })}</div>
      {form.kind === 'deity' && <div className="form-row">{input('subtitle_en', 'Festival / observance (English)', { maxLength: 120, placeholder: 'e.g. Janmatithi — annual' })}{input('subtitle_bn', 'উৎসব (বাংলা)', { maxLength: 120 })}</div>}
      <div className="form-row">{input('body_en', 'Description (English) *', { rows: 3, maxLength: 800 })}{input('body_bn', 'বিবরণ (বাংলা)', { rows: 3, maxLength: 800 })}</div>
      {form.kind === 'deity' && <>
        <ImagePicker id="hl-photo" label="Deity photo (optional) / দেবদেবীর ছবি" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', image_url: '' })) }} currentUrl={!photoFile && form.image_url && !checkUrl(form.image_url, { label: 'x' }) ? form.image_url : ''} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />
        <details className="link-option" open={Boolean(form.image_url) && !photoFile}>
          <summary>…or paste an image link instead / অথবা ছবির লিংক দিন</summary>
          {input('image_url', 'Photo link', { type: 'url', placeholder: 'https://…', disabled: Boolean(photoFile) })}
        </details>
      </>}
      <label className="publish-option"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Show on website</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list">
      {items.length === 0 ? <p>Nothing added yet.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Type</th><th>#</th><th>Title</th><th>Description</th><th>Show</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className={item.is_active ? '' : 'row-muted'}>
          <td>{KIND_LABEL[item.kind]}</td><td>{item.sort_order}</td>
          <td>{item.title_en}{item.title_bn && <small className="cell-sub">{item.title_bn}</small>}{item.subtitle_en && <small className="cell-sub">{item.subtitle_en}</small>}</td>
          <td>{(item.body_en || '').slice(0, 90)}{(item.body_en || '').length > 90 ? '…' : ''}</td>
          <td>{item.is_active ? 'Yes' : 'Hidden'}</td>
          <td className="row-actions"><button type="button" onClick={() => { setEditingId(item.id); setErrors({}); setPhotoFile(null); setForm({ kind: item.kind, title_en: item.title_en, title_bn: item.title_bn || '', subtitle_en: item.subtitle_en || '', subtitle_bn: item.subtitle_bn || '', body_en: item.body_en || '', body_bn: item.body_bn || '', image_url: item.image_url || '', sort_order: String(item.sort_order), is_active: item.is_active }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </div>
}
