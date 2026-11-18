import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db } from '../lib/staff'
import { checkOptionalEmail, checkPhone, checkText, checkUrl, cleanErrors } from '../lib/validation'
import { describeDbError } from '../lib/dbErrors'
import { BackToMainButton, ErrorSummary, FieldError, invalidProps } from '../components/FormHelpers'

const emptySettings = { ticker_en: '', ticker_bn: '', ticker_audio_url: '', bhajan_autoplay: false, bhajan_title_en: '', bhajan_title_bn: '', address_en: '', address_bn: '', map_url: '', temple_phone: '', email: '', panjika_url: '', festival_hours_note_en: '', festival_hours_note_bn: '', facebook_url: '', youtube_url: '', instagram_url: '', whatsapp_url: '', tiktok_url: '' }
const emptyContact = { name: '', role_en: '', role_bn: '', phone: '', email: '', sort_order: '100', is_public: true }

export default function TempleInfoManagement() {
  const [settings, setSettings] = useState(emptySettings)
  const [savedSettings, setSavedSettings] = useState(emptySettings)
  const [settingErrors, setSettingErrors] = useState({})
  const [contacts, setContacts] = useState([])
  const [contact, setContact] = useState(emptyContact)
  const [contactErrors, setContactErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadAll() {
    const [{ data: rows, error }, { data: people, error: peopleError }] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('committee_contacts').select('*').order('sort_order').order('name')
    ])
    if (error || peopleError) { setMessage(describeDbError(error || peopleError)); return }
    const map = Object.fromEntries((rows || []).map(row => [row.key, row]))
    const loaded = {
      ticker_en: map.ticker_message?.value_en || '', ticker_bn: map.ticker_message?.value_bn || '', ticker_audio_url: map.ticker_audio_url?.value_en || '', bhajan_autoplay: map.bhajan_autoplay?.value_en === 'on', bhajan_title_en: map.bhajan_title?.value_en || '', bhajan_title_bn: map.bhajan_title?.value_bn || '',
      address_en: map.address?.value_en || '', address_bn: map.address?.value_bn || '', map_url: map.map_url?.value_en || '',
      temple_phone: map.temple_phone?.value_en || '', email: map.email?.value_en || '', panjika_url: map.panjika_url?.value_en || '',
      festival_hours_note_en: map.festival_hours_note?.value_en || '', festival_hours_note_bn: map.festival_hours_note?.value_bn || '',
      facebook_url: map.facebook_url?.value_en || '', youtube_url: map.youtube_url?.value_en || '', instagram_url: map.instagram_url?.value_en || '', whatsapp_url: map.whatsapp_url?.value_en || '', tiktok_url: map.tiktok_url?.value_en || ''
    }
    setSettings(loaded)
    setSavedSettings(loaded)
    setContacts(people || [])
  }

  useEffect(() => { loadAll() }, [])

  function changeSetting(event) {
    const { name, value, type, checked } = event.target
    setSettings(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setSettingErrors(previous => ({ ...previous, [name]: '' }))
  }

  async function saveSettings(event) {
    event.preventDefault()
    setMessage('')
    const found = cleanErrors({
      ticker_en: checkText(settings.ticker_en, { label: 'Banner message (English)', max: 1000 }),
      ticker_bn: checkText(settings.ticker_bn, { label: 'Banner message (Bangla)', max: 1000, bengali: true }),
      ticker_audio_url: checkUrl(settings.ticker_audio_url, { label: 'Audio link' }) || (settings.bhajan_autoplay && !settings.ticker_audio_url.trim() ? 'Add the song link first, then tick “play when the website opens”.' : ''),
      bhajan_title_en: checkText(settings.bhajan_title_en, { label: 'Bhajan name (English)', max: 120 }),
      bhajan_title_bn: checkText(settings.bhajan_title_bn, { label: 'Bhajan name (Bangla)', max: 120, bengali: true }),
      address_en: checkText(settings.address_en, { label: 'Address (English)', min: 5, max: 300 }),
      address_bn: checkText(settings.address_bn, { label: 'Address (Bangla)', min: 5, max: 300, bengali: true }),
      map_url: checkUrl(settings.map_url, { label: 'Google Maps link' }),
      temple_phone: checkPhone(settings.temple_phone, { label: 'Temple phone' }),
      email: checkOptionalEmail(settings.email),
      panjika_url: checkUrl(settings.panjika_url, { label: 'Panjika link' }),
      festival_hours_note_en: checkText(settings.festival_hours_note_en, { label: 'Festival hours note (English)', max: 300 }),
      festival_hours_note_bn: checkText(settings.festival_hours_note_bn, { label: 'Festival hours note (Bangla)', max: 300, bengali: true }),
      facebook_url: checkUrl(settings.facebook_url, { label: 'Facebook link' }),
      youtube_url: checkUrl(settings.youtube_url, { label: 'YouTube link' }),
      instagram_url: checkUrl(settings.instagram_url, { label: 'Instagram link' }),
      whatsapp_url: checkPhone(settings.whatsapp_url, { label: 'WhatsApp number' }),
      tiktok_url: checkUrl(settings.tiktok_url, { label: 'TikTok link' })
    })
    setSettingErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const clean = value => value.trim() || null
    const rows = [
      { key: 'ticker_message', value_en: clean(settings.ticker_en), value_bn: clean(settings.ticker_bn) },
      { key: 'ticker_audio_url', value_en: clean(settings.ticker_audio_url), value_bn: null },
      { key: 'bhajan_autoplay', value_en: settings.bhajan_autoplay ? 'on' : null, value_bn: null },
      { key: 'bhajan_title', value_en: clean(settings.bhajan_title_en), value_bn: clean(settings.bhajan_title_bn) },
      { key: 'address', value_en: clean(settings.address_en), value_bn: clean(settings.address_bn) },
      { key: 'map_url', value_en: clean(settings.map_url), value_bn: null },
      { key: 'temple_phone', value_en: clean(settings.temple_phone), value_bn: null },
      { key: 'email', value_en: clean(settings.email), value_bn: null },
      { key: 'panjika_url', value_en: clean(settings.panjika_url), value_bn: null },
      { key: 'festival_hours_note', value_en: clean(settings.festival_hours_note_en), value_bn: clean(settings.festival_hours_note_bn) },
      { key: 'facebook_url', value_en: clean(settings.facebook_url), value_bn: null },
      { key: 'youtube_url', value_en: clean(settings.youtube_url), value_bn: null },
      { key: 'instagram_url', value_en: clean(settings.instagram_url), value_bn: null },
      { key: 'whatsapp_url', value_en: clean(settings.whatsapp_url), value_bn: null },
      { key: 'tiktok_url', value_en: clean(settings.tiktok_url), value_bn: null }
    ].map(row => ({ ...row, updated_at: new Date().toISOString() }))
    const { error } = await db('site_settings').upsert(rows, { onConflict: 'key' })
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Temple information saved.'); setSavedSettings(settings) }
    setSaving(false)
  }

  function changeContact(event) {
    const { name, value, type, checked } = event.target
    setContact(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setContactErrors(previous => ({ ...previous, [name]: '' }))
  }

  function resetContact() { setContact(emptyContact); setEditingId(null); setContactErrors({}) }

  async function saveContact(event) {
    event.preventDefault()
    setMessage('')
    const digits = contact.phone.replace(/\D/g, '')
    const duplicate = digits && contacts.find(c => c.id !== editingId && (c.phone || '').replace(/\D/g, '') === digits)
    const found = cleanErrors({
      name: checkText(contact.name, { label: 'Name', required: true, min: 2, max: 100 }),
      role_en: checkText(contact.role_en, { label: 'Role (English)', max: 80 }),
      role_bn: checkText(contact.role_bn, { label: 'Role (Bangla)', max: 80, bengali: true }),
      phone: (!contact.phone.trim() && !contact.email.trim() ? 'Enter a phone number or an email.' : checkPhone(contact.phone)) || (duplicate ? `This phone number already belongs to ${duplicate.name}.` : ''),
      email: checkOptionalEmail(contact.email),
      sort_order: !/^\d{1,4}$/.test(String(contact.sort_order).trim()) ? 'Display order must be a whole number from 0 to 9999.' : ''
    })
    setContactErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    const payload = {
      name: contact.name.trim(), role_en: contact.role_en.trim() || null, role_bn: contact.role_bn.trim() || null,
      phone: contact.phone.trim() || null, email: contact.email.trim() || null, sort_order: Number(contact.sort_order), is_public: contact.is_public
    }
    const result = editingId ? await db('committee_contacts').update(payload).eq('id', editingId) : await db('committee_contacts').insert(payload)
    if (result.error) setMessage('Error: ' + describeDbError(result.error))
    else { setMessage(editingId ? 'Contact updated.' : 'Contact added.'); resetContact(); await loadAll() }
    setSaving(false)
  }

  async function deleteContact(item) {
    if (!window.confirm(`Remove ${item.name} from the committee contacts?`)) return
    const { error } = await db('committee_contacts').delete().eq('id', item.id)
    if (error) setMessage('Error: ' + describeDbError(error))
    else { setMessage('Contact removed.'); if (editingId === item.id) resetContact(); await loadAll() }
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings) || JSON.stringify(contact) !== JSON.stringify(emptyContact)
  const field = (name, label, props = {}) => <>
    <label htmlFor={`ti-${name}`}>{label}</label>
    <input id={`ti-${name}`} name={name} value={settings[name]} onChange={changeSetting} {...props} {...invalidProps(settingErrors, name, 'ti')} />
    <FieldError id={`ti-${name}-error`} message={settingErrors[name]} />
  </>

  return <div className="events-management">
    <h3>Temple Information / মন্দিরের তথ্য</h3>
    <p className="field-hint">Shown in the Contact and Worship sections of the website. Leave a field empty to hide it.</p>
    <form className="event-form" onSubmit={saveSettings} noValidate>
      <ErrorSummary errors={settingErrors} />
      <div className="form-row">
        <div><label htmlFor="ti-ticker_en">Banner message (English) — scrolls over the top of the banner photo</label><textarea id="ti-ticker_en" name="ticker_en" rows="3" value={settings.ticker_en} onChange={changeSetting} maxLength={1000} placeholder="One line per row, e.g. the lines of 'Ramakrishna Sharanam…'" {...invalidProps(settingErrors, 'ticker_en', 'ti')} /><FieldError id="ti-ticker_en-error" message={settingErrors.ticker_en} /></div>
        <div><label htmlFor="ti-ticker_bn">ব্যানারের বার্তা (বাংলা)</label><textarea id="ti-ticker_bn" name="ticker_bn" rows="3" value={settings.ticker_bn} onChange={changeSetting} maxLength={1000} placeholder="প্রতিটি লাইন আলাদা সারিতে লিখুন" {...invalidProps(settingErrors, 'ticker_bn', 'ti')} /><FieldError id="ti-ticker_bn-error" message={settingErrors.ticker_bn} /></div>
      </div>
      <small className="field-hint">Leave both empty to hide the banner message. Each line is separated by ✦ when it scrolls.</small>
      {field('ticker_audio_url', 'Song audio link (optional .mp3 — only a recording you have permission to use)', { type: 'url', placeholder: 'https://…/ramakrishna-sharanam.mp3' })}
      <label className="publish-option"><input type="checkbox" name="bhajan_autoplay" checked={settings.bhajan_autoplay} onChange={changeSetting} /> Play this song when the website opens / সাইট খুললেই এই ভজন বাজবে</label>
      <p className="field-hint">The song starts softly when the home page opens and plays once. Most browsers keep sound off until the visitor first touches the page, so it may start on the first tap. Visitors can pause it any time with the button at the bottom right.</p>
      <div className="form-row"><div>{field('bhajan_title_en', 'Bhajan name shown on the player (English)', { maxLength: 120, placeholder: 'e.g. Khandana Bhava Bandhana' })}</div><div>{field('bhajan_title_bn', 'প্লেয়ারে ভজনের নাম (বাংলা)', { maxLength: 120, placeholder: 'যেমন খণ্ডন ভব বন্ধন' })}</div></div>
      <div className="form-row"><div>{field('address_en', 'Address (English)', { maxLength: 300 })}</div><div>{field('address_bn', 'ঠিকানা (বাংলা)', { maxLength: 300 })}</div></div>
      {field('map_url', 'Google Maps link (for "Get directions")', { type: 'url', placeholder: 'https://maps.google.com/?q=...' })}
      <div className="form-row"><div>{field('temple_phone', 'Temple phone', { type: 'tel', maxLength: 20 })}</div><div>{field('email', 'Temple email', { type: 'email', maxLength: 254 })}</div></div>
      {field('panjika_url', 'Bengali Panjika link', { type: 'url' })}
      <div className="form-row"><div>{field('festival_hours_note_en', 'Festival-day hours note (English)', { maxLength: 300, placeholder: 'Hours may vary on festival days.' })}</div><div>{field('festival_hours_note_bn', 'উৎসবের দিনের সময় (বাংলা)', { maxLength: 300 })}</div></div>
      <h4 className="social-admin-heading">Social media / সোশ্যাল মিডিয়া</h4>
      <small className="field-hint">Paste the full page link. A button appears on the website (Contact section and footer) only for the links you fill in.</small>
      <div className="form-row"><div>{field('facebook_url', 'Facebook page link', { type: 'url', placeholder: 'https://www.facebook.com/your-page' })}</div><div>{field('youtube_url', 'YouTube channel link', { type: 'url', placeholder: 'https://www.youtube.com/@your-channel' })}</div></div>
      <div className="form-row"><div>{field('instagram_url', 'Instagram link', { type: 'url', placeholder: 'https://www.instagram.com/your-account' })}</div><div>{field('tiktok_url', 'TikTok link', { type: 'url', placeholder: 'https://www.tiktok.com/@your-account' })}</div></div>
      {field('whatsapp_url', 'WhatsApp number (with country code)', { type: 'tel', maxLength: 20, placeholder: '+880 1XXX-XXXXXX' })}
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Temple Information'}</button>
        <BackToMainButton dirty={dirty} />
      </div>
    </form>
    {message && <p className="event-message" role="status">{message}</p>}

    <h3>{editingId ? 'Edit Committee Contact' : 'Committee Contacts / কমিটির যোগাযোগ'}</h3>
    <form className="event-form" onSubmit={saveContact} noValidate>
      <ErrorSummary errors={contactErrors} />
      <label htmlFor="cc-name">Name / নাম *</label>
      <input id="cc-name" name="name" value={contact.name} onChange={changeContact} maxLength={100} {...invalidProps(contactErrors, 'name', 'cc')} />
      <FieldError id="cc-name-error" message={contactErrors.name} />
      <div className="form-row">
        <div><label htmlFor="cc-role_en">Role (English)</label><input id="cc-role_en" name="role_en" value={contact.role_en} onChange={changeContact} placeholder="e.g. President, Secretary, Treasurer" maxLength={80} {...invalidProps(contactErrors, 'role_en', 'cc')} /><FieldError id="cc-role_en-error" message={contactErrors.role_en} /></div>
        <div><label htmlFor="cc-role_bn">পদ (বাংলা)</label><input id="cc-role_bn" name="role_bn" value={contact.role_bn} onChange={changeContact} placeholder="যেমন: সভাপতি" maxLength={80} {...invalidProps(contactErrors, 'role_bn', 'cc')} /><FieldError id="cc-role_bn-error" message={contactErrors.role_bn} /></div>
      </div>
      <div className="form-row">
        <div><label htmlFor="cc-phone">Phone / ফোন</label><input id="cc-phone" name="phone" type="tel" value={contact.phone} onChange={changeContact} maxLength={20} {...invalidProps(contactErrors, 'phone', 'cc')} /><FieldError id="cc-phone-error" message={contactErrors.phone} /></div>
        <div><label htmlFor="cc-email">Email / ইমেইল</label><input id="cc-email" name="email" type="email" value={contact.email} onChange={changeContact} maxLength={254} {...invalidProps(contactErrors, 'email', 'cc')} /><FieldError id="cc-email-error" message={contactErrors.email} /></div>
      </div>
      <label htmlFor="cc-sort_order">Display Order</label>
      <input id="cc-sort_order" name="sort_order" inputMode="numeric" value={contact.sort_order} onChange={changeContact} maxLength={4} {...invalidProps(contactErrors, 'sort_order', 'cc')} />
      <FieldError id="cc-sort_order-error" message={contactErrors.sort_order} />
      <label className="publish-option"><input type="checkbox" name="is_public" checked={contact.is_public} onChange={changeContact} /> Show on website</label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{editingId ? 'Update Contact' : 'Add Contact'}</button>
        {editingId && <button type="button" onClick={resetContact}>Cancel</button>}
      </div>
    </form>
    <div className="events-list">
      {contacts.length === 0 ? <p>No committee contacts yet.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Show</th><th>Actions</th></tr></thead>
        <tbody>{contacts.map(item => <tr key={item.id} className={item.is_public ? '' : 'row-muted'}>
          <td>{item.sort_order}</td><td>{item.name}</td><td>{item.role_en || '—'}{item.role_bn && <small className="cell-sub">{item.role_bn}</small>}</td>
          <td>{item.phone || '—'}</td><td>{item.email || '—'}</td><td>{item.is_public ? 'Yes' : 'Hidden'}</td>
          <td className="row-actions"><button type="button" onClick={() => { setEditingId(item.id); setContactErrors({}); setContact({ name: item.name, role_en: item.role_en || '', role_bn: item.role_bn || '', phone: item.phone || '', email: item.email || '', sort_order: String(item.sort_order), is_public: item.is_public }) }}>Edit</button><button type="button" onClick={() => deleteContact(item)}>Delete</button></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </div>
}
