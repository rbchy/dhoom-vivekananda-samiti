import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ORGANISATIONS } from '../i18n-org'
import '../receipt.css'

// Money receipt (মানি রসিদ) of Dhoom Vivekananda Samiti and its institutions.
// One design, two uses:
//   /admin/receipt?id=<donation id>           → a filled receipt for one donation, to print or save as PDF
//   /admin/receipt?blank=1&from=1&count=100   → blank receipts for a printed receipt book, 2 per A4 page
// Each receipt is A5 landscape: a counterfoil (মুড়ি) kept by the Samiti, and the receipt given to the donor.

const SAMITI = {
  name_bn: 'ধুম বিবেকানন্দ সমিতি',
  name_en: 'Dhoom Vivekananda Samiti',
  founded: 'স্থাপিত: ১৯২৩ খ্রিস্টাব্দ',
  address: 'গ্রাম: ধুম, ডাকঘর: মহাজনহাট, উপজেলা: মীরসরাই, জেলা: চট্টগ্রাম',
  contact: 'বিকাশ: ০১৮১২৩৮১৫৪৪ · নগদ: ০১৮৫৪০১৮৯০২ · rbchy.github.io/dhoom-vivekananda-samiti'
}

// The Samiti's general fund first, then every institution under it
const FUNDS = [{ id: 'samiti', name_bn: 'সমিতি (সাধারণ তহবিল)' }, ...ORGANISATIONS.map(o => ({ id: o.id, name_bn: o.name_bn }))]

const METHODS = [
  { code: 'cash', bn: 'নগদ টাকা' }, { code: 'bkash', bn: 'বিকাশ' }, { code: 'nagad', bn: 'নগদ (মোবাইল)' },
  { code: 'rocket', bn: 'রকেট' }, { code: 'bank', bn: 'ব্যাংক' }, { code: 'cheque', bn: 'চেক' }
]

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
export const bnDigits = value => String(value ?? '').replace(/[0-9]/g, d => BN_DIGITS[d])

const ONES = ('শূন্য এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ ' +
  'বিশ একুশ বাইশ তেইশ চব্বিশ পঁচিশ ছাব্বিশ সাতাশ আটাশ ঊনত্রিশ ত্রিশ একত্রিশ বত্রিশ তেত্রিশ চৌত্রিশ পঁয়ত্রিশ ছত্রিশ সাঁইত্রিশ আটত্রিশ ঊনচল্লিশ ' +
  'চল্লিশ একচল্লিশ বিয়াল্লিশ তেতাল্লিশ চুয়াল্লিশ পঁয়তাল্লিশ ছেচল্লিশ সাতচল্লিশ আটচল্লিশ ঊনপঞ্চাশ পঞ্চাশ একান্ন বাহান্ন তিপ্পান্ন চুয়ান্ন পঞ্চান্ন ছাপ্পান্ন সাতান্ন আটান্ন ঊনষাট ' +
  'ষাট একষট্টি বাষট্টি তেষট্টি চৌষট্টি পঁয়ষট্টি ছেষট্টি সাতষট্টি আটষট্টি ঊনসত্তর সত্তর একাত্তর বাহাত্তর তিয়াত্তর চুয়াত্তর পঁচাত্তর ছিয়াত্তর সাতাত্তর আটাত্তর ঊনআশি ' +
  'আশি একাশি বিরাশি তিরাশি চুরাশি পঁচাশি ছিয়াশি সাতাশি আটাশি ঊননব্বই নব্বই একানব্বই বিরানব্বই তিরানব্বই চুরানব্বই পঁচানব্বই ছিয়ানব্বই সাতানব্বই আটানব্বই নিরানব্বই').split(' ')

// Whole number in Bangla words, Bangladeshi style: কোটি, লক্ষ, হাজার, শত
export function bnWords(n) {
  n = Math.floor(Math.abs(Number(n) || 0))
  if (n === 0) return ONES[0]
  const parts = []
  const crore = Math.floor(n / 10000000); n %= 10000000
  if (crore) parts.push(`${bnWords(crore)} কোটি`)
  for (const [size, word] of [[100000, 'লক্ষ'], [1000, 'হাজার'], [100, 'শত']]) {
    const q = Math.floor(n / size); n %= size
    if (q) parts.push(`${ONES[q]} ${word}`)
  }
  if (n) parts.push(ONES[n])
  return parts.join(' ')
}

export function amountInWords(amount, currency = 'BDT') {
  const value = Number(amount) || 0
  const whole = Math.floor(value)
  const cents = Math.round((value - whole) * 100)
  const unit = currency === 'BDT' ? ['টাকা', 'পয়সা'] : ['মার্কিন ডলার', 'সেন্ট']
  return `${bnWords(whole)} ${unit[0]}${cents ? ` ${bnWords(cents)} ${unit[1]}` : ''} মাত্র`
}

const bnDate = iso => iso ? bnDigits(String(iso).slice(0, 10).split('-').reverse().join('/')) : ''
const amountFigure = (amount, currency) => (currency === 'BDT' ? '৳ ' : '$ ') + bnDigits(new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(amount) || 0))

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
          <dt>রসিদ নং</dt><dd><Line value={bnDigits(no)} /></dd>
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
          <span>রসিদ নং: <b>{bnDigits(no) || <Line grow={false} />}</b></span>
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

export default function ReceiptPage() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const blank = params.get('blank') === '1'
  const from = Math.max(0, parseInt(params.get('from') || '0', 10) || 0)
  const count = Math.min(500, Math.max(1, parseInt(params.get('count') || '2', 10) || 2))
  const [donation, setDonation] = useState(null)
  const [fund, setFund] = useState('samiti')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('donations').select('*').eq('id', id).maybeSingle().then(({ data, error: dbError }) => {
      if (dbError || !data) { setError('এই দানের তথ্য পাওয়া যায়নি (বা দেখার অনুমতি নেই)।'); return }
      setDonation(data); setFund(guessFund(data.purpose))
    })
  }, [id])

  const sheets = useMemo(() => {
    if (blank) return Array.from({ length: count }, (_, i) => ({ number: from ? String(from + i).padStart(4, '0') : '', data: {} }))
    if (donation) return [{ data: { ...donation, fund, fund_name: FUNDS.find(f => f.id === fund)?.name_bn } }]
    return []
  }, [blank, count, from, donation, fund])

  return <div className="rc-page">
    <div className="rc-toolbar no-print">
      <Link to="/admin/dashboard">← ড্যাশবোর্ড</Link>
      {donation && <label>খাত: <select value={fund} onChange={e => setFund(e.target.value)}>{FUNDS.map(f => <option key={f.id} value={f.id}>{f.name_bn}</option>)}</select></label>}
      {blank && <span>ফাঁকা রসিদ: {bnDigits(count)}টি{from ? `, নং ${bnDigits(String(from).padStart(4, '0'))} থেকে` : ''} (প্রতি A4 পাতায় ২টি)</span>}
      <button type="button" onClick={() => window.print()} disabled={!sheets.length}>প্রিন্ট / PDF</button>
    </div>
    {!id && !blank && <p className="rc-msg no-print">দানের তালিকা থেকে “রসিদ” চাপুন, অথবা ফাঁকা রসিদের জন্য <Link to="/admin/receipt?blank=1&count=2">এখানে</Link> যান।</p>}
    {error && <p className="rc-msg no-print">{error}</p>}
    {id && !donation && !error && <p className="rc-msg no-print">লোড হচ্ছে…</p>}
    <div className="rc-sheets print-area">{sheets.map((s, i) => <Receipt key={i} data={s.data} number={s.number} />)}</div>
  </div>
}
