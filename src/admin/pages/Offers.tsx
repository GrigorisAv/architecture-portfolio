import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { displayStatus, formatDate, formatMoney, OFFER_STATUS, offerTotals, type OfferDisplayStatus } from '../../offers/model'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { Button, ErrorNote, Loading, PageHeader, Panel, StatusBadge } from '../ui/kit'
import { inputCls } from '../ui/kitUtils'

const FILTERS: { value: OfferDisplayStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Όλες' },
  { value: 'draft', label: 'Πρόχειρες' },
  { value: 'sent', label: 'Σε αναμονή' },
  { value: 'accepted', label: 'Αποδεκτές' },
  { value: 'declined', label: 'Απορρίφθηκαν' },
  { value: 'expired', label: 'Έληξαν' },
]

/** /diaxeirisi/prosfores : every offer ever made (the archive), newest first. */
export function Offers() {
  const { api } = useAdmin()
  const navigate = useNavigate()
  const offers = useLoad(() => api.listOffers(), [api])
  const [filter, setFilter] = useState<OfferDisplayStatus | 'all'>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('el')
    return (offers.data ?? [])
      .map((o) => ({ o, status: displayStatus(o), total: offerTotals(o).total }))
      .filter((r) => filter === 'all' || r.status === filter)
      .filter((r) => !needle || [r.o.number, r.o.clientName, r.o.title, r.o.clientEmail, r.o.location].join(' ').toLocaleLowerCase('el').includes(needle))
  }, [offers.data, filter, q])

  const counts = useMemo(() => {
    const c: Partial<Record<OfferDisplayStatus, number>> = {}
    for (const o of offers.data ?? []) c[displayStatus(o)] = (c[displayStatus(o)] ?? 0) + 1
    return c
  }, [offers.data])
  const acceptedValue = (offers.data ?? []).filter((o) => o.status === 'accepted').reduce((s, o) => s + offerTotals(o).total, 0)

  if (offers.error) return <ErrorNote message={offers.error} onRetry={offers.reload} />
  if (!offers.data) return <Loading />

  return (
    <>
      <PageHeader
        title="Προσφορές"
        description="Το αρχείο όλων των οικονομικών προσφορών. Δημιουργήστε νέα ή ξεκινήστε από ένα αίτημα προσφοράς."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/diaxeirisi/prosfores/rythmiseis" className="inline-flex min-h-11 items-center rounded-md border border-stone-deep bg-white px-4 text-sm font-semibold hover:border-ink">
              Ρυθμίσεις προσφορών
            </Link>
            <Button variant="primary" onClick={() => navigate('/diaxeirisi/prosfores/nea')}>Νέα προσφορά</Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Σε αναμονή απάντησης" value={String(counts.sent ?? 0)} />
        <Stat label="Αποδεκτές" value={String(counts.accepted ?? 0)} />
        <Stat label="Αξία αποδεκτών (με ΦΠΑ)" value={formatMoney(acceptedValue)} />
      </div>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Φίλτρο κατάστασης">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className="min-h-9 rounded-full border border-stone-deep px-3.5 text-sm aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {f.label}
                {f.value !== 'all' && counts[f.value] ? <span className="ml-1.5 opacity-70">{counts[f.value]}</span> : null}
              </button>
            ))}
          </div>
          <label className="ml-auto w-full sm:w-64">
            <span className="sr-only">Αναζήτηση προσφοράς</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Αναζήτηση: αριθμός, πελάτης, έργο…" className={inputCls} />
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-muted-paper">{offers.data.length === 0 ? 'Δεν υπάρχουν προσφορές ακόμη.' : 'Καμία προσφορά δεν ταιριάζει στα κριτήρια.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="text-muted-paper">
                <tr className="border-b border-stone-deep/60">
                  <th className="py-2 pr-4 font-semibold">Αριθμός</th>
                  <th className="py-2 pr-4 font-semibold">Πελάτης</th>
                  <th className="py-2 pr-4 font-semibold">Έργο</th>
                  <th className="py-2 pr-4 text-right font-semibold">Σύνολο</th>
                  <th className="py-2 pr-4 font-semibold">Κατάσταση</th>
                  <th className="py-2 font-semibold">Ημερομηνία</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ o, status, total }) => (
                  <tr key={o.id} className="cursor-pointer border-b border-stone-deep/40 hover:bg-stone/30" onClick={() => navigate(`/diaxeirisi/prosfores/${o.id}`)}>
                    <td className="py-3 pr-4 font-semibold tabular-nums">
                      <Link to={`/diaxeirisi/prosfores/${o.id}`} onClick={(e) => e.stopPropagation()} className="underline-offset-4 hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{o.clientName || '—'}</td>
                    <td className="py-3 pr-4 text-muted-paper">{o.title || '—'}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(total)}</td>
                    <td className="py-3 pr-4"><StatusBadge tone={OFFER_STATUS[status].tone}>{OFFER_STATUS[status].label}</StatusBadge></td>
                    <td className="py-3 whitespace-nowrap text-muted-paper">{formatDate(o.issueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-deep/70 bg-white px-5 py-4">
      <p className="text-sm text-muted-paper">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  )
}
