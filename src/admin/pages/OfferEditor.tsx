import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { SiteSettings } from '../../content/types'
import { SITE_URL } from '../../lib/env'
import {
  displayStatus,
  duplicateOffer,
  emptyOffer,
  formatDate,
  formatMoney,
  isLocked,
  issuerFrom,
  lineTotal,
  newItem,
  OFFER_STATUS,
  offerLink,
  offerMailto,
  offerTotals,
  UNIT_SUGGESTIONS,
  VAT_OPTIONS,
  type IssuerContext,
  type Offer,
  type OfferItem,
  type OfferSettings,
} from '../../offers/model'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { Button, ConfirmButton, ErrorNote, Field, Loading, PageHeader, Panel, StatusBadge } from '../ui/kit'
import { inputCls, useBeforeUnload, useToast } from '../ui/kitUtils'
import { PROJECT_TYPE_LABEL } from './labels'

const siteOrigin = () => SITE_URL || window.location.origin
const issuerContext = (s: SiteSettings): IssuerContext => ({
  studioName: s.studioName,
  email: s.email,
  phone: s.phone,
  address: s.address,
  website: siteOrigin().replace(/^https?:\/\//, ''),
})

/** /diaxeirisi/prosfores/nea[?aitima=<request id>] and /diaxeirisi/prosfores/:id */
export function OfferEditor() {
  const { api } = useAdmin()
  const { id = 'nea' } = useParams()
  const [search] = useSearchParams()
  const requestId = search.get('aitima')
  const loaded = useLoad(async () => {
    const [offer, settings, site, quotes] = await Promise.all([
      id === 'nea' ? Promise.resolve(null) : api.getOffer(id),
      api.getOfferSettings(),
      api.getSettings(),
      requestId ? api.listQuotes() : Promise.resolve([]),
    ])
    if (id !== 'nea' && !offer) throw new Error('Η προσφορά δεν βρέθηκε.')
    const q = quotes.find((x) => x.id === requestId)
    const initial =
      offer ??
      emptyOffer(
        settings,
        issuerContext(site),
        q ? { id: q.id, fullName: q.fullName, email: q.email, phone: q.phone, area: q.area, projectTypeLabel: PROJECT_TYPE_LABEL[q.projectType] ?? 'Έργο', sizeSqm: q.sizeSqm } : undefined,
      )
    return { initial, settings, site }
  }, [api, id, requestId])
  if (loaded.error) return <ErrorNote message={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loading />
  return <OfferForm key={loaded.data.initial.id || 'new'} {...loaded.data} />
}

function OfferForm({ initial, settings, site }: { initial: Offer; settings: OfferSettings; site: SiteSettings }) {
  const { api } = useAdmin()
  const toast = useToast()
  const navigate = useNavigate()
  const [o, setO] = useState<Offer>(initial)
  const [saved, setSaved] = useState<Offer>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [showSend, setShowSend] = useState(false)
  const isNew = !o.id
  const locked = isLocked(saved)
  const dirty = JSON.stringify(o) !== JSON.stringify(saved)
  useBeforeUnload(dirty)
  const set = <K extends keyof Offer>(k: K, v: Offer[K]) => setO((x) => ({ ...x, [k]: v }))
  const setItem = (i: number, patch: Partial<OfferItem>) => set('items', o.items.map((it, k) => (k === i ? { ...it, ...patch } : it)))
  const moveItem = (i: number, d: -1 | 1) => {
    const items = [...o.items]
    ;[items[i], items[i + d]] = [items[i + d], items[i]]
    set('items', items)
  }
  const totals = offerTotals(o)
  const status = displayStatus(saved)
  const link = saved.publicToken ? offerLink(siteOrigin(), saved.publicToken) : ''

  const persist = async (next: Offer, message?: string): Promise<Offer | null> => {
    try {
      // The issuer is refreshed from the current settings on every save until the client answers.
      const toSave = isLocked(next) ? next : { ...next, issuer: issuerFrom(settings, issuerContext(site)) }
      const r = await api.saveOffer(toSave)
      setO(r)
      setSaved(r)
      if (message) toast('success', message)
      if (!next.id) navigate(`/diaxeirisi/prosfores/${r.id}`, { replace: true })
      return r
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Η αποθήκευση απέτυχε.')
      return null
    }
  }
  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  const sendProblems = [
    o.clientName.trim().length < 3 && 'το όνομα του πελάτη',
    (o.items.length === 0 || o.items.some((i) => !i.title.trim())) && 'τίτλο σε κάθε γραμμή εργασιών',
    totals.total <= 0 && 'τιμές στις εργασίες',
    o.validUntil && o.validUntil < o.issueDate && 'σωστή ημερομηνία ισχύος',
  ].filter(Boolean) as string[]

  const send = () =>
    run('send', async () => {
      if (sendProblems.length) {
        toast('error', `Πριν την αποστολή συμπληρώστε: ${sendProblems.join(', ')}.`)
        return
      }
      const r = await persist({ ...o, status: 'sent', sentAt: o.sentAt ?? new Date().toISOString() }, o.status === 'sent' ? 'Η προσφορά ενημερώθηκε.' : 'Η προσφορά είναι έτοιμη για αποστολή.')
      if (r) setShowSend(true)
    })

  return (
    <>
      <PageHeader
        title={isNew ? 'Νέα προσφορά' : `Προσφορά ${saved.number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Link to="/diaxeirisi/prosfores" className="underline underline-offset-4">← Όλες οι προσφορές</Link>
            {!isNew && <StatusBadge tone={OFFER_STATUS[status].tone}>{OFFER_STATUS[status].label}</StatusBadge>}
            {o.quoteRequestId && (
              <Link to={`/diaxeirisi/aitimata?aitima=${o.quoteRequestId}`} className="text-sm underline underline-offset-4">Από αίτημα προσφοράς</Link>
            )}
            {dirty && !locked && <span className="text-sm text-bronze-ink">· Μη αποθηκευμένες αλλαγές</span>}
          </span>
        }
        actions={
          !locked && (
            <Button variant="primary" busy={busy === 'save'} disabled={!dirty} onClick={() => run('save', () => persist(o, isNew ? 'Η προσφορά δημιουργήθηκε.' : 'Η προσφορά αποθηκεύτηκε.'))}>
              {isNew ? 'Δημιουργία προσφοράς' : 'Αποθήκευση'}
            </Button>
          )
        }
      />

      {locked && (
        <p role="status" className={`mb-6 rounded-md px-4 py-3 text-sm ${saved.status === 'accepted' ? 'bg-[#e4ecdf] text-[#2f4a26]' : 'bg-[#f3eadf] text-bronze-ink'}`}>
          {saved.status === 'accepted'
            ? `Αποδεκτή${saved.clientSignedName ? ` από ${saved.clientSignedName}` : ''}${saved.respondedAt ? ` στις ${formatDate(saved.respondedAt)}` : ''}. Το περιεχόμενο δεν αλλάζει πλέον· για νέα εκδοχή φτιάξτε αντίγραφο.`
            : `Ο πελάτης δεν αποδέχθηκε την προσφορά${saved.respondedAt ? ` (${formatDate(saved.respondedAt)})` : ''}. Για νέα εκδοχή φτιάξτε αντίγραφο.`}
        </p>
      )}
      {saved.status === 'sent' && dirty && (
        <p className="mb-6 rounded-md bg-[#f3eadf] px-4 py-3 text-sm text-bronze-ink">Η προσφορά έχει σταλεί: μετά την αποθήκευση, ο πελάτης θα δει τις αλλαγές στον ίδιο σύνδεσμο.</p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <fieldset disabled={locked} className="flex min-w-0 flex-col gap-6">
          <Panel title="Πελάτης">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Ονοματεπώνυμο / επωνυμία" required>{(p) => <input {...p} className={inputCls} value={o.clientName} onChange={(e) => set('clientName', e.target.value)} />}</Field>
              <Field label="Email" hint="Χρειάζεται για αποστολή με email.">{(p) => <input {...p} type="email" className={inputCls} value={o.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} />}</Field>
              <Field label="Τηλέφωνο">{(p) => <input {...p} type="tel" className={inputCls} value={o.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} />}</Field>
              <Field label="Διεύθυνση / ΑΦΜ (προαιρετικά)">{(p) => <textarea {...p} rows={2} className={inputCls} value={o.clientAddress} onChange={(e) => set('clientAddress', e.target.value)} />}</Field>
            </div>
          </Panel>

          <Panel title="Έργο">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Τίτλος έργου">{(p) => <input {...p} className={inputCls} value={o.title} placeholder="π.χ. Ανακαίνιση διαμερίσματος 95 τ.μ." onChange={(e) => set('title', e.target.value)} />}</Field>
              <Field label="Τοποθεσία">{(p) => <input {...p} className={inputCls} value={o.location} onChange={(e) => set('location', e.target.value)} />}</Field>
              <div className="md:col-span-2">
                <Field label="Εισαγωγικό κείμενο">{(p) => <textarea {...p} rows={3} className={inputCls} value={o.intro} onChange={(e) => set('intro', e.target.value)} />}</Field>
              </div>
            </div>
          </Panel>

          <Panel title="Εργασίες & τιμές" description="Κάθε γραμμή: τίτλος, προαιρετική περιγραφή, ποσότητα, μονάδα και τιμή μονάδας (χωρίς ΦΠΑ).">
            <datalist id="offer-units">
              {UNIT_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
            <ol className="flex flex-col gap-3" data-offer-items>
              {o.items.map((it, i) => (
                <li key={it.id} className="rounded-lg border border-stone-deep/60 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2.5 w-6 shrink-0 font-display italic text-bronze-ink">{String(i + 1).padStart(2, '0')}</span>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                      <label className="flex flex-col gap-1 text-xs font-semibold sm:col-span-2 md:col-span-4">
                        Εργασία
                        <input className={inputCls} value={it.title} placeholder="π.χ. Αρχιτεκτονική μελέτη" onChange={(e) => setItem(i, { title: e.target.value })} />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold">
                        Ποσότητα
                        <input className={inputCls} type="number" min={0} step="any" inputMode="decimal" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) || 0 })} />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold">
                        Μονάδα
                        <input className={inputCls} list="offer-units" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold">
                        Τιμή μονάδας (€)
                        <input className={inputCls} type="number" min={0} step="any" inputMode="decimal" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) || 0 })} />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold sm:col-span-2 md:col-span-4">
                        Περιγραφή (προαιρετική)
                        <textarea className={inputCls} rows={2} value={it.description} placeholder="Τι περιλαμβάνει: παραδοτέα, στάδια, επισκέψεις…" onChange={(e) => setItem(i, { description: e.target.value })} />
                      </label>
                      <div className="flex flex-col justify-end gap-1 text-right">
                        <span className="text-xs text-muted-paper">Σύνολο γραμμής</span>
                        <span className="pb-2.5 font-semibold tabular-nums">{formatMoney(lineTotal(it))}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button variant="ghost" className="px-2" aria-label={`Μετακίνηση γραμμής ${i + 1} πάνω`} disabled={i === 0} onClick={() => moveItem(i, -1)}>↑</Button>
                      <Button variant="ghost" className="px-2" aria-label={`Μετακίνηση γραμμής ${i + 1} κάτω`} disabled={i === o.items.length - 1} onClick={() => moveItem(i, 1)}>↓</Button>
                      <Button variant="ghost" className="px-2 text-error" aria-label={`Αφαίρεση γραμμής ${i + 1}`} disabled={o.items.length === 1} onClick={() => set('items', o.items.filter((_, k) => k !== i))}>✕</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <Button className="mt-4" onClick={() => set('items', [...o.items, newItem()])}>+ Προσθήκη γραμμής</Button>

            <div className="mt-6 grid gap-5 border-t border-stone-deep/60 pt-5 md:grid-cols-2">
              <Field label="Έκπτωση (%)">{(p) => <input {...p} type="number" min={0} max={100} step="any" inputMode="decimal" className={inputCls} value={o.discountPercent} onChange={(e) => set('discountPercent', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />}</Field>
              <Field label="ΦΠΑ">
                {(p) => (
                  <select {...p} className={inputCls} value={o.vatRate} onChange={(e) => set('vatRate', Number(e.target.value))}>
                    {VAT_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v === 0 ? 'Χωρίς ΦΠΑ' : `${v}%`}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Όροι">
            <div className="grid gap-5">
              <Field label="Τρόπος πληρωμής">{(p) => <textarea {...p} rows={2} className={inputCls} value={o.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} />}</Field>
              <Field label="Όροι" hint="Ένας όρος ανά γραμμή.">{(p) => <textarea {...p} rows={4} className={inputCls} value={o.terms} onChange={(e) => set('terms', e.target.value)} />}</Field>
              <Field label="Σημειώσεις προς τον πελάτη (προαιρετικά)">{(p) => <textarea {...p} rows={2} className={inputCls} value={o.notes} onChange={(e) => set('notes', e.target.value)} />}</Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Ημερομηνία έκδοσης">{(p) => <input {...p} type="date" className={inputCls} value={o.issueDate} onChange={(e) => e.target.value && set('issueDate', e.target.value)} />}</Field>
                <Field label="Ισχύει έως" error={o.validUntil && o.validUntil < o.issueDate ? 'Πριν από την ημερομηνία έκδοσης' : undefined}>
                  {(p) => <input {...p} type="date" className={inputCls} value={o.validUntil ?? ''} onChange={(e) => set('validUntil', e.target.value || null)} />}
                </Field>
              </div>
            </div>
          </Panel>
        </fieldset>

        {/* ---------- Summary & actions ---------- */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Panel title="Σύνοψη">
            <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm tabular-nums" data-offer-summary>
              <dt className="text-muted-paper">Υποσύνολο</dt>
              <dd className="text-right">{formatMoney(totals.subtotal)}</dd>
              {o.discountPercent > 0 && (
                <>
                  <dt className="text-muted-paper">Έκπτωση {o.discountPercent}%</dt>
                  <dd className="text-right">−{formatMoney(totals.discount)}</dd>
                </>
              )}
              <dt className="text-muted-paper">ΦΠΑ {o.vatRate}%</dt>
              <dd className="text-right">{formatMoney(totals.vat)}</dd>
              <dt className="mt-2 border-t border-ink pt-2 font-semibold">Σύνολο</dt>
              <dd className="mt-2 border-t border-ink pt-2 text-right font-display text-2xl" data-offer-total>{formatMoney(totals.total)}</dd>
            </dl>
          </Panel>

          <Panel title="Ενέργειες">
            <div className="flex flex-col gap-2">
              {!locked && (
                <Button variant="primary" busy={busy === 'send'} onClick={send}>
                  {saved.status === 'sent' ? (dirty ? 'Αποθήκευση & αποστολή ξανά' : 'Αποστολή στον πελάτη') : 'Ετοιμασία για αποστολή'}
                </Button>
              )}
              {!isNew && (
                <Link
                  to={`/diaxeirisi/prosfores/${saved.id}/ektyposi`}
                  target="_blank"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-deep bg-white px-4 text-sm font-semibold hover:border-ink"
                >
                  Προεπισκόπηση & PDF ↗
                </Link>
              )}
              {dirty && !isNew && <p className="text-xs text-muted-paper">Η προεπισκόπηση δείχνει την αποθηκευμένη εκδοχή.</p>}
              {!isNew && (
                <Button
                  busy={busy === 'dup'}
                  onClick={() =>
                    run('dup', async () => {
                      const r = await api.saveOffer({ ...duplicateOffer(saved), issuer: issuerFrom(settings, issuerContext(site)) })
                      toast('success', `Δημιουργήθηκε η ${r.number} ως αντίγραφο.`)
                      navigate(`/diaxeirisi/prosfores/${r.id}`)
                    })
                  }
                >
                  Αντίγραφο ως νέα προσφορά
                </Button>
              )}
              {saved.status === 'sent' && !dirty && (
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer text-muted-paper">Η απάντηση ήρθε αλλιώς (π.χ. τηλεφωνικά);</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button onClick={() => run('acc', () => persist({ ...saved, status: 'accepted' }, 'Σημειώθηκε ως αποδεκτή.'))}>Αποδεκτή</Button>
                    <Button onClick={() => run('dec', () => persist({ ...saved, status: 'declined' }, 'Σημειώθηκε ως απορριφθείσα.'))}>Απορρίφθηκε</Button>
                    <Button variant="ghost" onClick={() => run('draft', () => persist({ ...saved, status: 'draft' }, 'Η προσφορά έγινε ξανά πρόχειρη· ο σύνδεσμος δεν λειτουργεί πλέον.'))}>Επαναφορά σε πρόχειρη</Button>
                  </div>
                </details>
              )}
              {!isNew && (
                <div className="mt-2 border-t border-stone-deep/60 pt-3">
                  <ConfirmButton
                    label="Διαγραφή προσφοράς"
                    onConfirm={async () => {
                      await api.deleteOffer(saved.id)
                      toast('success', 'Η προσφορά διαγράφηκε.')
                      navigate('/diaxeirisi/prosfores')
                    }}
                  />
                </div>
              )}
            </div>
          </Panel>

          {(showSend || saved.status !== 'draft') && link && (
            <Panel title="Σύνδεσμος πελάτη">
              <div className="flex flex-col gap-3 text-sm" data-offer-share>
                <p className="text-muted-paper">Ο πελάτης βλέπει, εκτυπώνει και {saved.status === 'sent' ? 'αποδέχεται με υπογραφή' : 'αποθηκεύει'} την προσφορά σε αυτόν τον ιδιωτικό σύνδεσμο.</p>
                <input readOnly value={link} className={`${inputCls} text-xs`} aria-label="Σύνδεσμος προσφοράς" onFocus={(e) => e.target.select()} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigator.clipboard?.writeText(link).then(() => toast('success', 'Ο σύνδεσμος αντιγράφηκε.'))}>Αντιγραφή</Button>
                  <a
                    href={saved.clientEmail ? offerMailto(saved, link) : undefined}
                    aria-disabled={!saved.clientEmail}
                    className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 font-semibold text-paper aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  >
                    Αποστολή με email
                  </a>
                  <a href={link} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center px-1 underline underline-offset-4">Όπως τη βλέπει ο πελάτης ↗</a>
                </div>
                {!saved.clientEmail && <p className="text-xs text-muted-paper">Συμπληρώστε το email του πελάτη για αποστολή με email· αλλιώς στείλτε τον σύνδεσμο από Viber, SMS κ.λπ.</p>}
                <p className="text-xs text-muted-paper">Το «Αποστολή με email» ανοίγει το πρόγραμμα email σας με έτοιμο μήνυμα· η αποστολή γίνεται από εκεί.</p>
              </div>
            </Panel>
          )}

          {saved.status === 'accepted' && saved.clientSignature && (
            <Panel title="Υπογραφή πελάτη">
              <img src={saved.clientSignature} alt={`Υπογραφή: ${saved.clientSignedName ?? ''}`} className="max-h-24" />
              <p className="mt-2 text-sm">{saved.clientSignedName}</p>
            </Panel>
          )}

          <Panel title="Εσωτερικές σημειώσεις">
            <textarea
              aria-label="Εσωτερικές σημειώσεις"
              rows={3}
              className={inputCls}
              value={o.internalNotes}
              placeholder="Δεν εμφανίζονται ποτέ στον πελάτη."
              onChange={(e) => set('internalNotes', e.target.value)}
            />
            {locked && dirty && (
              <Button className="mt-2" busy={busy === 'notes'} onClick={() => run('notes', () => persist({ ...saved, internalNotes: o.internalNotes }, 'Οι σημειώσεις αποθηκεύτηκαν.'))}>
                Αποθήκευση σημειώσεων
              </Button>
            )}
          </Panel>
        </aside>
      </div>
    </>
  )
}
