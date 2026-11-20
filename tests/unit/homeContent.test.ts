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

test('sample-photo note stays until every sample photo is replaced', async () => {
  const { aboutUsesSample, homeUsesSample } = await import('../../src/content/records.ts')
  assert.equal(homeUsesSample(HOME_DEFAULTS), true)
  const own = structuredClone(HOME_DEFAULTS)
  for (const slot of Object.keys(own.images) as (keyof typeof own.images)[]) own.images[slot] = { path: `home/${slot}`, alt: 'x' }
  assert.equal(homeUsesSample(own), false)
  assert.equal(aboutUsesSample({ approachImagePath: null, portraitPath: null }), true)
  assert.equal(aboutUsesSample({ approachImagePath: 'about/a', portraitPath: null }), false)
  assert.equal(aboutUsesSample({ approachImagePath: 'local:minimal-white-room', portraitPath: 'about/p' }), true)
})
