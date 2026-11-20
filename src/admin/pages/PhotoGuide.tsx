import { Link } from 'react-router-dom'
import { gallerySpec, GENERAL_RULES, IMAGE_SPECS, type ImageSpec } from '../lib/imageGuide'
import { PageHeader, Panel } from '../ui/kit'

type Row = { label: string; spec: ImageSpec }

const SECTIONS: { title: string; to: string; rows: Row[]; footnote?: string }[] = [
  {
    title: 'Αρχική σελίδα',
    to: '/diaxeirisi/arxiki',
    rows: [
      { label: 'Κεντρική εικόνα (hero)', spec: IMAGE_SPECS.hero },
      { label: 'Φιλοσοφία', spec: IMAGE_SPECS.philosophy },
      { label: 'Πεδία · Αρχιτεκτονική', spec: IMAGE_SPECS.architecture },
      { label: 'Πεδία · Εσωτερικοί χώροι', spec: IMAGE_SPECS.interiors },
      { label: 'Ύλη · 1η (Ξύλο · Μέταλλο)', spec: IMAGE_SPECS.material1 },
      { label: 'Ύλη · 2η (Διαφάνεια · Νερό)', spec: IMAGE_SPECS.material2 },
      { label: 'Ύλη · 3η (Πέτρα · Φως)', spec: IMAGE_SPECS.material3 },
    ],
  },
  {
    title: 'Έργα',
    to: '/diaxeirisi/erga',
    rows: [
      { label: 'Εξώφυλλο έργου', spec: IMAGE_SPECS.projectCover },
      { label: 'Φωτογραφία 1η, 4η, 7η…', spec: gallerySpec(0) },
      { label: 'Φωτογραφία 2η, 5η, 8η…', spec: gallerySpec(1) },
      { label: 'Φωτογραφία 3η, 6η, 9η…', spec: gallerySpec(2) },
      { label: 'Σχέδια / κατόψεις / renders', spec: IMAGE_SPECS.drawing },
    ],
    footnote: 'Ταξινομήστε τις φωτογραφίες ώστε κάθε μία να πέφτει σε κάδρο που της ταιριάζει (π.χ. πανοραμική όψη → οριζόντια → κάθετη λεπτομέρεια).',
  },
  { title: 'Υπηρεσίες', to: '/diaxeirisi/ypiresies', rows: [{ label: 'Φωτογραφία υπηρεσίας', spec: IMAGE_SPECS.service }] },
  {
    title: 'Σελίδα «Σχετικά»',
    to: '/diaxeirisi/sxetika',
    rows: [
      { label: 'Προσωπική φωτογραφία (πορτρέτο)', spec: IMAGE_SPECS.portrait },
      { label: 'Επαγγελματική προσέγγιση', spec: IMAGE_SPECS.aboutApproach },
    ],
  },
]

export function PhotoGuide() {
  return (
    <>
      <PageHeader title="Οδηγός φωτογραφιών" description="Τι διαστάσεις χρειάζεται κάθε θέση του ιστότοπου. Οι ίδιες οδηγίες εμφανίζονται και δίπλα σε κάθε ανέβασμα." />
      <div className="flex flex-col gap-6">
        <Panel title="Γενικοί κανόνες">
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>{GENERAL_RULES}</li>
            <li>Οι φωτογραφίες κόβονται αυτόματα στο κάδρο κάθε θέσης κρατώντας το κέντρο: το βασικό θέμα στο κέντρο, όχι στις άκρες.</li>
            <li>Αν μια φωτογραφία είναι μικρή ή σε λάθος προσανατολισμό για τη θέση της, το CMS εμφανίζει προειδοποίηση (⚠) μετά το ανέβασμα.</li>
            <li>Συμπληρώνετε πάντα την περιγραφή (alt): μια σύντομη πρόταση για το τι δείχνει η φωτογραφία.</li>
            <li>Μόνο φωτογραφίες που σας ανήκουν ή για τις οποίες έχετε άδεια.</li>
          </ul>
        </Panel>
        {SECTIONS.map((sec) => (
          <Panel key={sec.title} title={sec.title} actions={<Link to={sec.to} className="text-sm underline">Μετάβαση</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-muted-paper">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Θέση</th>
                    <th className="py-2 pr-4 font-semibold">Κάδρο</th>
                    <th className="py-2 pr-4 font-semibold">Ιδανικά</th>
                    <th className="py-2 font-semibold">Ελάχιστο πλάτος</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.rows.map((r) => (
                    <tr key={r.label} className="border-t border-stone-deep/50 align-top">
                      <td className="py-2.5 pr-4 font-semibold">
                        {r.label}
                        {r.spec.note && <p className="mt-1 font-normal text-muted-paper">{r.spec.note}</p>}
                      </td>
                      <td className="py-2.5 pr-4">{r.spec.frame}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">{r.spec.ideal}</td>
                      <td className="py-2.5 whitespace-nowrap">{r.spec.minWidth} px</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sec.footnote && <p className="mt-3 text-sm text-muted-paper">{sec.footnote}</p>}
          </Panel>
        ))}
      </div>
    </>
  )
}
