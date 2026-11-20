import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/ui/Eyebrow'
import { ArrowRight } from '../components/ui/icons'
import { useSeo } from '../lib/seo'

/** Holding page for routes scheduled for Phase 2. Fully styled so navigation & transitions can be reviewed. */
export function PhasePlaceholder({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  useSeo({ title, description })
  return (
    <section className="page-x relative mx-auto flex min-h-[88svh] max-w-[var(--container-page)] flex-col justify-end pb-24 pt-44">
      <Eyebrow className="text-bronze-ink">{eyebrow}</Eyebrow>
      <h1 className="mt-8 max-w-5xl text-display">{title}</h1>
      <p className="mt-8 max-w-2xl text-lead text-muted-paper">{description}</p>
      {children}
      <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-stone-deep pt-8">
        <p className="eyebrow text-muted-paper">Σε εξέλιξη · Φάση 2</p>
        <Link to="/" className="btn btn-ghost-dark">
          Επιστροφή στην αρχική <ArrowRight />
        </Link>
      </div>
    </section>
  )
}
