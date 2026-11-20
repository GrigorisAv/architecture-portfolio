import { PlaceholderBadge } from './PlaceholderBadge'

/** Honest stand-in for the architect's portrait: a line drawing, never a stock face. */
export function PortraitPlaceholder({ caption = 'Η προσωπική φωτογραφία θα προστεθεί.' }: { caption?: string }) {
  return (
    <figure>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone">
        <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full text-stone-deep" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M60 440V170l140-90 140 90v270" />
            <path d="M60 170h280M200 80v360M110 440V260h180v180" />
            <circle cx="200" cy="200" r="34" />
            <path d="M20 440h360" />
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <PlaceholderBadge tone="light" label="Προσωπική φωτογραφία" />
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-muted-paper">{caption}</figcaption>
    </figure>
  )
}
