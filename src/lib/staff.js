// Staff roles and approval-aware database writes.
//
// Roles (admin_profiles.role):
//   admin           main admin — website content; views accounts
//   accounts_admin  accounts admin — donations, subscriptions, income, expenses
//   secretary       every add / edit / delete becomes a request in pending_changes
//
// Admin pages write through db('table') instead of supabase.from('table').
// For admins it is exactly supabase.from(). For the secretary it returns a
// look-alike that stores the change as a request; the right admin approves it
// (see supabase/roles-and-approvals.sql).
import { supabase } from './supabaseClient'

export const STAFF_ROLES = {
  admin: { en: 'Main Admin', bn: 'প্রধান অ্যাডমিন' },
  accounts_admin: { en: 'Accounts Admin', bn: 'হিসাব অ্যাডমিন' },
  secretary: { en: 'Secretary', bn: 'সম্পাদক' }
}

export function isStaffRole(role) {
  return Object.prototype.hasOwnProperty.call(STAFF_ROLES, role)
}

let currentRole = null
export function setCurrentStaffRole(role) { currentRole = role }
export function getCurrentStaffRole() { return currentRole }

export async function fetchStaffRole(userId) {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data && isStaffRole(data.role) ? data.role : null
}

export const REQUEST_SENT_EVENT = 'staff:request-sent'

function describe(values) {
  if (!values || typeof values !== 'object') return null
  const text = values.title_en || values.name_en || values.title_bn || values.name_bn ||
    values.donor_name || values.description || values.key || values.name || null
  return text ? String(text).slice(0, 200) : null
}

// Minimal stand-in for the Supabase query builder used by the admin pages:
//   insert(v) / update(v).eq(col, val) / delete().eq(col, val) / upsert(rows, { onConflict })
// plus .select() / .single() / .maybeSingle(), which are accepted and ignored.
class ChangeRequest {
  constructor(table, action, values, options = {}) {
    this.table = table
    this.action = action
    this.values = values
    this.options = options
    this.filter = null
  }

  eq(column, value) { this.filter = { column, value }; return this }
  select() { return this }
  single() { return this }
  maybeSingle() { return this }

  rows() {
    const list = Array.isArray(this.values) ? this.values : [this.values]
    if (this.action === 'insert') {
      return list.map(values => ({ table_name: this.table, action: 'insert', new_data: values, summary: describe(values) }))
    }
    if (this.action === 'upsert') {
      const key = this.options.onConflict || 'id'
      return list.map(values => ({ table_name: this.table, action: values[key] ? 'upsert' : 'insert', row_key: key, row_id: values[key] ? String(values[key]) : null, new_data: values, summary: describe(values) }))
    }
    if (!this.filter) throw new Error('A change request needs .eq(column, value)')
    return [{
      table_name: this.table,
      action: this.action,
      row_key: this.filter.column,
      row_id: String(this.filter.value),
      new_data: this.action === 'update' ? this.values : null,
      summary: describe(this.values)
    }]
  }

  async run() {
    let rows
    try { rows = this.rows() } catch (error) { return { data: null, error } }
    const { error } = await supabase.from('pending_changes').insert(rows)
    if (!error && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REQUEST_SENT_EVENT, { detail: { table: this.table, action: this.action, count: rows.length } }))
    }
    return { data: null, error, pendingApproval: !error }
  }

  then(resolve, reject) { return this.run().then(resolve, reject) }
}

export function db(table) {
  if (currentRole !== 'secretary') return supabase.from(table)
  return {
    insert: values => new ChangeRequest(table, 'insert', values),
    update: values => new ChangeRequest(table, 'update', values),
    delete: () => new ChangeRequest(table, 'delete', null),
    upsert: (values, options) => new ChangeRequest(table, 'upsert', values, options)
  }
}
