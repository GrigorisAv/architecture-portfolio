import type { CSSProperties } from 'react'
import type { ImageAsset } from '../../content/types'
import { fallbackSrc, getManifestEntry, srcSet } from '../../content/images'

interface PictureProps {
  image: ImageAsset
  /** Real rendered width hint, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string
  /** Above-the-fold LCP image: eager + high priority. */
  priority?: boolean
  className?: string
  imgClassName?: string
  style?: CSSProperties
  /** Blur-up placeholder behind the image (off for letterboxed/contain images). */
  blur?: boolean
}

/**
 * Responsive <picture>: AVIF → WebP → JPEG, intrinsic width/height (no CLS),
 * lazy by default, blur-up LQIP behind the image. Works with manifest keys or absolute URLs (CMS).
 */
export function Picture({ image, sizes, priority = false, className, imgClassName = '', style, blur = true }: PictureProps) {
  const entry = getManifestEntry(image.src)
  const width = image.width ?? entry?.width
  const height = image.height ?? entry?.height
  const imgStyle: CSSProperties = {
    objectPosition: image.focal,
    backgroundImage: entry && blur ? `url("${entry.lqip}")` : undefined,
  }

  return (
    <picture className={className} style={style}>
      {entry && <source type="image/avif" srcSet={srcSet(image.src, 'avif')} sizes={sizes} />}
      {entry && <source type="image/webp" srcSet={srcSet(image.src, 'webp')} sizes={sizes} />}
      <img
        src={entry ? fallbackSrc(image.src) : (image.srcset?.find((v) => v.width >= 1600)?.url ?? image.src)}
        srcSet={entry ? srcSet(image.src, 'jpg') : image.srcset?.map((v) => `${v.url} ${v.width}w`).join(', ')}
        sizes={entry || image.srcset ? sizes : undefined}
        alt={image.alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={imgClassName}
        style={imgStyle}
        draggable={false}
      />
    </picture>
  )
}
