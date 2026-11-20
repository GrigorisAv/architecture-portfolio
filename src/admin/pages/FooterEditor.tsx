import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FOOTER_DEFAULTS, type FooterRecord } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { Button, ErrorNote, Field, Loading, PageHeader, Panel } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'

export function FooterEditor() {
  const { api } = useAdmin()
  const loaded = useLoad(() => api.getFooter(), [api])
  if (loaded.error) return <ErrorNote message={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loading />
  return <FooterForm initial={loaded.data} />
}

function FooterForm({ initial }: { initial: FooterRecord }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [f, setF] = useState<FooterRecord>(initial)
  const [saved, setSaved] = useState<FooterRecord>(initial)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(f) !== JSON.stringify(saved)
  useBeforeUnload(dirty)
  const set = <K extends keyof FooterRecord>(k: K, v: FooterRecord[K]) => setF((x) => ({ ...x, [k]: v }))
  const urlError = f.creditUrl && !/^https?:\/\/\S+\.\S+/.test(f.creditUrl) ? 'Ο σύνδεσμος πρέπει να ξεκινά με https://' : undefined

  const save = async () => {
    if (urlError) {
      toast('error', urlError)
      return
    }
    setBusy(true)
    try {
      const next = { ...f, creditUrl: f.creditUrl?.trim() || null }
      await api.saveFooter(next)
      setF(next)
      setSaved(next)
      toast('success', 'Το footer αποθηκεύτηκε.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Footer (υποσέλιδο)"
        description="Τα κείμενα στο κάτω μέρος κάθε σελίδας."
        actions={<Button variant="primary" busy={busy} disabled={!dirty} onClick={save}>Αποθήκευση</Button>}
      />
      <div className="flex flex-col gap-6">
        <Panel title="Κείμενα">
          <div className="grid gap-5">
            <Field label="Σύντομη περιγραφή (κάτω από το λογότυπο)" hint="Αφήστε κενό για να μην εμφανίζεται.">
              {(p) => <textarea {...p} className={`${inputCls} min-h-20`} value={f.description} onChange={(e) => set('description', e.target.value)} />}
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Υπογραφή δημιουργού" hint="Εμφανίζεται δίπλα στο ©. Αφήστε κενό για να μην εμφανίζεται.">
                {(p) => <input {...p} className={inputCls} value={f.creditText} onChange={(e) => set('creditText', e.target.value)} />}
              </Field>
              <Field label="Σύνδεσμος υπογραφής (προαιρετικό)" hint="π.χ. https://www.linkedin.com/in/…" error={urlError}>
                {(p) => <input {...p} type="url" className={inputCls} value={f.creditUrl ?? ''} onChange={(e) => set('creditUrl', e.target.value || null)} />}
              </Field>
            </div>
            <div>
              <Button variant="ghost" onClick={() => setF(structuredClone(FOOTER_DEFAULTS))}>Επαναφορά αρχικών κειμένων</Button>
            </div>
          </div>
        </Panel>
        <Panel title="Ενημερώνονται αυτόματα">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-paper">
            <li>
              <strong>Επικοινωνία</strong> (email, τηλέφωνο, διεύθυνση, Instagram): από τις{' '}
              <Link to="/diaxeirisi/rythmiseis" className="underline">Ρυθμίσεις &amp; SEO</Link>.
            </li>
            <li>
              <strong>Σημείωση για τις ενδεικτικές φωτογραφίες (Unsplash)</strong>: εμφανίζεται όσο υπάρχει έστω και μία ενδεικτική φωτογραφία (αρχική,
              «Σχετικά», υπηρεσίες, έργα) και εξαφανίζεται μόλις αντικατασταθούν όλες.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  )
}
