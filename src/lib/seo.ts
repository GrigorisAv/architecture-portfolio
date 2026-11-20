import { useEffect } from 'react'

const SITE = 'ATELIER STUDIO'

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

/** Updates <title> and description/OG meta in place (no duplicate tags). */
export function useSeo({ title, description }: { title?: string; description?: string }) {
  useEffect(() => {
    const full = title ? `${title} — ${SITE}` : `${SITE} — Αρχιτεκτονική & Εσωτερικοί Χώροι`
    document.title = full
    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    }
  }, [title, description])
}
