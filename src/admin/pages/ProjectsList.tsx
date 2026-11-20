import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../AdminContext'
import { thumbUrl } from '../lib/thumb'
import { useLoad } from '../lib/useLoad'
import { ErrorNote, Loading, PageHeader, StatusBadge } from '../ui/kit'
import { formatDate, inputCls } from '../ui/kitUtils'

type Filter = 'all' | 'published' | 'draft' | 'featured'

export function ProjectsList() {
  const { api } = useAdmin()
  const projects = useLoad(() => api.listProjects(), [api])
  const categories = useLoad(() => api.listCategories(), [api])
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (projects.data ?? []).filter((p) => {
      if (filter === 'published' && p.status !== 'published') return false
      if (filter === 'draft' && p.status !== 'draft') return false
      if (filter === 'featured' && !p.featured) return false
      return !q || p.title.toLowerCase().includes(q) || p.slug.includes(q)
    })
  }, [projects.data, filter, query])

  const catLabel = (id: string) => categories.data?.find((c) => c.id === id)?.label ?? '—'

  return (
    <>
      <PageHeader
        title="Έργα"
        description="Δημιουργία, επεξεργασία και δημοσίευση έργων. Τα πρόχειρα δεν εμφανίζονται στον ιστότοπο."
        actions={<Link to="/diaxeirisi/erga/neo" className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm font-semibold text-paper">+ Νέο έργο</Link>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Φίλτρο κατάστασης" className="flex flex-wrap gap-1 rounded-md border border-stone-deep/70 bg-white p-1">
          {([['all', 'Όλα'], ['published', 'Δημοσιευμένα'], ['draft', 'Πρόχειρα'], ['featured', 'Προβεβλημένα']] as [Filter, string][]).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={`rounded px-3 py-1.5 text-sm font-medium ${filter === v ? 'bg-ink text-paper' : 'text-ink hover:bg-stone/50'}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="project-search">Αναζήτηση</label>
        <input id="project-search" type="search" placeholder="Αναζήτηση τίτλου…" className={`${inputCls} max-w-xs`} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {projects.loading && <Loading />}
      {projects.error && <ErrorNote message={projects.error} onRetry={projects.reload} />}
      {projects.data && (
        <div className="overflow-x-auto rounded-lg border border-stone-deep/70 bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-stone-deep/60 text-xs uppercase tracking-[0.08em] text-muted-paper">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Έργο</th>
                <th scope="col" className="px-4 py-3 font-semibold">Κατηγορία</th>
                <th scope="col" className="px-4 py-3 font-semibold">Κατάσταση</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ενημέρωση</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-deep/40">
              {list.map((p) => {
                const cover = p.images.find((i) => i.id === p.coverImageId) ?? p.images[0]
                const img = cover ? api.resolveImage(cover.path, cover.width) : null
                return (
                  <tr key={p.id} className="hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <Link to={`/diaxeirisi/erga/${p.id}`} className="flex items-center gap-3 font-semibold hover:underline">
                        <span className="h-12 w-16 shrink-0 overflow-hidden rounded bg-stone">
                          {img && <img src={thumbUrl(img)} alt="" className="h-full w-full object-cover" loading="lazy" />}
                        </span>
                        <span>
                          {p.title || <em className="text-muted-paper">Χωρίς τίτλο</em>}
                          <span className="block text-xs font-normal text-muted-paper">/{p.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{catLabel(p.categoryId)}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1.5">
                        {p.status === 'published' ? <StatusBadge tone="green">Δημοσιευμένο</StatusBadge> : <StatusBadge tone="gray">Πρόχειρο</StatusBadge>}
                        {p.featured && <StatusBadge tone="bronze">Προβεβλημένο</StatusBadge>}
                        {p.isPlaceholder && <StatusBadge tone="gray">Ενδεικτικό</StatusBadge>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-paper">{formatDate(p.updatedAt)}</td>
                  </tr>
                )
              })}
              {list.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-paper">Δεν βρέθηκαν έργα.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
