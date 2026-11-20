/** Inline SVG icons (no emoji, no icon font). Decorative by default. */
type IconProps = { className?: string; title?: string }

export function ArrowRight({ className = 'h-3 w-5', title }: IconProps) {
  return (
    <svg viewBox="0 0 20 12" fill="none" className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d="M0 6h18.5M13.5 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function Monogram({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M14 50 32 14l18 36M21 37h22" stroke="currentColor" strokeWidth="2.2" />
      <path d="M10 54h44" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
