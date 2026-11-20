/**
 * Local demo content (Phase 1–2). Everything here is PLACEHOLDER material,
 * flagged with `isPlaceholder: true` and labeled in the UI.
 * Photos: Unsplash (see assets-src/photos/SOURCES.md). They are NOT works of the studio.
 */
import type { Project, ProjectCategory, Service, SiteSettings } from '../types'

export const categories: ProjectCategory[] = [
  { id: 'cat-residential', slug: 'katoikies', label: 'Κατοικίες', order: 1 },
  { id: 'cat-interiors', slug: 'esoterikoi-xoroi', label: 'Εσωτερικοί χώροι', order: 2 },
  { id: 'cat-renovation', slug: 'anakainiseis', label: 'Ανακαινίσεις', order: 3 },
  { id: 'cat-commercial', slug: 'epaggelmatikoi-xoroi', label: 'Επαγγελματικοί χώροι', order: 4 },
]

export const projects: Project[] = [
  {
    id: 'p-01',
    slug: 'oikia-tou-orizonta',
    title: 'Οικία του Ορίζοντα',
    categoryId: 'cat-residential',
    summary:
      'Οριζόντιες πλάκες που σκιάζουν, μια δεξαμενή νερού που καθρεφτίζει τον ουρανό και εσωτερικοί χώροι που ανοίγουν ολόκληροι προς το φως.',
    status: 'published',
    featured: true,
    featuredOrder: 1,
    cover: { src: 'white-villa-pool', alt: 'Λευκή διώροφη κατοικία με ξύλινη οροφή στη στέγαση και πισίνα υπερχείλισης μπροστά από τη γυάλινη πρόσοψη' },
    gallery: [],
    isPlaceholder: true,
  },
  {
    id: 'p-02',
    slug: 'lefkos-ogkos',
    title: 'Λευκός Όγκος',
    categoryId: 'cat-residential',
    summary:
      'Καθαροί κυβικοί όγκοι, μικρά ανοίγματα και ασβεστωμένες επιφάνειες: μια σύγχρονη ανάγνωση της κυκλαδίτικης κατοικίας.',
    status: 'published',
    featured: true,
    featuredOrder: 2,
    cover: { src: 'cycladic-white-house', alt: 'Λευκή κατοικία από επάλληλους κυβικούς όγκους με μικρά τετράγωνα παράθυρα, κάτω από πεύκα', focal: '50% 45%' },
    gallery: [],
    isPlaceholder: true,
  },
  {
    id: 'p-03',
    slug: 'esoteriko-fos',
    title: 'Εσωτερικό Φως',
    categoryId: 'cat-interiors',
    summary:
      'Ένα καθιστικό ανοιχτής κάτοψης όπου το ξύλο, ο λευκός σοβάς και τα μαλακά υφάσματα ισορροπούν με το φυσικό φως.',
    status: 'published',
    featured: true,
    featuredOrder: 3,
    cover: { src: 'warm-living-interior', alt: 'Φωτεινό καθιστικό με λευκό καναπέ, στρογγυλά τραπεζάκια και ξύλινη επένδυση τοίχου δίπλα σε μεγάλα ανοίγματα' },
    gallery: [],
    isPlaceholder: true,
  },
  {
    id: 'p-04',
    slug: 'proopsi-apo-xylo',
    title: 'Πρόσοψη από Ξύλο',
    categoryId: 'cat-residential',
    summary:
      'Σκούρες επιφάνειες, ξύλινες περσίδες και φωτισμένη είσοδος: μια πρόσοψη που αλλάζει χαρακτήρα από τη μέρα στη νύχτα.',
    status: 'published',
    featured: true,
    featuredOrder: 4,
    cover: { src: 'dark-facade-timber', alt: 'Σκούρα πρόσοψη κατοικίας με κάθετες ξύλινες περσίδες και ζεστό φως στην είσοδο το σούρουπο', focal: '50% 60%' },
    gallery: [],
    isPlaceholder: true,
  },
  {
    id: 'p-05',
    slug: 'gyalino-atelie',
    title: 'Γυάλινο Ατελιέ',
    categoryId: 'cat-commercial',
    summary:
      'Ένας χώρος εργασίας με γυάλινα κελύφη, εμφανές σκυρόδεμα και θέα στο πράσινο, σχεδιασμένος για συγκέντρωση και συνεργασία.',
    status: 'published',
    featured: true,
    featuredOrder: 5,
    cover: { src: 'glass-workspace', alt: 'Χώρος εργασίας με γυάλινους τοίχους, εμφανές σκυρόδεμα στην οροφή και μακρύ τραπέζι συσκέψεων' },
    gallery: [],
    isPlaceholder: true,
  },
]

export const services: Service[] = [
  {
    id: 's-01',
    slug: 'arxitektonikes-meletes',
    title: 'Αρχιτεκτονικές Μελέτες',
    summary: 'Από την πρώτη ιδέα έως την άδεια και την κατασκευή, για νέες κατοικίες και κτίρια.',
    order: 1,
    isPlaceholder: true,
  },
  {
    id: 's-02',
    slug: 'interior-design',
    title: 'Interior Design',
    summary: 'Κάτοψη, υλικά, φωτισμός, έπιπλα και λεπτομέρειες, ως μία ενιαία σύνθεση.',
    order: 2,
    isPlaceholder: true,
  },
  {
    id: 's-03',
    slug: 'anakainiseis',
    title: 'Ανακαινίσεις',
    summary: 'Νέα ζωή σε υπάρχοντες χώρους, με σεβασμό στη μνήμη και στις ανάγκες του σήμερα.',
    order: 3,
    isPlaceholder: true,
  },
  {
    id: 's-04',
    slug: 'epaggelmatikoi-xoroi',
    title: 'Σχεδιασμός Επαγγελματικών Χώρων',
    summary: 'Γραφεία, καταστήματα και χώροι φιλοξενίας που εκφράζουν την ταυτότητα κάθε επιχείρησης.',
    order: 4,
    isPlaceholder: true,
  },
]

export const siteSettings: SiteSettings = {
  studioName: 'ATELIER STUDIO',
  tagline: 'Η τέχνη του χώρου',
  architectName: null,
  architectRole: 'Αρχιτέκτων Μηχανικός',
  email: null,
  phone: null,
  address: null,
  instagram: null,
  seo: {
    title: 'ATELIER STUDIO — Αρχιτεκτονική & Εσωτερικοί Χώροι',
    description:
      'ATELIER STUDIO: ανεξάρτητο στούντιο αρχιτεκτονικής και εσωτερικού σχεδιασμού. Κατοικίες, ανακαινίσεις και επαγγελματικοί χώροι με μεσογειακό φως και καθαρές αναλογίες.',
  },
}
