/**
 * Writes .br (brotli, max quality) and .gz next to every text asset in dist/.
 * Caddy serves them directly (file_server precompressed): smaller than on-the-fly compression, zero CPU.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const DIST = path.resolve(process.env.DIST ?? 'dist')
const TEXT = /\.(html|js|css|svg|json|xml|txt)$/
let files = 0, before = 0, after = 0

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const file = path.join(dir, name)
    if ((await stat(file)).isDirectory()) { await walk(file); continue }
    if (!TEXT.test(name)) continue
    const buf = await readFile(file)
    if (buf.length < 512) continue
    const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } })
    await writeFile(file + '.br', br)
    await writeFile(file + '.gz', gzipSync(buf, { level: 9 }))
    files++; before += buf.length; after += br.length
  }
}
await walk(DIST)
console.log(`precompressed ${files} files: ${(before / 1024).toFixed(0)} kB → ${(after / 1024).toFixed(0)} kB (brotli)`)
