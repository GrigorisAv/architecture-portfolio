import type { ReactNode } from 'react'

/** Section label: "02 — Επιλεγμένα έργα". */
export function Eyebrow({ index, children, className = '' }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-4 ${className}`}>
      {index && <span aria-hidden="true">{index}</span>}
      {index && <span className="h-px w-10 bg-current opacity-50" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  )
}
