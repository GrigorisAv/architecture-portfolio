import type { ReactNode } from 'react'
import { Picture } from '../media/Picture'
import type { ImageAsset } from '../../content/types'

interface EditorialFigureProps {
  image: ImageAsset
  sizes: string
  /** CSS aspect-ratio, e.g. "4 / 5". Reserves space → no layout shift. */
  ratio: string
  caption?: ReactNode
  className?: string
  /** Initial rotateX (deg) and rotateY (deg) for the desktop reveal. */
  tilt?: number
  shift?: number
  captionClassName?: string
}

export function EditorialFigure({ image, sizes, ratio, caption, className = '', tilt, shift, captionClassName = 'text-muted-paper' }: EditorialFigureProps) {
  return (
    <figure data-reveal-figure data-reveal-tilt={tilt} data-reveal-shift={shift} className={className}>
      <div data-reveal-clip className="media-frame w-full will-change-transform" style={{ aspectRatio: ratio }}>
        <div data-reveal-inner className="absolute inset-x-0 -inset-y-[8%]">
          <Picture image={image} sizes={sizes} className="absolute inset-0" imgClassName="h-full w-full" />
        </div>
      </div>
      {caption && <figcaption className={`mt-4 flex items-baseline justify-between gap-6 text-sm ${captionClassName}`}>{caption}</figcaption>}
    </figure>
  )
}
