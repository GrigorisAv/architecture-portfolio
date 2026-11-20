/** Visible marker for demo content. Required by the brief: no fake projects passed off as real. */
export function PlaceholderBadge({ label = 'Ενδεικτικό', tone = 'dark' }: { label?: string; tone?: 'dark' | 'light' }) {
  const color = tone === 'dark' ? 'text-stone border-stone/40' : 'text-muted-paper border-muted-paper/40'
  return (
    <span className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.16em] uppercase ${color}`}>
      <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
