import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { copyText, shareText } from '../lib/share'
import SocialPostButton from '../components/SocialPostButton'
import { checkText, checkUrl, cleanErrors, todayISO } from '../lib/validation'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import { describeDbError } from '../lib/dbErrors'
import { shrinkImage } from '../lib/imageEnhance'

const SPECIAL = 'special'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const BUCKET = 'event-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // after preparing (WebP 80%, at most 1600 px)
const MAX_ORIGINAL_SIZE = 25 * 1024 * 1024 // a photo straight from a phone camera
const LIMITS = { title: 150, description: 2000 }

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

const emptyForm = {
  title_en: '',
  title_bn: '',
  description_en: '',
  description_bn: '',
  event_date: '',
  image_url: '',
  opens_at: '',
  puja_starts_at: '',
  closes_at: '',
  location: '',
  subtitle_en: '',
  subtitle_bn: '',
  mantra_bn: '',
  mantra_en: '',
  is_published: false
}

const dateOnly = value => (value ? String(value).slice(0, 10) : '')

// Get the Storage file path from a Supabase public URL
function getStoragePath(publicUrl) {
  if (!publicUrl) return null

  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = publicUrl.indexOf(marker)

  if (index === -1) return null

  const encodedPath = publicUrl
    .slice(index + marker.length)
    .split('?')[0]

  try {
    return encodedPath
      .split('/')
      .map(part => decodeURIComponent(part))
      .join('/')
  } catch {
    return encodedPath
  }
}

// Upload selected image to Supabase Storage
async function uploadEventImage(file) {
  const safeName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    '-'
  )

  const filePath = `events/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (error) throw error

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  return {
    path: filePath,
    url: data.publicUrl
  }
}

export default function EventsManagement() {
  const [form, setForm] = useState(emptyForm)
  const [events, setEvents] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})
  const [catalog, setCatalog] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [titleChoice, setTitleChoice] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [message, setMessage] = useState('')

  useEffect(() => {
    loadEvents()
    loadCatalog()
  }, [])

  // Yearly event list for the title drop-down
  async function loadCatalog() {
    const { data, error } = await supabase
      .from('event_catalog')
      .select('id, name_en, name_bn, usual_month, sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .order('name_en')

    if (error) {
      setCatalogError(describeDbError(error))
      setCatalog([])
    } else {
      setCatalog(data || [])
      setCatalogError('')
    }
  }

  function handleTitleChoice(event) {
    const value = event.target.value
    setTitleChoice(value)
    setErrors(previous => ({ ...previous, title_choice: '', title_en: '', title_bn: '' }))

    const picked = catalog.find(item => item.id === value)
    setForm(previous => ({
      ...previous,
      title_en: picked ? picked.name_en : '',
      title_bn: picked ? picked.name_bn : ''
    }))
  }

  // Manage temporary image preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  async function loadEvents(showLoader = true) {
    if (showLoader) setLoading(true)

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      setMessage('Error loading events: ' + error.message)
    } else {
      setEvents(data || [])
    }

    if (showLoader) setLoading(false)
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm(previous => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors(previous => ({ ...previous, photo: 'Event photo must be a JPG, PNG or WebP image.' }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_ORIGINAL_SIZE) {
      setErrors(previous => ({ ...previous, photo: 'Event photo must not exceed 25 MB.' }))
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setErrors(previous => ({ ...previous, photo: '' }))
    setMessage('')
  }

  function validate() {
    const today = todayISO()
    const date = form.event_date
    let dateError = ''

    if (!date) {
      dateError = 'Event date is required.'
    } else if (Number.isNaN(new Date(`${date}T00:00:00`).valueOf())) {
      dateError = 'Event date is not a valid date.'
    } else if (!editingId && date < today) {
      dateError = 'Event date cannot be in the past for a new event.'
    } else if (date > `${Number(today.slice(0, 4)) + 5}${today.slice(4)}`) {
      dateError = 'Event date must be within the next 5 years.'
    }

    const titleEn = form.title_en.trim().toLowerCase()
    const titleBn = form.title_bn.trim()
    const duplicate = events.find(item =>
      item.id !== editingId &&
      dateOnly(item.event_date) === date &&
      ((item.title_en || '').trim().toLowerCase() === titleEn ||
        (item.title_bn || '').trim() === titleBn)
    )

    const manualTitles = titleChoice === SPECIAL || (catalogError && !catalog.length)

    const found = cleanErrors({
      title_choice: !manualTitles && !titleChoice ? 'Choose an event from the yearly list, or choose "Special event" to type a new name.' : '',
      title_en: !manualTitles && !titleChoice ? '' : checkText(form.title_en, { label: 'English event title', required: true, min: 3, max: LIMITS.title }) ||
        (duplicate ? `An event called "${duplicate.title_en || duplicate.title_bn}" already exists on this date.` : ''),
      title_bn: !manualTitles && !titleChoice ? '' : checkText(form.title_bn, { label: 'Bangla event title', required: true, min: 2, max: LIMITS.title, bengali: true }),
      description_en: checkText(form.description_en, { label: 'English description', min: 10, max: LIMITS.description }),
      description_bn: checkText(form.description_bn, { label: 'Bangla description', min: 10, max: LIMITS.description, bengali: true }),
      event_date: dateError,
      puja_starts_at: form.opens_at && form.puja_starts_at && form.puja_starts_at < form.opens_at ? 'Puja cannot begin before the temple opens.' : '',
      location: checkText(form.location, { label: 'Location', min: 3, max: 150 }),
      image_url: selectedFile ? '' : checkUrl(form.image_url, { label: 'Event image URL' }),
      photo: errors.photo || ''
    })

    setErrors(found)
    return Object.keys(found).length === 0
  }

  function resetForm() {
    setForm(emptyForm)
    setSelectedFile(null)
    setEditingId(null)
    setErrors({})
    setTitleChoice('')

    const fileInput = document.getElementById('event-photo')

    if (fileInput) fileInput.value = ''
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')

    if (!validate()) return

    setSaving(true)

    let uploadedPath = null
    let recordSaved = false

    try {
      let imageUrl = form.image_url.trim() || null

      // Upload new image when selected
      if (selectedFile) {
        setMessage('Preparing event photo...')
        // Saved as a light WebP picture (80%, at most 1600 px wide)
        const ready = await shrinkImage(selectedFile).catch(() => selectedFile)
        if (ready.size > MAX_FILE_SIZE) throw new Error('The photo is still larger than 5 MB after preparing it. Please choose a smaller photo.')
        setMessage('Uploading event photo...')

        const uploaded = await uploadEventImage(ready)

        uploadedPath = uploaded.path
        imageUrl = uploaded.url
      }

      const payload = {
        title_en: form.title_en.trim(),
        title_bn: form.title_bn.trim(),
        description_en: form.description_en.trim(),
        description_bn: form.description_bn.trim(),
        event_date: form.event_date,
        image_url: imageUrl,
        opens_at: form.opens_at || null,
        puja_starts_at: form.puja_starts_at || null,
        closes_at: form.closes_at || null,
        location: form.location.trim() || null,
        is_published: form.is_published
      }

      // Subtitle and mantra columns come from supabase/event-extras.sql; send them only when they exist or were filled in
      const extras = { subtitle_en: form.subtitle_en.trim() || null, subtitle_bn: form.subtitle_bn.trim() || null, mantra_bn: form.mantra_bn.trim() || null, mantra_en: form.mantra_en.trim() || null }
      if (events.some(item => 'mantra_bn' in item) || Object.values(extras).some(Boolean)) Object.assign(payload, extras)

      const previousEvent = events.find(
        item => item.id === editingId
      )

      const result = editingId
        ? await db('events')
            .update(payload)
            .eq('id', editingId)
        : await db('events')
            .insert(payload)

      if (result.error) throw result.error

      recordSaved = true

      let successMessage = editingId
        ? 'Event updated successfully!'
        : 'Event added successfully!'

      // Remove previous Storage image after successful update
      if (selectedFile && previousEvent?.image_url) {
        const oldPath = getStoragePath(previousEvent.image_url)

        if (oldPath && oldPath !== uploadedPath) {
          const { error } = await supabase.storage
            .from(BUCKET)
            .remove([oldPath])

          if (error) {
            successMessage +=
              ' Warning: Previous photo could not be removed.'
          }
        }
      }

      resetForm()
      setMessage(successMessage)

      await loadEvents(false)

    } catch (error) {
      // Remove newly uploaded image if database save failed
      if (uploadedPath && !recordSaved) {
        await supabase.storage
          .from(BUCKET)
          .remove([uploadedPath])
      }

      setMessage('Error: ' + error.message + (/subtitle|mantra/i.test(error.message || '') ? ' (The subtitle and mantra fields are not set up yet — run supabase/event-extras.sql once in Supabase → SQL Editor.)' : ''))

    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    setEditingId(item.id)

    setForm({
      title_en: item.title_en || '',
      title_bn: item.title_bn || '',
      description_en: item.description_en || '',
      description_bn: item.description_bn || '',
      event_date: dateOnly(item.event_date),
      image_url: item.image_url || '',
      opens_at: (item.opens_at || '').slice(0, 5),
      puja_starts_at: (item.puja_starts_at || '').slice(0, 5),
      closes_at: (item.closes_at || '').slice(0, 5),
      location: item.location || '',
      subtitle_en: item.subtitle_en || '',
      subtitle_bn: item.subtitle_bn || '',
      mantra_bn: item.mantra_bn || '',
      mantra_en: item.mantra_en || '',
      is_published: item.is_published ?? false
    })

    const match = catalog.find(entry =>
      entry.name_en.trim().toLowerCase() === (item.title_en || '').trim().toLowerCase() &&
      entry.name_bn.trim() === (item.title_bn || '').trim()
    )
    setTitleChoice(match ? match.id : SPECIAL)

    setSelectedFile(null)
    setErrors({})
    setMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this event?'
    )

    if (!confirmed) return

    const item = events.find(event => event.id === id)

    setDeletingId(id)
    setMessage('')

    try {
      const { error } = await db('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEvents(previous =>
        previous.filter(event => event.id !== id)
      )

      if (editingId === id) resetForm()

      // Delete associated Storage image
      const imagePath = getStoragePath(item?.image_url)

      if (imagePath) {
        const { error: imageError } = await supabase.storage
          .from(BUCKET)
          .remove([imagePath])

        if (imageError) {
          setMessage(
            'Event deleted, but its photo could not be removed: ' +
            imageError.message
          )
        } else {
          setMessage('Event and associated photo deleted successfully!')
        }
      } else {
        setMessage('Event deleted successfully!')
      }

    } catch (error) {
      setMessage('Error: ' + error.message)

    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <p>Loading events...</p>
  }

  const dirty = Boolean(selectedFile) || Boolean(titleChoice) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const showManualTitles = titleChoice === SPECIAL || (catalogError && !catalog.length)
  const pickedEvent = catalog.find(item => item.id === titleChoice)

  return (
    <div className="events-management">

      <h2>Events Management</h2>

      <p>
        Manage temple events in English and Bengali.
      </p>

      <form
        onSubmit={handleSave}
        className="event-form"
        noValidate
      >

        <h3>
          {editingId ? 'Edit Event' : 'Add New Event'}
        </h3>

        <ErrorSummary errors={errors} />

        <label htmlFor="event-title_choice">Event / অনুষ্ঠান *</label>

        <select
          id="event-title_choice"
          value={titleChoice}
          onChange={handleTitleChoice}
          {...invalidProps(errors, 'title_choice', 'event')}
        >
          <option value="">— Choose from yearly list / বার্ষিক তালিকা থেকে বাছুন —</option>
          {catalog.map(item => (
            <option key={item.id} value={item.id}>
              {item.name_en} — {item.name_bn}{item.usual_month ? ` (${MONTHS[item.usual_month - 1]})` : ''}
            </option>
          ))}
          <option value={SPECIAL}>★ Special event (type new name) / বিশেষ অনুষ্ঠান (নতুন নাম লিখুন)</option>
        </select>
        <small className="field-hint">
          Missing from the list? Add it once under “Yearly Event List” in the dashboard, or choose “Special event”.
        </small>
        {catalogError && <small className="field-error">{catalogError} You can still type the names as a special event.</small>}
        <FieldError id="event-title_choice-error" message={errors.title_choice} />

        {pickedEvent && (
          <div className="picked-event" aria-live="polite">
            <span><b>English:</b> {pickedEvent.name_en}</span>
            <span lang="bn"><b>বাংলা:</b> {pickedEvent.name_bn}</span>
          </div>
        )}
        {(errors.title_en || errors.title_bn) && !showManualTitles && (
          <FieldError id="event-title_en-error" message={errors.title_en || errors.title_bn} />
        )}

        {showManualTitles && (
          <>
            <label htmlFor="event-title_en">English Event Title *</label>

            <input
              id="event-title_en"
              name="title_en"
              value={form.title_en}
              onChange={handleChange}
              placeholder="Enter English event title"
              maxLength={LIMITS.title}
              required
              {...invalidProps(errors, 'title_en', 'event')}
            />
            <FieldError id="event-title_en-error" message={errors.title_en} />

            <label htmlFor="event-title_bn">বাংলা অনুষ্ঠানের শিরোনাম *</label>

            <input
              id="event-title_bn"
              name="title_bn"
              value={form.title_bn}
              onChange={handleChange}
              placeholder="বাংলায় অনুষ্ঠানের নাম লিখুন"
              maxLength={LIMITS.title}
              required
              {...invalidProps(errors, 'title_bn', 'event')}
            />
            <FieldError id="event-title_bn-error" message={errors.title_bn} />
          </>
        )}

        <label htmlFor="event-description_en">English Description</label>

        <textarea
          id="event-description_en"
          name="description_en"
          value={form.description_en}
          onChange={handleChange}
          placeholder="Enter event description"
          rows="4"
          maxLength={LIMITS.description}
          {...invalidProps(errors, 'description_en', 'event')}
        />
        <small className="field-hint">{form.description_en.length}/{LIMITS.description}</small>
        <FieldError id="event-description_en-error" message={errors.description_en} />

        <label htmlFor="event-description_bn">বাংলা বিবরণ</label>

        <textarea
          id="event-description_bn"
          name="description_bn"
          value={form.description_bn}
          onChange={handleChange}
          placeholder="অনুষ্ঠানের বিবরণ বাংলায় লিখুন"
          rows="4"
          maxLength={LIMITS.description}
          {...invalidProps(errors, 'description_bn', 'event')}
        />
        <small className="field-hint">{form.description_bn.length}/{LIMITS.description}</small>
        <FieldError id="event-description_bn-error" message={errors.description_bn} />

        <label htmlFor="event-subtitle_en">Subtitle (English, optional)</label>
        <input id="event-subtitle_en" name="subtitle_en" value={form.subtitle_en} onChange={handleChange} maxLength={120} placeholder="e.g. Annual festival · Vasant Panchami" />
        <label htmlFor="event-subtitle_bn">উপশিরোনাম (বাংলা)</label>
        <input id="event-subtitle_bn" name="subtitle_bn" value={form.subtitle_bn} onChange={handleChange} maxLength={120} placeholder="যেমন বার্ষিক উৎসব · বসন্ত পঞ্চমী" />

        <label htmlFor="event-mantra_bn">মন্ত্র (বাংলা হরফে, ঐচ্ছিক)</label>
        <textarea id="event-mantra_bn" name="mantra_bn" value={form.mantra_bn} onChange={handleChange} rows="3" maxLength={500} placeholder={'ওঁ ভদ্রকাল্যৈ নমো নিত্যং সরস্বত্যৈ নমো নমঃ।\nবেদ-বেদাঙ্গ-বেদান্ত-বিদ্যাস্থানেভ্য এব চ॥'} />
        <label htmlFor="event-mantra_en">Mantra (Roman letters, for other languages)</label>
        <textarea id="event-mantra_en" name="mantra_en" value={form.mantra_en} onChange={handleChange} rows="3" maxLength={500} placeholder="Om bhadrakālyai namo nityaṁ…" />
        <small className="field-hint">The mantra is shown on the event card. Press Enter for a new line; a last line starting with “—” is shown as the source (e.g. — Bhagavad Gita 4.7).</small>

        <label htmlFor="event-event_date">Event Date *</label>

        <input
          id="event-event_date"
          type="date"
          name="event_date"
          value={form.event_date}
          onChange={handleChange}
          min={editingId ? undefined : todayISO()}
          required
          {...invalidProps(errors, 'event_date', 'event')}
        />
        <FieldError id="event-event_date-error" message={errors.event_date} />

        <div className="form-row three">
          <div>
            <label htmlFor="event-opens_at">Temple Opens / মন্দির খোলা</label>
            <input id="event-opens_at" type="time" name="opens_at" value={form.opens_at} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="event-puja_starts_at">Puja Begins / পূজা শুরু</label>
            <input id="event-puja_starts_at" type="time" name="puja_starts_at" value={form.puja_starts_at} onChange={handleChange} {...invalidProps(errors, 'puja_starts_at', 'event')} />
            <FieldError id="event-puja_starts_at-error" message={errors.puja_starts_at} />
          </div>
          <div>
            <label htmlFor="event-closes_at">Temple Closes / বন্ধ</label>
            <input id="event-closes_at" type="time" name="closes_at" value={form.closes_at} onChange={handleChange} />
          </div>
        </div>
        <small className="field-hint">Optional. A closing time earlier than the opening time means after midnight (e.g. 6:00 PM – 12:00 AM).</small>

        <label htmlFor="event-location">Location / স্থান</label>
        <input id="event-location" name="location" value={form.location} onChange={handleChange} placeholder="Leave empty if at the temple" maxLength={150} {...invalidProps(errors, 'location', 'event')} />
        <FieldError id="event-location-error" message={errors.location} />

        <div className="event-photo-upload">

          <label htmlFor="event-photo">
            Upload Event Photo
          </label>

          <input
            id="event-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            {...invalidProps(errors, 'photo', 'event')}
          />

          <small>
            JPG, PNG or WebP, up to 25 MB. It is saved as a light WebP picture (at most 1600 px wide).
          </small>
          <FieldError id="event-photo-error" message={errors.photo} />

          {selectedFile && (
            <p className="selected-photo-name">
              Selected: {selectedFile.name}
              {' '}
              <button
                type="button"
                className="remove-photo-button"
                onClick={() => {
                  setSelectedFile(null)
                  const fileInput = document.getElementById('event-photo')
                  if (fileInput) fileInput.value = ''
                }}
              >
                Remove
              </button>
            </p>
          )}

          {(previewUrl || /^https?:\/\//i.test(form.image_url.trim())) && (
            <div className="event-preview-container">

              <p>Event Photo Preview</p>

              <img
                src={previewUrl || form.image_url}
                alt="Event preview"
                className="event-image-preview"
                onError={event => {
                  event.currentTarget.style.display = 'none'
                }}
              />

            </div>
          )}

        </div>

        <label htmlFor="event-image_url">Or enter an external Event Image URL</label>

        <input
          id="event-image_url"
          type="url"
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="https://example.com/event-image.jpg"
          {...invalidProps(errors, 'image_url', 'event')}
        />
        <FieldError id="event-image_url-error" message={errors.image_url} />

        <label className="publish-option">

          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />

          Publish this event

        </label>

        <div className="form-actions">
          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Event'
                : 'Save Event'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel Edit
            </button>
          )}

          <BackToMainButton dirty={dirty} />
        </div>

        {message && (
          <p
            className="event-message"
            role="status"
          >
            {message}
          </p>
        )}

      </form>

      <div className="events-list">

        <h3>Saved Events ({events.length})</h3>
        <input className="management-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events" aria-label="Search events" maxLength={100} />

        {events.length === 0 ? (

          <p>No events have been added yet.</p>

        ) : (

          events.filter(item => `${item.title_en || ''} ${item.title_bn || ''} ${item.description_en || ''} ${item.description_bn || ''}`.toLowerCase().includes(search.trim().toLowerCase())).map(item => (

            <article
              className="event-item"
              key={item.id}
            >

              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title_en}
                  className="event-image-preview"
                />
              )}

              <h4>{item.title_en}</h4>

              <p>{item.title_bn}</p>

              <p>{item.description_en}</p>

              <p>{item.description_bn}</p>

              <p>Event Date: {dateOnly(item.event_date) || 'Not set'}</p>

              <p>
                Status: {item.is_published ? 'Published' : 'Draft'}
              </p>

              <button
                type="button"
                onClick={() => handleEdit(item)}
              >
                Edit
              </button>

              <button
                type="button"
                title="Copy Bangla + English text with link, for Facebook groups, WhatsApp, TikTok"
                onClick={async () => setMessage((await copyText(shareText('event', item, 'both'))) ? 'Copied for social media — paste it in a Facebook group, WhatsApp channel or TikTok. / সোশ্যাল মিডিয়ার জন্য কপি হয়েছে।' : 'Could not copy.')}
              >
                📋 Copy for social
              </button>

              <SocialPostButton kind="event" item={item} />

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? 'Deleting...' : 'Delete'}
              </button>

            </article>

          ))

        )}

      </div>

    </div>
  )
}
