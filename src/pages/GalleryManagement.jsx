import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, checkUrl, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { enhanceImage } from '../lib/imageEnhance'
import { ORGANISATIONS } from '../i18n-org'

const LIMITS = { title: 150, description: 1000 }
const CATEGORIES = { festivals: 'Festivals / উৎসব', worship: 'Worship / পূজা', community: 'Community / সমাজ', temple: 'Temple / মন্দির', clinic: 'Clinic / ক্লিনিক' }
// Which organisation a photo belongs to ('' = the Samiti in general)
const GENERAL_LABEL = 'Samiti (general) / সমিতি (সাধারণ)'
const ORG_LABELS = Object.fromEntries(ORGANISATIONS.map(org => [org.id, `${org.name_en} / ${org.name_bn}`]))
const orgLabel = id => (id ? ORG_LABELS[id] || id : GENERAL_LABEL)
const emptyForm = { organisation: '', category: 'temple', title_en: '', title_bn: '', image_url: '', description_en: '', description_bn: '', is_published: false }

// A link may be a full web address or a photo inside this website (e.g. /temple-photo.jpg)
const checkImageLink = value => (/^\/[\w\-./]+$/.test((value || '').trim()) ? '' : checkUrl(value, { label: 'Image link' }))

export default function GalleryManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [togglingId, setTogglingId] = useState(null)
  const [enhancingId, setEnhancingId] = useState(null)
  const [batch, setBatch] = useState(null)
  // previous photo address of each enhanced item, so it can be undone in this session
  const [undoUrls, setUndoUrls] = useState({})
  const [errors, setErrors] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState('')

  async function loadItems() {
    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
    if (error) setMessage('Error loading gallery: ' + describeDbError(error))
    else setItems(data || [])
  }

  useEffect(() => { loadItems() }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: '', photo: name === 'image_url' ? '' : previous.photo }))
  }

  // Keep the chosen organisation after saving, so several photos of one temple can be added one after another
  function resetForm(keepOrganisation = false) { setForm(keepOrganisation ? { ...emptyForm, organisation: form.organisation, category: form.category } : emptyForm); setEditingId(null); setErrors({}); setPhotoFile(null) }

  function validate() {
    const url = form.image_url.trim()
    const original = (items.find(item => item.id === editingId)?.image_url || '').trim()
    // Only a new or changed outside link is checked for duplicates
    const duplicate = !photoFile && url && url !== original && !url.startsWith('/') && items.find(item => item.id !== editingId && (item.image_url || '').trim() === url)
    const found = cleanErrors({
      title_en: checkText(form.title_en, { label: 'English title', required: true, min: 3, max: LIMITS.title }),
      title_bn: checkText(form.title_bn, { label: 'Bangla title', min: 2, max: LIMITS.title, bengali: true }),
      category: CATEGORIES[form.category] ? '' : 'Choose a category.',
      organisation: !form.organisation || ORG_LABELS[form.organisation] ? '' : 'Choose an organisation.',
      photo: errors.photo || (!photoFile && !url ? 'Upload a photo from your computer, or paste an image link.' : ''),
      image_url: photoFile ? '' : (url && checkImageLink(url)) || (duplicate ? `This image is already in the gallery ("${duplicate.title_en || duplicate.title_bn}").` : ''),
      description_en: checkText(form.description_en, { label: 'English description', min: 10, max: LIMITS.description }),
      description_bn: checkText(form.description_bn, { label: 'Bangla description', min: 10, max: LIMITS.description, bengali: true })
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setSaving(true)
    let uploaded = null
    try {
      let imageUrl = form.image_url.trim()
      if (photoFile) {
        setMessage('Uploading photo...')
        uploaded = await uploadImage(photoFile, `gallery/${form.organisation || 'general'}`)
        imageUrl = uploaded.url
      }
      const previous = items.find(item => item.id === editingId)
      const payload = { ...form, organisation: form.organisation || null, title_en: form.title_en.trim(), title_bn: form.title_bn.trim() || null, image_url: imageUrl, description_en: form.description_en.trim() || null, description_bn: form.description_bn.trim() || null }
      const result = editingId ? await db('gallery').update(payload).eq('id', editingId) : await db('gallery').insert(payload)
      if (result.error) throw result.error
      // The old uploaded photo is no longer used after replacing it
      if (previous && previous.image_url !== imageUrl && storagePathFromUrl(previous.image_url)) await removeImage(previous.image_url)
      setMessage(editingId ? 'Gallery item updated.' : `Photo added to ${orgLabel(form.organisation)}.`)
      resetForm(!editingId)
      await loadItems()
    } catch (error) {
      if (uploaded) await removeImage(uploaded.path)
      const needsOrgColumn = /organisation/i.test(error.message || '')
      setMessage('Error: ' + (needsOrgColumn ? 'The organisation column is missing — run supabase/organisations-gallery-schema.sql once in Supabase → SQL Editor.' : describeDbError(error) || error.message) + (/row-level|policy|permission|Unauthorized/i.test(error.message || '') ? ' (Photo upload is not allowed yet — run supabase/storage-photos-policy.sql once.)' : ''))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Delete this gallery item?')) return
    setDeletingId(item.id)
    const { error } = await db('gallery').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else {
      const photoError = await removeImage(item.image_url)
      setMessage(photoError ? 'Gallery item deleted, but its photo file could not be removed.' : 'Gallery item deleted.')
      if (editingId === item.id) resetForm()
      await loadItems()
    }
    setDeletingId(null)
  }

  // Clean, brighten and enlarge a photo that is already uploaded. The original file is kept, so it can be undone.
  async function enhanceItem(item, { quiet = false } = {}) {
    setEnhancingId(item.id)
    let uploaded = null
    try {
      const better = await enhanceImage(item.image_url, { name: (item.title_en || 'photo').replace(/[^\w-]+/g, '-').slice(0, 40) })
      uploaded = await uploadImage(better, `gallery/${item.organisation || 'general'}`)
      const { error } = await db('gallery').update({ image_url: uploaded.url }).eq('id', item.id)
      if (error) throw error
      setUndoUrls(previous => ({ ...previous, [item.id]: item.image_url }))
      if (!quiet) { setMessage(`✨ "${item.title_en || item.title_bn}" enhanced. Use Undo to go back to the original.`); await loadItems() }
      return true
    } catch (error) {
      if (uploaded) await removeImage(uploaded.path)
      setMessage('Could not enhance this photo: ' + (/Failed to fetch|tainted|cross-origin|could not be opened/i.test(error.message || '') ? 'the photo link does not allow editing (photos from other websites cannot be changed — upload the photo instead).' : describeDbError(error) || error.message))
      return false
    } finally {
      setEnhancingId(null)
    }
  }

  async function undoEnhance(item) {
    const before = undoUrls[item.id]
    if (!before) return
    const { error } = await db('gallery').update({ image_url: before }).eq('id', item.id)
    if (error) { setMessage('Error: ' + describeDbError(error)); return }
    await removeImage(item.image_url)
    setUndoUrls(previous => { const next = { ...previous }; delete next[item.id]; return next })
    setMessage('Original photo restored.')
    await loadItems()
  }

  async function enhanceAll() {
    const list = shownItems.filter(item => !undoUrls[item.id])
    if (!list.length || !window.confirm(`Enhance ${list.length} photo(s) shown in the list? Each original is kept until you leave this page (Undo).`)) return
    let done = 0
    for (const [index, item] of list.entries()) {
      setBatch(`✨ Enhancing photo ${index + 1} of ${list.length}…`)
      if (await enhanceItem(item, { quiet: true })) done++
    }
    setBatch(null)
    setMessage(`✨ ${done} of ${list.length} photo(s) enhanced.`)
    await loadItems()
  }

  // Publish / hide a photo straight from the list
  async function togglePublished(item) {
    setTogglingId(item.id)
    const { error } = await db('gallery').update({ is_published: !item.is_published }).eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage(item.is_published ? 'Photo hidden from the website.' : 'Photo published on the website.'); await loadItems() }
    setTogglingId(null)
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setErrors({})
    setMessage('')
    setPhotoFile(null)
    setForm({ organisation: item.organisation || '', category: item.category || 'temple', title_en: item.title_en || '', title_bn: item.title_bn || '', image_url: item.image_url || '', description_en: item.description_en || '', description_bn: item.description_bn || '', is_published: item.is_published ?? false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const query = search.trim().toLowerCase()
  const shownItems = items.filter(item =>
    (orgFilter === 'all' || (item.organisation || 'general') === orgFilter) &&
    (categoryFilter === 'all' || item.category === categoryFilter) &&
    (statusFilter === 'all' || (statusFilter === 'published') === Boolean(item.is_published)) &&
    `${item.title_en || ''} ${item.title_bn || ''} ${item.description_en || ''} ${item.description_bn || ''}`.toLowerCase().includes(query))
  const counts = items.reduce((total, item) => { const key = item.organisation || 'general'; total[key] = (total[key] || 0) + 1; return total }, {})

  const dirty = Boolean(photoFile) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const linkPreview = !photoFile && form.image_url.trim() && !checkImageLink(form.image_url) ? form.image_url.trim() : ''

  return <div className="events-management">
    <h3>{editingId ? 'Edit Gallery Item' : 'Add Gallery Item'}</h3>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <ErrorSummary errors={errors} />

      <label htmlFor="gallery-organisation">Organisation / প্রতিষ্ঠান *</label>
      <select id="gallery-organisation" name="organisation" value={form.organisation} onChange={handleChange} {...invalidProps(errors, 'organisation', 'gallery')}>
        <option value="">{GENERAL_LABEL}</option>
        {ORGANISATIONS.map(org => <option key={org.id} value={org.id}>{ORG_LABELS[org.id]}</option>)}
      </select>
      <small className="field-hint">The photo is shown on the website under this temple / organisation.</small>
      <FieldError id="gallery-organisation-error" message={errors.organisation} />

      <label htmlFor="gallery-category">Category / ধরন *</label>
      <select id="gallery-category" name="category" value={form.category} onChange={handleChange} {...invalidProps(errors, 'category', 'gallery')}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <FieldError id="gallery-category-error" message={errors.category} />

      <label htmlFor="gallery-title_en">English Title *</label>
      <input id="gallery-title_en" name="title_en" value={form.title_en} onChange={handleChange} placeholder="English title" maxLength={LIMITS.title} required {...invalidProps(errors, 'title_en', 'gallery')} />
      <FieldError id="gallery-title_en-error" message={errors.title_en} />

      <label htmlFor="gallery-title_bn">বাংলা শিরোনাম</label>
      <input id="gallery-title_bn" name="title_bn" value={form.title_bn} onChange={handleChange} placeholder="বাংলা শিরোনাম" maxLength={LIMITS.title} {...invalidProps(errors, 'title_bn', 'gallery')} />
      <FieldError id="gallery-title_bn-error" message={errors.title_bn} />

      <ImagePicker id="gallery-photo" label="Photo / ছবি *" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', image_url: '' })) }} currentUrl={linkPreview} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />

      <details className="link-option" open={Boolean(form.image_url) && !photoFile}>
        <summary>…or paste an image link instead / অথবা ছবির লিংক দিন</summary>
        <input id="gallery-image_url" type="url" name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/photo.jpg" disabled={Boolean(photoFile)} {...invalidProps(errors, 'image_url', 'gallery')} />
        <FieldError id="gallery-image_url-error" message={errors.image_url} />
      </details>

      <label htmlFor="gallery-description_en">English Description</label>
      <textarea id="gallery-description_en" name="description_en" value={form.description_en} onChange={handleChange} placeholder="English description" rows="3" maxLength={LIMITS.description} {...invalidProps(errors, 'description_en', 'gallery')} />
      <small className="field-hint">{form.description_en.length}/{LIMITS.description}</small>
      <FieldError id="gallery-description_en-error" message={errors.description_en} />

      <label htmlFor="gallery-description_bn">বাংলা বিবরণ</label>
      <textarea id="gallery-description_bn" name="description_bn" value={form.description_bn} onChange={handleChange} placeholder="বাংলা বিবরণ" rows="3" maxLength={LIMITS.description} {...invalidProps(errors, 'description_bn', 'gallery')} />
      <small className="field-hint">{form.description_bn.length}/{LIMITS.description}</small>
      <FieldError id="gallery-description_bn-error" message={errors.description_bn} />

      <label className="publish-option"><input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} /> Publish this image</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? (photoFile ? 'Uploading...' : 'Saving...') : editingId ? 'Update Image' : 'Add Image'}</button>
        {editingId && <button type="button" onClick={() => resetForm()} disabled={saving}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list">
      <h3>Saved Gallery Items ({shownItems.length} of {items.length})</h3>
      <div className="org-photo-counts">{[['', GENERAL_LABEL], ...ORGANISATIONS.map(org => [org.id, ORG_LABELS[org.id]])].map(([id, label]) => <button type="button" key={id || 'general'} className={orgFilter === (id || 'general') ? 'active' : ''} onClick={() => setOrgFilter(orgFilter === (id || 'general') ? 'all' : (id || 'general'))}>{label.split(' / ')[0]} <b>{counts[id || 'general'] || 0}</b></button>)}</div>
      <div className="filter-row">
        <input className="management-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title or description" aria-label="Search gallery items" maxLength={100} />
        <select value={orgFilter} onChange={event => setOrgFilter(event.target.value)} aria-label="Filter by organisation"><option value="all">All organisations</option><option value="general">{GENERAL_LABEL}</option>{ORGANISATIONS.map(org => <option key={org.id} value={org.id}>{ORG_LABELS[org.id]}</option>)}</select>
        <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="all">Published and drafts</option><option value="published">Published only</option><option value="draft">Drafts only</option></select>
      </div>
      {shownItems.length > 0 && <div className="enhance-all-row"><button type="button" className="enhance-btn" onClick={enhanceAll} disabled={Boolean(enhancingId) || Boolean(batch)}>✨ Enhance all {shownItems.length} photo(s) in this list</button>{batch && <span role="status">{batch}</span>}</div>}
      {shownItems.length === 0 && <p className="field-hint">No photos match these filters.</p>}
      <div className="admin-gallery-grid">{shownItems.map(item => <article className="event-item" key={item.id}>
        <a href={item.image_url} target="_blank" rel="noopener noreferrer" title="Open full size"><img className="event-image-preview" src={item.image_url} alt={item.title_en || item.title_bn || 'Gallery item'} loading="lazy" /></a>
        <h4>{item.title_en || item.title_bn}</h4>
        <p><b>{orgLabel(item.organisation).split(' / ')[0]}</b><br />{CATEGORIES[item.category] || 'Temple'} · {item.is_published ? 'Published' : 'Draft'}</p>
        <button type="button" onClick={() => handleEdit(item)}>Edit</button>
        <button type="button" onClick={() => togglePublished(item)} disabled={togglingId === item.id}>{item.is_published ? 'Hide' : 'Publish'}</button>
        <button type="button" className="enhance-btn" onClick={() => enhanceItem(item)} disabled={Boolean(enhancingId) || Boolean(batch)}>{enhancingId === item.id ? '✨ Working…' : '✨ Enhance'}</button>
        {undoUrls[item.id] && <button type="button" onClick={() => undoEnhance(item)} disabled={Boolean(enhancingId)}>↶ Undo</button>}
        <button type="button" onClick={() => handleDelete(item)} disabled={deletingId === item.id}>{deletingId === item.id ? 'Deleting...' : 'Delete'}</button>
      </article>)}</div>
    </div>
  </div>
}
