// Cleans and improves a photo in the browser before it is uploaded:
//  1. enlarges small photos (long side at least 1400 px) and shrinks huge ones (long side at most 1600 px)
//  2. light noise clean-up (soft blur that keeps edges)
//  3. balanced brightness and contrast (auto levels on brightness only, so colours do not shift)
//  4. gentle sharpening
// The result is a WebP File at 80% quality (JPEG on the few browsers that cannot make WebP), ready for uploadImage().
// shrinkImage() does only the resizing and WebP step, for when "Auto-enhance" is turned off.

const MIN_LONG_SIDE = 1400
const MAX_LONG_SIDE = 1600 // the website never shows a photo wider than this
export const WEB_QUALITY = 0.8

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { if (typeof source !== 'string') URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => reject(new Error('The photo could not be opened.'))
    img.src = url
  })
}

// Resize in steps of at most 2× so enlarged photos stay smooth
function resizeCanvas(img, width, height) {
  let canvas = document.createElement('canvas')
  let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height
  canvas.width = w; canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0)
  while (w !== width || h !== height) {
    const nextW = width > w ? Math.min(width, w * 2) : Math.max(width, Math.round(w / 2))
    const nextH = Math.round(nextW * height / width)
    const next = document.createElement('canvas')
    next.width = nextW; next.height = nextH
    const ctx = next.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, 0, 0, nextW, nextH)
    canvas = next; w = nextW; h = nextH
  }
  return canvas
}

// 3×3 pass: soft edge-keeping blur (clean) followed by unsharp mask (sharpen)
function cleanAndSharpen(data, width, height, sharpen) {
  const src = new Uint8ClampedArray(data)
  const row = width * 4
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * row + x * 4
      for (let c = 0; c < 3; c++) {
        const center = src[i + c]
        // average of the 8 neighbours that are close in value (keeps edges sharp, smooths grain)
        let sum = center * 2, weight = 2
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const v = src[i + dy * row + dx * 4 + c]
          if (Math.abs(v - center) < 18) { sum += v; weight++ }
        }
        const smooth = sum / weight
        // unsharp mask against the plain 3×3 average
        const blur = (src[i - row - 4 + c] + src[i - row + c] + src[i - row + 4 + c] + src[i - 4 + c] + center + src[i + 4 + c] + src[i + row - 4 + c] + src[i + row + c] + src[i + row + 4 + c]) / 9
        data[i + c] = smooth + sharpen * (center - blur)
      }
    }
  }
}

function balanceLight(data) {
  // brightness histogram
  const hist = new Uint32Array(256)
  const count = data.length / 4
  for (let i = 0; i < data.length; i += 4) hist[Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])]++
  const point = share => { let total = 0; for (let v = 0; v < 256; v++) { total += hist[v]; if (total >= count * share) return v } return 255 }
  let low = point(0.008), high = point(0.992)
  // never stretch too hard (keeps natural look on already good photos)
  low = Math.min(low, 40); high = Math.max(high, 215)
  const range = Math.max(1, high - low)
  // mean brightness after stretching → gentle gamma towards a pleasant middle brightness
  let mean = 0
  for (let v = 0; v < 256; v++) mean += hist[v] * Math.min(1, Math.max(0, (v - low) / range))
  mean /= count
  // exponent < 1 brightens a dark photo, > 1 calms an over-bright one; limited so the change stays natural
  const gamma = Math.min(1.25, Math.max(0.7, Math.log(0.48) / Math.log(Math.min(0.95, Math.max(0.05, mean)))))
  const curve = new Float32Array(256)
  for (let v = 0; v < 256; v++) {
    const t = Math.min(1, Math.max(0, (v - low) / range))
    curve[v] = 255 * Math.pow(t, gamma)
  }
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    const target = curve[Math.round(y)]
    const scale = y > 1 ? target / y : 1
    // same scale on R, G and B keeps the original colours; slight saturation lift
    const k = Math.min(scale, 3)
    const nr = r * k, ng = g * k, nb = b * k
    const ny = 0.299 * nr + 0.587 * ng + 0.114 * nb
    data[i] = ny + (nr - ny) * 1.08
    data[i + 1] = ny + (ng - ny) * 1.08
    data[i + 2] = ny + (nb - ny) * 1.08
  }
}

// WebP at the given quality; older Safari cannot encode WebP and quietly returns PNG, so fall back to JPEG there
async function encodeForWeb(canvas, quality) {
  const webp = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality))
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp', type: 'image/webp' }
  const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!jpeg) throw new Error('The photo could not be prepared.')
  return { blob: jpeg, ext: 'jpg', type: 'image/jpeg' }
}

const baseName = name => (name || 'photo').replace(/\.[^.]+$/, '')

export async function enhanceImage(source, { name = 'photo.jpg', quality = WEB_QUALITY } = {}) {
  const img = await loadImage(source)
  const w0 = img.naturalWidth, h0 = img.naturalHeight
  const longSide = Math.max(w0, h0)
  const factor = longSide < MIN_LONG_SIDE ? MIN_LONG_SIDE / longSide : longSide > MAX_LONG_SIDE ? MAX_LONG_SIDE / longSide : 1
  const width = Math.round(w0 * factor), height = Math.round(h0 * factor)
  const canvas = resizeCanvas(img, width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const image = ctx.getImageData(0, 0, width, height)
  cleanAndSharpen(image.data, width, height, factor > 1.3 ? 0.55 : 0.4)
  balanceLight(image.data)
  ctx.putImageData(image, 0, 0)
  const out = await encodeForWeb(canvas, quality)
  return new File([out.blob], `${baseName(name)}-enhanced.${out.ext}`, { type: out.type })
}

// No enhancement: only shrink to at most 1600 px and save as WebP 80%.
// A photo that is already small and light enough is kept as it is.
export async function shrinkImage(file, { quality = WEB_QUALITY } = {}) {
  const img = await loadImage(file)
  const w0 = img.naturalWidth, h0 = img.naturalHeight
  const factor = Math.min(1, MAX_LONG_SIDE / Math.max(w0, h0))
  const width = Math.round(w0 * factor), height = Math.round(h0 * factor)
  const out = await encodeForWeb(resizeCanvas(img, width, height), quality)
  if (factor === 1 && file.type === 'image/webp' && file.size <= out.blob.size) return file
  return new File([out.blob], `${baseName(file.name)}.${out.ext}`, { type: out.type })
}
