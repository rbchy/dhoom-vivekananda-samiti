import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, cleanErrors } from '../lib/validation'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import { ORGANISATIONS } from '../i18n-org'

// Pages that can be edited here: the main story, and one page per institution (/org/<id>)
const PAGES = [
  { slug: 'about-temple', label: 'Our Story (home page) / আমাদের ইতিহাস' },
  ...ORGANISATIONS.map(org => ({ slug: `org-${org.id}`, label: `${org.name_en} / ${org.name_bn}`, org }))
]
const emptyPage = slug => ({ slug, title_en: '', title_bn: '', body_en: '', body_bn: '', mantra_bn: '', mantra_en: '', is_published: false })

const LIMITS = { title: 150, body: 5000, mantra: 600 }

export default function TempleContent() {
  const [slug, setSlug] = useState('about-temple')
  const [form, setForm] = useState(emptyPage('about-temple'))
  const page = PAGES.find(p => p.slug === slug)
  const isOrgPage = Boolean(page?.org)

  const [savedForm, setSavedForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [recordId, setRecordId] = useState(null)

  useEffect(() => {
    loadContent()
  }, [slug])

  async function loadContent() {
    setLoading(true)
    setMessage('')
    setErrors({})
    setRecordId(null)
    setSavedForm(null)
    setForm(emptyPage(slug))

    const { data, error } = await supabase
      .from('temple_content')
      .select('*')
      .eq('slug', slug)
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
        mantra_bn: data.mantra_bn || '',
        mantra_en: data.mantra_en || '',
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
      body_bn: checkText(form.body_bn, { label: 'Bangla description', min: 10, max: LIMITS.body, bengali: true }),
      mantra_bn: isOrgPage ? checkText(form.mantra_bn, { label: 'Pranam mantra (Bangla)', max: LIMITS.mantra, bengali: true }) : '',
      mantra_en: isOrgPage ? checkText(form.mantra_en, { label: 'Pranam mantra (Roman letters)', max: LIMITS.mantra }) : ''
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setSaving(true)

    const { mantra_bn, mantra_en, ...rest } = form
    const payload = {
      ...rest,
      slug,
      title_en: form.title_en.trim(),
      title_bn: form.title_bn.trim(),
      body_en: form.body_en.trim(),
      body_bn: form.body_bn.trim(),
      // the mantra columns exist only after supabase/organisation-pages.sql has been run
      ...(isOrgPage ? { mantra_bn: mantra_bn.trim() || null, mantra_en: mantra_en.trim() || null } : {}),
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
      setMessage('Error: ' + result.error.message + (/mantra/i.test(result.error.message) ? ' — run supabase/organisation-pages.sql once in Supabase → SQL Editor.' : ''))
    } else {
      if (result.data?.id) setRecordId(result.data.id)
      setSavedForm(form)
      setMessage(isOrgPage ? `Saved. ${form.is_published ? 'The page is live at' : 'Tick "Publish" to show it at'} /org/${page.org.id}` : 'Temple content saved successfully!')
    }

    setSaving(false)
  }

  const dirty = savedForm ? JSON.stringify(savedForm) !== JSON.stringify(form) : Boolean(form.title_en || form.title_bn || form.body_en || form.body_bn)

  return (
    <div className="temple-content-editor">
      <h2>Temple Content Management</h2>
      <p>Edit the home-page story and the page of each institution in English and Bengali.</p>

      <label htmlFor="temple-page">Which page / কোন পেজ</label>
      <select id="temple-page" value={slug} onChange={event => { if (!dirty || window.confirm('You have unsaved changes. Switch page without saving?')) setSlug(event.target.value) }}>
        {PAGES.map(p => <option key={p.slug} value={p.slug}>{p.label}</option>)}
      </select>
      {isOrgPage && <p className="field-hint">Shown on the website at <a href={`${import.meta.env.BASE_URL}org/${page.org.id}`} target="_blank" rel="noopener noreferrer">/org/{page.org.id}</a>. Until it is published, the page shows the short description of the institution.</p>}
      {loading && <p>Loading…</p>}

      <form onSubmit={handleSave} noValidate>
        <ErrorSummary errors={errors} />


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

        {isOrgPage && <>
          <label htmlFor="temple-mantra_bn">প্রণাম মন্ত্র (বাংলা) — optional</label>
          <textarea id="temple-mantra_bn" name="mantra_bn" value={form.mantra_bn} onChange={handleChange} rows="3" maxLength={LIMITS.mantra} placeholder="প্রতিটি চরণ আলাদা লাইনে" {...invalidProps(errors, 'mantra_bn', 'temple')} />
          <FieldError id="temple-mantra_bn-error" message={errors.mantra_bn} />
          <label htmlFor="temple-mantra_en">Pranam mantra in Roman letters (for other languages) — optional</label>
          <textarea id="temple-mantra_en" name="mantra_en" value={form.mantra_en} onChange={handleChange} rows="3" maxLength={LIMITS.mantra} placeholder="One line per verse" {...invalidProps(errors, 'mantra_en', 'temple')} />
          <FieldError id="temple-mantra_en-error" message={errors.mantra_en} />
        </>}

        <label className="publish-option">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />
          {isOrgPage ? 'Publish this page' : 'Publish this content'}
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
