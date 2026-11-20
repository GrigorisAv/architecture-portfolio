import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useEditorialReveals } from '../../components/editorial/useEditorialReveals'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { ArrowRight } from '../../components/ui/icons'
import { PlaceholderBadge } from '../../components/ui/PlaceholderBadge'
import type { SiteSettings } from '../../content/types'

const approach = [
  { n: '01', title: 'Ακρόαση', text: 'Συζήτηση, επίσκεψη στον χώρο και καταγραφή αναγκών, ορίων και προσδοκιών.' },
  { n: '02', title: 'Ιδέα', text: 'Πρώτες προτάσεις σε σκίτσα, μακέτες και αναφορές υλικών.' },
  { n: '03', title: 'Μελέτη', text: 'Αναλυτικά σχέδια, προδιαγραφές, φωτισμός και επιλογές επίπλωσης.' },
  { n: '04', title: 'Υλοποίηση', text: 'Συντονισμός συνεργατών και επίβλεψη έως την τελευταία λεπτομέρεια.' },
]

export function ArchitectProfile({ settings }: { settings: SiteSettings }) {
  const root = useRef<HTMLElement>(null)
  useEditorialReveals(root)
  const name = settings.architectName ?? 'Όνομα Αρχιτέκτονα'

  return (
    <section id="architektonas" ref={root} aria-labelledby="architektonas-title" className="bg-paper text-ink outline-none">
      <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
        <div className="grid-12 gap-y-16">
          {/* Portrait placeholder: no stock face pretending to be the architect */}
          <figure className="col-span-4 lg:col-span-5" data-reveal-text>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone">
              <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full text-stone-deep" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
                <g fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M60 440V170l140-90 140 90v270" />
                  <path d="M60 170h280M200 80v360M110 440V260h180v180" />
                  <circle cx="200" cy="200" r="34" />
                  <path d="M20 440h360" />
                </g>
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                <PlaceholderBadge tone="light" label="Προσωπική φωτογραφία" />
              </div>
            </div>
            <figcaption className="mt-4 text-sm text-muted-paper">Η προσωπική φωτογραφία θα προστεθεί.</figcaption>
          </figure>

          <div className="col-span-4 lg:col-span-6 lg:col-start-7">
            <Eyebrow index="05" className="text-bronze-ink">Η αρχιτέκτονας</Eyebrow>
            <h2 id="architektonas-title" className="mt-8 text-h2" data-reveal-text>
              {settings.architectName ? name : <span className="text-muted-paper">[{name}]</span>}
            </h2>
            <p className="eyebrow mt-4 text-muted-paper" data-reveal-text>{settings.architectRole} · Ιδρύτρια του ATELIER STUDIO</p>

            <div className="mt-10 border-l border-bronze pl-6" data-reveal-text>
              <PlaceholderBadge tone="light" label="Προσωρινό κείμενο" />
              <p className="mt-4 max-w-xl text-lead text-muted-paper">
                Εδώ θα παρουσιαστεί η διαδρομή της αρχιτέκτονα: σπουδές, επαγγελματική εμπειρία και όσα διαμορφώνουν τη ματιά της στον χώρο.
              </p>
            </div>

            <h3 className="eyebrow mt-16 text-bronze-ink">Η προσέγγιση</h3>
            <ol className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {approach.map((step) => (
                <li key={step.n} className="border-t border-stone-deep py-6" data-reveal-text>
                  <p className="flex items-baseline gap-4">
                    <span className="font-display italic text-bronze-ink" aria-hidden="true">{step.n}</span>
                    <span className="font-display text-2xl">{step.title}</span>
                  </p>
                  <p className="mt-3 text-muted-paper">{step.text}</p>
                </li>
              ))}
            </ol>

            <Link to="/sxetika" className="btn btn-ghost-dark mt-12">
              Περισσότερα για εμένα <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
