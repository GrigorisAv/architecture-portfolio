export function HydrateFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-ink text-muted-ink" role="status" aria-live="polite">
      <span className="eyebrow">Φόρτωση…</span>
    </div>
  )
}
