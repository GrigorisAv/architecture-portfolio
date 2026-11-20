import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, displayStatus, duplicateOffer, emptyOffer, lineTotal, normalizeOfferSettings, OFFER_SETTINGS_DEFAULTS, offerMailto, offerTotals, parseAmount } from '../../src/offers/model.ts'

const site = { studioName: 'DS Architect', email: 'info@example.gr', phone: null, address: null, website: 'www.example.gr' }

test('totals: lines, discount, VAT, rounding to cents', () => {
  const items = [
    { id: '1', title: 'Μελέτη', description: '', quantity: 1, unit: 'κατ’ αποκοπή', unitPrice: 1800 },
    { id: '2', title: 'Εσωτερικός', description: '', quantity: 95, unit: 'τ.μ.', unitPrice: 22 },
    { id: '3', title: 'Επίβλεψη', description: '', quantity: 6, unit: 'επίσκεψη', unitPrice: 120 },
  ]
  assert.equal(lineTotal(items[1]), 2090)
  assert.deepEqual(offerTotals({ items, discountPercent: 5, vatRate: 24 }), { subtotal: 4610, discount: 230.5, net: 4379.5, vat: 1051.08, total: 5430.58 })
  assert.deepEqual(offerTotals({ items: [], discountPercent: 0, vatRate: 24 }), { subtotal: 0, discount: 0, net: 0, vat: 0, total: 0 })
  assert.equal(offerTotals({ items: [{ ...items[0], quantity: 3, unitPrice: 0.1 }], discountPercent: 0, vatRate: 0 }).total, 0.3)
})

test('amounts typed the Greek way', () => {
  assert.equal(parseAmount('1.234,50'), 1234.5)
  assert.equal(parseAmount('1234.5'), 1234.5)
  assert.equal(parseAmount('22 €'), 22)
  assert.equal(parseAmount(''), 0)
  assert.equal(parseAmount('abc'), 0)
})

test('new offer from a request: client prefilled, defaults applied, validity from settings', () => {
  const o = emptyOffer(OFFER_SETTINGS_DEFAULTS, site, { id: 'q1', fullName: 'Μαρία', email: 'm@example.gr', phone: '69', area: 'Κατερίνη', projectTypeLabel: 'Ανακαίνιση', sizeSqm: 95 })
  assert.equal(o.quoteRequestId, 'q1')
  assert.equal(o.title, 'Ανακαίνιση · 95 τ.μ.')
  assert.equal(o.vatRate, 24)
  assert.equal(o.validUntil, addDays(o.issueDate, 30))
  assert.equal(o.issuer.name, 'Δήμητρα Σαπίδου')
  assert.equal(o.issuer.role, 'Αρχιτέκτων Μηχανικός')
  assert.equal(o.status, 'draft')
})

test('status: a sent offer past its date shows as expired', () => {
  assert.equal(displayStatus({ status: 'sent', validUntil: '2026-01-01' }, '2026-01-02'), 'expired')
  assert.equal(displayStatus({ status: 'sent', validUntil: '2026-01-02' }, '2026-01-02'), 'sent')
  assert.equal(displayStatus({ status: 'accepted', validUntil: '2026-01-01' }, '2027-01-01'), 'accepted')
})

test('duplicate is a fresh draft without the answer', () => {
  const o = { ...emptyOffer(OFFER_SETTINGS_DEFAULTS, site), id: 'x', number: 'ΠΡ-2026-001', status: 'accepted' as const, publicToken: 't', clientSignature: 'data:image/png;base64,AA', clientSignedName: 'Μ' }
  const d = duplicateOffer(o)
  assert.equal(d.id, '')
  assert.equal(d.number, '')
  assert.equal(d.status, 'draft')
  assert.equal(d.clientSignature, null)
  assert.notEqual(d.items[0].id, o.items[0].id)
})

test('settings: bad values fall back to defaults; mail link carries the offer link', () => {
  assert.deepEqual(normalizeOfferSettings({ defaultVatRate: 500 as number, defaultValidityDays: 0 }), OFFER_SETTINGS_DEFAULTS)
  const o = { ...emptyOffer(OFFER_SETTINGS_DEFAULTS, site), number: 'ΠΡ-2026-007', clientEmail: 'a@b.gr', clientName: 'Άννα' }
  const href = offerMailto(o, 'https://www.example.gr/prosfora/abc')
  assert.match(href, /^mailto:a%40b\.gr\?subject=/)
  assert.ok(decodeURIComponent(href).includes('https://www.example.gr/prosfora/abc'))
  assert.ok(decodeURIComponent(href).includes('ΠΡ-2026-007'))
})
