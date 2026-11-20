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
}

/**
 * Responsive <picture>: AVIF → WebP → JPEG, intrinsic width/height (no CLS),
 * lazy by default, blur-up LQIP behind the image. Works with manifest keys or absolute URLs (CMS).
 */
export function Picture({ image, sizes, priority = false, className, imgClassName = '', style }: PictureProps) {
  const entry = getManifestEntry(image.src)
  const width = image.width ?? entry?.width
  const height = image.height ?? entry?.height
  const imgStyle: CSSProperties = {
    objectPosition: image.focal,
    backgroundImage: entry ? `url("${entry.lqip}")` : undefined,
  }

  return (
    <picture className={className} style={style}>
      {entry && <source type="image/avif" srcSet={srcSet(image.src, 'avif')} sizes={sizes} />}
      {entry && <source type="image/webp" srcSet={srcSet(image.src, 'webp')} sizes={sizes} />}
      <img
        src={fallbackSrc(image.src)}
        srcSet={entry ? srcSet(image.src, 'jpg') : undefined}
        sizes={entry ? sizes : undefined}
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
