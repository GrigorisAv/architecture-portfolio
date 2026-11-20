import type { Offer, OfferIssuer, OfferItem, OfferStatus, PublicOffer } from './model'

/** Row of public.offers (snake_case). */
export interface OfferRow {
  id: string
  number: string
  quote_request_id: string | null
  status: OfferStatus
  public_token: string
  client_name: string
  client_email: string
  client_phone: string
  client_address: string
  title: string
  location: string
  intro: string
  items: OfferItem[]
  discount_percent: number | string
  vat_rate: number | string
  payment_terms: string
  terms: string
  notes: string
  issuer: Partial<OfferIssuer>
  internal_notes: string
  issue_date: string
  valid_until: string | null
  sent_at: string | null
  responded_at: string | null
  client_signed_name: string | null
  client_signature: string | null
  created_at: string
  updated_at: string
}

const issuerOf = (i: Partial<OfferIssuer> | null | undefined): OfferIssuer => ({
  name: i?.name ?? '',
  role: i?.role ?? '',
  studio: i?.studio ?? '',
  email: i?.email ?? '',
  phone: i?.phone ?? '',
  address: i?.address ?? '',
  website: i?.website ?? '',
  signaturePath: i?.signaturePath ?? null,
})

const itemsOf = (v: unknown): OfferItem[] =>
  Array.isArray(v)
    ? v.map((i) => ({
        id: String(i?.id ?? Math.random()),
        title: String(i?.title ?? ''),
        description: String(i?.description ?? ''),
        quantity: Number(i?.quantity) || 0,
        unit: String(i?.unit ?? ''),
        unitPrice: Number(i?.unitPrice) || 0,
      }))
    : []

export const toOffer = (r: OfferRow): Offer => ({
  id: r.id,
  number: r.number,
  quoteRequestId: r.quote_request_id,
  status: r.status,
  publicToken: r.public_token,
  clientName: r.client_name,
  clientEmail: r.client_email,
  clientPhone: r.client_phone,
  clientAddress: r.client_address,
  title: r.title,
  location: r.location,
  intro: r.intro,
  items: itemsOf(r.items),
  discountPercent: Number(r.discount_percent) || 0,
  vatRate: Number(r.vat_rate) || 0,
  paymentTerms: r.payment_terms,
  terms: r.terms,
  notes: r.notes,
  issuer: issuerOf(r.issuer),
  internalNotes: r.internal_notes,
  issueDate: r.issue_date,
  validUntil: r.valid_until,
  sentAt: r.sent_at,
  respondedAt: r.responded_at,
  clientSignedName: r.client_signed_name,
  clientSignature: r.client_signature,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

/** Editable columns only (number, token, timestamps and the client's answer are owned by the database). */
export const fromOffer = (o: Offer) => ({
  quote_request_id: o.quoteRequestId,
  status: o.status,
  client_name: o.clientName,
  client_email: o.clientEmail,
  client_phone: o.clientPhone,
  client_address: o.clientAddress,
  title: o.title,
  location: o.location,
  intro: o.intro,
  items: o.items,
  discount_percent: o.discountPercent,
  vat_rate: o.vatRate,
  payment_terms: o.paymentTerms,
  terms: o.terms,
  notes: o.notes,
  issuer: o.issuer,
  internal_notes: o.internalNotes,
  issue_date: o.issueDate,
  valid_until: o.validUntil,
  sent_at: o.sentAt,
})

/** JSON returned by get_public_offer(). */
export const toPublicOffer = (j: Record<string, unknown>): PublicOffer => {
  const r = j as unknown as OfferRow
  const o = toOffer({ ...r, id: '', quote_request_id: null, public_token: '', internal_notes: '', created_at: '', updated_at: '' })
  const { id: _i, quoteRequestId: _q, publicToken: _t, internalNotes: _n, createdAt: _c, updatedAt: _u, ...pub } = o
  return pub
}
