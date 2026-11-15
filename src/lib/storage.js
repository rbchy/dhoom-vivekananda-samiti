import { supabase } from './supabaseClient'

// Same Supabase Storage bucket the Events form already uses
export const PHOTO_BUCKET = 'event-photos'
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function checkImageFile(file) {
  if (!file) return ''
  if (!IMAGE_TYPES.includes(file.type)) return 'Photo must be a JPG, PNG or WebP image.'
  if (file.size > MAX_IMAGE_SIZE) return `Photo must not exceed 5 MB (this one is ${(file.size / 1024 / 1024).toFixed(1)} MB).`
  return ''
}

export async function uploadImage(file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `${folder}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

// Storage path of a photo uploaded to our bucket (null for outside links)
export function storagePathFromUrl(url) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  try { return decodeURIComponent(url.slice(index + marker.length).split('?')[0]) } catch { return null }
}

export async function removeImage(urlOrPath) {
  const path = urlOrPath && urlOrPath.includes('/') && !urlOrPath.startsWith('http') ? urlOrPath : storagePathFromUrl(urlOrPath)
  if (!path) return null
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
  return error || null
}
