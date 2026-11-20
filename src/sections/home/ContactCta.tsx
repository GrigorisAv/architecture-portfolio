import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useEditorialReveals } from '../../components/editorial/useEditorialReveals'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { ArrowRight } from '../../components/ui/icons'

export function ContactCta({ index }: { index?: string }) {
  const root = useRef<HTMLElement>(null)
  useEditorialReveals(root)
  return (
    <section id="epikoinonia" ref={root} aria-labelledby="cta-title" className="relative overflow-hidden bg-ink text-paper outline-none">
      <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
        <Eyebrow index={index} className="text-bronze-light">Επικοινωνία</Eyebrow>
        <h2 id="cta-title" className="mt-10 max-w-[14ch] text-display" data-reveal-text>
          Ας σχεδιάσουμε τον <em className="italic text-bronze-light">χώρο</em> σας.
        </h2>
        <div className="mt-14 grid gap-10 border-t border-paper/12 pt-10 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-xl text-lead text-stone" data-reveal-text>
            Πείτε μας για το έργο σας: μια νέα κατοικία, μια ανακαίνιση ή έναν επαγγελματικό χώρο. Θα επικοινωνήσουμε μαζί σας για μια πρώτη συζήτηση.
          </p>
          <div className="flex flex-wrap gap-4" data-reveal-text>
            <Link to="/aitima-prosforas" className="btn btn-primary">
              Αίτημα Προσφοράς <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
