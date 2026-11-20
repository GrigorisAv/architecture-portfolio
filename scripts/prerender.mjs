/**
 * Prerenders every public page of dist/ to static HTML so that crawlers and link-preview bots
 * (Facebook, LinkedIn, Viber…) see real content, titles and Open Graph tags without running JS.
 *
 *   VITE_SITE_URL=https://www.example.gr npm run build:static
 *
 * - Crawls from "/" following internal links (new CMS projects are picked up automatically).
 * - Renders with prefers-reduced-motion so the snapshot holds final, animation-free states.
 * - Writes dist/<route>/index.html, dist/404.html, dist/sitemap.xml (+ Sitemap line in robots.txt).
 * - Keeps dist/spa.html (unrendered shell) as the fallback for anything not prerendered.
 */
import { createServer } from 'node:http'
import { mkdir, readFile, stat, writeFile, appendFile } from 'node:fs/promises'
import path from 'node:path'

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.warn('⚠ playwright is not installed; skipping prerender (the SPA still works).')
  process.exit(0)
}

const DIST = path.resolve(process.env.PRERENDER_DIST ?? 'dist')
const SITE_URL = (process.env.VITE_SITE_URL ?? '').replace(/\/$/, '')
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' }

const shell = await readFile(path.join(DIST, 'spa.html'), 'utf8').catch(() => null)
if (!shell) throw new Error('dist/spa.html missing: run "npm run build" first.')

// Static server over dist/ with SPA fallback to the *unrendered* shell.
const server = createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = path.join(DIST, url)
  try {
    if (file.startsWith(DIST) && (await stat(file)).isFile()) {
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' })
      return res.end(await readFile(file))
    }
  } catch {
    /* fall through to shell */
  }
  res.writeHead(200, { 'content-type': MIME['.html'] })
  res.end(shell)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'el-GR' })

async function render(route) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(origin + route, { waitUntil: 'networkidle' })
  await page.waitForSelector('#main > *, h1', { timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  const result = await page.evaluate(
    ({ siteUrl }) => {
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
      document.documentElement.setAttribute('data-prerendered', 'true')
      // Asset/link URLs injected at runtime (e.g. Vite modulepreload) may be absolute to the build server: make them root-relative.
      for (const el of document.querySelectorAll('[href], [src]')) {
        if (el.matches('link[rel="canonical"]')) continue
        for (const attr of ['href', 'src']) {
          const v = el.getAttribute(attr)
          if (v?.startsWith(location.origin)) el.setAttribute(attr, v.slice(location.origin.length) || '/')
        }
      }
      // Adjacent text nodes (e.g. "© {year} ATELIER") merge when serialized; React's SSR separates them with
      // <!-- --> so hydration can match them one to one. Do the same.
      const walker = document.createTreeWalker(document.getElementById('root'), NodeFilter.SHOW_TEXT)
      const pairs = []
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.previousSibling?.nodeType === Node.TEXT_NODE) pairs.push(n)
      pairs.forEach((n) => n.parentNode.insertBefore(document.createComment(' '), n))
      // Each page preloads its own priority image (the static shell only knows the home hero).
      document.querySelectorAll('link[rel="preload"][as="image"]').forEach((n) => n.remove())
      const hero = document.querySelector('img[fetchpriority="high"]')
      const avif = hero?.closest('picture')?.querySelector('source[type="image/avif"]')
      if (hero) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.setAttribute('fetchpriority', 'high')
        if (avif) {
          link.type = 'image/avif'
          link.setAttribute('imagesrcset', avif.getAttribute('srcset'))
          link.setAttribute('imagesizes', avif.getAttribute('sizes') || '100vw')
        } else {
          link.href = hero.getAttribute('src')
        }
        document.head.prepend(link)
      }
      if (!siteUrl) {
        // Without a known public origin these would point at the build machine: drop them.
        document.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach((n) => n.remove())
      }
      document.querySelectorAll('meta[name="robots"]').forEach((n) => n.getAttribute('content')?.includes('noindex') || n.remove())
      return { links, html: '<!doctype html>\n' + document.documentElement.outerHTML, title: document.title }
    },
    { siteUrl: SITE_URL },
  )
  await page.close()
  if (errors.length) throw new Error(`${route}: ${errors.join('; ')}`)
  // Inline the stylesheet: render-critical, and lets the browser discover the font files immediately.
  result.html = await inlineCss(result.html)
  // Remaining absolute URLs are SEO metadata (og:image, JSON-LD, canonical): point them at the public origin.
  result.html = result.html.split(origin).join(SITE_URL)
  return result
}

const cssCache = new Map()
async function inlineCss(html) {
  return html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (tag, href) => {
    const css = cssCache.get(href)
    return css === undefined ? tag : `<style data-inlined="${href}">${css}</style>`
  })
}
for (const f of (await import('node:fs')).readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.css'))) {
  cssCache.set(`/assets/${f}`, (await readFile(path.join(DIST, 'assets', f), 'utf8')).replace(/<\/style/gi, '<\\/style'))
}

const out = (route) => (route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html'))
const queue = ['/']
const done = new Set()
while (queue.length) {
  const route = queue.shift()
  if (done.has(route)) continue
  done.add(route)
  const { links, html, title } = await render(route)
  await mkdir(path.dirname(out(route)), { recursive: true })
  await writeFile(out(route), html)
  console.log(`✓ ${route.padEnd(36)} ${title}`)
  for (const href of links) {
    if (!href?.startsWith('/') || href.startsWith('//')) continue
    const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
    if (clean.startsWith('/diaxeirisi') || /\.[a-z0-9]+$/i.test(clean)) continue
    if (!done.has(clean) && !queue.includes(clean)) queue.push(clean)
  }
}

// 404 page (served by hosts for unknown static paths where configured).
const notFound = await render('/__selida-pou-den-yparxei__')
await writeFile(path.join(DIST, '404.html'), notFound.html.replace('<head>', '<head><meta name="robots" content="noindex">'))
console.log('✓ 404.html')

await browser.close()
server.close()

if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [...done].sort().map((r) => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod></url>`).join('\n')
  await writeFile(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
  await appendFile(path.join(DIST, 'robots.txt'), `Sitemap: ${SITE_URL}/sitemap.xml\n`)
  console.log(`✓ sitemap.xml (${done.size} URLs)`)
} else {
  console.warn('⚠ VITE_SITE_URL not set: canonical/og:url omitted and no sitemap.xml written.')
}
console.log(`Prerendered ${done.size} pages.`)
