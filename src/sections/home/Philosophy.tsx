import { useRef } from 'react'
import { EditorialFigure } from '../../components/editorial/EditorialFigure'
import { useEditorialReveals } from '../../components/editorial/useEditorialReveals'
import { Words } from '../../components/editorial/WordReveal'
import { Eyebrow } from '../../components/ui/Eyebrow'

const principles = [
  { numeral: 'I', title: 'Φως', text: 'Ο προσανατολισμός, οι σκιές και οι αντανακλάσεις οργανώνουν τον χώρο πριν από κάθε άλλη απόφαση.' },
  { numeral: 'II', title: 'Ύλη', text: 'Πέτρα, ξύλο, ασβέστης και λινό: λίγα, ειλικρινή υλικά που αποκτούν αξία με τον χρόνο.' },
  { numeral: 'III', title: 'Αναλογία', text: 'Ήρεμες γεωμετρίες και μετρημένες αποστάσεις, ώστε κάθε χώρος να μοιάζει αυτονόητος.' },
]

export function Philosophy() {
  const root = useRef<HTMLElement>(null)
  useEditorialReveals(root)

  return (
    <section id="filosofia" ref={root} aria-labelledby="filosofia-title" className="relative bg-paper text-ink outline-none">
      <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
        <div className="grid-12 gap-y-10">
          <Eyebrow index="01" className="col-span-4 text-bronze-ink lg:col-span-2 lg:pt-5">
            Φιλοσοφία
          </Eyebrow>

          <h2 id="filosofia-title" data-reveal-words className="col-span-4 text-display lg:col-span-10">
            <Words text="Ο χώρος δεν σχεδιάζεται για να εντυπωσιάσει." />{' '}
            <span className="text-muted-paper">
              <Words text="Σχεδιάζεται για να" /> <Words text="κατοικηθεί." italic />
            </span>
          </h2>
        </div>

        <div className="grid-12 mt-[clamp(4rem,10vw,9rem)] gap-y-16">
          <EditorialFigure
            className="col-span-4 lg:col-span-5"
            image={{ src: 'oak-stair-detail', alt: 'Λευκό κλιμακοστάσιο με δρύινα σκαλοπάτια, μαύρο μεταλλικό κιγκλίδωμα και κρεμαστά φωτιστικά', focal: '50% 40%' }}
            sizes="(min-width: 1024px) 40vw, 100vw"
            ratio="4 / 5"
            tilt={8}
            shift={-6}
            caption={
              <>
                <span>Λεπτομέρεια κλιμακοστασίου</span>
                <span className="eyebrow">Ενδεικτική φωτογραφία</span>
              </>
            }
          />

          <div className="col-span-4 flex flex-col justify-end lg:col-span-6 lg:col-start-7">
            <p data-reveal-text className="max-w-[34rem] text-lead text-muted-paper">
              Κάθε έργο ξεκινά από μια προσεκτική ακρόαση: του τόπου, του φωτός και των ανθρώπων που θα ζήσουν εκεί. Από εκεί προκύπτει μια
              αρχιτεκτονική χωρίς περιττά στοιχεία, όπου η ησυχία είναι η πραγματική πολυτέλεια.
            </p>

            <ol className="mt-16 border-t border-stone-deep">
              {principles.map((p) => (
                <li key={p.title} data-reveal-text className="grid grid-cols-[3.5rem_1fr] gap-x-6 border-b border-stone-deep py-7 md:grid-cols-[4rem_10rem_1fr]">
                  <span className="font-display text-xl italic text-bronze-ink" aria-hidden="true">
                    {p.numeral}
                  </span>
                  <h3 className="font-display text-h3">{p.title}</h3>
                  <p className="col-start-2 mt-2 text-muted-paper md:col-start-3 md:mt-1">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
