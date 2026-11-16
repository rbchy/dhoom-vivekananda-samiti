// Supabase Edge Function: post an event or announcement to the Facebook Page and Instagram.
// Deploy:  supabase functions deploy social-post
// Secrets: supabase secrets set META_PAGE_ID=… META_PAGE_TOKEN=… META_IG_USER_ID=… SITE_URL=…
// See docs/SOCIAL-AUTOPOST.md (Bangla) for the full setup.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { DEFAULT_GRAPH_VERSION, handleSocialPost } from './lib.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return reply(405, { error: 'POST only' })

  const env = name => Deno.env.get(name) || ''
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return reply(401, { error: 'Please log in' })

  // As the logged-in person (their role decides), and as the server (to read the post and write the log)
  const asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: authHeader } } })
  const asServer = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
  const { data: userData } = await asUser.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) return reply(401, { error: 'Please log in' })

  let body
  try { body = await request.json() } catch { return reply(400, { error: 'Invalid JSON' }) }

  const siteUrl = env('SITE_URL')
  const table = kind => (kind === 'event' ? 'events' : 'announcements')

  const result = await handleSocialPost(body, {
    fetchFn: fetch,
    getRole: async () => {
      const { data } = await asUser.rpc('staff_role')
      return data || null
    },
    loadItem: async (kind, id) => {
      const { data } = await asServer.from(table(kind)).select('*').eq('id', id).maybeSingle()
      return data
    },
    alreadyPosted: async (kind, id, target) => {
      const { count } = await asServer.from('social_posts').select('id', { count: 'exact', head: true })
        .eq('kind', kind).eq('item_id', id).eq('target', target).eq('status', 'posted')
      return (count || 0) > 0
    },
    log: async entry => {
      await asServer.from('social_posts').insert({ ...entry, posted_by: userId })
    },
    config: {
      version: env('META_GRAPH_VERSION') || DEFAULT_GRAPH_VERSION,
      pageId: env('META_PAGE_ID'),
      pageToken: env('META_PAGE_TOKEN'),
      igUserId: env('META_IG_USER_ID'),
      siteUrl,
      hashtags: env('SOCIAL_HASHTAGS'),
      fallbackImageUrl: env('SOCIAL_FALLBACK_IMAGE') || (siteUrl ? `${siteUrl.replace(/\/$/, '')}/images/belur-math.jpg` : '')
    }
  })
  return reply(result.status, result.body)
})
