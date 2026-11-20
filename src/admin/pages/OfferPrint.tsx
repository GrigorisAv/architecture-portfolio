import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { displayStatus, OFFER_STATUS, pdfTitle } from '../../offers/model'
import { OfferDocument } from '../../offers/OfferDocument'
import { useAdmin } from '../AdminContext'
import { useLoad } from '../lib/useLoad'
import { ErrorNote, Loading } from '../ui/kit'

/** /diaxeirisi/prosfores/:id/ektyposi : the document alone, for preview and «Save as PDF» (A4). */
export function OfferPrint() {
  const { api } = useAdmin()
  const { id = '' } = useParams()
  const loaded = useLoad(async () => {
    const o = await api.getOffer(id)
    if (!o) throw new Error('Η προσφορά δεν βρέθηκε.')
    return o
  }, [api, id])

  useEffect(() => {
    if (!loaded.data) return
    const prev = document.title
    document.title = pdfTitle(loaded.data)
    return () => {
      document.title = prev
    }
  }, [loaded.data])

  if (loaded.error) return <div className="p-8"><ErrorNote message={loaded.error} onRetry={loaded.reload} /></div>
  if (!loaded.data) return <Loading />
  const o = loaded.data
  const status = displayStatus(o)

  return (
    <div data-print-root className="min-h-svh bg-[#ece7dd] px-3 pb-16 pt-4 sm:px-6">
      <div data-print-hide className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center gap-3">
        <Link to={`/diaxeirisi/prosfores/${o.id}`} className="min-h-11 content-center text-sm underline underline-offset-4">← Επιστροφή στην επεξεργασία</Link>
        <span className="text-sm text-muted-paper">
          {o.number} · {OFFER_STATUS[status].label}
        </span>
        <button type="button" onClick={() => window.print()} className="ml-auto inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink-raised" data-offer-pdf>
          Λήψη PDF / Εκτύπωση
        </button>
        <p className="w-full text-xs text-muted-paper">
          Στο παράθυρο εκτύπωσης επιλέξτε «Αποθήκευση ως PDF». Το αρχείο προτείνεται με όνομα «{pdfTitle(o)}».
        </p>
      </div>
      <OfferDocument
        offer={o}
        issuerSignatureSrc={o.issuer.signaturePath ? api.resolveImage(o.issuer.signaturePath, null).src : null}
        badge={
          o.status === 'draft' ? (
            <span className="pointer-events-none absolute right-6 top-6 rotate-6 rounded border-2 border-bronze/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-bronze/80">
              Πρόχειρο
            </span>
          ) : undefined
        }
      />
    </div>
  )
}
