import { supabase } from './supabaseClient'

// Published Smriti Stambha names, in display order
export async function loadSmritiNames() {
  const { data, error } = await supabase.from('smriti_stambha').select('*').eq('is_published', true).order('sort_order')
  return error ? [] : data || []
}

export const pickText = (item, field, language) =>
  language === 'bn' ? item[`${field}_bn`] || item[`${field}_en`] || '' : item[`${field}_en`] || item[`${field}_bn`] || ''

// First letter of the name (Bangla or English), for the round medallion when there is no photo
export function initials(name) {
  const words = String(name || '').replace(/^(Sri|Smt\.?|Dr\.?|শ্রী|শ্রীমতী|ডা\.?)\s+/i, '').trim().split(/\s+/)
  return Array.from(words[0] || '?')[0] + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '')
}
