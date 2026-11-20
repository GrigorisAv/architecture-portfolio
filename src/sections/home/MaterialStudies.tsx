import { useRef } from 'react'
import { EditorialFigure } from '../../components/editorial/EditorialFigure'
import { useEditorialReveals } from '../../components/editorial/useEditorialReveals'
import { Eyebrow } from '../../components/ui/Eyebrow'

/** C. Editorial project reveals: asymmetric plates revealed with offset + perspective. */
export function MaterialStudies() {
  const root = useRef<HTMLElement>(null)
  useEditorialReveals(root)

  return (
    <section ref={root} aria-labelledby="yli-title" className="overflow-clip bg-stone text-ink">
      <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
        <div className="grid-12 gap-y-8">
          <Eyebrow index="04" className="col-span-4 text-bronze-ink lg:col-span-3 lg:pt-4">
            Ύλη &amp; λεπτομέρεια
          </Eyebrow>
          <h2 id="yli-title" className="col-span-4 text-h2 lg:col-span-7" data-reveal-text>
            Εκεί όπου ο χώρος γίνεται <em className="italic">εμπειρία</em>.
          </h2>
        </div>

        <div className="grid-12 mt-[clamp(4rem,9vw,8rem)] gap-y-16 lg:gap-y-0">
          <EditorialFigure
            className="col-span-4 lg:col-span-6"
            image={{ src: 'timber-black-house', alt: 'Κατοικία με ξύλινο κουτί εισόδου, μαύρη μεταλλική επένδυση και κήπο με αμμοχάλικο', focal: '40% 50%' }}
            sizes="(min-width: 1024px) 48vw, 100vw"
            ratio="5 / 4"
            tilt={10}
            shift={7}
            captionClassName="text-muted-paper"
            caption={<><span>Ξύλο · Μέταλλο</span><span className="eyebrow">Ενδεικτική</span></>}
          />
          <EditorialFigure
            className="col-span-4 lg:col-span-4 lg:col-start-9 lg:mt-[22vh]"
            image={{ src: 'glass-stair-pool', alt: 'Αιωρούμενη ξύλινη σκάλα μπροστά από γυάλινη πρόσοψη με θέα στην πισίνα' }}
            sizes="(min-width: 1024px) 32vw, 100vw"
            ratio="3 / 4"
            tilt={8}
            shift={-8}
            captionClassName="text-muted-paper"
            caption={<><span>Διαφάνεια · Νερό</span><span className="eyebrow">Ενδεικτική</span></>}
          />
          <EditorialFigure
            className="col-span-4 lg:col-span-5 lg:col-start-3 lg:-mt-[6vh]"
            image={{ src: 'wood-wall-dining', alt: 'Καθιστικό και τραπεζαρία που ανοίγουν σε ξύλινο deck, με επένδυση ξύλου και πέτρινο τζάκι' }}
            sizes="(min-width: 1024px) 40vw, 100vw"
            ratio="4 / 3"
            tilt={9}
            shift={6}
            captionClassName="text-muted-paper"
            caption={<><span>Πέτρα · Φως</span><span className="eyebrow">Ενδεικτική</span></>}
          />
          <blockquote className="col-span-4 self-end lg:col-span-3 lg:col-start-9 lg:pb-8" data-reveal-text>
            <p className="font-display text-[clamp(1.5rem,2.2vw,2.1rem)] font-light italic leading-snug">
              «Η λεπτομέρεια δεν είναι διακόσμηση. Είναι ο τρόπος με τον οποίο ένα κτίριο αγγίζει το χέρι.»
            </p>
            <footer className="eyebrow mt-6 text-muted-paper">Σημείωμα στούντιο</footer>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
