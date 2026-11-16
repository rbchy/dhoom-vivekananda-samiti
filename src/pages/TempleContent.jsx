import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, cleanErrors } from '../lib/validation'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const LIMITS = { title: 150, body: 5000 }

export default function TempleContent() {
  const [form, setForm] = useState({
    slug: 'about-temple',
    title_en: '',
    title_bn: '',
    body_en: '',
    body_bn: '',
    is_published: false
  })

  const [savedForm, setSavedForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [recordId, setRecordId] = useState(null)

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    setLoading(true)

    const { data, error } = await supabase
      .from('temple_content')
      .select('*')
      .eq('slug', 'about-temple')
      .maybeSingle()

    if (error) {
      setMessage(error.message)
    } else if (data) {
      setRecordId(data.id)
      const loaded = {
        slug: data.slug,
        title_en: data.title_en || '',
        title_bn: data.title_bn || '',
        body_en: data.body_en || '',
        body_bn: data.body_bn || '',
        is_published: data.is_published ?? false
      }
      setForm(loaded)
      setSavedForm(loaded)
    }

    setLoading(false)
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm(previous => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function validate() {
    const found = cleanErrors({
      title_en: checkText(form.title_en, { label: 'English title', required: true, min: 3, max: LIMITS.title }),
      title_bn: checkText(form.title_bn, { label: 'Bangla title', required: true, min: 2, max: LIMITS.title, bengali: true }),
      body_en: checkText(form.body_en, { label: 'English description', required: form.is_published, min: 20, max: LIMITS.body }),
      body_bn: checkText(form.body_bn, { label: 'Bangla description', min: 10, max: LIMITS.body, bengali: true })
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setSaving(true)

    const payload = {
      ...form,
      title_en: form.title_en.trim(),
      title_bn: form.title_bn.trim(),
      body_en: form.body_en.trim(),
      body_bn: form.body_bn.trim(),
      updated_at: new Date().toISOString()
    }

    const result = recordId
      ? await db('temple_content')
          .update(payload)
          .eq('id', recordId)
      : await db('temple_content')
          .insert(payload)
          .select()
          .single()

    if (result.error) {
      setMessage('Error: ' + result.error.message)
    } else {
      if (result.data?.id) setRecordId(result.data.id)
      setSavedForm(form)
      setMessage('Temple content saved successfully!')
    }

    setSaving(false)
  }

  if (loading) return <p>Loading temple content...</p>

  const dirty = savedForm ? JSON.stringify(savedForm) !== JSON.stringify(form) : Boolean(form.title_en || form.title_bn || form.body_en || form.body_bn)

  return (
    <div className="temple-content-editor">
      <h2>Temple Content Management</h2>
      <p>Edit temple information in English and Bengali.</p>

      <form onSubmit={handleSave} noValidate>
        <ErrorSummary errors={errors} />

        <label htmlFor="temple-slug">Content Slug</label>
        <input id="temple-slug" value={form.slug} disabled />

        <label htmlFor="temple-title_en">English Title *</label>
        <input
          id="temple-title_en"
          name="title_en"
          value={form.title_en}
          onChange={handleChange}
          maxLength={LIMITS.title}
          required
          {...invalidProps(errors, 'title_en', 'temple')}
        />
        <FieldError id="temple-title_en-error" message={errors.title_en} />

        <label htmlFor="temple-title_bn">বাংলা শিরোনাম *</label>
        <input
          id="temple-title_bn"
          name="title_bn"
          value={form.title_bn}
          onChange={handleChange}
          maxLength={LIMITS.title}
          required
          {...invalidProps(errors, 'title_bn', 'temple')}
        />
        <FieldError id="temple-title_bn-error" message={errors.title_bn} />

        <label htmlFor="temple-body_en">English Description {form.is_published && '*'}</label>
        <textarea
          id="temple-body_en"
          name="body_en"
          value={form.body_en}
          onChange={handleChange}
          rows="5"
          maxLength={LIMITS.body}
          {...invalidProps(errors, 'body_en', 'temple')}
        />
        <small className="field-hint">{form.body_en.length}/{LIMITS.body} — required before publishing (at least 20 characters).</small>
        <FieldError id="temple-body_en-error" message={errors.body_en} />

        <label htmlFor="temple-body_bn">বাংলা বিবরণ</label>
        <textarea
          id="temple-body_bn"
          name="body_bn"
          value={form.body_bn}
          onChange={handleChange}
          rows="5"
          maxLength={LIMITS.body}
          {...invalidProps(errors, 'body_bn', 'temple')}
        />
        <small className="field-hint">{form.body_bn.length}/{LIMITS.body}</small>
        <FieldError id="temple-body_bn-error" message={errors.body_bn} />

        <label className="publish-option">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />
          Publish this content
        </label>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Temple Content'}
          </button>
          <BackToMainButton dirty={dirty} />
        </div>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  )
}
