import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, checkUrl, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { checkImageFile, removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'
import { enhanceImage, shrinkImage } from '../lib/imageEnhance'
import { ORGANISATIONS } from '../i18n-org'
import '../admin-directory.css'

// Admin → Holy Visits: visits of senior monks of the Ramakrishna Order (shown at /visits),
// and the memories disciples and devotees send from the website (approve before they show)
const emptyForm = { monk_name_en: '', monk_name_bn: '', monk_title_en: '', monk_title_bn: '', visit_date: '', visit_date_end: '', occasion_en: '', occasion_bn: '', places: [], summary_en: '', summary_bn: '', blessing_en: '', blessing_bn: '', photo_url: '', photos: [], sort_order: '100', is_published: true }
const MAX_PHOTOS = 24
const notSetUp = 'The Holy Visits tables are not set up yet — run supabase/visits-and-bhavadhara.sql once in Supabase → SQL Editor.'
const tableMissing = error => /relation|does not exist|schema cache/i.test(error?.message || '')

export default function VisitsManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [memories, setMemories] = useState([])
  const [contacts, setContacts] = useState({})
  const [memoryFilter, setMemoryFilter] = useState('pending')
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [newPhotos, setNewPhotos] = useState([])

  async function loadAll() {
    const [v, m, c] = await Promise.all([
      supabase.from('maharaj_visits').select('*').order('visit_date', { ascending: false, nullsFirst: false }).order('sort_order'),
      supabase.from('visit_memories').select('*').order('created_at', { ascending: false }),
      supabase.from('submission_contacts').select('*').eq('kind', 'memory')
    ])
    if (v.error) { setMessage(tableMissing(v.error) ? notSetUp : describeDbError(v.error)); return }
    setItems(v.data || [])
    setMemories(m.data || [])
    setContacts(Object.fromEntries((c.data || []).map(row => [row.ref_id, row])))
  }

  useEffect(() => { loadAll() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function togglePlace(id) {
    setForm(previous => ({ ...previous, places: previous.places.includes(id) ? previous.places.filter(p => p !== id) : [...previous.places, id] }))
  }

  function addPhotos(event) {
    const files = [...event.target.files]
    event.target.value = ''
    // Photos straight from a camera may be large: each one is made a light WebP (at most 1600 px) before upload
    const problem = files.map(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ? 'Photos must be JPG, PNG or WebP images.' : f.size > 25 * 1024 * 1024 ? `"${f.name}" is larger than 25 MB.` : '').find(Boolean)
    if (problem) { setErrors(p => ({ ...p, photos: problem })); return }
    if (form.photos.length + newPhotos.length + files.length > MAX_PHOTOS) { setErrors(p => ({ ...p, photos: `At most ${MAX_PHOTOS} photos per visit.` })); return }
    setErrors(p => ({ ...p, photos: '' }))
    setNewPhotos(previous => [...previous, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))])
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setErrors({}); setPhotoFile(null); setNewPhotos([]) }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    const found = cleanErrors({
      monk_name_en: checkText(form.monk_name_en, { label: 'Name (English)', required: true, min: 3, max: 150 }),
      monk_name_bn: checkText(form.monk_name_bn, { label: 'Name (Bangla)', max: 150, bengali: true }),
      monk_title_en: checkText(form.monk_title_en, { label: 'Title (English)', max: 200 }),
      monk_title_bn: checkText(form.monk_title_bn, { label: 'Title (Bangla)', max: 200, bengali: true }),
      visit_date: !form.visit_date && form.visit_date_end ? 'Add the first day too, or clear the last day.' : '',
      visit_date_end: form.visit_date_end && form.visit_date && form.visit_date_end < form.visit_date ? 'The last day cannot be before the first day.' : '',
      occasion_en: checkText(form.occasion_en, { label: 'Occasion (English)', max: 200 }),
      occasion_bn: checkText(form.occasion_bn, { label: 'Occasion (Bangla)', max: 200, bengali: true }),
      summary_en: checkText(form.summary_en, { label: 'Account of the visit (English)', max: 4000 }),
      summary_bn: checkText(form.summary_bn, { label: 'Account of the visit (Bangla)', max: 4000, bengali: true }),
      blessing_en: checkText(form.blessing_en, { label: 'Blessing (English)', max: 800 }),
      blessing_bn: checkText(form.blessing_bn, { label: 'Blessing (Bangla)', max: 800, bengali: true }),
      photo: errors.photo || '',
      photo_url: photoFile ? '' : checkUrl(form.photo_url, { label: 'Portrait link' }),
      photos: errors.photos || '',
      sort_order: !/^\d{1,4}$/.test(String(form.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const clean = v => v.trim() || null
    const uploaded = []
    try {
      let photoUrl = clean(form.photo_url)
      if (photoFile) { setMessage('Uploading portrait...'); const up = await uploadImage(photoFile, 'visits'); uploaded.push(up.path); photoUrl = up.url }
      const extra = []
      for (const [i, item] of newPhotos.entries()) {
        setMessage(`Improving and uploading photo ${i + 1} of ${newPhotos.length}...`)
        let file = item.file
        try { file = await enhanceImage(item.file, { name: item.file.name }) } catch {
          try { file = await shrinkImage(item.file) } catch { /* keep the original */ }
        }
        const tooBig = checkImageFile(file)
        if (tooBig) throw new Error(tooBig)
        const up = await uploadImage(file, 'visits'); uploaded.push(up.path); extra.push(up.url)
      }
      const previous = items.find(i => i.id === editingId)
      const payload = {
        monk_name_en: form.monk_name_en.trim(), monk_name_bn: clean(form.monk_name_bn), monk_title_en: clean(form.monk_title_en), monk_title_bn: clean(form.monk_title_bn),
        visit_date: form.visit_date || null, visit_date_end: form.visit_date_end || null, occasion_en: clean(form.occasion_en), occasion_bn: clean(form.occasion_bn),
        places: ORGANISATIONS.map(o => o.id).filter(id => form.places.includes(id)),
        summary_en: clean(form.summary_en), summary_bn: clean(form.summary_bn), blessing_en: clean(form.blessing_en), blessing_bn: clean(form.blessing_bn),
        photo_url: photoUrl, photos: [...form.photos, ...extra], sort_order: Number(form.sort_order), is_published: form.is_published
      }
      const result = editingId ? await db('maharaj_visits').update(payload).eq('id', editingId) : await db('maharaj_visits').insert(payload)
      if (result.error) throw result.error
      if (!result.pendingApproval && previous) {
        // Remove uploaded photos that were taken off the visit
        if (previous.photo_url && previous.photo_url !== payload.photo_url && storagePathFromUrl(previous.photo_url)) await removeImage(previous.photo_url)
        for (const url of previous.photos || []) if (!payload.photos.includes(url) && storagePathFromUrl(url)) await removeImage(url)
      }
      setMessage(result.pendingApproval ? 'Sent to the main admin for approval.' : editingId ? 'Visit updated.' : 'Visit added.'); resetForm(); await loadAll()
    } catch (error) {
      for (const path of uploaded) await removeImage(path)
      setMessage('Error: ' + (describeDbError(error) || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const count = memories.filter(m => m.visit_id === item.id).length
    if (!window.confirm(`Delete the visit of ${item.monk_name_en} (${item.visit_date || 'date unknown'})?${count ? ` Its ${count} memory(ies) will be deleted too.` : ''} This cannot be undone.`)) return
    const result = await db('maharaj_visits').delete().eq('id', item.id)
    if (result.error) { setMessage('Error: ' + describeDbError(result.error)); return }
    if (!result.pendingApproval) for (const url of [item.photo_url, ...(item.photos || [])]) if (storagePathFromUrl(url)) await removeImage(url)
    setMessage(result.pendingApproval ? 'Delete request sent for approval.' : 'Visit deleted.')
    if (editingId === item.id) resetForm()
    await loadAll()
  }

  function startEdit(item) {
    setEditingId(item.id); setErrors({}); setPhotoFile(null); setNewPhotos([])
    setForm({
      monk_name_en: item.monk_name_en, monk_name_bn: item.monk_name_bn || '', monk_title_en: item.monk_title_en || '', monk_title_bn: item.monk_title_bn || '',
      visit_date: item.visit_date || '', visit_date_end: item.visit_date_end || '', occasion_en: item.occasion_en || '', occasion_bn: item.occasion_bn || '',
      places: item.places || [], summary_en: item.summary_en || '', summary_bn: item.summary_bn || '', blessing_en: item.blessing_en || '', blessing_bn: item.blessing_bn || '',
      photo_url: item.photo_url || '', photos: item.photos || [], sort_order: String(item.sort_order), is_published: item.is_published
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function setMemoryStatus(memory, status) {
    const result = await db('visit_memories').update({ status }).eq('id', memory.id)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(result.pendingApproval ? 'Sent to the main admin for approval.' : status === 'approved' ? 'Memory approved — it now shows on the website.' : status === 'rejected' ? 'Memory hidden.' : 'Memory moved back to waiting.'); await loadAll() }
  }

  async function deleteMemory(memory) {
    if (!window.confirm(`Delete the memory from ${memory.author_name}? This cannot be undone.`)) return
    const result = await db('visit_memories').delete().eq('id', memory.id)
    if (result.error) { setMessage('Error: ' + describeDbError(result.error)); return }
    if (!result.pendingApproval && contacts[memory.id]) await supabase.from('submission_contacts').delete().eq('id', contacts[memory.id].id)
    setMessage(result.pendingApproval ? 'Delete request sent for approval.' : 'Memory deleted.'); await loadAll()
  }

  const dirty = Boolean(photoFile) || newPhotos.length > 0 || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const input = (name, label, props = {}) => <div>
    <label htmlFor={`hv-${name}`}>{label}</label>
    {props.rows ? <textarea id={`hv-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'hv')} /> : <input id={`hv-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'hv')} />}
    <FieldError id={`hv-${name}-error`} message={errors[name]} />
  </div>
  const visitName = id => { const v = items.find(i => i.id === id); return v ? `${v.monk_name_en} · ${v.visit_date || 'date unknown'}` : '—' }
  const pendingCount = memories.filter(m => m.status === 'pending').length
  const shownMemories = memories.filter(m => memoryFilter === 'all' || m.status === memoryFilter)

  return <div className="events-management">
    <p className="field-hint">Record each visit of a senior monk of the Ramakrishna Order (for example the President or a Vice-President of the Ramakrishna Math and Mission) to the Samiti. Visits are shown newest first on the website's Holy Visits page (/visits). Disciples and devotees can send their memories of a visit from that page; they appear only after you approve them below.</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit visit / আগমন সম্পাদনা' : 'Add a visit / আগমন যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">{input('monk_name_en', 'Name of the monk (English) *', { maxLength: 150, placeholder: 'e.g. Srimat Swami … Maharaj' })}{input('monk_name_bn', 'সন্ন্যাসীর নাম (বাংলা)', { maxLength: 150, placeholder: 'যেমন শ্রীমৎ স্বামী … মহারাজ' })}</div>
      <div className="form-row">{input('monk_title_en', 'Position at the time of the visit (English)', { maxLength: 200, placeholder: 'e.g. President, Ramakrishna Math and Ramakrishna Mission' })}{input('monk_title_bn', 'তখনকার পদ (বাংলা)', { maxLength: 200, placeholder: 'যেমন অধ্যক্ষ, রামকৃষ্ণ মঠ ও রামকৃষ্ণ মিশন' })}</div>
      <div className="form-row">{input('visit_date', 'Date of the visit (leave empty if not known)', { type: 'date' })}{input('visit_date_end', 'Last day (if more than one day)', { type: 'date', min: form.visit_date || undefined })}</div>
      <div className="form-row">{input('occasion_en', 'Occasion (English)', { maxLength: 200, placeholder: 'e.g. Consecration of the Ramakrishna Mandir' })}{input('occasion_bn', 'উপলক্ষ (বাংলা)', { maxLength: 200 })}</div>
      <fieldset className="checkbox-group">
        <legend>Places visited / যেসব প্রতিষ্ঠানে গিয়েছিলেন</legend>
        {ORGANISATIONS.map(o => <label key={o.id} className="publish-option"><input type="checkbox" checked={form.places.includes(o.id)} onChange={() => togglePlace(o.id)} /> {o.name_en}</label>)}
      </fieldset>
      <div className="form-row">{input('summary_en', 'Account of the visit (English)', { rows: 6, maxLength: 4000, placeholder: 'What happened during the visit. Leave a blank line between paragraphs.' })}{input('summary_bn', 'আগমনের বিবরণ (বাংলা)', { rows: 6, maxLength: 4000 })}</div>
      <div className="form-row">{input('blessing_en', 'Words of blessing (English)', { rows: 3, maxLength: 800, placeholder: 'What the Maharaj said, in his words if known' })}{input('blessing_bn', 'আশীর্বাণী (বাংলা)', { rows: 3, maxLength: 800 })}</div>
      <ImagePicker id="hv-photo" label="Portrait of the monk (optional) / প্রতিকৃতি" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', photo_url: '' })) }} currentUrl={!photoFile && form.photo_url && !checkUrl(form.photo_url, { label: 'x' }) ? form.photo_url : ''} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />
      <details className="link-option" open={Boolean(form.photo_url) && !photoFile}>
        <summary>…or paste a portrait link instead / অথবা ছবির লিংক দিন</summary>
        {input('photo_url', 'Portrait link', { type: 'url', placeholder: 'https://…', disabled: Boolean(photoFile) })}
      </details>
      <div>
        <label htmlFor="hv-photos">Photos of the visit / আগমনের ছবি ({form.photos.length + newPhotos.length} of {MAX_PHOTOS})</label>
        <input id="hv-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} {...invalidProps(errors, 'photos', 'hv')} />
        <p className="field-hint">JPG, PNG or WebP, up to 25 MB each. Each photo is cleaned, sharpened and saved as a light WebP picture (at most 1600 px wide) before upload.</p>
        <FieldError id="hv-photos-error" message={errors.photos} />
        {(form.photos.length > 0 || newPhotos.length > 0) && <div className="admin-thumbs">
          {form.photos.map(url => <figure key={url}><img src={url} alt="" /><button type="button" onClick={() => setForm(p => ({ ...p, photos: p.photos.filter(x => x !== url) }))}>Remove</button></figure>)}
          {newPhotos.map(item => <figure key={item.preview}><img src={item.preview} alt="" /><figcaption>new</figcaption><button type="button" onClick={() => setNewPhotos(p => p.filter(x => x !== item))}>Remove</button></figure>)}
        </div>}
      </div>
      {input('sort_order', 'Order among visits on the same day', { inputMode: 'numeric', maxLength: 4 })}
      <label className="publish-option"><input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} /> Show on website</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add visit'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}

    <div className="events-list">
      <h3>Visits / আগমনসমূহ ({items.length})</h3>
      {items.length === 0 ? <p>No visits recorded yet.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Date</th><th>Monk</th><th>Occasion</th><th>Photos</th><th>Memories</th><th>Show</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className={item.is_published ? '' : 'row-muted'}>
          <td>{item.visit_date || '—'}{item.visit_date_end && <small className="cell-sub">to {item.visit_date_end}</small>}</td>
          <td>{item.monk_name_en}{item.monk_title_en && <small className="cell-sub">{item.monk_title_en}</small>}</td>
          <td>{item.occasion_en}</td>
          <td>{(item.photos || []).length + (item.photo_url ? 1 : 0)}</td>
          <td>{memories.filter(m => m.visit_id === item.id && m.status === 'approved').length} shown{memories.some(m => m.visit_id === item.id && m.status === 'pending') && <small className="cell-sub">{memories.filter(m => m.visit_id === item.id && m.status === 'pending').length} waiting</small>}</td>
          <td>{item.is_published ? 'Yes' : 'Hidden'}</td>
          <td className="row-actions"><button type="button" onClick={() => startEdit(item)}>Edit</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>

    <div className="events-list">
      <h3>Memories from disciples and devotees / স্মৃতিকথা {pendingCount > 0 && <span className="badge-count">{pendingCount} waiting</span>}</h3>
      <p className="field-hint">Read each memory before approving it. The writer's email or phone is shown only here, never on the website.</p>
      <div className="filter-tabs" role="tablist">{[['pending', 'Waiting'], ['approved', 'Shown'], ['rejected', 'Hidden'], ['all', 'All']].map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={memoryFilter === key} className={memoryFilter === key ? 'active' : ''} onClick={() => setMemoryFilter(key)}>{label} ({key === 'all' ? memories.length : memories.filter(m => m.status === key).length})</button>)}</div>
      {shownMemories.length === 0 ? <p>No memories here.</p> : shownMemories.map(memory => {
        const contact = contacts[memory.id]
        return <article key={memory.id} className={`admin-memory status-${memory.status}`}>
          <header><strong>{memory.author_name}</strong>{memory.relation && <> · {memory.relation}</>}{memory.place && <> · {memory.place}</>} <small>— {new Date(memory.created_at).toLocaleString()}</small></header>
          <p className="admin-memory-visit">Visit: {visitName(memory.visit_id)}</p>
          <blockquote>{memory.memory}</blockquote>
          {contact && <p className="admin-memory-contact">Private contact: {contact.email || contact.phone}</p>}
          <div className="row-actions">
            {memory.status !== 'approved' && <button type="button" onClick={() => setMemoryStatus(memory, 'approved')}>Approve &amp; show</button>}
            {memory.status !== 'rejected' && <button type="button" onClick={() => setMemoryStatus(memory, 'rejected')}>Hide</button>}
            {memory.status !== 'pending' && <button type="button" onClick={() => setMemoryStatus(memory, 'pending')}>Back to waiting</button>}
            <button type="button" onClick={() => deleteMemory(memory)}>Delete</button>
          </div>
        </article>
      })}
    </div>
  </div>
}
