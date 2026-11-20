import { PageIntro } from '../components/editorial/PageIntro'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import { useSeo } from '../lib/seo'

const sections = [
  { title: 'Ποια στοιχεία συλλέγουμε', text: 'Τα στοιχεία που συμπληρώνετε στη φόρμα αιτήματος προσφοράς: ονοματεπώνυμο, email, τηλέφωνο, περιοχή, είδος και περιγραφή έργου.' },
  { title: 'Για ποιο σκοπό', text: 'Αποκλειστικά για να απαντήσουμε στο αίτημά σας και να επικοινωνήσουμε μαζί σας σχετικά με αυτό.' },
  { title: 'Για πόσο διάστημα', text: 'Το χρονικό διάστημα διατήρησης θα οριστεί στο τελικό κείμενο.' },
  { title: 'Τα δικαιώματά σας', text: 'Πρόσβαση, διόρθωση, διαγραφή και εναντίωση στην επεξεργασία, σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (ΓΚΠΔ).' },
  { title: 'Υπεύθυνος επεξεργασίας', text: 'Τα στοιχεία του υπευθύνου και ο τρόπος επικοινωνίας θα προστεθούν.' },
]

export function PrivacyPage() {
  useSeo({ title: 'Πολιτική Απορρήτου', description: 'Πώς χρησιμοποιούνται τα προσωπικά δεδομένα που υποβάλλονται μέσω του ιστότοπου ATELIER STUDIO.' })
  return (
    <>
      <PageIntro
        eyebrow="Πολιτική Απορρήτου"
        title="Τα δεδομένα σας, με διαφάνεια."
        intro="Το παρακάτω κείμενο είναι προσχέδιο. Το τελικό κείμενο θα συνταχθεί και θα ελεγχθεί νομικά πριν από τη δημοσίευση του ιστότοπου."
        aside={<PlaceholderBadge tone="light" label="Προσχέδιο" />}
      />
      <section aria-label="Περιεχόμενο πολιτικής" className="bg-paper pb-section text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)]">
          <dl className="border-t border-stone-deep lg:ml-[calc(100%/12*2)] lg:max-w-4xl">
            {sections.map((s) => (
              <div key={s.title} className="grid gap-3 border-b border-stone-deep py-8 md:grid-cols-[16rem_1fr] md:gap-10">
                <dt className="font-display text-2xl">{s.title}</dt>
                <dd className="text-muted-paper">{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  )
}
