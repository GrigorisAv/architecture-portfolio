import { useState } from 'react'
import { HOME_DEFAULTS, HOME_IMAGE_SLOTS, isSamplePath, type HomeImageSlot, type HomeRecord, type SlotImage } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { IMAGE_SPECS } from '../lib/imageGuide'
import { MediaPicker } from '../ui/MediaPicker'
import { Button, ErrorNote, Field, Loading, PageHeader, Panel } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'

const SLOT_INFO: Record<HomeImageSlot, { section: string; label: string }> = {
  hero: { section: 'Πρώτη εικόνα', label: 'Κεντρική εικόνα (hero)' },
  philosophy: { section: 'Ενότητα «Φιλοσοφία»', label: 'Φωτογραφία φιλοσοφίας' },
  architecture: { section: 'Ενότητα «Πεδία»', label: 'Αρχιτεκτονική' },
  interiors: { section: 'Ενότητα «Πεδία»', label: 'Εσωτερικοί χώροι' },
  material1: { section: 'Ενότητα «Ύλη & λεπτομέρεια»', label: 'Πρώτη εικόνα · Ξύλο · Μέταλλο' },
  material2: { section: 'Ενότητα «Ύλη & λεπτομέρεια»', label: 'Δεύτερη εικόνα · Διαφάνεια · Νερό' },
  material3: { section: 'Ενότητα «Ύλη & λεπτομέρεια»', label: 'Τρίτη εικόνα · Πέτρα · Φως' },
}

export function HomeEditor() {
  const { api } = useAdmin()
  const loaded = useLoad(() => api.getHome(), [api])
  if (loaded.error) return <ErrorNote message={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loading />
  return <HomeForm initial={loaded.data} />
}

function HomeForm({ initial }: { initial: HomeRecord }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [h, setH] = useState<HomeRecord>(initial)
  const [saved, setSaved] = useState<HomeRecord>(initial)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(h) !== JSON.stringify(saved)
  useBeforeUnload(dirty)

  const setSlot = (slot: HomeImageSlot, v: SlotImage) => setH((x) => ({ images: { ...x.images, [slot]: v } }))
  const missingAlt = HOME_IMAGE_SLOTS.filter((s) => !h.images[s].alt.trim())

  const save = async () => {
    if (missingAlt.length) {
      toast('error', 'Συμπληρώστε την περιγραφή (alt) σε κάθε φωτογραφία πριν την αποθήκευση.')
      return
    }
    setBusy(true)
    try {
      await api.saveHome(h)
      setSaved(h)
      toast('success', 'Οι φωτογραφίες της αρχικής αποθηκεύτηκαν.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Αρχική σελίδα"
        description="Οι φωτογραφίες της αρχικής. Μέχρι να ανεβάσετε δικές σας, εμφανίζονται ενδεικτικές φωτογραφίες με την ένδειξη «Ενδεικτική φωτογραφία»."
        actions={<Button variant="primary" busy={busy} disabled={!dirty} onClick={save}>Αποθήκευση</Button>}
      />
      <div className="flex flex-col gap-6">
        {HOME_IMAGE_SLOTS.map((slot, i) => {
          const info = SLOT_INFO[slot]
          const img = h.images[slot]
          const sample = isSamplePath(img.path)
          const title = i > 0 && SLOT_INFO[HOME_IMAGE_SLOTS[i - 1]].section === info.section ? undefined : info.section
          return (
            <Panel key={slot} title={title}>
              <div className="grid gap-5 md:grid-cols-2" data-home-slot={slot}>
                <div className="flex flex-col gap-2">
                  <MediaPicker
                    label={info.label}
                    folder="home"
                    path={img.path}
                    spec={IMAGE_SPECS[slot]}
                    canRemove={!sample}
                    removeLabel="Επαναφορά ενδεικτικής"
                    // A new photo needs its own description; reverting restores the sample's.
                    onChange={(p) => setSlot(slot, p ? { path: p, alt: sample ? '' : img.alt } : HOME_DEFAULTS.images[slot])}
                  />
                  {sample && <p className="text-sm font-semibold text-bronze-ink">Τώρα: ενδεικτική φωτογραφία.</p>}
                </div>
                <Field label="Περιγραφή φωτογραφίας (alt)" required hint="Τι δείχνει η φωτογραφία, για άτομα με προβλήματα όρασης και για τη Google." error={!img.alt.trim() ? 'Υποχρεωτικό πεδίο' : undefined}>
                  {(p) => <textarea {...p} className={`${inputCls} min-h-20`} value={img.alt} onChange={(e) => setSlot(slot, { ...img, alt: e.target.value })} />}
                </Field>
              </div>
            </Panel>
          )
        })}
        <Panel>
          <p className="text-sm text-muted-paper">
            Οι αλλαγές εμφανίζονται αμέσως στον ιστότοπο. Οι μηχανές αναζήτησης και η πρώτη, στατική φόρτωση της σελίδας ενημερώνονται με το επόμενο
            «Redeploy» στο Railway.
          </p>
        </Panel>
      </div>
    </>
  )
}
