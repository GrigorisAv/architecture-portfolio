import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { OfferSettings } from '../../offers/model'
import { VAT_OPTIONS } from '../../offers/model'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { Button, ErrorNote, Field, Loading, PageHeader, Panel } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'
import { MediaPicker } from '../ui/MediaPicker'

const SIGNATURE_SPEC = {
  frame: 'Υπογραφή σε διάφανο ή λευκό φόντο',
  ideal: '1200×400 px (PNG)',
  orientation: 'landscape' as const,
  minWidth: 600,
  note: 'Υπογράψτε με μαύρο στυλό σε λευκό χαρτί, φωτογραφίστε ή σκανάρετε και περικόψτε γύρω από την υπογραφή.',
}

export function OfferSettingsPage() {
  const { api } = useAdmin()
  const loaded = useLoad(() => api.getOfferSettings(), [api])
  if (loaded.error) return <ErrorNote message={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loading />
  return <SettingsForm initial={loaded.data} />
}

function SettingsForm({ initial }: { initial: OfferSettings }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [s, setS] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)
  useBeforeUnload(dirty)
  const set = <K extends keyof OfferSettings>(k: K, v: OfferSettings[K]) => setS((x) => ({ ...x, [k]: v }))

  const save = async () => {
    setBusy(true)
    try {
      await api.saveOfferSettings(s)
      setSaved(s)
      toast('success', 'Οι ρυθμίσεις προσφορών αποθηκεύτηκαν.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Ρυθμίσεις προσφορών"
        description={<><Link to="/diaxeirisi/prosfores" className="underline underline-offset-4">← Προσφορές</Link> · Στοιχεία υπογραφής και προτεινόμενα κείμενα για κάθε νέα προσφορά.</>}
        actions={<Button variant="primary" busy={busy} disabled={!dirty} onClick={save}>Αποθήκευση</Button>}
      />
      <div className="flex flex-col gap-6">
        <Panel title="Υπογραφή" description="Εμφανίζεται στο τέλος κάθε προσφοράς. Email, τηλέφωνο και διεύθυνση έρχονται από τις «Ρυθμίσεις & SEO».">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Ονοματεπώνυμο">{(p) => <input {...p} className={inputCls} value={s.issuerName} onChange={(e) => set('issuerName', e.target.value)} />}</Field>
            <Field label="Ιδιότητα">{(p) => <input {...p} className={inputCls} value={s.issuerRole} onChange={(e) => set('issuerRole', e.target.value)} />}</Field>
            <div className="md:col-span-2">
              <MediaPicker label="Εικόνα υπογραφής (προαιρετικά)" folder="offers" spec={SIGNATURE_SPEC} path={s.signaturePath} onChange={(p) => set('signaturePath', p)} />
            </div>
          </div>
        </Panel>
        <Panel title="Προτεινόμενα κείμενα" description="Μπαίνουν αυτόματα σε κάθε νέα προσφορά και αλλάζουν ελεύθερα ανά προσφορά. Ελέγξτε ότι ανταποκρίνονται στη δική σας πρακτική.">
          <div className="grid gap-5">
            <Field label="Εισαγωγικό κείμενο">{(p) => <textarea {...p} rows={3} className={inputCls} value={s.defaultIntro} onChange={(e) => set('defaultIntro', e.target.value)} />}</Field>
            <Field label="Τρόπος πληρωμής">{(p) => <textarea {...p} rows={2} className={inputCls} value={s.defaultPaymentTerms} onChange={(e) => set('defaultPaymentTerms', e.target.value)} />}</Field>
            <Field label="Όροι" hint="Ένας όρος ανά γραμμή.">{(p) => <textarea {...p} rows={5} className={inputCls} value={s.defaultTerms} onChange={(e) => set('defaultTerms', e.target.value)} />}</Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Ισχύς προσφοράς (ημέρες)">{(p) => <input {...p} type="number" min={1} max={365} className={inputCls} value={s.defaultValidityDays} onChange={(e) => set('defaultValidityDays', Math.min(365, Math.max(1, Number(e.target.value) || 30)))} />}</Field>
              <Field label="ΦΠΑ">
                {(p) => (
                  <select {...p} className={inputCls} value={s.defaultVatRate} onChange={(e) => set('defaultVatRate', Number(e.target.value))}>
                    {VAT_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v === 0 ? 'Χωρίς ΦΠΑ' : `${v}%`}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
