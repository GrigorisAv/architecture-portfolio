import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import type { CategoryRecord, ImageKind, ImageRecord, ProjectRecord } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { AdminError, emptyProject } from '../api/types'
import { isValidSlug, slugify } from '../lib/slugify'
import { useLoad } from '../lib/useLoad'
import { Button, ConfirmButton, ErrorNote, Field, Loading, PageHeader, Panel, StatusBadge, StringListEditor, Toggle } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'
import { thumbUrl } from '../lib/thumb'
import { SiteLink } from '../ui/SiteLink'

type Errors = Partial<Record<'title' | 'slug' | 'categoryId' | 'year' | 'areaSqm' | 'publish', string>>

/** Loads the project + categories, then mounts the form with its initial state (keyed by id). */
export function ProjectEditor() {
  const { id } = useParams()
  const { api } = useAdmin()
  const categories = useLoad(() => api.listCategories(), [api])
  const loaded = useLoad(async () => (id ? api.getProject(id) : emptyProject()), [api, id])

  if (loaded.error || categories.error) return <ErrorNote message={(loaded.error ?? categories.error)!} onRetry={() => { loaded.reload(); categories.reload() }} />
  if (loaded.loading || categories.loading || !categories.data) return <Loading />
  if (!loaded.data) return <ErrorNote message="Το έργο δεν βρέθηκε." />
  const initial = loaded.data.categoryId ? loaded.data : { ...loaded.data, categoryId: categories.data[0]?.id ?? '' }
  return <ProjectForm key={id ?? 'new'} initial={initial} isNew={!id} categories={categories.data} />
}

function ProjectForm({ initial, isNew, categories }: { initial: ProjectRecord; isNew: boolean; categories: CategoryRecord[] }) {
  const { api } = useAdmin()
  const toast = useToast()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ProjectRecord>(initial)
  const [saved, setSaved] = useState<ProjectRecord>(initial)
  const [slugTouched, setSlugTouched] = useState(!!initial.slug)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  const coreOf = (p: ProjectRecord) => JSON.stringify({ ...p, images: undefined, updatedAt: undefined })
  const dirty = useMemo(() => coreOf(draft) !== coreOf(saved), [draft, saved])
  useBeforeUnload(dirty)
  // Set right before navigating after a save/delete: state updates are not visible to the blocker yet.
  const allowLeave = useRef(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname)

  const set = <K extends keyof ProjectRecord>(key: K, value: ProjectRecord[K]) => setDraft((d) => d && { ...d, [key]: value })

  const validate = (p: ProjectRecord): Errors => {
    const e: Errors = {}
    if (!p.title.trim()) e.title = 'Συμπληρώστε τίτλο.'
    if (!isValidSlug(p.slug)) e.slug = 'Το slug επιτρέπει μόνο λατινικά πεζά, αριθμούς και παύλες (π.χ. oikia-sto-fos).'
    if (!p.categoryId) e.categoryId = 'Επιλέξτε κατηγορία.'
    if (p.year !== null && (p.year < 1900 || p.year > 2100)) e.year = 'Το έτος πρέπει να είναι μεταξύ 1900 και 2100.'
    if (p.areaSqm !== null && !(p.areaSqm > 0)) e.areaSqm = 'Τα τετραγωνικά πρέπει να είναι θετικός αριθμός.'
    if (p.status === 'published') {
      if (!p.images.some((i) => i.kind === 'photo')) e.publish = 'Για δημοσίευση χρειάζεται τουλάχιστον μία φωτογραφία.'
      else if (p.images.some((i) => !i.alt.trim())) e.publish = 'Για δημοσίευση, συμπληρώστε περιγραφή (alt) σε όλες τις εικόνες.'
    }
    return e
  }

  const save = async () => {
    const e = validate(draft)
    setErrors(e)
    if (Object.keys(e).length) {
      toast('error', 'Ελέγξτε τα πεδία με σφάλμα.')
      return
    }
    setSaving(true)
    try {
      const result = await api.saveProject({ ...draft, title: draft.title.trim(), description: draft.description.map((s) => s.trim()).filter(Boolean) })
      const merged = { ...result, images: draft.images }
      setDraft(merged)
      setSaved(merged)
      toast('success', result.status === 'published' ? 'Το έργο αποθηκεύτηκε και είναι δημοσιευμένο.' : 'Το έργο αποθηκεύτηκε ως πρόχειρο.')
      if (isNew) {
        allowLeave.current = true
        navigate(`/diaxeirisi/erga/${result.id}`, { replace: true })
      }
    } catch (err) {
      toast('error', err instanceof AdminError ? err.message : 'Η αποθήκευση απέτυχε.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await api.deleteProject(draft.id)
      allowLeave.current = true
      toast('success', 'Το έργο διαγράφηκε.')
      navigate('/diaxeirisi/erga')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η διαγραφή απέτυχε.')
    }
  }

  const syncImages = (images: ImageRecord[]) => {
    setDraft((d) => d && { ...d, images })
    setSaved((s) => s && { ...s, images })
  }

  return (
    <>
      <p className="mb-4 text-sm"><Link to="/diaxeirisi/erga" className="text-muted-paper underline underline-offset-4 hover:text-ink">← Όλα τα έργα</Link></p>
      <PageHeader
        title={isNew ? 'Νέο έργο' : draft.title || 'Χωρίς τίτλο'}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {draft.status === 'published' ? <StatusBadge tone="green">Δημοσιευμένο</StatusBadge> : <StatusBadge tone="gray">Πρόχειρο</StatusBadge>}
            {dirty && <StatusBadge tone="bronze">Μη αποθηκευμένες αλλαγές</StatusBadge>}
          </span>
        }
        actions={
          <>
            {!isNew && saved?.status === 'published' && (
              <SiteLink to={`/erga/${saved.slug}`} className="inline-flex min-h-10 items-center rounded-md border border-stone-deep bg-white px-4 text-sm font-semibold hover:border-ink">
                Προβολή ↗
              </SiteLink>
            )}
            <Button variant="primary" busy={saving} onClick={save}>{isNew ? 'Δημιουργία έργου' : 'Αποθήκευση'}</Button>
          </>
        }
      />

      {errors.publish && <div className="mb-6"><ErrorNote message={errors.publish} /></div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <Panel title="Βασικά στοιχεία">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Τίτλος" required error={errors.title}>
                  {(p) => (
                    <input
                      {...p}
                      className={inputCls}
                      value={draft.title}
                      onChange={(e) => {
                        const title = e.target.value
                        setDraft((d) => d && { ...d, title, slug: slugTouched ? d.slug : slugify(title) })
                      }}
                    />
                  )}
                </Field>
              </div>
              <Field label="Slug (διεύθυνση)" required error={errors.slug} hint={`/erga/${draft.slug || '…'}`}>
                {(p) => <input {...p} className={inputCls} value={draft.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} />}
              </Field>
              <Field label="Κατηγορία" required error={errors.categoryId}>
                {(p) => (
                  <select {...p} className={inputCls} value={draft.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Τοποθεσία">{(p) => <input {...p} className={inputCls} value={draft.location ?? ''} onChange={(e) => set('location', e.target.value || null)} />}</Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Έτος" error={errors.year}>{(p) => <input {...p} inputMode="numeric" className={inputCls} value={draft.year ?? ''} onChange={(e) => set('year', e.target.value ? Number(e.target.value) : null)} />}</Field>
                <Field label="Τ.μ." error={errors.areaSqm}>{(p) => <input {...p} inputMode="decimal" className={inputCls} value={draft.areaSqm ?? ''} onChange={(e) => set('areaSqm', e.target.value ? Number(e.target.value.replace(',', '.')) : null)} />}</Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Σύντομη περιγραφή" hint="Εμφανίζεται στις κάρτες έργων και ως εισαγωγή στη σελίδα του έργου.">
                  {(p) => <textarea {...p} className={`${inputCls} min-h-24`} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />}
                </Field>
              </div>
              <div className="md:col-span-2">
                <StringListEditor label="Αναλυτική περιγραφή" hint="Μία παράγραφος ανά πεδίο." multiline addLabel="Παράγραφος" items={draft.description} onChange={(v) => set('description', v)} />
              </div>
            </div>
          </Panel>

          {isNew ? (
            <Panel title="Φωτογραφίες & σχέδια"><p className="text-muted-paper">Αποθηκεύστε πρώτα το έργο για να προσθέσετε φωτογραφίες.</p></Panel>
          ) : (
            <ImageManager project={draft} onImages={syncImages} onCover={(imgId) => set('coverImageId', imgId)} />
          )}

          <Panel title="SEO" description="Προαιρετικά. Αν μείνουν κενά, χρησιμοποιούνται ο τίτλος και η σύντομη περιγραφή.">
            <div className="grid gap-5">
              <Field label="Τίτλος σελίδας">{(p) => <input {...p} className={inputCls} value={draft.seoTitle ?? ''} onChange={(e) => set('seoTitle', e.target.value || null)} />}</Field>
              <Field label="Περιγραφή (meta description)" hint={`${(draft.seoDescription ?? '').length}/160 χαρακτήρες`}>
                {(p) => <textarea {...p} maxLength={300} className={`${inputCls} min-h-20`} value={draft.seoDescription ?? ''} onChange={(e) => set('seoDescription', e.target.value || null)} />}
              </Field>
            </div>
          </Panel>
        </div>

        <aside className="flex flex-col gap-6">
          <Panel title="Δημοσίευση">
            <div className="flex flex-col gap-5">
              <Toggle checked={draft.status === 'published'} onChange={(v) => set('status', v ? 'published' : 'draft')} label="Δημοσιευμένο" description="Τα πρόχειρα δεν εμφανίζονται στον ιστότοπο." />
              <Toggle checked={draft.featured} onChange={(v) => set('featured', v)} label="Προβεβλημένο" description="Εμφανίζεται στην 3D gallery της αρχικής." />
              {draft.featured && (
                <Field label="Σειρά προβολής">{(p) => <input {...p} inputMode="numeric" className={inputCls} value={draft.featuredOrder ?? ''} onChange={(e) => set('featuredOrder', e.target.value ? Number(e.target.value) : null)} />}</Field>
              )}
              <Toggle checked={draft.isPlaceholder} onChange={(v) => set('isPlaceholder', v)} label="Ενδεικτικό έργο" description="Εμφανίζει την ετικέτα «Ενδεικτικό» στον ιστότοπο." />
              <Field label="Σειρά στη λίστα έργων">{(p) => <input {...p} inputMode="numeric" className={inputCls} value={draft.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} />}</Field>
            </div>
          </Panel>
          {!isNew && (
            <Panel title="Διαγραφή">
              <p className="mb-4 text-sm text-muted-paper">Διαγράφει το έργο και όλες τις φωτογραφίες του. Δεν αναιρείται.</p>
              <ConfirmButton label="Διαγραφή έργου" onConfirm={remove} />
            </Panel>
          )}
        </aside>
      </div>

      {blocker.state === 'blocked' && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="leave-title" className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="leave-title" className="font-display text-2xl">Μη αποθηκευμένες αλλαγές</h2>
            <p className="mt-2 text-muted-paper">Αν φύγετε τώρα, οι αλλαγές θα χαθούν.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button autoFocus onClick={() => blocker.reset?.()}>Παραμονή</Button>
              <Button variant="danger" onClick={() => blocker.proceed?.()}>Έξοδος χωρίς αποθήκευση</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------------- Images ---------------- */
function ImageManager({ project, onImages, onCover }: { project: ProjectRecord; onImages: (imgs: ImageRecord[]) => void; onCover: (id: string) => void }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [uploading, setUploading] = useState<string[]>([])
  const [kind, setKind] = useState<ImageKind>('photo')
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sorted = [...project.images].sort((a, b) => a.sortOrder - b.sortOrder)

  const upload = async (files: FileList | File[]) => {
    const list = [...files]
    if (!list.length) return
    setUploading(list.map((f) => f.name))
    let images = [...project.images]
    for (const f of list) {
      try {
        const img = await api.uploadImage(project.id, f, kind)
        images = [...images, img]
        onImages(images)
      } catch (err) {
        toast('error', `${f.name}: ${err instanceof Error ? err.message : 'Το ανέβασμα απέτυχε.'}`)
      }
      setUploading((u) => u.filter((n) => n !== f.name))
    }
    toast('success', 'Οι εικόνες ανέβηκαν. Συμπληρώστε την περιγραφή (alt) σε καθεμία.')
    if (inputRef.current) inputRef.current.value = ''
  }

  const update = async (img: ImageRecord) => {
    onImages(project.images.map((i) => (i.id === img.id ? img : i)))
    try {
      await api.updateImage(project.id, img)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η ενημέρωση απέτυχε.')
    }
  }
  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= sorted.length) return
    const ids = sorted.map((i) => i.id)
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    onImages(project.images.map((i) => ({ ...i, sortOrder: ids.indexOf(i.id) })))
    try {
      await api.reorderImages(project.id, ids)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η ταξινόμηση απέτυχε.')
    }
  }
  const remove = async (img: ImageRecord) => {
    await api.deleteImage(project.id, img.id)
    onImages(project.images.filter((i) => i.id !== img.id))
    toast('success', 'Η εικόνα διαγράφηκε.')
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void upload(e.dataTransfer.files)
  }

  return (
    <Panel title="Φωτογραφίες & σχέδια" description="Οι αλλαγές στις εικόνες αποθηκεύονται αμέσως. Οι εικόνες μετατρέπονται αυτόματα σε WebP (800/1600/2400 px).">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${over ? 'border-ink bg-stone/40' : 'border-stone-deep'}`}
      >
        <p className="font-semibold">Σύρετε εικόνες εδώ ή</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className="text-sm">
            <span className="sr-only">Είδος εικόνων</span>
            <select className={`${inputCls} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as ImageKind)}>
              <option value="photo">Φωτογραφίες</option>
              <option value="drawing">Σχέδια</option>
              <option value="render">Renders</option>
            </select>
          </label>
          <Button variant="primary" onClick={() => inputRef.current?.click()} busy={uploading.length > 0}>Επιλογή αρχείων</Button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" aria-label="Επιλογή εικόνων" onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
        <p className="text-xs text-muted-paper">JPEG, PNG, WebP ή AVIF έως 30 MB.</p>
        {uploading.length > 0 && <p role="status" className="text-sm">Ανέβασμα: {uploading.join(', ')}…</p>}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-5 text-muted-paper">Δεν υπάρχουν εικόνες ακόμη.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {sorted.map((img, i) => {
            const res = api.resolveImage(img.path, img.width)
            const isCover = project.coverImageId ? project.coverImageId === img.id : i === sorted.findIndex((x) => x.kind === 'photo')
            return (
              <li key={img.id} className="grid gap-3 rounded-lg border border-stone-deep/60 p-3 md:grid-cols-[7rem_1fr_auto]">
                <img src={thumbUrl(res)} alt="" className="h-20 w-28 rounded object-cover" loading="lazy" />
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold" htmlFor={`alt-${img.id}`}>
                    Περιγραφή εικόνας (alt) {!img.alt.trim() && <span className="ml-1 text-error">· λείπει</span>}
                  </label>
                  <input
                    id={`alt-${img.id}`}
                    className={inputCls}
                    defaultValue={img.alt}
                    placeholder="Τι δείχνει η εικόνα; π.χ. «Φωτεινό καθιστικό με ξύλινη επένδυση»"
                    onBlur={(e) => e.target.value !== img.alt && update({ ...img, alt: e.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <select aria-label="Είδος" className={`${inputCls} w-auto py-1.5`} value={img.kind} onChange={(e) => update({ ...img, kind: e.target.value as ImageKind })}>
                      <option value="photo">Φωτογραφία</option>
                      <option value="drawing">Σχέδιο</option>
                      <option value="render">Render</option>
                    </select>
                    {img.kind === 'photo' && (
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" name="cover" checked={isCover} onChange={() => onCover(img.id)} className="accent-ink" />
                        Εξώφυλλο {isCover && <StatusBadge tone="bronze">επιλεγμένο</StatusBadge>}
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <Button variant="ghost" className="px-2" aria-label="Μετακίνηση πάνω" disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
                  <Button variant="ghost" className="px-2" aria-label="Μετακίνηση κάτω" disabled={i === sorted.length - 1} onClick={() => move(i, 1)}>↓</Button>
                  <ConfirmButton label="Διαγραφή" confirmLabel="Διαγραφή;" onConfirm={() => remove(img)} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-paper">Η επιλογή εξωφύλλου αποθηκεύεται με το κουμπί «Αποθήκευση».</p>
    </Panel>
  )
}
