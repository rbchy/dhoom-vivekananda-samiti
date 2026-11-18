// Stand-in for src/lib/supabaseClient.js in the demo build (npm run build:demo).
// Answers every query from demo/demoData.js, saves nothing and needs no internet.
import { DEMO_TABLES } from './demoData.js'

const DEMO_NOTE = 'Demo version: nothing is saved and admin login is turned off.'

function query(table) {
  let rows = [...(DEMO_TABLES[table] || [])]
  let one = null
  let write = false
  const sorts = []
  const api = {
    select() { return api },
    eq(column, value) { if (!write) rows = rows.filter(row => row[column] === value); return api },
    neq(column, value) { if (!write) rows = rows.filter(row => row[column] !== value); return api },
    // Several .order() calls sort by the first column, then the next, as in Supabase
    order(column, { ascending = true } = {}) {
      sorts.push([column, ascending ? 1 : -1])
      rows.sort((a, b) => {
        for (const [key, dir] of sorts) {
          const x = a[key] ?? '', y = b[key] ?? ''
          if (x < y) return -dir
          if (x > y) return dir
        }
        return 0
      })
      return api
    },
    limit(n) { rows = rows.slice(0, n); return api },
    maybeSingle() { one = 'maybe'; return api },
    single() { one = 'single'; return api },
    insert() { write = true; return api },
    update() { write = true; return api },
    upsert() { write = true; return api },
    delete() { write = true; return api },
    then(resolve, reject) {
      const data = write ? null : one ? rows[0] ?? null : rows
      return Promise.resolve({ data, error: null, count: write ? null : rows.length }).then(resolve, reject)
    }
  }
  for (const name of ['filter', 'in', 'is', 'gte', 'lte', 'gt', 'lt', 'or', 'not', 'range', 'match', 'ilike', 'like', 'contains']) api[name] = () => api
  return api
}

const noUser = { data: { user: null, session: null }, error: null }

export const supabase = {
  from: query,
  rpc: async () => ({ data: null, error: { message: DEMO_NOTE } }),
  auth: {
    getUser: async () => noUser,
    getSession: async () => noUser,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ data: null, error: { message: DEMO_NOTE } }),
    signOut: async () => ({ error: null })
  },
  storage: {
    from: () => ({
      getPublicUrl: path => ({ data: { publicUrl: path } }),
      upload: async () => ({ data: null, error: { message: DEMO_NOTE } }),
      remove: async () => ({ data: null, error: null })
    })
  },
  functions: { invoke: async () => ({ data: null, error: { message: DEMO_NOTE } }) }
}
