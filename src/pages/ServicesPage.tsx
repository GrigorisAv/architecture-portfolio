import { useRef } from 'react'
import { Link, useLoaderData, useLocation } from 'react-router-dom'
import { EditorialFigure } from '../components/editorial/EditorialFigure'
import { PageIntro } from '../components/editorial/PageIntro'
import { useEditorialReveals } from '../components/editorial/useEditorialReveals'
import { handleNavClick } from '../components/layout/navLinkHandler'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import type { Service } from '../content/types'
import { useSeo } from '../lib/seo'
import { ContactCta } from '../sections/home/ContactCta'

/** A real sequence, so numbering carries meaning here. */
const process = [
  { title: 'Πρώτη συνάντηση', text: 'Γνωριμία, επίσκεψη στον χώρο και συζήτηση για ανάγκες, χρονοδιάγραμμα και προϋπολογισμό.' },
  { title: 'Πρόταση', text: 'Πρώτες ιδέες σε σκίτσα, αναφορές και μια σαφή πρόταση συνεργασίας.' },
  { title: 'Μελέτη', text: 'Ανάπτυξη του σχεδιασμού: σχέδια, υλικά, φωτισμός και οπτικοποιήσεις.' },
  { title: 'Άδειες & προσφορές', text: 'Φάκελος αδειών όπου απαιτείται και σύγκριση προσφορών από συνεργάτες.' },
  { title: 'Υλοποίηση', text: 'Συντονισμός και επίβλεψη των εργασιών έως την τελική παράδοση.' },
]

export function ServicesPage() {
  const { services } = useLoaderData() as { services: Service[] }
  const { pathname } = useLocation()
  const root = useRef<HTMLDivElement>(null)
  useEditorialReveals(root)
  useSeo({
    title: 'Υπηρεσίες',
    description: 'Αρχιτεκτονικές μελέτες, interior design, ανακαινίσεις και σχεδιασμός επαγγελματικών χώρων από το DS Architect.',
  })

  return (
    <div ref={root}>
      <PageIntro
        eyebrow="Υπηρεσίες"
        title={
          <>
            Από την πρώτη σκέψη έως την <em className="italic">τελευταία λεπτομέρεια</em>.
          </>
        }
        intro="Τέσσερα πεδία, μία προσέγγιση: προσεκτική ακρόαση, καθαρές ιδέες και προσωπική παρακολούθηση κάθε έργου."
      >
        <nav aria-label="Υπηρεσίες σε αυτή τη σελίδα" className="mt-14 border-t border-stone-deep">
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <li key={s.id} className="border-b border-stone-deep sm:odd:border-r lg:border-r lg:last:border-r-0">
                <Link
                  to={`/ypiresies#${s.slug}`}
                  onClick={(e) => handleNavClick(e, `/ypiresies#${s.slug}`, pathname)}
                  className="group flex min-h-24 items-start gap-4 p-5 transition-colors hover:bg-stone/40"
                >
                  <span className="font-display italic text-bronze-ink" aria-hidden="true">{String(s.order).padStart(2, '0')}</span>
                  <span className="font-display text-xl leading-snug group-hover:italic">{s.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </PageIntro>

      {services.map((s, i) => {
        const flip = i % 2 === 1
        return (
          <section key={s.id} id={s.slug} aria-labelledby={`${s.slug}-title`} className="bg-paper text-ink outline-none">
            <div className="page-x mx-auto max-w-[var(--container-page)] py-[clamp(4rem,9vw,8rem)]">
              <div className="grid-12 items-start gap-y-12 border-t border-stone-deep pt-[clamp(3rem,6vw,5rem)]">
                <EditorialFigure
                  className={`col-span-4 lg:col-span-6 ${flip ? 'lg:order-2 lg:col-start-7' : ''}`}
                  image={s.image}
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  ratio="4 / 3"
                  tilt={8}
                  shift={flip ? -6 : 6}
                  caption={<><span>{s.title}</span><span className="eyebrow">Ενδεικτική φωτογραφία</span></>}
                />
                <div className={`col-span-4 lg:col-span-5 ${flip ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-8'}`}>
                  <p className="font-display text-5xl italic text-bronze-ink" aria-hidden="true">{String(s.order).padStart(2, '0')}</p>
                  <h2 id={`${s.slug}-title`} className="mt-6 text-h2" data-reveal-text>{s.title}</h2>
                  <p className="mt-6 text-lead" data-reveal-text>{s.summary}</p>
                  <div className="mt-6 space-y-4 text-muted-paper">
                    {s.body.map((p, k) => <p key={k} data-reveal-text>{p}</p>)}
                  </div>
                  <h3 className="eyebrow mt-12 text-bronze-ink">Τι περιλαμβάνει</h3>
                  <ul className="mt-4 border-t border-stone-deep">
                    {s.includes.map((item) => (
                      <li key={item} className="flex items-baseline gap-4 border-b border-stone-deep py-3.5">
                        <span className="h-px w-4 shrink-0 translate-y-[-0.3em] bg-bronze" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {s.isPlaceholder && <div className="mt-6"><PlaceholderBadge tone="light" label="Προσωρινή περιγραφή" /></div>}
                </div>
              </div>
            </div>
          </section>
        )
      })}

      <section aria-labelledby="process-title" className="bg-stone text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
          <div className="grid-12 gap-y-6">
            <p className="eyebrow col-span-4 text-bronze-ink lg:col-span-3 lg:pt-3">Διαδικασία</p>
            <h2 id="process-title" className="col-span-4 text-h2 lg:col-span-8" data-reveal-text>
              Πώς εξελίσσεται <em className="italic">ένα έργο</em>.
            </h2>
          </div>
          <ol className="mt-[clamp(3rem,7vw,6rem)] grid gap-x-6 gap-y-10 border-t border-ink/20 pt-10 sm:grid-cols-2 lg:grid-cols-5">
            {process.map((step, i) => (
              <li key={step.title} data-reveal-text className="relative">
                <p className="flex items-center gap-3">
                  <span className="font-display text-3xl italic text-bronze-ink">{String(i + 1).padStart(2, '0')}</span>
                  <span className="hidden h-px flex-1 bg-ink/20 lg:block" aria-hidden="true" />
                </p>
                <h3 className="mt-5 font-display text-2xl">{step.title}</h3>
                <p className="mt-3 text-muted-paper">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ContactCta />
    </div>
  )
}
