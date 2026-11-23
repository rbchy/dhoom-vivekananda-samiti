import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ORGANISATIONS } from '../i18n-org'
import { RECEIPT_TYPES, intlPhone, loadDeliveries, sendReceipt } from '../lib/receipts'
import { METHODS, SAMITI, amountFigure, amountInWords, bnDate, bnDigits, donationReceiptNo, incomeReceiptNo, monthBn, receiptText, subscriptionReceiptNo } from '../../supabase/functions/send-receipt/receipt-text.js'
import '../receipt.css'

// Money receipt (মানি রসিদ) of Dhoom Vivekananda Samiti and its institutions.
// One design, two uses:
//   /admin/receipt?type=donation|subscription|income&id=<id> → a filled receipt for one earning: view, print/PDF,
//                                                 and send to the donor by e-mail, SMS or WhatsApp
//   /admin/receipt?blank=1&from=1&count=100   → blank receipts for a printed receipt book, 2 per A4 page
// Each receipt is A5 landscape: a counterfoil (মুড়ি) kept by the Samiti, and the receipt given to the donor.

// The Samiti's general fund first, then every institution under it
const FUNDS = [{ id: 'samiti', name_bn: 'সমিতি (সাধারণ তহবিল)' }, ...ORGANISATIONS.map(o => ({ id: o.id, name_bn: o.name_bn }))]

// Best guess of the fund from the donation's purpose (the admin can change it before printing)
function guessFund(purpose = '') {
  const text = purpose.toLowerCase()
  const hit = ORGANISATIONS.find(o => [o.name_bn, o.name_en, o.id].some(n => n && text.includes(String(n).toLowerCase().replace(/^(sree sree|শ্রীশ্রী)\s*/, ''))))
  return hit ? hit.id : 'samiti'
}

function Box({ on }) {
  return <span className={`rc-box${on ? ' is-on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
}

// A value written on the line, or an empty line to write on by hand
function Line({ value, grow = true, wide = false }) {
  return <span className={`rc-line${grow ? ' grow' : ''}${wide ? ' wide' : ''}`}>{value || ' '}</span>
}

export function Receipt({ data = {}, number = '' }) {
  const d = data
  const no = d.receipt_no || number
  const filled = Boolean(d.id)
  const name = d.anonymous ? 'বেনামী দাতা' : d.donor_name
  const words = filled ? amountInWords(d.amount, d.currency) : ''
  const figure = filled ? amountFigure(d.amount, d.currency) : ''
  return (
    <article className="rc-sheet">
      <aside className="rc-stub" aria-label="মুড়ি">
        <p className="rc-stub-title">মুড়ি</p>
        <p className="rc-stub-org">{SAMITI.name_bn}</p>
        <dl>
          <dt>রসিদ নং</dt><dd><Line value={no} /></dd>
          <dt>তারিখ</dt><dd><Line value={bnDate(d.donated_on)} /></dd>
          <dt>দাতার নাম</dt><dd><Line value={name} /><Line /></dd>
          <dt>খাত</dt><dd><Line value={d.fund_name} /></dd>
          <dt>টাকা</dt><dd><Line value={figure} /></dd>
          <dt>মাধ্যম</dt><dd><Line value={METHODS.find(m => m.code === d.method)?.bn} /></dd>
        </dl>
        <p className="rc-stub-sign">গ্রহীতার স্বাক্ষর</p>
      </aside>

      <section className="rc-main" style={{ '--rc-emblem': `url(${import.meta.env.BASE_URL}emblem.svg)` }}>
        <div className="rc-head">
          <img src={`${import.meta.env.BASE_URL}emblem.svg`} alt="" className="rc-emblem" />
          <div>
            <p className="rc-om" aria-hidden="true">ॐ</p>
            <h1>{SAMITI.name_bn}</h1>
            <p className="rc-en">{SAMITI.name_en}</p>
            <p className="rc-sub">{SAMITI.founded} · {SAMITI.address}</p>
          </div>
        </div>

        <div className="rc-titlebar">
          <span>রসিদ নং: <b className="rc-no">{no || <Line grow={false} />}</b></span>
          <h2>মানি রসিদ</h2>
          <span>তারিখ: <b>{bnDate(d.donated_on) || <Line grow={false} />}</b></span>
        </div>

        <p className="rc-row">ধন্যবাদের সহিত গ্রহণ করা হলো — <span className="rc-label">জনাব/শ্রী/শ্রীমতী</span> <Line value={name} /></p>
        <p className="rc-row"><span className="rc-label">ঠিকানা</span> <Line value={d.address} /> <span className="rc-label">মোবাইল</span> <Line value={bnDigits(d.phone)} grow={false} wide /></p>
        <p className="rc-row"><span className="rc-label">কথায়</span> <Line value={words} /></p>

        <div className="rc-funds">
          <span className="rc-label">যে খাতে:</span>
          {FUNDS.map(f => <span key={f.id} className="rc-check"><Box on={d.fund === f.id} />{f.name_bn}</span>)}
        </div>
        <p className="rc-row"><span className="rc-label">উদ্দেশ্য / বিবরণ</span> <Line value={d.purpose} /></p>

        <div className="rc-methods">
          <span className="rc-label">মাধ্যম:</span>
          {METHODS.map(m => <span key={m.code} className="rc-check"><Box on={d.method === m.code} />{m.bn}</span>)}
          <span className="rc-label">লেনদেন/চেক নং</span> <Line value={d.transaction_ref} />
        </div>

        <div className="rc-foot">
          <div className="rc-amount"><span>টাকার পরিমাণ</span><b>{figure || '৳'}</b></div>
          <div className="rc-sign"><span className="rc-sign-line" />আদায়কারীর স্বাক্ষর</div>
          <div className="rc-sign"><span className="rc-sign-line" />কোষাধ্যক্ষ / সাধারণ সম্পাদক</div>
        </div>
        <p className="rc-thanks">আপনার দান মানবসেবায় ব্যবহৃত হবে — “শিবজ্ঞানে জীবসেবা”। {SAMITI.contact}</p>
      </section>
    </article>
  )
}

// Load one earning of any kind and bring it to the receipt's common shape
async function loadEarning(type, id) {
  if (type === 'subscription') {
    const { data: pay } = await supabase.from('subscription_payments').select('*').eq('id', id).maybeSingle()
    if (!pay) return null
    const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', pay.subscription_id).maybeSingle()
    return { id: pay.id, kind: 'মাসিক চাঁদা', receipt_no: subscriptionReceiptNo(pay), donated_on: pay.paid_on, donor_name: sub?.donor_name, phone: sub?.phone, email: sub?.email, address: sub?.address,
      amount: pay.amount, currency: pay.currency, method: pay.method, transaction_ref: pay.transaction_ref, purpose: `মাসিক চাঁদা — ${monthBn(pay.month)}` }
  }
  if (type === 'income') {
    const { data: inc } = await supabase.from('income_entries').select('*').eq('id', id).maybeSingle()
    if (!inc) return null
    return { id: inc.id, kind: 'আয়', receipt_no: incomeReceiptNo(inc), donated_on: inc.entry_date, donor_name: inc.received_from, amount: inc.amount, currency: inc.currency,
      method: inc.method, transaction_ref: inc.reference, purpose: inc.description }
  }
  const { data: don } = await supabase.from('donations').select('*').eq('id', id).maybeSingle()
  return don ? { ...don, kind: 'দান', receipt_no: donationReceiptNo(don) } : null
}

const DELIVERY_STATUS = { sent: 'পাঠানো হয়েছে', failed: 'ব্যর্থ', skipped: 'পাঠানো হয়নি' }

function SharePanel({ type, data, fundName }) {
  const [email, setEmail] = useState(data.email || '')
  const [phone, setPhone] = useState(data.phone || '')
  const [again, setAgain] = useState(false)
  const [busy, setBusy] = useState('')
  const [outcome, setOutcome] = useState(null)
  const [history, setHistory] = useState([])
  const text = receiptText({ ...data, fund_name: fundName })
  const subject = `মানি রসিদ ${data.receipt_no} — ${SAMITI.name_bn}`
  const enc = encodeURIComponent
  const intl = intlPhone(phone)

  const refresh = () => loadDeliveries(type, data.id).then(setHistory)
  useEffect(() => { refresh() }, [type, data.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send(channels) {
    setBusy(channels.join()); setOutcome(null)
    const result = await sendReceipt(type, data.id, { channels, email, phone, fundName, force: again })
    setOutcome(result); setBusy(''); refresh()
  }

  return <div className="rc-share no-print">
    <p className="rc-share-title">দাতাকে রসিদ পাঠান</p>
    <div className="rc-share-row">
      <label>ইমেইল <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="donor@example.com" /></label>
      <button type="button" className="rc-btn" disabled={!email || !!busy} onClick={() => send(['email'])}>{busy === 'email' ? 'পাঠানো হচ্ছে…' : 'ইমেইল পাঠান'}</button>
      <a className={`rc-btn rc-btn-ghost${email ? '' : ' is-off'}`} href={email ? `mailto:${email}?subject=${enc(subject)}&body=${enc(text)}` : undefined}>নিজের মেইল থেকে</a>
    </div>
    <div className="rc-share-row">
      <label>মোবাইল <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></label>
      <button type="button" className="rc-btn" disabled={!phone || !!busy} onClick={() => send(['sms'])}>{busy === 'sms' ? 'পাঠানো হচ্ছে…' : 'SMS পাঠান'}</button>
      <a className={`rc-btn rc-btn-ghost${phone ? '' : ' is-off'}`} href={phone ? `sms:${phone}?&body=${enc(text)}` : undefined}>নিজের ফোন থেকে</a>
      <a className={`rc-btn rc-btn-wa${intl ? '' : ' is-off'}`} href={intl ? `https://wa.me/${intl}?text=${enc(text)}` : undefined} target="_blank" rel="noopener">WhatsApp</a>
    </div>
    <div className="rc-share-row">
      <button type="button" className="rc-btn" disabled={(!email && !phone) || !!busy} onClick={() => send(['email', 'sms'])}>{busy === 'email,sms' ? 'পাঠানো হচ্ছে…' : 'ইমেইল ও SMS দুটোই পাঠান'}</button>
      <label className="rc-again"><input type="checkbox" checked={again} onChange={e => setAgain(e.target.checked)} /> আগে পাঠানো হলেও আবার পাঠান</label>
      <button type="button" className="rc-btn rc-btn-ghost" onClick={() => navigator.clipboard?.writeText(text)}>লেখা কপি করুন</button>
    </div>
    {outcome && <p className={`rc-outcome${outcome.error ? ' is-error' : ''}`} role="status">
      {outcome.error ? `পাঠানো যায়নি: ${outcome.error}` : outcome.results.map(r => `${r.channel === 'email' ? 'ইমেইল' : 'SMS'}: ${DELIVERY_STATUS[r.status]}${r.to ? ` (${r.to})` : ''}${r.error ? ` — ${r.error}` : ''}`).join(' · ')}
    </p>}
    {history.length > 0 && <details className="rc-history"><summary>পাঠানোর ইতিহাস ({bnDigits(history.length)})</summary><ul>
      {history.map(h => <li key={h.id}>{new Date(h.created_at).toLocaleString('bn-BD')} — {h.channel === 'email' ? 'ইমেইল' : 'SMS'} → {h.recipient}: {DELIVERY_STATUS[h.status]}{h.automatic ? ' (স্বয়ংক্রিয়)' : ''}{h.error ? ` — ${h.error}` : ''}</li>)}
    </ul></details>}
    <small>“ইমেইল/SMS পাঠান” সমিতির নিজস্ব ইমেইল ও SMS সেবা দিয়ে সরাসরি দাতার কাছে যায়। “নিজের মেইল/ফোন থেকে” আপনার ডিভাইসের অ্যাপে বার্তা তৈরি করে খোলে।</small>
  </div>
}

export default function ReceiptPage() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const type = RECEIPT_TYPES.includes(params.get('type')) ? params.get('type') : 'donation'
  const blank = params.get('blank') === '1'
  const from = Math.max(0, parseInt(params.get('from') || '0', 10) || 0)
  const count = Math.min(500, Math.max(1, parseInt(params.get('count') || '2', 10) || 2))
  const [earning, setEarning] = useState(null)
  const [fund, setFund] = useState('samiti')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    loadEarning(type, id).then(data => {
      if (!data) { setError('এই আয়ের তথ্য পাওয়া যায়নি (বা দেখার অনুমতি নেই)।'); return }
      setEarning(data); setFund(type === 'subscription' ? 'samiti' : guessFund(data.purpose))
    }).catch(() => setError('তথ্য লোড করা যায়নি।'))
  }, [type, id])

  const fundName = FUNDS.find(f => f.id === fund)?.name_bn
  const sheets = useMemo(() => {
    if (blank) return Array.from({ length: count }, (_, i) => ({ number: from ? String(from + i).padStart(4, '0') : '', data: {} }))
    if (earning) return [{ data: { ...earning, fund, fund_name: fundName } }]
    return []
  }, [blank, count, from, earning, fund, fundName])

  return <div className="rc-page">
    <div className="rc-toolbar no-print">
      <Link to="/admin/dashboard">← ড্যাশবোর্ড</Link>
      {earning && <span>{earning.kind}</span>}
      {earning && <label>খাত: <select value={fund} onChange={e => setFund(e.target.value)}>{FUNDS.map(f => <option key={f.id} value={f.id}>{f.name_bn}</option>)}</select></label>}
      {blank && <span>ফাঁকা রসিদ: {bnDigits(count)}টি{from ? `, নং ${bnDigits(String(from).padStart(4, '0'))} থেকে` : ''} (প্রতি A4 পাতায় ২টি)</span>}
      <button type="button" onClick={() => window.print()} disabled={!sheets.length}>প্রিন্ট / PDF</button>
    </div>
    {earning && <SharePanel type={type} data={earning} fundName={fundName} key={earning.id} />}
    {!id && !blank && <p className="rc-msg no-print">আয়ের তালিকা থেকে “রসিদ” চাপুন, অথবা ফাঁকা রসিদের জন্য <Link to="/admin/receipt?blank=1&count=2">এখানে</Link> যান।</p>}
    {error && <p className="rc-msg no-print">{error}</p>}
    {id && !earning && !error && <p className="rc-msg no-print">লোড হচ্ছে…</p>}
    <div className="rc-sheets print-area">{sheets.map((s, i) => <Receipt key={i} data={s.data} number={s.number} />)}</div>
  </div>
}
