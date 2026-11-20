import type { ImageResolver } from './records'

/** Uploads are stored as WebP at these widths: `<base>-<w>.webp` (never upscaled). */
export const UPLOAD_WIDTHS = [800, 1600, 2400] as const

export function variantWidths(width: number | null): number[] {
  const w = width ?? 2400
  const list = UPLOAD_WIDTHS.filter((x) => x < w) as number[]
  list.push(Math.min(w, 2400))
  return [...new Set(list)].sort((a, b) => a - b)
}

export const variantPath = (base: string, width: number) => `${base}-${width}.webp`

/** Resolver for paths that never need a server: bundled photos and absolute/blob URLs. */
export function resolveLocalPath(path: string): { src: string } | null {
  if (path.startsWith('local:')) return { src: path.slice(6) }
  if (/^(https?:|blob:|data:)/.test(path)) return { src: path }
  return null
}

export function storageResolver(publicBase: string): ImageResolver {
  return (path, width) => {
    const local = resolveLocalPath(path)
    if (local) return local
    const widths = variantWidths(width)
    const srcset = widths.map((w) => ({ width: w, url: `${publicBase}/${variantPath(path, w)}` }))
    return { src: srcset[srcset.length - 1].url, srcset }
  }
}

export const localResolver: ImageResolver = (path) => resolveLocalPath(path) ?? { src: path }
