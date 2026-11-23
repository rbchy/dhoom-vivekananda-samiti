// Pure logic for the send-receipt Edge Function (no Deno APIs, so Node can test it).
// Everything that talks to the outside world (mail / SMS services, database) is passed in.
import { bdMobile, receiptEmailHtml, receiptSms, receiptText } from './receipt-text.js'

export const TYPES = ['donation', 'subscription', 'income']
export const CHANNELS = ['email', 'sms']
const STAFF = ['admin', 'accounts_admin', 'secretary']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateRequest(body) {
  const errors = []
  if (!body || typeof body !== 'object') return ['Missing request body']
  if (!TYPES.includes(body.type)) errors.push('type must be donation, subscription or income')
  if (!body.id || typeof body.id !== 'string') errors.push('id is required')
  const channels = Array.isArray(body.channels) ? body.channels : []
  if (channels.length === 0 || channels.some(c => !CHANNELS.includes(c))) errors.push('channels must be ["email"], ["sms"] or both')
  if (body.email && !EMAIL_RE.test(String(body.email))) errors.push('email address is not valid')
  return errors
}

// ---- Providers -------------------------------------------------------

// Resend (resend.com): one HTTPS call per e-mail
export async function sendEmailResend({ fetchFn, apiKey, from, replyTo, to, subject, html, text }) {
  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`E-mail service: ${data?.message || data?.error || res.status}`)
  return data.id || ''
}

// sms.net.bd (Alpha Net), a Bangladeshi SMS gateway: one HTTPS POST per message, Bangla supported.
// Success is {"error": 0, "data": {"request_id": …}}. A sender ID is optional (approved masking name).
export async function sendSmsNetBd({ fetchFn, apiKey, senderId, to, message }) {
  const params = new URLSearchParams({ api_key: apiKey, msg: message, to })
  if (senderId) params.set('sender_id', senderId)
  const res = await fetchFn('https://api.sms.net.bd/sendsms', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString()
  })
  const data = await res.json().catch(() => ({}))
  if (Number(data.error) !== 0) throw new Error(`SMS service: ${data.msg || data.error || res.status}`)
  return String(data.data?.request_id ?? '')
}

// ---- The whole job ---------------------------------------------------
//   deps.getRole()                     → staff role or null
//   deps.loadEarning(type, id)         → earning in the receipt's common shape (+ email, phone, status) or null
//   deps.alreadySent(type, id, channel)→ boolean
//   deps.log(entry)                    → stores one delivery row
//   deps.fetchFn, deps.config          → { resendKey, emailFrom, emailReplyTo, smsKey, smsSender? }
export async function handleSendReceipt(body, deps) {
  const errors = validateRequest(body)
  if (errors.length) return { status: 400, body: { error: errors.join('; ') } }

  const role = await deps.getRole()
  if (!STAFF.includes(role)) return { status: 403, body: { error: 'Only staff can send receipts' } }

  const earning = await deps.loadEarning(body.type, body.id)
  if (!earning) return { status: 404, body: { error: 'Earning not found' } }
  if (body.type === 'donation' && earning.status !== 'verified') return { status: 409, body: { error: 'Verify the donation first' } }

  const receipt = { ...earning, fund_name: body.fund_name || earning.fund_name }
  const { config } = deps
  const results = []

  for (const channel of body.channels) {
    const to = channel === 'email' ? String(body.email || earning.email || '').trim() : bdMobile(body.phone || earning.phone)
    const skip = reason => results.push({ channel, to, status: 'skipped', error: reason })
    if (channel === 'email' && !(config.resendKey && config.emailFrom)) { skip('E-mail sending is not set up (RESEND_API_KEY / RECEIPT_EMAIL_FROM)'); continue }
    if (channel === 'sms' && !config.smsKey) { skip('SMS sending is not set up (SMS_NET_BD_API_KEY)'); continue }
    if (!to || (channel === 'email' && !EMAIL_RE.test(to))) { skip(channel === 'email' ? 'No e-mail address' : 'No Bangladeshi mobile number'); continue }
    if (!body.force && await deps.alreadySent(body.type, body.id, channel)) { skip('Already sent (choose "send again" to repeat)'); continue }
    try {
      const providerId = channel === 'email'
        ? await sendEmailResend({ fetchFn: deps.fetchFn, apiKey: config.resendKey, from: config.emailFrom, replyTo: config.emailReplyTo, to,
          subject: `মানি রসিদ ${receipt.receipt_no} — ধুম বিবেকানন্দ সমিতি`, html: receiptEmailHtml(receipt), text: receiptText(receipt) })
        : await sendSmsNetBd({ fetchFn: deps.fetchFn, apiKey: config.smsKey, senderId: config.smsSender, to, message: receiptSms(receipt) })
      results.push({ channel, to, status: 'sent', provider_id: providerId })
    } catch (error) {
      results.push({ channel, to, status: 'failed', error: String(error.message || error).slice(0, 500) })
    }
  }

  for (const r of results) {
    if (r.status !== 'skipped') {
      await deps.log({ earning_type: body.type, earning_id: body.id, receipt_no: receipt.receipt_no, channel: r.channel, recipient: r.to,
        status: r.status, provider_id: r.provider_id || null, error: r.error || null, automatic: Boolean(body.auto) })
    }
  }
  const anyFailed = results.some(r => r.status === 'failed')
  return { status: anyFailed ? 207 : 200, body: { receipt_no: receipt.receipt_no, results } }
}
