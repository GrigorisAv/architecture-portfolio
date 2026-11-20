import { variantWidths } from '../../content/imagePaths'

export interface ResizedImage {
  width: number
  height: number
  variants: { width: number; blob: Blob }[]
}

const MAX_BYTES = 30 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Validates and converts an upload to WebP at 800/1600/2400 px (never upscaled), in the browser. */
export async function resizeImage(file: File): Promise<ResizedImage> {
  if (!TYPES.includes(file.type)) throw new Error('Υποστηρίζονται μόνο εικόνες JPEG, PNG, WebP ή AVIF.')
  if (file.size > MAX_BYTES) throw new Error('Η εικόνα είναι μεγαλύτερη από 30 MB.')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Δεν ήταν δυνατή η ανάγνωση της εικόνας.')
  })
  const scale = Math.min(1, 2400 / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const variants: ResizedImage['variants'] = []
  for (const w of variantWidths(width)) {
    const h = Math.round((height * w) / width)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Η μετατροπή της εικόνας απέτυχε.'))), 'image/webp', 0.82))
    variants.push({ width: w, blob })
  }
  bitmap.close()
  return { width, height, variants }
}
