import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { slugify } from '../lib/finance'
import { ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const empty = { head_type: 'income', name_en: '', name_bn: '', code: '', sort_order: '100', is_active: true }

export default function AccountHeadsManager({ heads, usedCodes, onChanged }) {
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const builtin = heads.some(h => h.builtin)

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm(previous => {
      const next = { ...previous, [name]: type === 'checkbox' ? checked : value }
      if (name === 'name_en' && !editingId) next.code = slugify(value)
      return next
    })
    setErrors(previous => ({ ...previous, [name]: '', code: name === 'name_en' ? '' : previous.code }))
  }

  function reset() { setForm(empty); setEditingId(null); setErrors({}) }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    const sameType = heads.filter(h => h.head_type === form.head_type && h.id !== editingId)
    const found = cleanErrors({
      name_en: checkText(form.name_en, { label: 'Head name (English)', required: true, min: 2, max: 80 }) || (sameType.some(h => (h.name_en || '').trim().toLowerCase() === form.name_en.trim().toLowerCase()) ? 'A head with this name already exists.' : ''),
      name_bn: checkText(form.name_bn, { label: 'Head name (Bangla)', max: 80, bengali: true }),
      code: !/^[a-z0-9_]{2,40}$/.test(form.code) ? 'Code must be 2–40 lowercase letters, digits or _.' : sameType.some(h => h.code === form.code) ? 'This code is already used.' : '',
      sort_order: !/^\d{1,4}$/.test(String(form.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const payload = { head_type: form.head_type, code: form.code, name_en: form.name_en.trim(), name_bn: form.name_bn.trim() || null, sort_order: Number(form.sort_order), is_active: form.is_active }
    const result = editingId
      ? await db('account_heads').update({ name_en: payload.name_en, name_bn: payload.name_bn, sort_order: payload.sort_order, is_active: payload.is_active }).eq('id', editingId)
      : await db('account_heads').insert(payload)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(editingId ? 'Head updated.' : 'Head added.'); reset(); await onChanged() }
    setSaving(false)
  }

  async function handleDelete(head) {
    if (usedCodes.has(`${head.head_type}|${head.code}`)) { setMessage(`"${head.name_en}" is used in entries, so it cannot be deleted. Untick "Active" to hide it instead.`); return }
    if (!window.confirm(`Delete the head "${head.name_en}"?`)) return
    const { error } = await db('account_heads').delete().eq('id', head.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Head deleted.'); await onChanged() }
  }

  return <div>
    {builtin && <p className="form-error-summary">Showing the built-in heads. Run supabase/site-extras-schema.sql to add, rename or hide heads.</p>}
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit Head' : 'Add Income / Expenditure Head / খাত যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">
        <div><label htmlFor="head-type">Type / ধরন *</label><select id="head-type" name="head_type" value={form.head_type} onChange={handleChange} disabled={Boolean(editingId)}><option value="income">Income head / আয়ের খাত</option><option value="expense">Expenditure head / ব্যয়ের খাত</option></select></div>
        <div><label htmlFor="head-sort_order">Display Order</label><input id="head-sort_order" name="sort_order" inputMode="numeric" value={form.sort_order} onChange={handleChange} maxLength={4} {...invalidProps(errors, 'sort_order', 'head')} /><FieldError id="head-sort_order-error" message={errors.sort_order} /></div>
      </div>
      <div className="form-row">
        <div><label htmlFor="head-name_en">Head Name (English) *</label><input id="head-name_en" name="name_en" value={form.name_en} onChange={handleChange} placeholder="e.g. Durga Puja chanda" maxLength={80} {...invalidProps(errors, 'name_en', 'head')} /><FieldError id="head-name_en-error" message={errors.name_en} /></div>
        <div><label htmlFor="head-name_bn">খাতের নাম (বাংলা)</label><input id="head-name_bn" name="name_bn" value={form.name_bn} onChange={handleChange} placeholder="যেমন: দুর্গাপূজার চাঁদা" maxLength={80} {...invalidProps(errors, 'name_bn', 'head')} /><FieldError id="head-name_bn-error" message={errors.name_bn} /></div>
      </div>
      <label htmlFor="head-code">Code (made automatically)</label>
      <input id="head-code" name="code" value={form.code} onChange={handleChange} disabled={Boolean(editingId)} maxLength={40} {...invalidProps(errors, 'code', 'head')} />
      <FieldError id="head-code-error" message={errors.code} />
      <label className="publish-option"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active (show in entry forms)</label>
      <div className="form-actions">
        <button type="submit" disabled={saving || builtin}>{editingId ? 'Update Head' : 'Add Head'}</button>
        {editingId && <button type="button" onClick={reset}>Cancel</button>}
      </div>
      {message && <p className="event-message" role="status">{message}</p>}
    </form>
    <div className="report-grid">
      {['income', 'expense'].map(type => <div key={type}>
        <h4>{type === 'income' ? 'Income heads / আয়ের খাত' : 'Expenditure heads / ব্যয়ের খাত'}</h4>
        <table className="admin-table compact"><tbody>{heads.filter(h => h.head_type === type).sort((a, b) => a.sort_order - b.sort_order).map(head => <tr key={head.id} className={head.is_active ? '' : 'row-muted'}>
          <td>{head.label}<small className="cell-sub">{head.code}{head.is_active ? '' : ' · hidden'}</small></td>
          <td className="row-actions">{!head.builtin && <><button type="button" onClick={() => { setEditingId(head.id); setErrors({}); setForm({ head_type: head.head_type, name_en: head.name_en, name_bn: head.name_bn || '', code: head.code, sort_order: String(head.sort_order), is_active: head.is_active }) }}>Edit</button><button type="button" onClick={() => handleDelete(head)}>Delete</button></>}</td>
        </tr>)}</tbody></table>
      </div>)}
    </div>
  </div>
}
