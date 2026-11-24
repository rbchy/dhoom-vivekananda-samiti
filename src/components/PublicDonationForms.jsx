import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CURRENCIES, PAYMENT_INFO, monthStart } from '../lib/money'
import { checkAmount, checkOptionalEmail, checkPhone, checkText, checkTransactionRef, cleanErrors, todayISO } from '../lib/validation'
import { FieldError, invalidProps } from './FormHelpers'

const ONLINE_METHODS = ['bkash', 'nagad', 'rocket', 'bank', 'card', 'other']
const METHOD_NAMES = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' }

function methodText(code, t) {
  if (METHOD_NAMES[code]) return METHOD_NAMES[code]
  return t(`m_${code}`)
}

function availableMethods() {
  return ONLINE_METHODS.filter(code => code !== 'card' || PAYMENT_INFO.cardUrl)
}

// Monthly subscription: collected like any gift of money — in cash (at the office or to the collector),
// bKash, Nagad, Rocket or bank (and card when a payment link is set)
const SUB_METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'bank']
function subscriptionMethods() {
  return [...SUB_METHODS, ...(PAYMENT_INFO.cardUrl ? ['card'] : [])]
}

function PaymentDetails({ method, t }) {
  const value = PAYMENT_INFO[method]
  if (method === 'card') {
    return <div className="pay-box"><a className="pay-card-link" href={PAYMENT_INFO.cardUrl} target="_blank" rel="noopener noreferrer">{t('pay_card_btn')} ↗</a><small>{t('pay_card_note')}</small></div>
  }
  if (method === 'other') return null
  if (method === 'cash') return <div className="pay-box"><strong>{t('pay_details')}: {methodText(method, t)}</strong><p className="pay-value">{t('pay_cash_note')}</p></div>
  return <div className="pay-box"><strong>{t('pay_details')}: {methodText(method, t)}</strong>{value ? <p className="pay-value">{value}</p> : <p className="pay-missing">{t('pay_not_set')}</p>}</div>
}

const emptyDonation = { donor_name: '', phone: '', email: '', amount: '', currency: 'BDT', method: 'bkash', transaction_ref: '', purpose: '', notes: '' }

export function OnlineDonationForm({ t, language }) {
  const [form, setForm] = useState(emptyDonation)
  const [errors, setErrors] = useState({})
  const [catalog, setCatalog] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    supabase.from('event_catalog').select('id, name_en, name_bn').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCatalog(data || []))
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function validate() {
    const found = cleanErrors({
      donor_name: checkText(form.donor_name, { label: 'x', required: true, min: 2, max: 100 }) ? t('err_name') : '',
      phone: checkPhone(form.phone, { required: true }) ? t('err_phone') : '',
      email: checkOptionalEmail(form.email) ? t('err_email') : '',
      amount: checkAmount(form.amount) ? t('err_amount') : '',
      method: !availableMethods().includes(form.method) ? t('err_method') : '',
      transaction_ref: checkTransactionRef(form.transaction_ref, { required: form.method !== 'other' }) ? t('err_txn') : '',
      notes: form.notes.length > 500 ? t('err_long') : ''
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending' || !validate()) return
    setStatus('sending')
    const picked = catalog.find(item => item.id === form.purpose)
    const { error } = await supabase.from('donations').insert({
      channel: 'online',
      status: 'pending',
      donor_name: form.donor_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      amount: Number(form.amount),
      currency: form.currency,
      method: form.method,
      transaction_ref: form.transaction_ref.trim() || null,
      purpose: picked ? picked.name_en : 'General temple fund',
      event_catalog_id: picked ? picked.id : null,
      donated_on: todayISO(),
      notes: form.notes.trim() || null
    })
    if (error) { console.error(error); setStatus('failed'); return }
    setForm(emptyDonation)
    setStatus('done')
  }

  if (status === 'done') return <p className="form-success" role="status">{t('donation_thanks')}</p>

  const name = item => (language === 'bn' ? item.name_bn : item.name_en)

  return <form className="public-form" onSubmit={handleSubmit} noValidate>
    <p className="public-form-intro">{t('donation_intro')}</p>
    {Object.values(errors).some(Boolean) && <p className="form-error-summary" role="alert">{t('fix_fields')}</p>}

    <label htmlFor="don-donor_name">{t('f_name')} *</label>
    <input id="don-donor_name" name="donor_name" value={form.donor_name} onChange={handleChange} autoComplete="name" maxLength={100} {...invalidProps(errors, 'donor_name', 'don')} />
    <FieldError id="don-donor_name-error" message={errors.donor_name} />

    <div className="form-row">
      <div>
        <label htmlFor="don-phone">{t('f_phone')} *</label>
        <input id="don-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" maxLength={20} dir="ltr" {...invalidProps(errors, 'phone', 'don')} />
        <FieldError id="don-phone-error" message={errors.phone} />
      </div>
      <div>
        <label htmlFor="don-email">{t('f_email')}</label>
        <input id="don-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" maxLength={254} dir="ltr" {...invalidProps(errors, 'email', 'don')} />
        <FieldError id="don-email-error" message={errors.email} />
      </div>
    </div>

    <div className="form-row">
      <div>
        <label htmlFor="don-amount">{t('f_amount')} *</label>
        <input id="don-amount" name="amount" inputMode="decimal" value={form.amount} onChange={handleChange} maxLength={12} dir="ltr" {...invalidProps(errors, 'amount', 'don')} />
        <FieldError id="don-amount-error" message={errors.amount} />
      </div>
      <div>
        <label htmlFor="don-currency">{t('f_currency')}</label>
        <select id="don-currency" name="currency" value={form.currency} onChange={handleChange}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
      </div>
    </div>

    <label htmlFor="don-purpose">{t('f_purpose')}</label>
    <select id="don-purpose" name="purpose" value={form.purpose} onChange={handleChange}>
      <option value="">{t('f_purpose_general')}</option>
      {catalog.map(item => <option key={item.id} value={item.id}>{name(item)}</option>)}
    </select>

    <label htmlFor="don-method">{t('f_method')} *</label>
    <select id="don-method" name="method" value={form.method} onChange={handleChange} {...invalidProps(errors, 'method', 'don')}>
      {availableMethods().map(code => <option key={code} value={code}>{methodText(code, t)}</option>)}
    </select>
    <FieldError id="don-method-error" message={errors.method} />
    <PaymentDetails method={form.method} t={t} />

    <label htmlFor="don-transaction_ref">{t('f_txn')} {form.method !== 'other' && '*'}</label>
    <input id="don-transaction_ref" name="transaction_ref" value={form.transaction_ref} onChange={handleChange} maxLength={60} dir="ltr" {...invalidProps(errors, 'transaction_ref', 'don')} />
    <FieldError id="don-transaction_ref-error" message={errors.transaction_ref} />

    <label htmlFor="don-notes">{t('f_message')}</label>
    <textarea id="don-notes" name="notes" rows="3" value={form.notes} onChange={handleChange} maxLength={500} {...invalidProps(errors, 'notes', 'don')} />
    <FieldError id="don-notes-error" message={errors.notes} />

    {status === 'failed' && <p className="form-error-summary" role="alert">{t('send_failed')}</p>}
    <button type="submit" className="public-submit" disabled={status === 'sending'}>{status === 'sending' ? t('f_sending') : t('f_submit_donation')}</button>
  </form>
}

const emptySubscription = { donor_name: '', phone: '', email: '', address: '', monthly_amount: '', currency: 'BDT', payment_method: 'bkash', start_month: monthStart().slice(0, 7), notes: '' }

export function SubscriptionForm({ t }) {
  const [form, setForm] = useState(emptySubscription)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const thisMonth = monthStart().slice(0, 7)

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: '' }))
  }

  function validate() {
    const found = cleanErrors({
      donor_name: checkText(form.donor_name, { label: 'x', required: true, min: 2, max: 100 }) ? t('err_name') : '',
      phone: checkPhone(form.phone, { required: true }) ? t('err_phone') : '',
      email: checkOptionalEmail(form.email) ? t('err_email') : '',
      address: form.address.length > 300 ? t('err_long') : '',
      monthly_amount: checkAmount(form.monthly_amount, { max: 1000000 }) ? t('err_amount') : '',
      payment_method: !subscriptionMethods().includes(form.payment_method) ? t('err_method') : '',
      start_month: !/^\d{4}-\d{2}$/.test(form.start_month) || form.start_month < thisMonth ? t('err_start') : '',
      notes: form.notes.length > 500 ? t('err_long') : ''
    })
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending' || !validate()) return
    setStatus('sending')
    const { error } = await supabase.from('subscriptions').insert({
      donor_name: form.donor_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      monthly_amount: Number(form.monthly_amount),
      currency: form.currency,
      payment_method: form.payment_method,
      start_month: `${form.start_month}-01`,
      status: 'pending',
      source: 'online',
      notes: form.notes.trim() || null
    })
    if (error) { console.error(error); setStatus('failed'); return }
    setForm(emptySubscription)
    setStatus('done')
  }

  if (status === 'done') return <p className="form-success" role="status">{t('sub_thanks')}</p>

  return <form className="public-form" onSubmit={handleSubmit} noValidate>
    <p className="public-form-intro">{t('sub_intro')}</p>
    {Object.values(errors).some(Boolean) && <p className="form-error-summary" role="alert">{t('fix_fields')}</p>}

    <label htmlFor="sub-donor_name">{t('f_name')} *</label>
    <input id="sub-donor_name" name="donor_name" value={form.donor_name} onChange={handleChange} autoComplete="name" maxLength={100} {...invalidProps(errors, 'donor_name', 'sub')} />
    <FieldError id="sub-donor_name-error" message={errors.donor_name} />

    <div className="form-row">
      <div>
        <label htmlFor="sub-phone">{t('f_phone')} *</label>
        <input id="sub-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" maxLength={20} dir="ltr" {...invalidProps(errors, 'phone', 'sub')} />
        <FieldError id="sub-phone-error" message={errors.phone} />
      </div>
      <div>
        <label htmlFor="sub-email">{t('f_email')}</label>
        <input id="sub-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" maxLength={254} dir="ltr" {...invalidProps(errors, 'email', 'sub')} />
        <FieldError id="sub-email-error" message={errors.email} />
      </div>
    </div>

    <label htmlFor="sub-address">{t('f_address')}</label>
    <input id="sub-address" name="address" value={form.address} onChange={handleChange} autoComplete="street-address" maxLength={300} {...invalidProps(errors, 'address', 'sub')} />
    <FieldError id="sub-address-error" message={errors.address} />

    <div className="form-row">
      <div>
        <label htmlFor="sub-monthly_amount">{t('f_monthly_amount')} *</label>
        <input id="sub-monthly_amount" name="monthly_amount" inputMode="decimal" value={form.monthly_amount} onChange={handleChange} maxLength={10} dir="ltr" {...invalidProps(errors, 'monthly_amount', 'sub')} />
        <FieldError id="sub-monthly_amount-error" message={errors.monthly_amount} />
      </div>
      <div>
        <label htmlFor="sub-currency">{t('f_currency')}</label>
        <select id="sub-currency" name="currency" value={form.currency} onChange={handleChange}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
      </div>
    </div>

    <div className="form-row">
      <div>
        <label htmlFor="sub-payment_method">{t('f_method')} *</label>
        <select id="sub-payment_method" name="payment_method" value={form.payment_method} onChange={handleChange} {...invalidProps(errors, 'payment_method', 'sub')}>
          {subscriptionMethods().map(code => <option key={code} value={code}>{methodText(code, t)}</option>)}
        </select>
        <FieldError id="sub-payment_method-error" message={errors.payment_method} />
      </div>
      <div>
        <label htmlFor="sub-start_month">{t('f_start_month')} *</label>
        <input id="sub-start_month" name="start_month" type="month" min={thisMonth} value={form.start_month} onChange={handleChange} {...invalidProps(errors, 'start_month', 'sub')} />
        <FieldError id="sub-start_month-error" message={errors.start_month} />
      </div>
    </div>
    <PaymentDetails method={form.payment_method} t={t} />
    <p className="field-hint">{t('sub_collect_note')}</p>

    <label htmlFor="sub-notes">{t('f_message')}</label>
    <textarea id="sub-notes" name="notes" rows="3" value={form.notes} onChange={handleChange} maxLength={500} {...invalidProps(errors, 'notes', 'sub')} />
    <FieldError id="sub-notes-error" message={errors.notes} />

    {status === 'failed' && <p className="form-error-summary" role="alert">{t('send_failed')}</p>}
    <button type="submit" className="public-submit" disabled={status === 'sending'}>{status === 'sending' ? t('f_sending') : t('f_submit_sub')}</button>
  </form>
}
