// Money receipts for every kind of earning: donations, monthly subscription payments and other income.
// Each earning has one receipt number starting with DVS (Dhoom Vivekananda Samiti).

export const RECEIPT_TYPES = ['donation', 'subscription', 'income']

// Link to the printable receipt of one earning (staff-only page)
export const receiptUrl = (type, id) => `${import.meta.env.BASE_URL}admin/receipt?type=${type}&id=${id}`

const short = id => String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase()

// Subscription payments have no stored number: it is derived, so it never changes — DVS-MS-YYYYMM-XXXXXX
export const subscriptionReceiptNo = payment => `DVS-MS-${String(payment.month || '').slice(0, 7).replace('-', '')}-${short(payment.id)}`

// Other income: its own receipt number, or a derived one for old entries saved without it
export const incomeReceiptNo = entry => entry.receipt_no || `DVS-IN-${String(entry.entry_date || '').slice(0, 10).replace(/-/g, '')}-${short(entry.id)}`

export const donationReceiptNo = donation => donation.receipt_no || `DVS-DN-${String(donation.donated_on || '').slice(0, 10).replace(/-/g, '')}-${short(donation.id)}`

// Bangladeshi mobile number → international digits for WhatsApp (01XXXXXXXXX → 8801XXXXXXXXX)
export function intlPhone(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (/^01\d{9}$/.test(digits)) return `88${digits}`
  if (/^8801\d{9}$/.test(digits)) return digits
  return digits
}
