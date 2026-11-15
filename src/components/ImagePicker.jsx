import { useEffect, useRef, useState } from 'react'
import { IMAGE_TYPES, MAX_IMAGE_SIZE, checkImageFile } from '../lib/storage'
import { enhanceImage } from '../lib/imageEnhance'
import { FieldError } from './FormHelpers'
import '../forms-upload.css'

// Photos straight from a phone camera can be large: they are accepted up to 25 MB because
// the enhanced copy that is uploaded is resized and compressed (it must still fit the 5 MB limit).
const MAX_ORIGINAL_SIZE = 25 * 1024 * 1024

// Choose a photo from the computer, with preview. The parent uploads it when the form is saved.
// "Auto-enhance" cleans the photo, balances brightness/contrast and enlarges small photos before upload.
export default function ImagePicker({ id, label, file, onFileChange, currentUrl, error, onError }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [original, setOriginal] = useState(null)
  const [enhance, setEnhance] = useState(true)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!file) { setPreview(''); setOriginal(null); if (inputRef.current) inputRef.current.value = ''; return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function prepare(picked, useEnhance) {
    if (!useEnhance) {
      const problem = checkImageFile(picked)
      if (problem) { onError(problem); return }
      onError(''); onFileChange(picked); return
    }
    setWorking(true)
    try {
      const better = await enhanceImage(picked, { name: picked.name })
      const problem = checkImageFile(better)
      if (problem) { onError(problem); return }
      onError(''); onFileChange(better)
    } catch {
      // if enhancing fails, fall back to the photo as it is
      const problem = checkImageFile(picked)
      if (problem) { onError(problem); return }
      onError(''); onFileChange(picked)
    } finally {
      setWorking(false)
    }
  }

  function handleChange(event) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (!IMAGE_TYPES.includes(picked.type)) { onError('Photo must be a JPG, PNG or WebP image.'); event.target.value = ''; return }
    if (picked.size > (enhance ? MAX_ORIGINAL_SIZE : MAX_IMAGE_SIZE)) { onError(checkImageFile(picked) || 'Photo is too large.'); event.target.value = ''; return }
    setOriginal(picked)
    prepare(picked, enhance)
  }

  function toggleEnhance(event) {
    const next = event.target.checked
    setEnhance(next)
    if (original) prepare(original, next)
  }

  const shown = preview || currentUrl

  return <div className="image-picker">
    <label htmlFor={id}>{label}</label>
    <div className="image-picker-row">
      <label htmlFor={id} className="image-picker-button">📷 {file ? 'Choose another photo' : 'Upload photo from computer'}</label>
      <input ref={inputRef} id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="visually-hidden-input" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} disabled={working} />
      {file && !working && <span className="image-picker-name">{file.name} ({(file.size / 1024).toFixed(0)} KB) <button type="button" className="remove-photo-button" onClick={() => onFileChange(null)}>Remove</button></span>}
      {working && <span className="image-picker-name" role="status">✨ Improving photo…</span>}
    </div>
    <label className="publish-option enhance-option"><input type="checkbox" checked={enhance} onChange={toggleEnhance} disabled={working} /> ✨ Auto-enhance photo — clean, balance brightness and enlarge small photos (recommended) / ছবি স্বয়ংক্রিয়ভাবে সুন্দর করুন</label>
    <small className="field-hint">JPG, PNG or WebP. The photo is uploaded when you save.</small>
    <FieldError id={`${id}-error`} message={error} />
    {shown && <img className="image-picker-preview" src={shown} alt="Selected photo preview" onError={event => { event.currentTarget.style.display = 'none' }} onLoad={event => { event.currentTarget.style.display = '' }} />}
  </div>
}
