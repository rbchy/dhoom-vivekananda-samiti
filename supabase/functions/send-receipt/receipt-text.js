// Shared, dependency-free receipt wording — used by the website (receipt page) and by the
// send-receipt Edge Function, so the printed receipt, the e-mail and the SMS always say the same thing.

export const SAMITI = {
  name_bn: 'ধুম বিবেকানন্দ সমিতি',
  name_en: 'Dhoom Vivekananda Samiti',
  founded: 'স্থাপিত: ১৯২৩ খ্রিস্টাব্দ',
  address: 'গ্রাম: ধুম, ডাকঘর: মহাজনহাট, উপজেলা: মীরসরাই, জেলা: চট্টগ্রাম',
  contact: 'বিকাশ: ০১৮১২৩৮১৫৪৪ · নগদ: ০১৮৫৪০১৮৯০২ · rbchy.github.io/dhoom-vivekananda-samiti'
}

export const METHODS = [
  { code: 'cash', bn: 'নগদ টাকা' }, { code: 'bkash', bn: 'বিকাশ' }, { code: 'nagad', bn: 'নগদ (মোবাইল)' },
  { code: 'rocket', bn: 'রকেট' }, { code: 'bank', bn: 'ব্যাংক' }, { code: 'cheque', bn: 'চেক' }
]
export const methodBn = code => METHODS.find(m => m.code === code)?.bn || code || ''

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

export const bnDate = iso => iso ? bnDigits(String(iso).slice(0, 10).split('-').reverse().join('/')) : ''
export const amountFigure = (amount, currency) => (currency === 'BDT' ? '৳ ' : '$ ') + bnDigits(new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(amount) || 0))

const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
export const monthBn = iso => { const [y, m] = String(iso || '').split('-'); return m ? `${MONTHS_BN[Number(m) - 1]} ${bnDigits(y)}` : '' }

const short = id => String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase()
export const subscriptionReceiptNo = payment => `DVS-MS-${String(payment.month || '').slice(0, 7).replace('-', '')}-${short(payment.id)}`
export const incomeReceiptNo = entry => entry.receipt_no || `DVS-IN-${String(entry.entry_date || '').slice(0, 10).replace(/-/g, '')}-${short(entry.id)}`
export const donationReceiptNo = donation => donation.receipt_no || `DVS-DN-${String(donation.donated_on || '').slice(0, 10).replace(/-/g, '')}-${short(donation.id)}`

// Bangladeshi mobile number → international digits (01XXXXXXXXX → 8801XXXXXXXXX); '' if it is not a BD mobile
export function bdMobile(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (/^01[3-9]\d{8}$/.test(digits)) return `88${digits}`
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits
  return ''
}

// Any earning in the receipt's common shape: { receipt_no, donated_on, donor_name, anonymous, amount, currency, method, transaction_ref, purpose, fund_name }
export function receiptText(d) {
  const name = d.anonymous ? 'বেনামী দাতা' : d.donor_name
  return [
    `${SAMITI.name_bn} — মানি রসিদ`,
    `রসিদ নং: ${d.receipt_no}`,
    `তারিখ: ${bnDate(d.donated_on)}`,
    name ? `প্রাপক থেকে: ${name}` : null,
    `পরিমাণ: ${amountFigure(d.amount, d.currency)} (${amountInWords(d.amount, d.currency)})`,
    `খাত: ${d.fund_name || 'সমিতি (সাধারণ তহবিল)'}${d.purpose ? ` — ${d.purpose}` : ''}`,
    `মাধ্যম: ${methodBn(d.method)}${d.transaction_ref ? ` (${d.transaction_ref})` : ''}`,
    '',
    'আপনার সহযোগিতার জন্য আন্তরিক কৃতজ্ঞতা। — ধুম বিবেকানন্দ সমিতি, মীরসরাই, চট্টগ্রাম'
  ].filter(line => line !== null).join('\n')
}

// Short SMS (Bangla SMS parts are 67 characters each, so keep it to a few lines)
export function receiptSms(d) {
  return `${SAMITI.name_bn}: আপনার ${amountFigure(d.amount, d.currency)} গৃহীত হয়েছে। রসিদ নং ${d.receipt_no}, তারিখ ${bnDate(d.donated_on)}। আন্তরিক কৃতজ্ঞতা।`
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// The e-mail: the same receipt as a simple table that every mail app shows well
export function receiptEmailHtml(d) {
  const name = d.anonymous ? 'বেনামী দাতা' : d.donor_name
  const row = (label, value) => value ? `<tr><td style="padding:6px 10px;color:#5b4636;font-weight:bold;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:6px 10px;color:#14233c">${esc(value)}</td></tr>` : ''
  return `<!doctype html><html lang="bn"><body style="margin:0;background:#f3efe6;font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fffdf7;border:3px double #b8862f">
<tr><td align="center" style="padding:20px 16px 10px;border-bottom:2px solid #b8862f">
<div style="color:#b8862f;font-size:18px">ॐ</div>
<div style="color:#7a1f2b;font-size:26px;font-weight:bold">${esc(SAMITI.name_bn)}</div>
<div style="color:#5b4636;font-size:12px;letter-spacing:2px">DHOOM VIVEKANANDA SAMITI</div>
<div style="color:#5b4636;font-size:12px;margin-top:4px">${esc(SAMITI.founded)} · ${esc(SAMITI.address)}</div>
<div style="display:inline-block;margin-top:12px;padding:4px 22px;border-radius:99px;background:#7a1f2b;color:#fff8e6;font-weight:bold">মানি রসিদ</div>
</td></tr>
<tr><td style="padding:12px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px">
${row('রসিদ নং', d.receipt_no)}${row('তারিখ', bnDate(d.donated_on))}${row('প্রাপক থেকে', name)}
${row('পরিমাণ', amountFigure(d.amount, d.currency))}${row('কথায়', amountInWords(d.amount, d.currency))}
${row('খাত', d.fund_name || 'সমিতি (সাধারণ তহবিল)')}${row('উদ্দেশ্য / বিবরণ', d.purpose)}
${row('মাধ্যম', methodBn(d.method) + (d.transaction_ref ? ` (${d.transaction_ref})` : ''))}
</table></td></tr>
<tr><td align="center" style="padding:14px 16px 20px;border-top:1px solid #e6d3a8;color:#5b4636;font-size:13px">
আপনার সহযোগিতার জন্য আন্তরিক কৃতজ্ঞতা — “শিবজ্ঞানে জীবসেবা”।<br>${esc(SAMITI.contact)}<br>
<span style="color:#8a7a66;font-size:11px">এটি কম্পিউটারে তৈরি রসিদ, স্বাক্ষরের প্রয়োজন নেই।</span>
</td></tr></table></td></tr></table></body></html>`
}
