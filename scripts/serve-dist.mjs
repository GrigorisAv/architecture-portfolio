/**
 * Serves dist/ like a static host would: exact file → <path>/index.html (prerendered) → /spa.html fallback.
 * Usage: npm run serve  (PORT=4173 by default). For local checks only, not for production.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'

const DIST = path.resolve(process.env.DIST ?? 'dist')
const PORT = Number(process.env.PORT ?? 4173)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' }
const isFile = async (p) => { try { return (await stat(p)).isFile() } catch { return false } }

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const candidates = [path.join(DIST, url), path.join(DIST, url, 'index.html'), path.join(DIST, 'spa.html')]
  for (const file of candidates) {
    if (file.startsWith(DIST) && (await isFile(file))) {
      const ext = path.extname(file)
      const immutable = file.includes(`${path.sep}assets${path.sep}`)
      let body = await readFile(file)
      const headers = { 'content-type': MIME[ext] ?? 'application/octet-stream', 'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache', vary: 'Accept-Encoding' }
      // Compress text like any real host does (Netlify, Vercel, Cloudflare, nginx).
      if (/\.(html|js|css|svg|json|txt|xml)$/.test(ext)) {
        const accept = String(req.headers['accept-encoding'] ?? '')
        if (accept.includes('br')) { body = brotliCompressSync(body); headers['content-encoding'] = 'br' }
        else if (accept.includes('gzip')) { body = gzipSync(body); headers['content-encoding'] = 'gzip' }
      }
      res.writeHead(200, headers)
      return res.end(body)
    }
  }
  res.writeHead(404).end('Not found')
}).listen(PORT, () => console.log(`dist/ on http://localhost:${PORT}`))
