import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { EditorialFigure } from '../../components/editorial/EditorialFigure'
import { useEditorialReveals } from '../../components/editorial/useEditorialReveals'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { ArrowRight } from '../../components/ui/icons'
import type { Service } from '../../content/types'

/** Αρχιτεκτονική & Interior Design + service index (services come from the CMS-ready repository). */
export function Disciplines({ services }: { services: Service[] }) {
  const root = useRef<HTMLElement>(null)
  useEditorialReveals(root)

  return (
    <section id="ypiresies" ref={root} aria-labelledby="ypiresies-title" className="bg-paper text-ink outline-none">
      <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
        <div className="grid-12 gap-y-8">
          <Eyebrow index="03" className="col-span-4 text-bronze-ink lg:col-span-2 lg:pt-4">
            Πεδία
          </Eyebrow>
          <h2 id="ypiresies-title" className="col-span-4 text-h2 lg:col-span-8" data-reveal-text>
            Αρχιτεκτονική <em className="italic text-muted-paper">&amp;</em> Interior Design
          </h2>
        </div>

        {/* Architecture */}
        <div className="grid-12 mt-[clamp(3.5rem,8vw,7rem)] gap-y-10">
          <EditorialFigure
            className="col-span-4 lg:col-span-7"
            image={{ src: 'pool-villa', alt: 'Σύγχρονη διώροφη κατοικία με επάλληλες λευκές πλάκες, μεγάλα υαλοστάσια και πισίνα στον κήπο' }}
            sizes="(min-width: 1024px) 58vw, 100vw"
            ratio="4 / 3"
            tilt={9}
            shift={5}
            caption={<><span>Κέλυφος και τοπίο</span><span className="eyebrow">Ενδεικτική φωτογραφία</span></>}
          />
          <div className="col-span-4 flex flex-col justify-end lg:col-span-4 lg:col-start-9 lg:pb-16">
            <p className="eyebrow text-bronze-ink" data-reveal-text>Αρχιτεκτονική</p>
            <h3 className="mt-5 text-h3" data-reveal-text>Κτίρια που ανήκουν στον τόπο τους.</h3>
            <p className="mt-5 text-muted-paper" data-reveal-text>
              Νέες κατοικίες και κτίρια με αφετηρία το οικόπεδο, τον προσανατολισμό και το τοπίο: από το πρώτο σκίτσο έως τα κατασκευαστικά σχέδια.
            </p>
          </div>
        </div>

        {/* Interiors (offset, mirrored) */}
        <div className="grid-12 mt-[clamp(5rem,12vw,11rem)] gap-y-10">
          <div className="order-2 col-span-4 flex flex-col justify-start lg:order-1 lg:col-span-4 lg:col-start-1 lg:pt-24">
            <p className="eyebrow text-bronze-ink" data-reveal-text>Εσωτερικοί χώροι</p>
            <h3 className="mt-5 text-h3" data-reveal-text>Ατμόσφαιρα, υφή και λεπτομέρεια.</h3>
            <p className="mt-5 text-muted-paper" data-reveal-text>
              Η κάτοψη, τα υλικά, ο φωτισμός και τα έπιπλα σχεδιάζονται μαζί, ώστε κάθε εσωτερικό να έχει μία καθαρή, ήρεμη ταυτότητα.
            </p>
          </div>
          <EditorialFigure
            className="order-1 col-span-4 lg:order-2 lg:col-span-7 lg:col-start-6"
            image={{ src: 'dining-stair-interior', alt: 'Τραπεζαρία με σκούρο ξύλινο τραπέζι μπροστά από γυάλινο διαχωριστικό, ξύλινη επένδυση και ανοιχτό κλιμακοστάσιο' }}
            sizes="(min-width: 1024px) 58vw, 100vw"
            ratio="3 / 2"
            tilt={9}
            shift={-5}
            caption={<><span>Φως και διαφάνεια</span><span className="eyebrow">Ενδεικτική φωτογραφία</span></>}
          />
        </div>

        {/* Service index */}
        <div className="grid-12 mt-[clamp(6rem,14vw,12rem)]">
          <div className="col-span-4 lg:col-span-10 lg:col-start-3">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-stone-deep pb-6">
              <p className="eyebrow text-bronze-ink">Υπηρεσίες</p>
              <p className="text-sm text-muted-paper">Οι περιγραφές είναι προσωρινές και θα οριστικοποιηθούν.</p>
            </div>
            <ul>
              {services.map((s) => (
                <li key={s.id} className="border-b border-stone-deep" data-reveal-text>
                  <Link
                    to={`/ypiresies#${s.slug}`}
                    className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-6 gap-y-2 py-8 md:grid-cols-[4rem_1.1fr_1fr_auto] md:py-10"
                  >
                    <span className="font-display text-lg italic text-bronze-ink" aria-hidden="true">{String(s.order).padStart(2, '0')}</span>
                    <span className="font-display text-[clamp(1.6rem,3vw,2.75rem)] font-light leading-tight tracking-[-0.015em] transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-2 group-hover:italic">
                      {s.title}
                    </span>
                    <span className="col-span-2 col-start-2 text-muted-paper md:col-span-1 md:col-start-3">{s.summary}</span>
                    <ArrowRight className="row-start-1 col-start-3 h-3 w-6 self-center text-ink transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1 md:col-start-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
