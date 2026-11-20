/** Keeps an unrendered copy of the app shell: hosts rewrite unknown paths to /spa.html (see public/_redirects). */
import { copyFile, readFile } from 'node:fs/promises'
const html = await readFile('dist/index.html', 'utf8')
if (!html.includes('data-prerendered')) await copyFile('dist/index.html', 'dist/spa.html')
console.log('dist/spa.html ready')
