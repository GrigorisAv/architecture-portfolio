import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Monogram } from '../components/ui/icons'
import { displayStatus, formatDate, pdfTitle, type PublicOffer } from '../offers/model'
import { OfferDocument } from '../offers/OfferDocument'
import { loadPublicOfferApi, type PublicOfferApi, type RespondError } from '../offers/publicApi'
import { SignaturePad } from '../offers/SignaturePad'

const ERRORS: Record<RespondError, string> = {
  not_found: 'Η προσφορά δεν βρέθηκε.',
  already_answered: 'Η προσφορά έχει ήδη απαντηθεί.',
  expired: 'Η προσφορά έχει λήξει. Επικοινωνήστε μαζί μας για ανανέωση.',
  'invalid:name': 'Συμπληρώστε το ονοματεπώνυμό σας.',
  'invalid:signature': 'Η υπογραφή δεν είναι έγκυρη. Υπογράψτε ξανά στο πλαίσιο.',
  network: 'Δεν ήταν δυνατή η αποστολή. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.',
}

/** /prosfora/:token : the client's view of an offer (private link, never indexed). */
export function OfferPublicPage() {
  const { token = '' } = useParams()
  const [api, setApi] = useState<PublicOfferApi | null>(null)
  const [offer, setOffer] = useState<PublicOffer | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => robots.remove()
  }, [])

  useEffect(() => {
    let alive = true
    loadPublicOfferApi()
      .then(async (a) => {
        const o = await a.get(token)
        if (!alive) return
        setApi(a)
        setOffer(o)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [token])

  useEffect(() => {
    if (offer) document.title = pdfTitle(offer)
  }, [offer])

  const reload = async () => {
    if (api) setOffer(await api.get(token))
  }

  return (
    <div data-print-root className="min-h-svh bg-[#ece7dd] px-3 pb-16 pt-4 text-ink sm:px-6">
      <header data-print-hide className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <a href="/" className="flex min-h-11 items-center gap-2.5">
          <Monogram className="h-7 w-7 text-bronze" />
          <span className="font-display text-lg tracking-[0.14em]">DS</span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-bronze-ink">Architect</span>
        </a>
        {offer && (
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink-raised">
            Λήψη PDF / Εκτύπωση
          </button>
        )}
      </header>

      {failed ? (
        <Message title="Δεν ήταν δυνατή η φόρτωση">Ελέγξτε τη σύνδεσή σας και ανανεώστε τη σελίδα.</Message>
      ) : offer === undefined ? (
        <p role="status" className="py-24 text-center text-muted-paper">Φόρτωση προσφοράς…</p>
      ) : offer === null ? (
        <Message title="Η προσφορά δεν βρέθηκε">Ο σύνδεσμος δεν είναι έγκυρος ή η προσφορά δεν είναι πλέον διαθέσιμη. Επικοινωνήστε μαζί μας για ένα νέο αντίγραφο.</Message>
      ) : (
        <>
          <StatusBanner offer={offer} />
          <OfferDocument offer={offer} issuerSignatureSrc={offer.issuer.signaturePath && api ? api.resolveImage(offer.issuer.signaturePath) : null} />
          {displayStatus(offer) === 'sent' && api && <ResponseForm offer={offer} token={token} api={api} onDone={reload} />}
        </>
      )}
    </div>
  )
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg bg-[#fffdf9] p-8 text-center shadow-sm">
      <h1 className="font-display text-2xl">{title}</h1>
      <p className="mt-3 text-muted-paper">{children}</p>
    </div>
  )
}

function StatusBanner({ offer }: { offer: PublicOffer }) {
  const s = displayStatus(offer)
  const text =
    s === 'accepted'
      ? `Η προσφορά έγινε αποδεκτή${offer.respondedAt ? ` στις ${formatDate(offer.respondedAt)}` : ''}. Σας ευχαριστούμε!`
      : s === 'declined'
        ? 'Η προσφορά δεν έγινε αποδεκτή. Αν θέλετε να τη συζητήσουμε ξανά, επικοινωνήστε μαζί μας.'
        : s === 'expired'
          ? 'Η προσφορά έχει λήξει. Επικοινωνήστε μαζί μας για ανανέωση.'
          : null
  if (!text) return null
  return (
    <p data-print-hide role="status" className={`mx-auto mb-4 max-w-[210mm] rounded-md px-4 py-3 text-sm ${s === 'accepted' ? 'bg-[#e4ecdf] text-[#2f4a26]' : 'bg-[#f3eadf] text-bronze-ink'}`}>
      {text}
    </p>
  )
}

function ResponseForm({ offer, token, api, onDone }: { offer: PublicOffer; token: string; api: PublicOfferApi; onDone: () => Promise<void> }) {
  const [name, setName] = useState(offer.clientName)
  const [signature, setSignature] = useState<string | null>(null)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDecline, setConfirmDecline] = useState(false)

  const send = async (accept: boolean) => {
    setError(null)
    if (name.trim().length < 3) return setError(ERRORS['invalid:name'])
    if (accept && !signature) return setError('Υπογράψτε στο πλαίσιο για να αποδεχθείτε την προσφορά.')
    if (accept && !agree) return setError('Επιβεβαιώστε ότι αποδέχεστε την προσφορά και τους όρους της.')
    setBusy(accept ? 'accept' : 'decline')
    const r = await api.respond(token, { accept, name: name.trim(), signature: accept ? signature : null })
    setBusy(null)
    if (!r.ok) return setError(ERRORS[r.error])
    await onDone()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(true)
  }

  return (
    <form data-print-hide onSubmit={onSubmit} className="mx-auto mt-6 max-w-[210mm] rounded-lg bg-[#fffdf9] p-6 shadow-sm sm:p-10" aria-labelledby="respond-title" data-offer-respond>
      <p className="eyebrow text-bronze-ink">Απάντηση</p>
      <h2 id="respond-title" className="mt-2 font-display text-2xl">Αποδοχή προσφοράς</h2>
      <p className="mt-2 max-w-xl text-sm text-muted-paper">
        Μπορείτε να αποδεχθείτε την προσφορά ηλεκτρονικά. Η υπογραφή σας θα εμφανιστεί στο έγγραφο, το οποίο μπορείτε στη συνέχεια να αποθηκεύσετε ως PDF.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Ονοματεπώνυμο
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-12 rounded-md border border-stone-deep bg-white px-4 font-normal outline-none focus:border-ink" />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Υπογραφή</span>
          <SignaturePad label="Πλαίσιο υπογραφής" onChange={setSignature} />
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-ink" />
        <span>Αποδέχομαι την προσφορά {offer.number} και τους όρους της.</span>
      </label>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-error">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy !== null} className="btn btn-primary">
          {busy === 'accept' ? 'Αποστολή…' : 'Αποδοχή και υπογραφή'}
        </button>
        {confirmDecline ? (
          <span className="flex flex-wrap items-center gap-3 text-sm">
            Σίγουρα;
            <button type="button" onClick={() => send(false)} disabled={busy !== null} className="min-h-11 rounded-md border border-error px-4 text-error">
              {busy === 'decline' ? 'Αποστολή…' : 'Ναι, απόρριψη'}
            </button>
            <button type="button" onClick={() => setConfirmDecline(false)} className="min-h-11 px-2 underline underline-offset-4">
              Άκυρο
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmDecline(true)} className="min-h-11 px-2 text-sm underline underline-offset-4">
            Δεν αποδέχομαι την προσφορά
          </button>
        )}
      </div>
    </form>
  )
}
