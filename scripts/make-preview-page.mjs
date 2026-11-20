/**
 * Turns dist-preview/index.html into a page body for a sandboxed preview host that supplies
 * its own <!doctype>/<html>/<head>/<body>: keeps title, meta, links and scripts, drops the wrappers.
 * Also writes dist-preview/files.json (the supporting files to publish next to the page).
 */
import { readFile, writeFile, readdir, stat, rm } from 'node:fs/promises'
import path from 'node:path'

const DIR = 'dist-preview'
const html = await readFile(path.join(DIR, 'index.html'), 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
const keepHead = head
  .split('\n')
  .filter((l) => !/<meta charset|<meta name="viewport"/.test(l))
  .join('\n')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Atelier Studio</title>')
await writeFile(path.join(DIR, 'index.html'), `${keepHead.trim()}\n${body.trim()}\n`)

// Preview hosts don't need server fallbacks; unused photos are skipped.
for (const f of ['_redirects', '.htaccess', 'robots.txt']) await rm(path.join(DIR, f), { force: true })
const unused = ['white-angular-architecture']

const files = []
async function walk(rel) {
  for (const name of await readdir(path.join(DIR, rel))) {
    const r = path.posix.join(rel, name)
    const s = await stat(path.join(DIR, r))
    if (s.isDirectory()) await walk(r)
    else if (r !== 'index.html' && r !== 'files.json' && !unused.some((u) => name.startsWith(u))) files.push(r)
  }
}
await walk('')
await writeFile(path.join(DIR, 'files.json'), JSON.stringify(files, null, 1))
const total = (await Promise.all(files.map((f) => stat(path.join(DIR, f))))).reduce((a, s) => a + s.size, 0)
console.log(`preview page ready: ${files.length} supporting files, ${(total / 1e6).toFixed(1)} MB`)
