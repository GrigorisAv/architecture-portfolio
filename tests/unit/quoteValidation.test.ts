import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptyQuote, validateAll, validateField } from '../../src/lib/quoteValidation.ts'

const valid = { ...emptyQuote, fullName: 'Μαρία Παπαδοπούλου', email: 'maria@example.gr', phone: '+30 690 000 0000', projectType: 'anakainisi' as const, area: 'Αθήνα', sizeSqm: '95,5', description: 'Ανακαίνιση διαμερίσματος με νέα κουζίνα.', privacyConsent: true }

test('a complete request has no errors', () => assert.deepEqual(validateAll(valid), {}))
test('empty form reports every required field', () => assert.deepEqual(Object.keys(validateAll(emptyQuote)).sort(), ['area', 'description', 'email', 'fullName', 'phone', 'privacyConsent', 'projectType']))
test('sqm is optional but must be a positive number', () => {
  assert.equal(validateField('sizeSqm', { ...valid, sizeSqm: '' }), undefined)
  assert.equal(validateField('sizeSqm', { ...valid, sizeSqm: '120,5' }), undefined)
  assert.ok(validateField('sizeSqm', { ...valid, sizeSqm: 'abc' }))
  assert.ok(validateField('sizeSqm', { ...valid, sizeSqm: '-3' }))
})
test('phone accepts Greek formats, rejects short numbers', () => {
  for (const ok of ['6900000000', '+30 690 000 0000', '210-1234567', '(210) 123 4567']) assert.equal(validateField('phone', { ...valid, phone: ok }), undefined, ok)
  for (const bad of ['123', 'abcdefghij', '+30 69']) assert.ok(validateField('phone', { ...valid, phone: bad }), bad)
})
test('email must look like an address', () => {
  assert.ok(validateField('email', { ...valid, email: 'λάθος' }))
  assert.ok(validateField('email', { ...valid, email: 'a@b' }))
})
test('description length bounds', () => {
  assert.ok(validateField('description', { ...valid, description: 'σύντομο' }))
  assert.ok(validateField('description', { ...valid, description: 'α'.repeat(2001) }))
})
test('messages are in Greek', () => assert.match(validateField('fullName', emptyQuote)!, /^Συμπληρώστε το ονοματεπώνυμ/))
