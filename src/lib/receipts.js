// Money receipts for every kind of earning: donations, monthly subscription payments and other income.
// Each earning has one receipt number starting with DVS (Dhoom Vivekananda Samiti).
import { supabase } from './supabaseClient'
export { bdMobile, donationReceiptNo, incomeReceiptNo, subscriptionReceiptNo } from '../../supabase/functions/send-receipt/receipt-text.js'

export const RECEIPT_TYPES = ['donation', 'subscription', 'income']

// Link to the printable receipt of one earning (staff-only page)
export const receiptUrl = (type, id) => `${import.meta.env.BASE_URL}admin/receipt?type=${type}&id=${id}`

// Mobile number → international digits for WhatsApp (01XXXXXXXXX → 8801XXXXXXXXX)
export function intlPhone(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (/^01\d{9}$/.test(digits)) return `88${digits}`
  return digits
}

// Send a receipt to the donor through the send-receipt Edge Function (e-mail and/or SMS).
// auto: true when it is sent by itself after a donation is verified or a payment recorded.
// Returns { results: [{ channel, to, status: sent|failed|skipped, error }] } or { error }.
export async function sendReceipt(type, id, { channels = ['email', 'sms'], email, phone, fundName, force = false, auto = false } = {}) {
  const { data, error } = await supabase.functions.invoke('send-receipt', {
    body: { type, id, channels, email: email || undefined, phone: phone || undefined, fund_name: fundName || undefined, force, auto }
  })
  if (error) {
    // 207 (one channel failed) still carries the results
    const detail = await error.context?.json?.().catch(() => null)
    if (detail?.results) return detail
    return { error: detail?.error || 'Could not reach the receipt-sending service' }
  }
  return data
}

// One line for staff, e.g. "Receipt sent: e-mail ✓, SMS ✓"
export function sendSummary(result) {
  if (!result || result.error) return result?.error ? `Receipt not sent: ${result.error}` : ''
  const label = { email: 'e-mail', sms: 'SMS' }
  const sent = result.results.filter(r => r.status === 'sent').map(r => `${label[r.channel]} ✓`)
  const failed = result.results.filter(r => r.status === 'failed').map(r => `${label[r.channel]} ✗ (${r.error})`)
  if (!sent.length && !failed.length) return ''
  return `Receipt ${result.receipt_no || ''} — ${[...sent, ...failed].join(', ')}`
}

export async function loadDeliveries(type, id) {
  const { data } = await supabase.from('receipt_deliveries').select('*').eq('earning_type', type).eq('earning_id', id).order('created_at', { ascending: false })
  return data || []
}
