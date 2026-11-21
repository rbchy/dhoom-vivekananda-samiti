import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkText, checkUrl, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { formatMoney } from '../lib/money'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'
import ImagePicker from '../components/ImagePicker'
import { removeImage, storagePathFromUrl, uploadImage } from '../lib/storage'
import '../admin-directory.css'

// Admin → Honoured Donors: the honour board shown at /donors. Separate from Admin → Donations:
// add a donor here only after they agree to be shown, and choose whether to show the amount and address.
const emptyForm = { name_en: '', name_bn: '', address_en: '', address_bn: '', amount: '', currency: 'BDT', gift_en: '', gift_bn: '', purpose_en: '', purpose_bn: '', donated_on: '', in_memory_of: '', photo_url: '', show_amount: true, show_address: true, consent: false, sort_order: '100', is_published: true }
const notSetUp = 'The Honoured Donors table is not set up yet — run supabase/donors-and-officials.sql once in Supabase → SQL Editor.'

export default function DonorHonoursManagement() {
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  async function loadItems() {
    const { data, error } = await supabase.from('donor_honours').select('*').order('sort_order').order('amount', { ascending: false, nullsFirst: false }).order('donated_on')
    if (error) setMessage(/relation|does not exist|schema cache/i.test(error.message || '') ? notSetUp : describeDbError(error))
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
    const amount = String(form.amount).replace(/,/g, '').trim()
    const found = cleanErrors({
      name_en: checkText(form.name_en, { label: 'Name (English)', required: true, min: 2, max: 150 }),
      name_bn: checkText(form.name_bn, { label: 'Name (Bangla)', max: 150, bengali: true }),
      address_en: checkText(form.address_en, { label: 'Address (English)', max: 300 }),
      address_bn: checkText(form.address_bn, { label: 'Address (Bangla)', max: 300, bengali: true }),
      amount: amount && (!/^\d{1,12}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) ? 'Amount must be a number above 0, with up to 2 decimals.'
        : !amount && !form.gift_en.trim() && !form.gift_bn.trim() ? 'Enter the amount, or describe the gift (land, building…) below.' : '',
      gift_en: checkText(form.gift_en, { label: 'Gift (English)', max: 200 }),
      gift_bn: checkText(form.gift_bn, { label: 'Gift (Bangla)', max: 200, bengali: true }),
      purpose_en: checkText(form.purpose_en, { label: 'Purpose (English)', max: 300 }),
      purpose_bn: checkText(form.purpose_bn, { label: 'Purpose (Bangla)', max: 300, bengali: true }),
      donated_on: form.donated_on && form.donated_on > new Date().toISOString().slice(0, 10) ? 'The date cannot be in the future.' : '',
      in_memory_of: checkText(form.in_memory_of, { label: 'In memory of', max: 150 }),
      photo: errors.photo || '',
      photo_url: photoFile ? '' : checkUrl(form.photo_url, { label: 'Photo link' }),
      consent: form.is_published && !form.consent ? 'Tick "The donor agreed" before showing a donor on the website — or untick "Show on website".' : '',
      sort_order: !/^\d{1,4}$/.test(String(form.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const clean = v => String(v || '').trim() || null
    let uploaded = null
    try {
      let photoUrl = clean(form.photo_url)
      if (photoFile) { setMessage('Uploading photo...'); uploaded = await uploadImage(photoFile, 'donors'); photoUrl = uploaded.url }
      const previous = items.find(i => i.id === editingId)
      const payload = { name_en: form.name_en.trim(), name_bn: clean(form.name_bn), address_en: clean(form.address_en), address_bn: clean(form.address_bn), amount: amount ? Number(amount) : null, currency: form.currency, gift_en: clean(form.gift_en), gift_bn: clean(form.gift_bn), purpose_en: clean(form.purpose_en), purpose_bn: clean(form.purpose_bn), donated_on: form.donated_on || null, in_memory_of: clean(form.in_memory_of), photo_url: photoUrl, show_amount: form.show_amount, show_address: form.show_address, consent: form.consent, sort_order: Number(form.sort_order), is_published: form.is_published }
      const result = editingId ? await db('donor_honours').update(payload).eq('id', editingId) : await db('donor_honours').insert(payload)
      if (result.error) throw result.error
      if (!result.pendingApproval && previous?.photo_url && previous.photo_url !== payload.photo_url && storagePathFromUrl(previous.photo_url)) await removeImage(previous.photo_url)
      setMessage(result.pendingApproval ? 'Sent to the main admin for approval.' : editingId ? 'Updated.' : 'Added.'); resetForm(); await loadItems()
    } catch (error) {
      if (uploaded) await removeImage(uploaded.path)
      setMessage('Error: ' + (describeDbError(error) || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove ${item.name_en} from the honour board? This cannot be undone.`)) return
    const result = await db('donor_honours').delete().eq('id', item.id)
    if (result.error) { setMessage('Error: ' + describeDbError(result.error)); return }
    if (!result.pendingApproval && storagePathFromUrl(item.photo_url)) await removeImage(item.photo_url)
    setMessage(result.pendingApproval ? 'Delete request sent for approval.' : 'Removed.'); if (editingId === item.id) resetForm(); await loadItems()
  }

  function startEdit(item) {
    setEditingId(item.id); setErrors({}); setPhotoFile(null)
    const keep = Object.fromEntries(Object.keys(emptyForm).map(k => [k, item[k] ?? emptyForm[k]]))
    setForm({ ...keep, amount: item.amount != null ? String(item.amount) : '', sort_order: String(item.sort_order) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dirty = Boolean(photoFile) || JSON.stringify(form) !== JSON.stringify(emptyForm)
  const input = (name, label, props = {}) => <div>
    <label htmlFor={`dh-${name}`}>{label}</label>
    {props.rows ? <textarea id={`dh-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'dh')} /> : <input id={`dh-${name}`} name={name} value={form[name]} onChange={handleChange} {...props} {...invalidProps(errors, name, 'dh')} />}
    <FieldError id={`dh-${name}-error`} message={errors[name]} />
  </div>
  const check = (name, label) => <label className="publish-option"><input type="checkbox" name={name} checked={form[name]} onChange={handleChange} {...invalidProps(errors, name, 'dh')} /> {label}</label>

  return <div className="events-management">
    <p className="field-hint">The honour board of the Samiti's major donors, shown at /donors, highest first. This list is separate from Admin → Donations: nothing from there appears on the website by itself. Add a donor only after they (or their family) agree to be shown, and untick "Show amount" or "Show address" if they prefer. The first donor in the order gets the large "Foremost donor" card.</p>
    <form className="event-form" onSubmit={handleSave} noValidate>
      <h3>{editingId ? 'Edit donor / দাতা সম্পাদনা' : 'Add a donor / দাতা যোগ করুন'}</h3>
      <ErrorSummary errors={errors} />
      <div className="form-row">{input('name_en', 'Donor name (English) *', { maxLength: 150, placeholder: 'e.g. Sri … Chowdhury' })}{input('name_bn', 'দাতার নাম (বাংলা)', { maxLength: 150 })}</div>
      <div className="form-row">{input('address_en', 'Address (English)', { maxLength: 300, placeholder: 'Village, upazila, district / city, country' })}{input('address_bn', 'ঠিকানা (বাংলা)', { maxLength: 300 })}</div>
      <div className="form-row">
        {input('amount', 'Amount', { inputMode: 'decimal', maxLength: 16, placeholder: 'e.g. 500000' })}
        <div><label htmlFor="dh-currency">Currency</label><select id="dh-currency" name="currency" value={form.currency} onChange={handleChange}><option value="BDT">BDT ৳</option><option value="USD">USD $</option></select></div>
      </div>
      <div className="form-row">{input('gift_en', 'Gift other than money (English)', { maxLength: 200, placeholder: 'e.g. Land for the Durga Mandir' })}{input('gift_bn', 'অর্থ ছাড়া অন্য দান (বাংলা)', { maxLength: 200, placeholder: 'যেমন দুর্গা মন্দিরের জমি' })}</div>
      <div className="form-row">{input('purpose_en', 'Donated for (English)', { maxLength: 300, placeholder: 'e.g. Construction of the Ramakrishna Mandir' })}{input('purpose_bn', 'দানের উদ্দেশ্য (বাংলা)', { maxLength: 300 })}</div>
      <div className="form-row">{input('donated_on', 'Date of the donation', { type: 'date' })}{input('in_memory_of', 'In memory of (optional)', { maxLength: 150, placeholder: 'e.g. Late … (father)' })}</div>
      <ImagePicker id="dh-photo" label="Photo of the donor (optional) / দাতার ছবি" file={photoFile} onFileChange={file => { setPhotoFile(file); setErrors(p => ({ ...p, photo: '', photo_url: '' })) }} currentUrl={!photoFile && form.photo_url && !checkUrl(form.photo_url, { label: 'x' }) ? form.photo_url : ''} error={errors.photo} onError={problem => setErrors(p => ({ ...p, photo: problem }))} />
      <details className="link-option" open={Boolean(form.photo_url) && !photoFile}>
        <summary>…or paste a photo link instead / অথবা ছবির লিংক দিন</summary>
        {input('photo_url', 'Photo link', { type: 'url', placeholder: 'https://…', disabled: Boolean(photoFile) })}
      </details>
      {input('sort_order', 'Display order (lower comes first; same number → higher amount first)', { inputMode: 'numeric', maxLength: 4 })}
      {check('show_amount', 'Show amount on the website / দানের পরিমাণ দেখান')}
      {check('show_address', 'Show address on the website / ঠিকানা দেখান')}
      {check('consent', 'The donor (or family) agreed to be shown on the website / দাতা সম্মতি দিয়েছেন *')}
      <FieldError id="dh-consent-error" message={errors.consent} />
      {check('is_published', 'Show on website')}
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}
    <div className="events-list">
      {items.length === 0 ? <p>No donors on the honour board yet.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Order</th><th>Donor</th><th>Amount / gift</th><th>Date</th><th>Agreed</th><th>Show</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className={item.is_published && item.consent ? '' : 'row-muted'}>
          <td>{item.sort_order}</td>
          <td>{item.name_en}{item.address_en && <small className="cell-sub">{item.address_en}{!item.show_address && ' (hidden)'}</small>}</td>
          <td>{item.amount != null && <>{formatMoney(item.amount, item.currency)}{!item.show_amount && <small className="cell-sub">amount hidden</small>}</>}{item.gift_en && <small className="cell-sub">{item.gift_en}</small>}</td>
          <td>{item.donated_on}</td>
          <td>{item.consent ? 'Yes' : 'No'}</td>
          <td>{item.is_published && item.consent ? 'Yes' : 'Hidden'}</td>
          <td className="row-actions"><button type="button" onClick={() => startEdit(item)}>Edit</button><button type="button" onClick={() => handleDelete(item)}>Delete</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </div>
}
