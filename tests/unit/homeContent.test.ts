import assert from 'node:assert/strict'
import { test } from 'node:test'
import { storageResolver } from '../../src/content/imagePaths.ts'
import { HOME_DEFAULTS, normalizeHome, toDomainHome } from '../../src/content/records.ts'

test('missing or partial home content falls back to the sample photos', () => {
  assert.deepEqual(normalizeHome(null), HOME_DEFAULTS)
  const partial = normalizeHome({ images: { hero: { path: 'home/abc', alt: 'Νέα' } } } as never)
  assert.deepEqual(partial.images.hero, { path: 'home/abc', alt: 'Νέα' })
  assert.deepEqual(partial.images.material2, HOME_DEFAULTS.images.material2)
  // Garbage is ignored rather than breaking the home page.
  assert.deepEqual(normalizeHome({ images: { hero: { path: '' } } } as never).images.hero, HOME_DEFAULTS.images.hero)
})

test('uploads resolve to storage variants and are not labelled as samples', () => {
  const home = toDomainHome(normalizeHome({ images: { hero: { path: 'home/abc', alt: 'Νέα' } } } as never), storageResolver('https://x.supabase.co/storage/v1/object/public/media'))
  assert.equal(home.images.hero.isSample, false)
  assert.equal(home.images.hero.focal, undefined)
  assert.match(home.images.hero.src, /^https:\/\/x\.supabase\.co\/.*home\/abc-2400\.webp$/)
  assert.equal(home.images.philosophy.isSample, true)
  assert.equal(home.images.philosophy.src, 'oak-stair-detail')
  assert.equal(home.images.philosophy.focal, '50% 40%')
})
