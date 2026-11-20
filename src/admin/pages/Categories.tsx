import { useState } from 'react'
import type { CategoryRecord } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { isValidSlug, slugify } from '../lib/slugify'
import { useLoad } from '../lib/useLoad'
import { Button, ConfirmButton, ErrorNote, Loading, PageHeader, Panel } from '../ui/kit'
import { inputCls, useToast } from '../ui/kitUtils'

export function Categories() {
  const { api } = useAdmin()
  const toast = useToast()
  const cats = useLoad(() => api.listCategories(), [api])
  const projects = useLoad(() => api.listProjects(), [api])
  const [newLabel, setNewLabel] = useState('')

  const count = (id: string) => projects.data?.filter((p) => p.categoryId === id).length ?? 0

  const save = async (c: CategoryRecord) => {
    if (!c.label.trim()) return toast('error', 'Η ονομασία δεν μπορεί να είναι κενή.')
    if (!isValidSlug(c.slug)) return toast('error', 'Μη έγκυρο slug: μόνο λατινικά πεζά, αριθμοί και παύλες.')
    try {
      await api.saveCategory(c)
      toast('success', 'Η κατηγορία αποθηκεύτηκε.')
      cats.reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
    }
  }
  const add = async () => {
    const label = newLabel.trim()
    if (!label) return
    await save({ id: '', label, slug: slugify(label), sortOrder: (cats.data?.length ?? 0) + 1 })
    setNewLabel('')
  }
  const remove = async (id: string) => {
    try {
      await api.deleteCategory(id)
      toast('success', 'Η κατηγορία διαγράφηκε.')
      cats.reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η διαγραφή απέτυχε.')
    }
  }

  return (
    <>
      <PageHeader title="Κατηγορίες" description="Οι κατηγορίες εμφανίζονται ως φίλτρα στη σελίδα «Έργα»." />
      {cats.loading && <Loading />}
      {cats.error && <ErrorNote message={cats.error} onRetry={cats.reload} />}
      {cats.data && (
        <Panel>
          <ul className="flex flex-col gap-3">
            {cats.data.map((c) => (
              <CategoryRow key={c.id + c.slug + c.label} category={c} used={count(c.id)} onSave={save} onDelete={() => remove(c.id)} />
            ))}
          </ul>
          <form className="mt-6 flex flex-wrap items-end gap-3 border-t border-stone-deep/60 pt-5" onSubmit={(e) => { e.preventDefault(); void add() }}>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Νέα κατηγορία
              <input className={`${inputCls} w-72 font-normal`} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="π.χ. Ξενοδοχεία" />
            </label>
            <Button type="submit" variant="primary" disabled={!newLabel.trim()}>Προσθήκη</Button>
          </form>
        </Panel>
      )}
    </>
  )
}

function CategoryRow({ category, used, onSave, onDelete }: { category: CategoryRecord; used: number; onSave: (c: CategoryRecord) => void; onDelete: () => Promise<void> }) {
  const [c, setC] = useState(category)
  const changed = JSON.stringify(c) !== JSON.stringify(category)
  return (
    <li className="grid items-end gap-3 rounded-md border border-stone-deep/60 p-3 md:grid-cols-[1fr_1fr_6rem_auto]">
      <label className="flex flex-col gap-1 text-xs font-semibold">Ονομασία<input className={`${inputCls} font-normal`} value={c.label} onChange={(e) => setC({ ...c, label: e.target.value })} /></label>
      <label className="flex flex-col gap-1 text-xs font-semibold">Slug<input className={`${inputCls} font-normal`} value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value.toLowerCase() })} /></label>
      <label className="flex flex-col gap-1 text-xs font-semibold">Σειρά<input inputMode="numeric" className={`${inputCls} font-normal`} value={c.sortOrder} onChange={(e) => setC({ ...c, sortOrder: Number(e.target.value) || 0 })} /></label>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" disabled={!changed} onClick={() => onSave(c)}>Αποθήκευση</Button>
        <ConfirmButton label="Διαγραφή" disabled={used > 0} onConfirm={onDelete} />
        <span className="text-xs text-muted-paper">{used} έργα</span>
      </div>
    </li>
  )
}
