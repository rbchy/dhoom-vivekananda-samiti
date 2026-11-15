export const INCOME_CATEGORIES = [
  { code: 'pranami', label: 'Pranami / donation box — প্রণামী বাক্স' },
  { code: 'puja_sponsorship', label: 'Puja sponsorship — পূজা স্পনসর' },
  { code: 'membership', label: 'Membership fee — সদস্য ফি' },
  { code: 'event_contribution', label: 'Event contribution — অনুষ্ঠানের চাঁদা' },
  { code: 'prasad', label: 'Prasad / bhog contribution — প্রসাদ' },
  { code: 'fundraising', label: 'Fundraising — তহবিল সংগ্রহ' },
  { code: 'grant', label: 'Grant / aid — অনুদান' },
  { code: 'interest', label: 'Bank interest — ব্যাংক সুদ' },
  { code: 'other', label: 'Other — অন্যান্য' }
]

export const EXPENSE_CATEGORIES = [
  { code: 'puja_materials', label: 'Puja materials — পূজার সামগ্রী' },
  { code: 'prasad_bhog', label: 'Prasad & bhog — প্রসাদ ও ভোগ' },
  { code: 'priest', label: 'Priest dakshina — পুরোহিত দক্ষিণা' },
  { code: 'decoration', label: 'Decoration & lighting — সাজসজ্জা ও আলো' },
  { code: 'rent', label: 'Rent / venue — ভাড়া' },
  { code: 'utilities', label: 'Utilities — বিদ্যুৎ, গ্যাস, পানি' },
  { code: 'maintenance', label: 'Maintenance & repair — রক্ষণাবেক্ষণ' },
  { code: 'insurance', label: 'Insurance — বিমা' },
  { code: 'printing', label: 'Printing & publicity — ছাপা ও প্রচার' },
  { code: 'sound_av', label: 'Sound & AV — সাউন্ড ও মাইক' },
  { code: 'community_food', label: 'Community meal / picnic — সম্মিলিত খাবার' },
  { code: 'charity', label: 'Humanitarian aid — মানবিক সহায়তা' },
  { code: 'office_admin', label: 'Office & admin — অফিস ও প্রশাসন' },
  { code: 'transport', label: 'Transport — যাতায়াত' },
  { code: 'other', label: 'Other — অন্যান্য' }
]

const ALL = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
export const categoryLabel = code => ALL.find(c => c.code === code)?.label || code

export function nextNumber(prefix) {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${prefix}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

// Heads from the account_heads table, falling back to the built-in lists before the SQL is run
export function headsFromRows(rows) {
  if (!rows || !rows.length) {
    return [
      ...INCOME_CATEGORIES.map((c, i) => ({ id: `builtin-i-${c.code}`, head_type: 'income', code: c.code, label: c.label, sort_order: i, is_active: true, builtin: true })),
      ...EXPENSE_CATEGORIES.map((c, i) => ({ id: `builtin-e-${c.code}`, head_type: 'expense', code: c.code, label: c.label, sort_order: i, is_active: true, builtin: true }))
    ]
  }
  return rows.map(row => ({ ...row, label: row.name_bn ? `${row.name_en} — ${row.name_bn}` : row.name_en }))
}

export function headLabel(heads, type, code) {
  return heads.find(h => h.head_type === type && h.code === code)?.label || categoryLabel(code)
}

export function slugify(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 40)
}
