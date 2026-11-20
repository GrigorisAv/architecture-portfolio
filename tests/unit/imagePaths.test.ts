import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveLocalPath, storageResolver, variantWidths } from '../../src/content/imagePaths.ts'

test('variants never upscale and always include the largest', () => {
  assert.deepEqual(variantWidths(3000), [800, 1600, 2400])
  assert.deepEqual(variantWidths(2400), [800, 1600, 2400])
  assert.deepEqual(variantWidths(1200), [800, 1200])
  assert.deepEqual(variantWidths(600), [600])
})
test('bundled and absolute paths resolve without a server', () => {
  assert.deepEqual(resolveLocalPath('local:pool-villa'), { src: 'pool-villa' })
  assert.deepEqual(resolveLocalPath('blob:http://x/1'), { src: 'blob:http://x/1' })
  assert.equal(resolveLocalPath('projects/abc/def'), null)
})
test('storage paths expand to a WebP srcset on the public bucket', () => {
  const r = storageResolver('https://x.supabase.co/storage/v1/object/public/media')('projects/p1/img', 1200)
  assert.equal(r.src, 'https://x.supabase.co/storage/v1/object/public/media/projects/p1/img-1200.webp')
  assert.deepEqual(r.srcset?.map((v) => v.width), [800, 1200])
})
