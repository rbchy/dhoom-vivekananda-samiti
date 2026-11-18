import { supabase } from './supabaseClient'

// Published founders in the order of the founding committee (see FOUNDER_POSITIONS), then by name
export async function loadSmritiNames() {
  const { data, error } = await supabase.from('smriti_stambha').select('*').eq('is_published', true).order('sort_order').order('name_en')
  return error ? [] : data || []
}

export const pickText = (item, field, language) =>
  language === 'bn' ? item[`${field}_bn`] || item[`${field}_en`] || '' : item[`${field}_en`] || item[`${field}_bn`] || ''

// First letter of the name (Bangla or English), for the round medallion when there is no photo
export function initials(name) {
  const words = String(name || '').replace(/^(Sri|Smt\.?|Dr\.?|শ্রী|শ্রীমতী|ডা\.?)\s+/i, '').trim().split(/\s+/)
  return Array.from(words[0] || '?')[0] + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '')
}

// The founding committee, in the order a foundation plaque lists it. The position sets the
// display order; founders with the same position are listed alphabetically, as equals.
export const FOUNDER_POSITIONS = [
  { id: 'president', order: 10, en: 'Founder President', bn: 'প্রতিষ্ঠাতা সভাপতি' },
  { id: 'vice_president', order: 20, en: 'Founder Vice President', bn: 'প্রতিষ্ঠাতা সহ-সভাপতি' },
  { id: 'secretary', order: 30, en: 'Founder General Secretary', bn: 'প্রতিষ্ঠাতা সাধারণ সম্পাদক' },
  { id: 'joint_secretary', order: 40, en: 'Founder Joint Secretary', bn: 'প্রতিষ্ঠাতা যুগ্ম সম্পাদক' },
  { id: 'treasurer', order: 50, en: 'Founder Treasurer', bn: 'প্রতিষ্ঠাতা কোষাধ্যক্ষ' },
  { id: 'member', order: 100, en: 'Founder Member', bn: 'প্রতিষ্ঠাতা সদস্য' }
]
export const positionFor = item => FOUNDER_POSITIONS.find(p => p.en === item.role_en) || null
