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

// Payment details shown to online donors — set these in the .env file
export const PAYMENT_INFO = {
  bkash: import.meta.env.VITE_DONATION_BKASH || '',
  nagad: import.meta.env.VITE_DONATION_NAGAD || '',
  rocket: import.meta.env.VITE_DONATION_ROCKET || '',
  bank: import.meta.env.VITE_DONATION_BANK || '',
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
