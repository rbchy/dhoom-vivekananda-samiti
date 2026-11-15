// Shared form validation helpers
export const BENGALI_PATTERN = /[ঀ-৿]/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Validate a text field. Returns an error message, or '' when valid.
export function checkText(value, { label, required = false, min = 0, max = Infinity, bengali = false } = {}) {
  const text = (value || '').trim()
  if (!text) return required ? `${label} is required.` : ''
  if (text.length < min) return `${label} must be at least ${min} characters.`
  if (text.length > max) return `${label} must be ${max} characters or fewer (now ${text.length}).`
  if (bengali && !BENGALI_PATTERN.test(text)) return `${label} must be written in Bangla (বাংলা).`
  return ''
}

export function checkUrl(value, { label, required = false } = {}) {
  const text = (value || '').trim()
  if (!text) return required ? `${label} is required.` : ''
  if (!isHttpUrl(text)) return `${label} must be a valid link starting with http:// or https://.`
  return ''
}

export function checkEmail(value) {
  const text = (value || '').trim()
  if (!text) return 'Email address is required.'
  if (!EMAIL_PATTERN.test(text)) return 'Enter a valid email address (for example name@example.com).'
  return ''
}

// Drop empty messages so Object.keys(errors).length tells whether the form is valid
export function cleanErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now - offset).toISOString().slice(0, 10)
}

export function checkPhone(value, { label = 'Phone number', required = false } = {}) {
  const text = (value || '').trim()
  if (!text) return required ? `${label} is required.` : ''
  if (!/^\+?[0-9\s()-]+$/.test(text)) return `${label} may contain only digits, spaces, +, - and brackets.`
  const digits = text.replace(/\D/g, '').length
  if (digits < 7 || digits > 15) return `${label} must have 7 to 15 digits.`
  return ''
}

export function checkOptionalEmail(value) {
  const text = (value || '').trim()
  if (!text) return ''
  return EMAIL_PATTERN.test(text) ? '' : 'Enter a valid email address (for example name@example.com).'
}

export function checkAmount(value, { label = 'Amount', max = 10000000 } = {}) {
  const text = String(value ?? '').trim()
  if (!text) return `${label} is required.`
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return `${label} must be a number with at most 2 decimal places.`
  const amount = Number(text)
  if (amount <= 0) return `${label} must be greater than 0.`
  if (amount > max) return `${label} must not exceed ${max.toLocaleString('en-US')}.`
  return ''
}

export function checkTransactionRef(value, { required = false } = {}) {
  const text = (value || '').trim()
  if (!text) return required ? 'Transaction ID / reference is required for this payment method.' : ''
  if (!/^[A-Za-z0-9\-_/ ]{4,60}$/.test(text)) return 'Transaction ID must be 4–60 letters or digits.'
  return ''
}
