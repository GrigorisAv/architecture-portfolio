import type { SiteImage } from '../../content/types'

/** Marks bundled sample photos on the site; nothing is shown once a real photo is uploaded. */
export function SampleLabel({ image, short = false }: { image: SiteImage; short?: boolean }) {
  if (!image.isSample) return null
  return <span className="eyebrow">{short ? 'Ενδεικτική' : 'Ενδεικτική φωτογραφία'}</span>
}
