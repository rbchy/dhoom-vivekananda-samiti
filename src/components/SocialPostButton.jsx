import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCurrentStaffRole } from '../lib/staff'
import { shareText } from '../lib/share'

// Main admin only: post one event / announcement to the Facebook Page and Instagram
// through the social-post Edge Function (see docs/SOCIAL-AUTOPOST.md).
// kind: 'event' | 'notice'
export default function SocialPostButton({ kind, item }) {
  const [open, setOpen] = useState(false)
  const [targets, setTargets] = useState({ facebook: true, instagram: true })
  const [language, setLanguage] = useState('both')
  const [force, setForce] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])

  async function loadHistory() {
    const { data } = await supabase.from('social_posts').select('target, status, error, created_at')
      .eq('kind', kind).eq('item_id', item.id).order('created_at', { ascending: false }).limit(10)
    setHistory(data || [])
  }

  useEffect(() => { if (open) loadHistory() }, [open])

  if (getCurrentStaffRole() !== 'admin') return null

  const posted = target => history.some(h => h.target === target && h.status === 'posted')
  const unpublished = item.is_published === false

  async function post() {
    const chosen = Object.keys(targets).filter(key => targets[key])
    if (chosen.length === 0) { setMessage('Choose Facebook, Instagram or both.'); return }
    if (!window.confirm(`Post "${item.title_en || item.title_bn}" to ${chosen.join(' and ')} now? Everyone following the page will see it.`)) return
    setBusy(true); setMessage('')
    const { data, error } = await supabase.functions.invoke('social-post', { body: { kind, id: item.id, targets: chosen, language, force } })
    setBusy(false)
    if (error && !data) {
      setMessage(`Could not reach the posting service: ${error.message}. Is the social-post function deployed? (docs/SOCIAL-AUTOPOST.md)`)
      return
    }
    if (data?.error) { setMessage(`Error: ${data.error}`); return }
    const lines = (data?.results || []).map(r => `${r.target}: ${r.status === 'posted' ? '✅ posted' : r.status === 'skipped' ? '⏭️ skipped' : '❌ ' + r.error}${r.status === 'skipped' ? ` — ${r.error}` : ''}`)
    setMessage(lines.join(' · '))
    await loadHistory()
  }

  return <>
    <button type="button" onClick={() => setOpen(!open)} title="Post to the Facebook Page and Instagram">
      📣 {open ? 'Close' : 'Facebook / Instagram'}
    </button>
    {open && <div className="social-post-panel" role="group" aria-label="Post to social media">
      {unpublished && <p className="event-message">Publish this on the website first — only published posts can be shared.</p>}
      <div className="social-post-options">
        <label><input type="checkbox" checked={targets.facebook} onChange={e => setTargets({ ...targets, facebook: e.target.checked })} /> Facebook Page {posted('facebook') && <span className="badge badge-verified">posted</span>}</label>
        <label><input type="checkbox" checked={targets.instagram} onChange={e => setTargets({ ...targets, instagram: e.target.checked })} /> Instagram {posted('instagram') && <span className="badge badge-verified">posted</span>}</label>
        <select aria-label="Language" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="both">বাংলা + English</option>
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
        <label><input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} /> Post again</label>
      </div>
      <details>
        <summary>Preview text</summary>
        <pre className="social-post-preview">{shareText(kind, item, language)}</pre>
      </details>
      <p className="form-hint">Instagram needs a JPEG photo; without one it uses the Belur Math picture. Instagram allows 50 posts a day.</p>
      <button type="button" disabled={busy || unpublished} onClick={post}>{busy ? 'Posting…' : 'Post now / এখনই পোস্ট করুন'}</button>
      {message && <p className="event-message" role="status">{message}</p>}
      {history.length > 0 && <ul className="social-post-history">
        {history.map((h, i) => <li key={i}>{new Date(h.created_at).toLocaleString()} — {h.target}: {h.status === 'posted' ? '✅' : `❌ ${h.error || ''}`}</li>)}
      </ul>}
    </div>}
  </>
}
