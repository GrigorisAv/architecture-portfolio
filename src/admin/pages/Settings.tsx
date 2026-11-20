import { useState } from 'react'
import type { SiteSettings } from '../../content/types'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { Button, ErrorNote, Field, Loading, PageHeader, Panel } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function Settings() {
  const { api } = useAdmin()
  const loaded = useLoad(() => api.getSettings(), [api])
  if (loaded.error) return <ErrorNote message={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loading />
  return <SettingsForm initial={loaded.data} />
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [s, setS] = useState<SiteSettings>(initial)
  const [saved, setSaved] = useState<SiteSettings>(initial)
  const [busy, setBusy] = useState(false)
  const [emailError, setEmailError] = useState<string>()
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)
  useBeforeUnload(dirty)
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }))
  const opt = (v: string) => (v.trim() ? v.trim() : null)

  const save = async () => {
    if (s.email && !EMAIL.test(s.email)) return setEmailError('Μη έγκυρο email.')
    setEmailError(undefined)
    setBusy(true)
    try {
      await api.saveSettings(s)
      setSaved(s)
      toast('success', 'Οι ρυθμίσεις αποθηκεύτηκαν.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Ρυθμίσεις & SEO" description="Στοιχεία στούντιο, επικοινωνίας και αναζήτησης." actions={<Button variant="primary" busy={busy} disabled={!dirty} onClick={save}>Αποθήκευση</Button>} />
      <div className="flex flex-col gap-6">
        <Panel title="Στούντιο & αρχιτέκτονας">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Όνομα στούντιο">{(p) => <input {...p} className={inputCls} value={s.studioName} onChange={(e) => set('studioName', e.target.value)} />}</Field>
            <Field label="Σύνθημα">{(p) => <input {...p} className={inputCls} value={s.tagline} onChange={(e) => set('tagline', e.target.value)} />}</Field>
            <Field label="Ονοματεπώνυμο αρχιτέκτονα" hint="Αν μείνει κενό, εμφανίζεται «[Όνομα Αρχιτέκτονα]».">{(p) => <input {...p} className={inputCls} value={s.architectName ?? ''} onChange={(e) => set('architectName', opt(e.target.value))} />}</Field>
            <Field label="Ιδιότητα">{(p) => <input {...p} className={inputCls} value={s.architectRole} onChange={(e) => set('architectRole', e.target.value)} />}</Field>
          </div>
        </Panel>
        <Panel title="Επικοινωνία">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Email" error={emailError}>{(p) => <input {...p} type="email" className={inputCls} value={s.email ?? ''} onChange={(e) => set('email', opt(e.target.value))} />}</Field>
            <Field label="Τηλέφωνο">{(p) => <input {...p} type="tel" className={inputCls} value={s.phone ?? ''} onChange={(e) => set('phone', opt(e.target.value))} />}</Field>
            <Field label="Διεύθυνση">{(p) => <input {...p} className={inputCls} value={s.address ?? ''} onChange={(e) => set('address', opt(e.target.value))} />}</Field>
            <Field label="Instagram (URL)">{(p) => <input {...p} type="url" className={inputCls} value={s.instagram ?? ''} onChange={(e) => set('instagram', opt(e.target.value))} />}</Field>
          </div>
        </Panel>
        <Panel title="SEO αρχικής σελίδας">
          <div className="grid gap-5">
            <Field label="Τίτλος">{(p) => <input {...p} className={inputCls} value={s.seo.title} onChange={(e) => set('seo', { ...s.seo, title: e.target.value })} />}</Field>
            <Field label="Περιγραφή" hint={`${s.seo.description.length}/160 χαρακτήρες`}>{(p) => <textarea {...p} className={`${inputCls} min-h-24`} value={s.seo.description} onChange={(e) => set('seo', { ...s.seo, description: e.target.value })} />}</Field>
          </div>
        </Panel>
      </div>
    </>
  )
}
