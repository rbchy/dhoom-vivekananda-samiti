// Supabase Edge Function: prepare income & expenditure statements, keep them in the archive and e-mail them.
//   - by staff from the website ("Prepare statement" / "Send")
//   - by the daily scheduler (pg_cron), which prepares the fortnightly / monthly / … statements by itself
// Deploy:  supabase functions deploy finance-report --no-verify-jwt   (the scheduler has no login; staff are checked below)
// Secrets: CRON_SECRET (and RESEND_API_KEY / RECEIPT_EMAIL_FROM, shared with send-receipt)
// See docs/FINANCE-REPORTS.md (Bangla) for the full setup.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleFinanceReport } from './lib.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

// Constant-time comparison for the scheduler's secret
function sameSecret(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return reply(405, { error: 'POST only' })

  const env = name => Deno.env.get(name) || ''
  const asServer = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
  const isCron = sameSecret(request.headers.get('x-cron-secret') || '', env('CRON_SECRET'))

  let asUser = null
  let userId = null
  let userName = ''
  if (!isCron) {
    const authHeader = request.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return reply(401, { error: 'Please log in' })
    asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: authHeader } } })
    const { data } = await asUser.auth.getUser()
    userId = data?.user?.id
    userName = data?.user?.email || ''
    if (!userId) return reply(401, { error: 'Please log in' })
  }

  let body
  try { body = await request.json() } catch { return reply(400, { error: 'Invalid JSON' }) }

  const all = async table => {
    const { data, error } = await asServer.from(table).select('*')
    if (error) throw new Error(`${table}: ${error.message}`)
    return data || []
  }

  try {
    const result = await handleFinanceReport(body, {
      fetchFn: fetch,
      now: () => new Date(),
      getRole: async () => {
        const { data } = await asUser.rpc('staff_role')
        return data || null
      },
      loadData: async () => {
        const [donations, subPayments, subscriptions, income, expenses] = await Promise.all(
          ['donations', 'subscription_payments', 'subscriptions', 'income_entries', 'expense_entries'].map(all))
        const { data: headRows } = await asServer.from('account_heads').select('*')
        const heads = (headRows || []).map(h => ({ ...h, label: h.name_bn ? `${h.name_en} — ${h.name_bn}` : h.name_en }))
        return { donations, subPayments, subscriptions, income, expenses, heads }
      },
      loadRecipients: async () => {
        const { data } = await asServer.from('finance_report_recipients').select('email').eq('is_active', true)
        return (data || []).map(r => r.email)
      },
      saveReport: async report => {
        const { id: _ignore, ...row } = report
        const { data, error } = await asServer.from('finance_reports').insert({ ...row, prepared_by: userId }).select('id').single()
        if (error) throw new Error(`Saving the statement: ${error.message}`)
        return data.id
      },
      findAutoReport: async (kind, start, end) => {
        const { count } = await asServer.from('finance_reports').select('id', { count: 'exact', head: true })
          .eq('kind', kind).eq('period_start', start).eq('period_end', end).eq('automatic', true)
        return (count || 0) > 0
      },
      loadReport: async id => {
        const { data } = await asServer.from('finance_reports').select('*').eq('id', id).maybeSingle()
        return data
      },
      markSent: async (id, recipients) => {
        const { data } = await asServer.from('finance_reports').select('sent_to').eq('id', id).maybeSingle()
        const sentTo = [...new Set([...(data?.sent_to || []), ...recipients])]
        await asServer.from('finance_reports').update({ sent_to: sentTo, sent_at: new Date().toISOString() }).eq('id', id)
      },
      config: { resendKey: env('RESEND_API_KEY'), emailFrom: env('RECEIPT_EMAIL_FROM') }
    }, { isCron, userName })
    return reply(result.status, result.body)
  } catch (error) {
    return reply(500, { error: String(error.message || error).slice(0, 300) })
  }
})
