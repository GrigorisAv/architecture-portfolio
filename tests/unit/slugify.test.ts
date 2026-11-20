import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isValidSlug, slugify } from '../../src/admin/lib/slugify.ts'

test('Greek titles become readable Latin slugs', () => {
  assert.equal(slugify('Οικία του Ορίζοντα'), 'oikia-tou-orizonta')
  assert.equal(slugify('Δοκιμαστικό Έργο Ξενώνα'), 'dokimastiko-ergo-xenona')
  assert.equal(slugify('Γυάλινο Ατελιέ'), 'gyalino-atelie')
  assert.equal(slugify('Ευρύχωρο Αυτοκίνητο'), 'evrychoro-aftokinito')
  assert.equal(slugify('Μπάνιο & Ντουλάπες'), 'banio-ntoulapes')
})
test('mixed and messy input', () => {
  assert.equal(slugify('  Villa  No.5 — Σαντορίνη!  '), 'villa-no-5-santorini')
  assert.equal(slugify('ΚΕΦΑΛΑΙΑ ΜΕ ΤΟΝΟΥΣ ΆΈΉ'), 'kefalaia-me-tonous-aei')
})
test('output is always a valid slug', () => {
  for (const t of ['Οικία', 'A B C', 'Ψηφιακό Ψ', '123 Έργο']) assert.ok(isValidSlug(slugify(t)), t)
  assert.equal(isValidSlug('Bad Slug'), false)
})
