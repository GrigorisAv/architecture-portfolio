/**
 * Financial offers (προσφορές): shared by the admin (create/send) and the public client page (view/sign).
 * Mirrors the `offers` table (supabase/migrations/20261120000005_offers.sql).
 */

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'declined'
/** `expired` is derived: a sent offer past its validity date. */
export type OfferDisplayStatus = OfferStatus | 'expired'

export interface OfferItem {
  id: string
  title: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

/** Issuer details frozen into each offer, so later settings changes never alter what a client saw. */
export interface OfferIssuer {
  name: string
  role: string
  studio: string
  email: string
  phone: string
  address: string
  website: string
  /** Stored image path (resolved with the site's image resolver), or null. */
  signaturePath: string | null
}

export interface Offer {
  id: string
  number: string
  quoteRequestId: string | null
  status: OfferStatus
  publicToken: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  title: string
  location: string
  intro: string
  items: OfferItem[]
  discountPercent: number
  vatRate: number
  paymentTerms: string
  terms: string
  notes: string
  issuer: OfferIssuer
  internalNotes: string
  /** YYYY-MM-DD */
  issueDate: string
  validUntil: string | null
  sentAt: string | null
  respondedAt: string | null
  clientSignedName: string | null
  clientSignature: string | null
  createdAt: string
  updatedAt: string
}

/** What a client sees through the link. */
export type PublicOffer = Omit<Offer, 'id' | 'quoteRequestId' | 'publicToken' | 'internalNotes' | 'createdAt' | 'updatedAt'>

export interface OfferSettings {
  issuerName: string
  issuerRole: string
  signaturePath: string | null
  defaultIntro: string
  defaultPaymentTerms: string
  defaultTerms: string
  defaultValidityDays: number
  defaultVatRate: number
}

export const OFFER_SETTINGS_DEFAULTS: OfferSettings = {
  issuerName: 'Δήμητρα Σαπίδου',
  issuerRole: 'Αρχιτέκτων Μηχανικός',
  signaturePath: null,
  defaultIntro: 'Σας ευχαριστούμε για το ενδιαφέρον σας. Ακολουθεί η οικονομική προσφορά για τις υπηρεσίες που συζητήσαμε.',
  defaultPaymentTerms: '30% με την αποδοχή της προσφοράς, 40% με την παράδοση της προμελέτης και 30% με την παράδοση της οριστικής μελέτης.',
  defaultTerms: [
    'Οι τιμές αφορούν τις υπηρεσίες που περιγράφονται παραπάνω. Εργασίες εκτός αντικειμένου τιμολογούνται χωριστά, κατόπιν συμφωνίας.',
    'Τέλη και εισφορές προς δημόσιους φορείς (π.χ. ΤΕΕ, ΥΔΟΜ) δεν περιλαμβάνονται, εκτός αν αναφέρεται ρητά.',
    'Η προσφορά ισχύει έως την ημερομηνία που αναγράφεται.',
  ].join('\n'),
  defaultValidityDays: 30,
  defaultVatRate: 24,
}

export function normalizeOfferSettings(c: Partial<OfferSettings> | null | undefined): OfferSettings {
  const d = OFFER_SETTINGS_DEFAULTS
  const str = (v: unknown, def: string) => (typeof v === 'string' ? v : def)
  const num = (v: unknown, def: number, min: number, max: number) => (typeof v === 'number' && v >= min && v <= max ? v : def)
  return {
    issuerName: str(c?.issuerName, d.issuerName),
    issuerRole: str(c?.issuerRole, d.issuerRole),
    signaturePath: typeof c?.signaturePath === 'string' && c.signaturePath ? c.signaturePath : null,
    defaultIntro: str(c?.defaultIntro, d.defaultIntro),
    defaultPaymentTerms: str(c?.defaultPaymentTerms, d.defaultPaymentTerms),
    defaultTerms: str(c?.defaultTerms, d.defaultTerms),
    defaultValidityDays: num(c?.defaultValidityDays, d.defaultValidityDays, 1, 365),
    defaultVatRate: num(c?.defaultVatRate, d.defaultVatRate, 0, 100),
  }
}

export const UNIT_SUGGESTIONS = ['κατ’ αποκοπή', 'τ.μ.', 'ώρα', 'επίσκεψη', 'τεμ.', 'φάση']
export const VAT_OPTIONS = [24, 13, 6, 0]

export const OFFER_STATUS: Record<OfferDisplayStatus, { label: string; tone: 'gray' | 'bronze' | 'green' | 'red' }> = {
  draft: { label: 'Πρόχειρη', tone: 'gray' },
  sent: { label: 'Απεστάλη', tone: 'bronze' },
  accepted: { label: 'Αποδεκτή', tone: 'green' },
  declined: { label: 'Απορρίφθηκε', tone: 'red' },
  expired: { label: 'Έληξε', tone: 'gray' },
}

/* ---------------- dates ---------------- */

export const todayIso = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return todayIso(new Date(y, m - 1, d + days))
}

/** «20 Νοεμβρίου 2026» */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('el-GR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d))
}

export function displayStatus(o: Pick<Offer, 'status' | 'validUntil'>, today = todayIso()): OfferDisplayStatus {
  return o.status === 'sent' && o.validUntil && o.validUntil < today ? 'expired' : o.status
}

/* ---------------- money ---------------- */

const EUR = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUM = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 2 })

export const formatMoney = (n: number) => EUR.format(round2(n))
export const formatNumber = (n: number) => NUM.format(n)
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Accepts Greek («1.234,5») and plain («1234.5») input. Empty/invalid → 0. */
export function parseAmount(input: string): number {
  const s = input.trim().replace(/\s|€/g, '')
  if (!s) return 0
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

export const lineTotal = (i: Pick<OfferItem, 'quantity' | 'unitPrice'>) => round2((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0))

export interface OfferTotals {
  subtotal: number
  discount: number
  net: number
  vat: number
  total: number
}

export function offerTotals(o: Pick<Offer, 'items' | 'discountPercent' | 'vatRate'>): OfferTotals {
  const subtotal = round2(o.items.reduce((sum, i) => sum + lineTotal(i), 0))
  const discount = round2((subtotal * (o.discountPercent || 0)) / 100)
  const net = round2(subtotal - discount)
  const vat = round2((net * (o.vatRate || 0)) / 100)
  return { subtotal, discount, net, vat, total: round2(net + vat) }
}

/* ---------------- creation ---------------- */

export const newItem = (): OfferItem => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
  title: '',
  description: '',
  quantity: 1,
  unit: UNIT_SUGGESTIONS[0],
  unitPrice: 0,
})

export interface IssuerContext {
  studioName: string
  email: string | null
  phone: string | null
  address: string | null
  website: string
}

export function issuerFrom(s: OfferSettings, site: IssuerContext): OfferIssuer {
  return {
    name: s.issuerName,
    role: s.issuerRole,
    studio: site.studioName,
    email: site.email ?? '',
    phone: site.phone ?? '',
    address: site.address ?? '',
    website: site.website,
    signaturePath: s.signaturePath,
  }
}

export interface RequestSeed {
  id: string
  fullName: string
  email: string
  phone: string
  area: string
  projectTypeLabel: string
  sizeSqm: number | null
}

export function emptyOffer(s: OfferSettings, site: IssuerContext, from?: RequestSeed): Offer {
  const issueDate = todayIso()
  return {
    id: '',
    number: '',
    quoteRequestId: from?.id ?? null,
    status: 'draft',
    publicToken: '',
    clientName: from?.fullName ?? '',
    clientEmail: from?.email ?? '',
    clientPhone: from?.phone ?? '',
    clientAddress: '',
    title: from ? `${from.projectTypeLabel}${from.sizeSqm ? ` · ${formatNumber(from.sizeSqm)} τ.μ.` : ''}` : '',
    location: from?.area ?? '',
    intro: s.defaultIntro,
    items: [newItem()],
    discountPercent: 0,
    vatRate: s.defaultVatRate,
    paymentTerms: s.defaultPaymentTerms,
    terms: s.defaultTerms,
    notes: '',
    issuer: issuerFrom(s, site),
    internalNotes: '',
    issueDate,
    validUntil: addDays(issueDate, s.defaultValidityDays),
    sentAt: null,
    respondedAt: null,
    clientSignedName: null,
    clientSignature: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/** A fresh draft with the same content (new number, new link, no answer). */
export function duplicateOffer(o: Offer): Offer {
  const issueDate = todayIso()
  const days = o.validUntil ? Math.max(1, Math.round((Date.parse(o.validUntil) - Date.parse(o.issueDate)) / 86_400_000)) : 30
  return {
    ...o,
    id: '',
    number: '',
    status: 'draft',
    publicToken: '',
    items: o.items.map((i) => ({ ...newItem(), ...i, id: newItem().id })),
    issueDate,
    validUntil: addDays(issueDate, days),
    sentAt: null,
    respondedAt: null,
    clientSignedName: null,
    clientSignature: null,
  }
}

export const isLocked = (o: Pick<Offer, 'status'>) => o.status === 'accepted' || o.status === 'declined'

/** Document title = the file name browsers suggest for «Save as PDF». */
export const pdfTitle = (o: Pick<PublicOffer, 'number' | 'clientName'>) => `Προσφορά ${o.number}${o.clientName ? ` - ${o.clientName}` : ''} - DS Architect`

export function offerLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/prosfora/${token}`
}

export function offerMailto(o: Offer, link: string): string {
  const subject = `Οικονομική προσφορά ${o.number} · ${o.issuer.studio}`
  const body = [
    `${o.clientName ? `Αγαπητέ/ή ${o.clientName},` : 'Καλημέρα σας,'}`,
    '',
    `σας αποστέλλω την οικονομική προσφορά${o.title ? ` για «${o.title}»` : ''}.`,
    'Μπορείτε να τη δείτε, να την εκτυπώσετε ή να την αποδεχθείτε ηλεκτρονικά εδώ:',
    link,
    '',
    ...(o.validUntil ? [`Η προσφορά ισχύει έως ${formatDate(o.validUntil)}.`, ''] : []),
    'Με εκτίμηση,',
    o.issuer.name,
    o.issuer.role,
    o.issuer.studio,
  ].join('\n')
  return `mailto:${encodeURIComponent(o.clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
