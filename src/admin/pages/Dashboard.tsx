import { Link } from 'react-router-dom'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { ErrorNote, Loading, PageHeader, Panel, StatusBadge } from '../ui/kit'
import { formatDate } from '../ui/kitUtils'
import { PROJECT_TYPE_LABEL } from './labels'

export function Dashboard() {
  const { api } = useAdmin()
  const stats = useLoad(() => api.stats(), [api])
  const quotes = useLoad(() => api.listQuotes(), [api])

  const cards = stats.data
    ? [
        { label: 'Δημοσιευμένα έργα', value: stats.data.projectsPublished, to: '/diaxeirisi/erga' },
        { label: 'Πρόχειρα', value: stats.data.projectsDraft, to: '/diaxeirisi/erga' },
        { label: 'Προβεβλημένα', value: stats.data.projectsFeatured, to: '/diaxeirisi/erga' },
        { label: 'Νέα αιτήματα', value: stats.data.requestsNew, to: '/diaxeirisi/aitimata', accent: stats.data.requestsNew > 0 },
      ]
    : []

  return (
    <>
      <PageHeader
        title="Πίνακας ελέγχου"
        description="Μια ματιά στο περιεχόμενο του ιστότοπου και στα αιτήματα προσφοράς."
        actions={<Link to="/diaxeirisi/erga/neo" className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm font-semibold text-paper">+ Νέο έργο</Link>}
      />
      {stats.error && <ErrorNote message={stats.error} onRetry={stats.reload} />}
      {stats.loading && <Loading />}
      {stats.data && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <li key={c.label}>
              <Link to={c.to} className={`block rounded-lg border bg-white p-5 transition-colors hover:border-ink ${c.accent ? 'border-bronze' : 'border-stone-deep/70'}`}>
                <p className="text-sm text-muted-paper">{c.label}</p>
                <p className="mt-2 font-display text-4xl tabular-nums">{c.value}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Panel title="Τελευταία αιτήματα" actions={<Link to="/diaxeirisi/aitimata" className="text-sm font-semibold underline underline-offset-4">Όλα τα αιτήματα</Link>}>
          {quotes.loading && <Loading />}
          {quotes.error && <ErrorNote message={quotes.error} onRetry={quotes.reload} />}
          {quotes.data && quotes.data.length === 0 && <p className="text-muted-paper">Δεν υπάρχουν αιτήματα ακόμη.</p>}
          {quotes.data && quotes.data.length > 0 && (
            <ul className="divide-y divide-stone-deep/50">
              {quotes.data.slice(0, 5).map((q) => (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{q.fullName} <span className="font-normal text-muted-paper">· {PROJECT_TYPE_LABEL[q.projectType]} · {q.area}</span></p>
                    <p className="text-xs text-muted-paper">{formatDate(q.createdAt)}</p>
                  </div>
                  {q.status === 'new' ? <StatusBadge tone="bronze">Νέο</StatusBadge> : <StatusBadge tone="gray">Διαβασμένο</StatusBadge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
