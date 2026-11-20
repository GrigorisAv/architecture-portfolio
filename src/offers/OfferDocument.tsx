import type { ReactNode } from 'react'
import { Monogram } from '../components/ui/icons'
import { formatDate, formatMoney, formatNumber, lineTotal, offerTotals, type PublicOffer } from './model'
import './offer.css'

interface Props {
  offer: PublicOffer
  /** Resolved URL of the issuer's signature image, if any. */
  issuerSignatureSrc?: string | null
  /** Optional overlay in the top-right corner (e.g. draft watermark in the admin). */
  badge?: ReactNode
}

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

/**
 * The offer as a document: identical on screen, in the admin preview and on paper (A4, see offer.css).
 * Brand top-left as on the website; signatures of the client and the architect at the end.
 */
export function OfferDocument({ offer: o, issuerSignatureSrc, badge }: Props) {
  const t = offerTotals(o)
  const studio = o.issuer.studio || 'DS Architect'
  const terms = lines(o.terms)
  const hasDiscount = o.discountPercent > 0
  const contact = [o.issuer.email, o.issuer.phone, o.issuer.website].filter(Boolean)

  return (
    <article className="offer-doc" aria-label={`Οικονομική προσφορά ${o.number}`}>
      {badge}
      {/* ---------- Header ---------- */}
      <header className="offer-head">
        <div className="offer-brand">
          <Monogram className="h-10 w-10 text-bronze" />
          <div>
            <p className="flex items-baseline gap-2.5 leading-none">
              <span className="font-display text-[1.7rem] tracking-[0.14em]">DS</span>
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-bronze-ink">Architect</span>
            </p>
            <p className="mt-1.5 text-[0.7rem] tracking-[0.04em] text-muted-paper">Αρχιτεκτονική &amp; Εσωτερικοί Χώροι</p>
          </div>
        </div>
        <div className="offer-meta">
          <p className="eyebrow text-bronze-ink">Οικονομική προσφορά</p>
          <p className="mt-1 font-display text-[1.65rem] leading-tight tabular-nums">{o.number}</p>
          <dl className="mt-3 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-[0.78rem]">
            <dt className="text-muted-paper">Ημερομηνία</dt>
            <dd>{formatDate(o.issueDate)}</dd>
            {o.validUntil && (
              <>
                <dt className="text-muted-paper">Ισχύει έως</dt>
                <dd>{formatDate(o.validUntil)}</dd>
              </>
            )}
          </dl>
        </div>
      </header>
      <div className="offer-rule" />

      {/* ---------- Parties ---------- */}
      <section className="offer-parties offer-keep">
        <div>
          <p className="offer-label">Προς</p>
          <p className="font-semibold">{o.clientName || '—'}</p>
          {o.clientAddress && <p className="whitespace-pre-line">{o.clientAddress}</p>}
          {o.clientEmail && <p>{o.clientEmail}</p>}
          {o.clientPhone && <p>{o.clientPhone}</p>}
        </div>
        <div>
          <p className="offer-label">Από</p>
          <p className="font-semibold">{o.issuer.name}</p>
          <p>{[o.issuer.role, studio].filter(Boolean).join(' · ')}</p>
          {o.issuer.address && <p className="whitespace-pre-line">{o.issuer.address}</p>}
          {contact.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
      </section>

      {/* ---------- Project ---------- */}
      {(o.title || o.location || o.intro) && (
        <section className="offer-project offer-keep">
          {o.title && (
            <>
              <p className="offer-label">Έργο</p>
              <h1 className="font-display text-[1.9rem] font-light leading-[1.15] tracking-[-0.01em]">{o.title}</h1>
            </>
          )}
          {o.location && <p className="mt-1.5 text-muted-paper">{o.location}</p>}
          {o.intro && <p className="mt-5 max-w-[38rem] whitespace-pre-line">{o.intro}</p>}
        </section>
      )}

      {/* ---------- Items ---------- */}
      <section className="offer-items">
        <table>
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Περιγραφή</th>
              <th className="num">Ποσότητα</th>
              <th className="num">Τιμή μονάδας</th>
              <th className="num">Σύνολο</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i, k) => (
              <tr key={i.id}>
                <td className="font-display italic text-bronze-ink">{String(k + 1).padStart(2, '0')}</td>
                <td>
                  <p className="font-semibold">{i.title || '—'}</p>
                  {i.description && <p className="mt-1 whitespace-pre-line text-[0.82rem] text-muted-paper">{i.description}</p>}
                </td>
                <td className="num whitespace-nowrap" data-label="Ποσότητα">
                  <span>
                    {formatNumber(i.quantity)} <span className="text-muted-paper">{i.unit}</span>
                  </span>
                </td>
                <td className="num whitespace-nowrap" data-label="Τιμή μονάδας">{formatMoney(i.unitPrice)}</td>
                <td className="num whitespace-nowrap font-semibold" data-label="Σύνολο">{formatMoney(lineTotal(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="offer-totals offer-keep">
          <dt>Υποσύνολο</dt>
          <dd>{formatMoney(t.subtotal)}</dd>
          {hasDiscount && (
            <>
              <dt>Έκπτωση {formatNumber(o.discountPercent)}%</dt>
              <dd>−{formatMoney(t.discount)}</dd>
              <dt>Καθαρό ποσό</dt>
              <dd>{formatMoney(t.net)}</dd>
            </>
          )}
          <dt>{o.vatRate > 0 ? `ΦΠΑ ${formatNumber(o.vatRate)}%` : 'ΦΠΑ'}</dt>
          <dd>{o.vatRate > 0 ? formatMoney(t.vat) : 'Δεν περιλαμβάνεται'}</dd>
          <div className="offer-total-row">
            <dt>Σύνολο</dt>
            <dd>{formatMoney(t.total)}</dd>
          </div>
        </dl>
      </section>

      {/* ---------- Terms ---------- */}
      {(o.paymentTerms || terms.length > 0 || o.notes) && (
        <section className="offer-terms">
          {o.paymentTerms && (
            <div className="offer-keep">
              <p className="offer-label">Τρόπος πληρωμής</p>
              <p className="whitespace-pre-line">{o.paymentTerms}</p>
            </div>
          )}
          {terms.length > 0 && (
            <div className="offer-keep">
              <p className="offer-label">Όροι</p>
              <ul className="space-y-1.5">
                {terms.map((l) => (
                  <li key={l} className="grid grid-cols-[0.9rem_1fr]">
                    <span aria-hidden="true" className="text-bronze">—</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {o.notes && (
            <div className="offer-keep sm:col-span-2">
              <p className="offer-label">Σημειώσεις</p>
              <p className="whitespace-pre-line">{o.notes}</p>
            </div>
          )}
        </section>
      )}

      {/* ---------- Signatures ---------- */}
      <section className="offer-signatures offer-keep" aria-label="Υπογραφές">
        <div>
          <p className="offer-label">Αποδοχή πελάτη</p>
          <div className="offer-sig-box">
            {o.clientSignature && <img src={o.clientSignature} alt={`Υπογραφή: ${o.clientSignedName ?? ''}`} />}
          </div>
          <p className="font-semibold">{o.clientSignedName || o.clientName || 'Ονοματεπώνυμο'}</p>
          <p className="text-[0.78rem] text-muted-paper">
            {o.status === 'accepted' && o.respondedAt ? `Υπογράφηκε ηλεκτρονικά · ${formatDate(o.respondedAt)}` : 'Υπογραφή & ημερομηνία'}
          </p>
        </div>
        <div>
          <p className="offer-label">Για το {studio}</p>
          <div className="offer-sig-box">{issuerSignatureSrc && <img src={issuerSignatureSrc} alt={`Υπογραφή: ${o.issuer.name}`} />}</div>
          <p className="font-semibold">
            {o.issuer.name}
            {o.issuer.role && <span className="font-normal text-muted-paper"> | {o.issuer.role}</span>}
          </p>
          <p className="text-[0.78rem] text-muted-paper">{studio}</p>
        </div>
      </section>

      <footer className="offer-foot">
        <span>{studio}</span>
        {contact.map((c) => (
          <span key={c}>{c}</span>
        ))}
        <span className="ml-auto tabular-nums">{o.number}</span>
      </footer>
    </article>
  )
}
