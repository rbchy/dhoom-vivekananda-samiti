// A small stand-in for Supabase, answered inside the browser test by page.route().
// The website is built with VITE_SUPABASE_URL = SUPABASE_URL, so every request the real
// supabase-js client makes (REST tables, Auth) lands here instead of the internet.
//
//   GET    /rest/v1/<table>?col=eq.x&order=a.asc,b.desc&limit=n   → rows from the sample tables
//   POST   /rest/v1/<table>                                        → recorded in `writes`, answers 201
//   POST   /auth/v1/token?grant_type=password                     → session for a known account
//   GET    /auth/v1/user                                          → the signed-in user
//   POST   /auth/v1/logout                                        → ends the session
//
// The tests read `writes` to check what the site sent, and can make a table fail with failTable().
import { ACCOUNTS, sampleTables } from './data.js'

export const SUPABASE_URL = 'https://e2e.supabase.test'

const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

// Same rules as PostgREST for the filters the site uses
function applyQuery(rows, params) {
  let out = [...rows]
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(key)) continue
    const [op, ...rest] = raw.split('.')
    const value = rest.join('.')
    const typed = value === 'true' ? true : value === 'false' ? false : value === 'null' ? null : value
    if (op === 'eq') out = out.filter(row => String(row[key]) === String(typed))
    else if (op === 'neq') out = out.filter(row => String(row[key]) !== String(typed))
    else if (op === 'is') out = out.filter(row => (row[key] ?? null) === typed)
    else if (op === 'gte') out = out.filter(row => row[key] >= typed)
    else if (op === 'lte') out = out.filter(row => row[key] <= typed)
    else if (op === 'gt') out = out.filter(row => row[key] > typed)
    else if (op === 'lt') out = out.filter(row => row[key] < typed)
  }
  const order = params.get('order')
  if (order) {
    const keys = order.split(',').map(part => { const [col, dir] = part.split('.'); return [col, dir === 'desc' ? -1 : 1] })
    out.sort((a, b) => {
      for (const [col, dir] of keys) {
        const x = a[col] ?? '', y = b[col] ?? ''
        if (x < y) return -dir
        if (x > y) return dir
      }
      return 0
    })
  }
  if (params.get('limit')) out = out.slice(0, Number(params.get('limit')))
  return out
}

// An unsigned JWT is enough: supabase-js only reads the payload
function fakeJwt(userId) {
  const enc = obj => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: userId, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 })}.e2e`
}

export async function installFakeSupabase(page) {
  const tables = sampleTables()
  const writes = []
  const failing = new Set()
  let signedIn = null

  const user = id => ({ id, aud: 'authenticated', role: 'authenticated', email: Object.keys(ACCOUNTS).find(e => ACCOUNTS[e].id === id), app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' })

  await page.route(`${SUPABASE_URL}/**`, async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()

    if (url.pathname.startsWith('/rest/v1/rpc/')) return json(route, 200, null)

    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.slice('/rest/v1/'.length)
      if (failing.has(table)) return json(route, 500, { code: 'XX000', message: `e2e: ${table} is down` })
      if (method === 'GET' || method === 'HEAD') {
        let rows = applyQuery(tables[table] || [], url.searchParams)
        // supabase-js asks for one object with this Accept header (.single())
        if ((request.headers().accept || '').includes('vnd.pgrst.object')) return json(route, rows.length ? 200 : 406, rows[0] || { code: 'PGRST116', message: 'no rows' })
        return json(route, 200, rows)
      }
      writes.push({ table, method, body: request.postDataJSON(), query: Object.fromEntries(url.searchParams) })
      return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
    }

    if (url.pathname === '/auth/v1/token') {
      const { email, password } = request.postDataJSON() || {}
      const account = ACCOUNTS[email]
      if (!account || account.password !== password) return json(route, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials', error: 'invalid_grant', error_description: 'Invalid login credentials' })
      signedIn = account.id
      const now = Math.floor(Date.now() / 1000)
      return json(route, 200, { access_token: fakeJwt(account.id), token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: `refresh-${account.id}`, user: user(account.id) })
    }
    if (url.pathname === '/auth/v1/user') return signedIn ? json(route, 200, user(signedIn)) : json(route, 401, { code: 401, msg: 'not signed in' })
    if (url.pathname === '/auth/v1/logout') { signedIn = null; return route.fulfill({ status: 204, body: '' }) }

    return json(route, 404, { message: `e2e fake: no handler for ${method} ${url.pathname}` })
  })

  return {
    writes,
    tables,
    failTable: name => failing.add(name),
    get signedIn() { return signedIn }
  }
}
