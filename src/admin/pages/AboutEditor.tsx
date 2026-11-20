import { useState } from 'react'
import { ABOUT_APPROACH_DEFAULT, isSamplePath, type AboutRecord } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { IMAGE_SPECS } from '../lib/imageGuide'
import { MediaPicker } from '../ui/MediaPicker'
import { Button, ErrorNote, Field, Loading, PageHeader, PairListEditor, Panel, StringListEditor, Toggle } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'

export function AboutEditor() {
  const { api } = useAdmin()
  const loaded = useLoad(() => api.getAbout(), [api])
  if (loaded.error) return <ErrorNote message={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loading />
  return <AboutForm initial={loaded.data} />
}

function AboutForm({ initial }: { initial: AboutRecord }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [a, setA] = useState<AboutRecord>(initial)
  const [saved, setSaved] = useState<AboutRecord>(initial)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(a) !== JSON.stringify(saved)
  useBeforeUnload(dirty)
  const set = <K extends keyof AboutRecord>(k: K, v: AboutRecord[K]) => setA((x) => ({ ...x, [k]: v }))

  const save = async () => {
    setBusy(true)
    try {
      await api.saveAbout(a)
      setSaved(a)
      toast('success', 'Η σελίδα «Σχετικά» αποθηκεύτηκε.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Σελίδα «Σχετικά»" description="Βιογραφικό, φιλοσοφία και προσέγγιση της αρχιτέκτονα." actions={<Button variant="primary" busy={busy} disabled={!dirty} onClick={save}>Αποθήκευση</Button>} />
      <div className="flex flex-col gap-6">
        <Panel title="Εισαγωγή & φωτογραφία">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2"><Field label="Εισαγωγικό κείμενο">{(p) => <textarea {...p} className={`${inputCls} min-h-20`} value={a.intro} onChange={(e) => set('intro', e.target.value)} />}</Field></div>
            <MediaPicker label="Προσωπική φωτογραφία" folder="about" spec={IMAGE_SPECS.portrait} path={a.portraitPath} onChange={(p) => set('portraitPath', p)} />
            <Field label="Περιγραφή φωτογραφίας (alt)">{(p) => <input {...p} className={inputCls} value={a.portraitAlt} onChange={(e) => set('portraitAlt', e.target.value)} />}</Field>
          </div>
        </Panel>
        <Panel title="Βιογραφικό"><StringListEditor label="Παράγραφοι" multiline addLabel="Παράγραφος" items={a.bio} onChange={(v) => set('bio', v)} /></Panel>
        <Panel title="Σχεδιαστική φιλοσοφία"><PairListEditor label="Αρχές" addLabel="Αρχή" items={a.philosophy} onChange={(v) => set('philosophy', v)} /></Panel>
        <Panel title="Επαγγελματική προσέγγιση">
          <div className="flex flex-col gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <MediaPicker
                label="Φωτογραφία ενότητας"
                folder="about"
                spec={IMAGE_SPECS.aboutApproach}
                path={a.approachImagePath}
                canRemove={!!a.approachImagePath && !isSamplePath(a.approachImagePath)}
                removeLabel="Επαναφορά ενδεικτικής"
                onChange={(p) =>
                  setA((x) =>
                    p
                      ? { ...x, approachImagePath: p, approachImageAlt: x.approachImagePath && isSamplePath(x.approachImagePath) ? '' : x.approachImageAlt }
                      : { ...x, approachImagePath: ABOUT_APPROACH_DEFAULT.path, approachImageAlt: ABOUT_APPROACH_DEFAULT.alt },
                  )
                }
              />
              <Field label="Περιγραφή φωτογραφίας (alt)">{(p) => <input {...p} className={inputCls} value={a.approachImageAlt} onChange={(e) => set('approachImageAlt', e.target.value)} />}</Field>
            </div>
            <PairListEditor label="Σημεία" addLabel="Σημείο" items={a.approach} onChange={(v) => set('approach', v)} />
          </div>
        </Panel>
        <Panel><Toggle checked={a.isPlaceholder} onChange={(v) => set('isPlaceholder', v)} label="Προσωρινό κείμενο" description="Εμφανίζει την ετικέτα «Προσωρινό κείμενο» στο βιογραφικό." /></Panel>
      </div>
    </>
  )
}
