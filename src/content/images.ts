import manifest from './generated/image-manifest.json'
import type { ImageAsset } from './types'

export interface ManifestEntry {
  width: number
  height: number
  widths: number[]
  dominant: string
  tint: string
  lqip: string
}

const entries = manifest as Record<string, ManifestEntry>
const BASE = import.meta.env.BASE_URL

export function getManifestEntry(src: string): ManifestEntry | undefined {
  return entries[src]
}

export function srcSet(src: string, ext: 'avif' | 'webp' | 'jpg'): string | undefined {
  const entry = entries[src]
  if (!entry) return undefined
  return entry.widths.map((w) => `${BASE}images/${src}-${w}.${ext} ${w}w`).join(', ')
}

export function fallbackSrc(src: string, preferred = 1600): string {
  const entry = entries[src]
  if (!entry) return src // absolute URL (CMS)
  const w = entry.widths.find((x) => x >= preferred) ?? entry.widths[entry.widths.length - 1]
  return `${BASE}images/${src}-${w}.jpg`
}

/** Dark, text-safe tint derived from the photo (paper text ≥ 7:1). */
export function tintFor(image: ImageAsset, fallback = '#191919'): string {
  return entries[image.src]?.tint ?? fallback
}
