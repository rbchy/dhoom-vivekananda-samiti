import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EMAIL_PATTERN, checkPhone, checkText, cleanErrors } from '../lib/validation'
import { FieldError, invalidProps } from './FormHelpers'

const empty = { name: '', email: '', phone: '', subject: '', message: '' }

export default function PublicContactForm({ t }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending') return
    const found = cleanErrors({
      name: checkText(form.name, { label: 'x', required: true, min: 2, max: 100 }) ? t('err_name') : '',
      email: !EMAIL_PATTERN.test(form.email.trim()) ? t('err_email') : '',
      phone: checkPhone(form.phone) ? t('err_phone') : '',
      subject: form.subject.length > 150 ? t('err_long') : '',
      message: checkText(form.message, { label: 'x', required: true, min: 10, max: 2000 }) ? t('err_message') : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending')
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null,
      subject: form.subject.trim() || null, message: form.message.trim(), status: 'new'
    })
    if (error) { console.error(error); setStatus('failed'); return }
    setForm(empty)
    setStatus('done')
  }

  if (status === 'done') return <p className="form-success" role="status">{t('msg_thanks')}</p>

  return <form className="public-form" onSubmit={handleSubmit} noValidate>
    {Object.keys(errors).length > 0 && <p className="form-error-summary" role="alert">{t('fix_fields')}</p>}
    <label htmlFor="msg-name">{t('f_name')} *</label>
    <input id="msg-name" name="name" value={form.name} onChange={handleChange} autoComplete="name" maxLength={100} {...invalidProps(errors, 'name', 'msg')} />
    <FieldError id="msg-name-error" message={errors.name} />
    <div className="form-row">
      <div>
        <label htmlFor="msg-email">{t('f_email_req')} *</label>
        <input id="msg-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" maxLength={254} dir="ltr" {...invalidProps(errors, 'email', 'msg')} />
        <FieldError id="msg-email-error" message={errors.email} />
      </div>
      <div>
        <label htmlFor="msg-phone">{t('f_phone')}</label>
        <input id="msg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" maxLength={20} dir="ltr" {...invalidProps(errors, 'phone', 'msg')} />
        <FieldError id="msg-phone-error" message={errors.phone} />
      </div>
    </div>
    <label htmlFor="msg-subject">{t('f_subject')}</label>
    <input id="msg-subject" name="subject" value={form.subject} onChange={handleChange} maxLength={150} {...invalidProps(errors, 'subject', 'msg')} />
    <FieldError id="msg-subject-error" message={errors.subject} />
    <label htmlFor="msg-message">{t('f_message_req')} *</label>
    <textarea id="msg-message" name="message" rows="5" value={form.message} onChange={handleChange} maxLength={2000} {...invalidProps(errors, 'message', 'msg')} />
    <FieldError id="msg-message-error" message={errors.message} />
    {status === 'failed' && <p className="form-error-summary" role="alert">{t('send_failed')}</p>}
    <button type="submit" className="public-submit" disabled={status === 'sending'}>{status === 'sending' ? t('f_sending') : t('f_send')}</button>
  </form>
}
