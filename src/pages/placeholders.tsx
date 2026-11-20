import { Link, useLoaderData } from 'react-router-dom'
import { Picture } from '../components/media/Picture'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import type { Project } from '../content/types'
import { PhasePlaceholder } from './PhasePlaceholder'

export function ProjectsPage() {
  return (
    <PhasePlaceholder
      eyebrow="Έργα"
      title="Όλα τα έργα, σε ένα αρχιτεκτονικό ευρετήριο."
      description="Εδώ θα παρουσιάζεται το πλήρες portfolio με φίλτρα κατηγοριών, μεγάλες φωτογραφίες και σύνδεσμο προς την αναλυτική παρουσίαση κάθε έργου."
    />
  )
}

export function ServicesPage() {
  return (
    <PhasePlaceholder
      eyebrow="Υπηρεσίες"
      title="Από την πρώτη σκέψη έως την τελευταία λεπτομέρεια."
      description="Αρχιτεκτονικές μελέτες, interior design, ανακαινίσεις και σχεδιασμός επαγγελματικών χώρων. Η αναλυτική σελίδα θα ολοκληρωθεί στην επόμενη φάση."
    />
  )
}

export function AboutPage() {
  return (
    <PhasePlaceholder
      eyebrow="Σχετικά με εμένα"
      title="Η αρχιτέκτονας πίσω από το στούντιο."
      description="Βιογραφικό, σχεδιαστική φιλοσοφία και επαγγελματική προσέγγιση. Το περιεχόμενο θα προστεθεί όταν δοθούν τα πραγματικά στοιχεία."
    />
  )
}

export function QuotePage() {
  return (
    <PhasePlaceholder
      eyebrow="Αίτημα Προσφοράς"
      title="Ας μιλήσουμε για τον χώρο σας."
      description="Η φόρμα αιτήματος προσφοράς θα υλοποιηθεί στη Φάση 2. Δεν αποστέλλει ακόμη αιτήματα: η αποστολή θα ενεργοποιηθεί μαζί με το backend."
    />
  )
}

export function ProjectDetailPage() {
  const { project } = useLoaderData() as { project: Project }
  return (
    <PhasePlaceholder
      eyebrow="Αναλυτική παρουσίαση έργου"
      title={project.title}
      description={project.summary}
    >
      <div className="mt-10 flex items-center gap-4">
        <PlaceholderBadge tone="light" label="Ενδεικτικό έργο" />
        <Link to="/#erga" className="link-draw text-sm text-muted-paper">Πίσω στα επιλεγμένα έργα</Link>
      </div>
      <div className="media-frame mt-12 aspect-[16/9] w-full">
        <Picture image={project.cover} sizes="100vw" />
      </div>
    </PhasePlaceholder>
  )
}
