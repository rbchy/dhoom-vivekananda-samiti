// Supabase Edge Function: send the money receipt of one earning to the donor by e-mail and/or SMS.
// Deploy:  supabase functions deploy send-receipt
// Secrets: supabase secrets set RESEND_API_KEY=… RECEIPT_EMAIL_FROM="ধুম বিবেকানন্দ সমিতি <receipt@your-domain>" SMS_NET_BD_API_KEY=…
// See docs/RECEIPT-SENDING.md (Bangla) for the full setup.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleSendReceipt } from './lib.js'
import { donationReceiptNo, incomeReceiptNo, monthBn, subscriptionReceiptNo } from './receipt-text.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

// One earning of any kind, in the receipt's common shape (with the donor's contact details)
async function loadEarning(db, type, id) {
  if (type === 'subscription') {
    const { data: pay } = await db.from('subscription_payments').select('*').eq('id', id).maybeSingle()
    if (!pay) return null
    const { data: sub } = await db.from('subscriptions').select('*').eq('id', pay.subscription_id).maybeSingle()
    return { receipt_no: subscriptionReceiptNo(pay), donated_on: pay.paid_on, donor_name: sub?.donor_name, email: sub?.email, phone: sub?.phone,
      amount: pay.amount, currency: pay.currency, method: pay.method, transaction_ref: pay.transaction_ref, purpose: `মাসিক চাঁদা — ${monthBn(pay.month)}` }
  }
  if (type === 'income') {
    const { data: inc } = await db.from('income_entries').select('*').eq('id', id).maybeSingle()
    if (!inc) return null
    return { receipt_no: incomeReceiptNo(inc), donated_on: inc.entry_date, donor_name: inc.received_from, amount: inc.amount, currency: inc.currency,
      method: inc.method, transaction_ref: inc.reference, purpose: inc.description }
  }
  const { data: don } = await db.from('donations').select('*').eq('id', id).maybeSingle()
  return don ? { ...don, receipt_no: donationReceiptNo(don) } : null
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return reply(405, { error: 'POST only' })

  const env = name => Deno.env.get(name) || ''
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return reply(401, { error: 'Please log in' })

  // As the logged-in person (their role decides), and as the server (to read the earning and write the log)
  const asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: authHeader } } })
  const asServer = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
  const { data: userData } = await asUser.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) return reply(401, { error: 'Please log in' })

  let body
  try { body = await request.json() } catch { return reply(400, { error: 'Invalid JSON' }) }

  const result = await handleSendReceipt(body, {
    fetchFn: fetch,
    getRole: async () => {
      const { data } = await asUser.rpc('staff_role')
      return data || null
    },
    loadEarning: (type, id) => loadEarning(asServer, type, id),
    alreadySent: async (type, id, channel) => {
      const { count } = await asServer.from('receipt_deliveries').select('id', { count: 'exact', head: true })
        .eq('earning_type', type).eq('earning_id', id).eq('channel', channel).eq('status', 'sent')
      return (count || 0) > 0
    },
    log: async entry => {
      await asServer.from('receipt_deliveries').insert({ ...entry, sent_by: userId })
    },
    config: {
      resendKey: env('RESEND_API_KEY'),
      emailFrom: env('RECEIPT_EMAIL_FROM'),
      emailReplyTo: env('RECEIPT_EMAIL_REPLY_TO'),
      smsKey: env('SMS_NET_BD_API_KEY'),
      smsSender: env('SMS_SENDER_ID')
    }
  })
  return reply(result.status, result.body)
})
