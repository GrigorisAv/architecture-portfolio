import { useState } from 'react'
import type { ServiceRecord } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { isValidSlug, slugify } from '../lib/slugify'
import { useLoad } from '../lib/useLoad'
import { MediaPicker } from '../ui/MediaPicker'
import { Button, ConfirmButton, ErrorNote, Field, Loading, PageHeader, Panel, StringListEditor, Toggle } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'

const blank = (order: number): ServiceRecord => ({ id: '', slug: '', title: '', summary: '', body: [], includes: [], imagePath: null, imageAlt: '', sortOrder: order, isPlaceholder: false })

export function ServicesAdmin() {
  const { api } = useAdmin()
  const services = useLoad(() => api.listServices(), [api])
  const [editing, setEditing] = useState<ServiceRecord | null>(null)

  return (
    <>
      <PageHeader
        title="Υπηρεσίες"
        description="Οι υπηρεσίες εμφανίζονται στην αρχική και στη σελίδα «Υπηρεσίες»."
        actions={<Button variant="primary" onClick={() => setEditing(blank((services.data?.length ?? 0) + 1))}>+ Νέα υπηρεσία</Button>}
      />
      {services.loading && <Loading />}
      {services.error && <ErrorNote message={services.error} onRetry={services.reload} />}
      {editing ? (
        <ServiceForm key={editing.id || 'new'} initial={editing} onDone={() => { setEditing(null); services.reload() }} />
      ) : (
        services.data && (
          <Panel>
            <ul className="divide-y divide-stone-deep/50">
              {services.data.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold"><span className="mr-2 text-muted-paper tabular-nums">{String(s.sortOrder).padStart(2, '0')}</span>{s.title}</p>
                    <p className="text-sm text-muted-paper">{s.summary}</p>
                  </div>
                  <Button onClick={() => setEditing(s)}>Επεξεργασία</Button>
                </li>
              ))}
            </ul>
          </Panel>
        )
      )}
    </>
  )
}

function ServiceForm({ initial, onDone }: { initial: ServiceRecord; onDone: () => void }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [s, setS] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; slug?: string }>({})
  const dirty = JSON.stringify(s) !== JSON.stringify(initial)
  useBeforeUnload(dirty)
  const set = <K extends keyof ServiceRecord>(k: K, v: ServiceRecord[K]) => setS((x) => ({ ...x, [k]: v }))

  const save = async () => {
    const e: typeof errors = {}
    if (!s.title.trim()) e.title = 'Συμπληρώστε τίτλο.'
    if (!isValidSlug(s.slug)) e.slug = 'Μόνο λατινικά πεζά, αριθμοί και παύλες.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await api.saveService({ ...s, body: s.body.filter((b) => b.trim()), includes: s.includes.filter((b) => b.trim()) })
      toast('success', 'Η υπηρεσία αποθηκεύτηκε.')
      onDone()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title={initial.id ? `Επεξεργασία: ${initial.title}` : 'Νέα υπηρεσία'}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onDone}>Άκυρο</Button>
          <Button variant="primary" busy={busy} onClick={save}>Αποθήκευση</Button>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Τίτλος" required error={errors.title}>{(p) => <input {...p} className={inputCls} value={s.title} onChange={(e) => setS((x) => ({ ...x, title: e.target.value, slug: initial.id ? x.slug : slugify(e.target.value) }))} />}</Field>
        <Field label="Slug" required error={errors.slug} hint={`/ypiresies#${s.slug || '…'}`}>{(p) => <input {...p} className={inputCls} value={s.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} />}</Field>
        <div className="md:col-span-2"><Field label="Σύντομη περιγραφή">{(p) => <textarea {...p} className={`${inputCls} min-h-20`} value={s.summary} onChange={(e) => set('summary', e.target.value)} />}</Field></div>
        <div className="md:col-span-2"><StringListEditor label="Κείμενο" multiline addLabel="Παράγραφος" items={s.body} onChange={(v) => set('body', v)} /></div>
        <div className="md:col-span-2"><StringListEditor label="Τι περιλαμβάνει" addLabel="Στοιχείο" items={s.includes} onChange={(v) => set('includes', v)} /></div>
        <MediaPicker label="Φωτογραφία" folder="services" path={s.imagePath} onChange={(p) => set('imagePath', p)} />
        <Field label="Περιγραφή φωτογραφίας (alt)">{(p) => <input {...p} className={inputCls} value={s.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />}</Field>
        <Field label="Σειρά">{(p) => <input {...p} inputMode="numeric" className={inputCls} value={s.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} />}</Field>
        <Toggle checked={s.isPlaceholder} onChange={(v) => set('isPlaceholder', v)} label="Προσωρινή περιγραφή" description="Εμφανίζει ετικέτα «Προσωρινή περιγραφή»." />
      </div>
      {initial.id && (
        <div className="mt-8 border-t border-stone-deep/60 pt-5">
          <ConfirmButton label="Διαγραφή υπηρεσίας" onConfirm={async () => { await api.deleteService(initial.id); toast('success', 'Η υπηρεσία διαγράφηκε.'); onDone() }} />
        </div>
      )}
    </Panel>
  )
}
