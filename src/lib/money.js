export const CURRENCIES = [
  { code: 'BDT', symbol: '৳', label: '৳ Taka (BDT)' },
  { code: 'USD', symbol: '$', label: '$ US Dollar (USD)' }
]

// Payment methods. "needsRef" = a transaction ID / cheque number must be entered.
export const PAYMENT_METHODS = [
  { code: 'cash', label: 'Cash / নগদ টাকা', office: true, online: false, needsRef: false },
  { code: 'cheque', label: 'Cheque / চেক', office: true, online: false, needsRef: true },
  { code: 'bkash', label: 'bKash / বিকাশ', office: true, online: true, needsRef: true },
  { code: 'nagad', label: 'Nagad / নগদ (মোবাইল)', office: true, online: true, needsRef: true },
  { code: 'rocket', label: 'Rocket / রকেট', office: true, online: true, needsRef: true },
  { code: 'bank', label: 'Bank transfer / ব্যাংক', office: true, online: true, needsRef: true },
  { code: 'card', label: 'Card (online payment link)', office: false, online: true, needsRef: true },
  { code: 'other', label: 'Other / অন্যান্য', office: true, online: true, needsRef: false }
]

export const methodLabel = code => PAYMENT_METHODS.find(m => m.code === code)?.label || code

export function formatMoney(amount, currency = 'BDT', locale = 'en-US') {
  const value = Number(amount || 0)
  if (currency === 'BDT') {
    // Bangladeshi grouping (1,00,000) with the Taka sign
    return '৳' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
  }
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `${currency === 'USD' ? '$' : '৳'}${value.toFixed(2)}`
  }
}

// Official payment details approved by the committee (Nov 2026), per institution.
// A VITE_DONATION_* variable in .env / GitHub repo variables still overrides each one.
const OFFICIAL_PAYMENT_INFO = {
  bkash: '01812381544 — ধুম বিবেকানন্দ সমিতি (Dhoom Vivekananda Samiti)',
  nagad: '01854018902 — ধুম বিবেকানন্দ সমিতি (Dhoom Vivekananda Samiti)',
  bank: [
    'ধুম বিবেকানন্দ সমিতি (Dhoom Vivekananda Samiti)',
    'রূপালী ব্যাংক পিএলসি (Rupali Bank PLC), শান্তিরহাট শাখা (Shantirhat Branch), মীরসরাই, চট্টগ্রাম',
    'হিসাব নং (A/C No): 1438010008825 · রাউটিং নং (Routing No): 185156974',
    '',
    'শ্রী শ্রী দক্ষিণ কালিকা মন্দির (Sree Sree Dokkhin Kalika Mandir)',
    'রূপালী ব্যাংক পিএলসি (Rupali Bank PLC), শান্তিরহাট শাখা (Shantirhat Branch), মীরসরাই, চট্টগ্রাম',
    'হিসাব নং (A/C No): 14380100011211 · রাউটিং নং (Routing No): 185156974'
  ].join('\n')
}

// Payment details shown to online donors
export const PAYMENT_INFO = {
  bkash: import.meta.env.VITE_DONATION_BKASH || OFFICIAL_PAYMENT_INFO.bkash,
  nagad: import.meta.env.VITE_DONATION_NAGAD || OFFICIAL_PAYMENT_INFO.nagad,
  rocket: import.meta.env.VITE_DONATION_ROCKET || '',
  bank: (import.meta.env.VITE_DONATION_BANK || OFFICIAL_PAYMENT_INFO.bank).replace(/\\n/g, '\n'),
  cardUrl: import.meta.env.VITE_DONATION_PAYMENT_URL || ''
}

export function monthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

export function monthLabel(isoMonth, locale = 'en-US') {
  if (!isoMonth) return ''
  const date = new Date(`${String(isoMonth).slice(0, 7)}-01T00:00:00`)
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
}
