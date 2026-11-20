import type { ImageSpec } from '../lib/imageGuide'

/** Compact «what to upload here» note shown next to every image upload. */
export function ImageSpecNote({ spec, className = '' }: { spec: ImageSpec; className?: string }) {
  return (
    <div className={`rounded-md border border-stone-deep/60 bg-paper px-3 py-2 text-sm ${className}`} data-image-spec>
      <p>
        <span className="font-semibold">{spec.frame}</span>
        <span className="text-muted-paper"> · ιδανικά </span>
        <span className="font-semibold">{spec.ideal}</span>
        {spec.orientation !== 'any' && <span className="text-muted-paper"> (τουλάχιστον {spec.minWidth} px πλάτος)</span>}
      </p>
      {spec.note && <p className="mt-1 text-muted-paper">{spec.note}</p>}
    </div>
  )
}

/** Non-blocking warnings after picking a file. */
export function FitWarnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null
  return (
    <ul role="status" className="rounded-md border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronze-ink" data-fit-warning>
      {warnings.map((w) => (
        <li key={w}>⚠ {w}</li>
      ))}
    </ul>
  )
}
