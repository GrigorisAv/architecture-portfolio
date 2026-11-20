import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { displayStatus, formatMoney, OFFER_STATUS, offerTotals, type Offer } from '../../offers/model'
import type { QuoteRecord, QuoteStatus } from '../../content/records'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { Button, ConfirmButton, ErrorNote, Loading, PageHeader, Panel, StatusBadge } from '../ui/kit'
import { formatDate, inputCls, useToast } from '../ui/kitUtils'
import { PROJECT_TYPE_LABEL, QUOTE_STATUS } from './labels'

type Filter = 'active' | QuoteStatus | 'all'

export function Requests() {
  const { api } = useAdmin()
  const toast = useToast()
  const quotes = useLoad(() => api.listQuotes(), [api])
  const offers = useLoad(() => api.listOffers(), [api])
  const [search] = useSearchParams()
  const [filter, setFilter] = useState<Filter>(search.get('aitima') ? 'all' : 'active')
  const [openId, setOpenId] = useState<string | null>(search.get('aitima'))

  const list = useMemo(
    () => (quotes.data ?? []).filter((q) => (filter === 'all' ? true : filter === 'active' ? q.status !== 'archived' : q.status === filter)),
    [quotes.data, filter],
  )
  const open = quotes.data?.find((q) => q.id === openId) ?? null

  const patch = async (q: QuoteRecord, p: { status?: QuoteStatus; adminNotes?: string }) => {
    quotes.setData((all) => all && all.map((x) => (x.id === q.id ? { ...x, ...p } : x)))
    try {
      await api.updateQuote(q.id, p)
      window.dispatchEvent(new Event('ds:requests-changed'))
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η ενημέρωση απέτυχε.')
      quotes.reload()
    }
  }
  const select = (q: QuoteRecord) => {
    setOpenId(q.id)
    if (q.status === 'new') void patch(q, { status: 'read' })
  }

  return (
    <>
      <PageHeader title="Αιτήματα προσφοράς" description="Τα αιτήματα που υποβάλλονται από τη φόρμα του ιστότοπου." />
      <div role="group" aria-label="Φίλτρο" className="mb-5 flex flex-wrap gap-1 rounded-md border border-stone-deep/70 bg-white p-1">
        {([['active', 'Ενεργά'], ['new', 'Νέα'], ['replied', 'Απαντήθηκαν'], ['archived', 'Αρχείο'], ['all', 'Όλα']] as [Filter, string][]).map(([v, l]) => (
          <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={`rounded px-3 py-1.5 text-sm font-medium ${filter === v ? 'bg-ink text-paper' : 'hover:bg-stone/50'}`}>{l}</button>
        ))}
      </div>
      {quotes.loading && <Loading />}
      {quotes.error && <ErrorNote message={quotes.error} onRetry={quotes.reload} />}
      {quotes.data && (
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <Panel>
            {list.length === 0 ? (
              <p className="text-muted-paper">Δεν υπάρχουν αιτήματα σε αυτή την προβολή.</p>
            ) : (
              <ul className="-m-2 flex flex-col">
                {list.map((q) => (
                  <li key={q.id}>
                    <button type="button" onClick={() => select(q)} aria-current={openId === q.id || undefined} className={`w-full rounded-md p-3 text-left transition-colors ${openId === q.id ? 'bg-stone/60' : 'hover:bg-stone/30'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate ${q.status === 'new' ? 'font-bold' : 'font-semibold'}`}>{q.fullName}</span>
                        <StatusBadge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</StatusBadge>
                      </span>
                      <span className="mt-1 block text-xs text-muted-paper">{PROJECT_TYPE_LABEL[q.projectType]} · {q.area} · {formatDate(q.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {open ? (
            <QuoteDetail key={open.id} q={open} offers={(offers.data ?? []).filter((o) => o.quoteRequestId === open.id)} onPatch={(p) => patch(open, p)} onDelete={async () => { await api.deleteQuote(open.id); toast('success', 'Το αίτημα διαγράφηκε.'); setOpenId(null); quotes.reload() }} />
          ) : (
            <Panel><p className="text-muted-paper">Επιλέξτε ένα αίτημα για να δείτε τις λεπτομέρειες.</p></Panel>
          )}
        </div>
      )}
    </>
  )
}

function QuoteDetail({ q, offers, onPatch, onDelete }: { q: QuoteRecord; offers: Offer[]; onPatch: (p: { status?: QuoteStatus; adminNotes?: string }) => void; onDelete: () => Promise<void> }) {
  const [notes, setNotes] = useState(q.adminNotes)
  const navigate = useNavigate()
  const rows: [string, React.ReactNode][] = [
    ['Email', <a key="email" className="underline underline-offset-4" href={`mailto:${q.email}`}>{q.email}</a>],
    ['Τηλέφωνο', <a key="phone" className="underline underline-offset-4" href={`tel:${q.phone.replace(/\s/g, '')}`}>{q.phone}</a>],
    ['Είδος έργου', PROJECT_TYPE_LABEL[q.projectType]],
    ['Περιοχή', q.area],
    ['Τετραγωνικά', q.sizeSqm ? `${q.sizeSqm} τ.μ.` : '—'],
    ['Υποβλήθηκε', formatDate(q.createdAt)],
  ]
  return (
    <Panel title={q.fullName} actions={<StatusBadge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</StatusBadge>}>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-paper">{k}</dt><dd className="mt-0.5 select-all">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-6 rounded-md border border-stone-deep/60 p-4" data-request-offers>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-paper">Προσφορές για αυτό το αίτημα</h3>
          <Button variant="primary" onClick={() => navigate(`/diaxeirisi/prosfores/nea?aitima=${q.id}`)}>Δημιουργία προσφοράς</Button>
        </div>
        {offers.length === 0 ? (
          <p className="mt-2 text-sm text-muted-paper">Δεν έχει γίνει προσφορά ακόμη. Τα στοιχεία του πελάτη συμπληρώνονται αυτόματα.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {offers.map((o) => {
              const st = displayStatus(o)
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3">
                  <Link to={`/diaxeirisi/prosfores/${o.id}`} className="font-semibold underline-offset-4 hover:underline">{o.number}</Link>
                  <span className="tabular-nums">{formatMoney(offerTotals(o).total)}</span>
                  <StatusBadge tone={OFFER_STATUS[st].tone}>{OFFER_STATUS[st].label}</StatusBadge>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-muted-paper">Περιγραφή</h3>
      <p className="mt-1 whitespace-pre-wrap rounded-md bg-paper p-4">{q.description}</p>
      <label className="mt-6 flex flex-col gap-1.5 text-sm font-semibold">
        Εσωτερικές σημειώσεις
        <textarea className={`${inputCls} min-h-24 font-normal`} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== q.adminNotes && onPatch({ adminNotes: notes })} />
      </label>
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stone-deep/60 pt-5">
        <label className="text-sm font-semibold" htmlFor="q-status">Κατάσταση</label>
        <select id="q-status" className={`${inputCls} w-auto`} value={q.status} onChange={(e) => onPatch({ status: e.target.value as QuoteStatus })}>
          {Object.entries(QUOTE_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </select>
        {q.status !== 'replied' && <Button onClick={() => onPatch({ status: 'replied' })}>Σήμανση ως απαντημένο</Button>}
        <span className="ml-auto"><ConfirmButton label="Διαγραφή" onConfirm={onDelete} /></span>
      </div>
    </Panel>
  )
}
